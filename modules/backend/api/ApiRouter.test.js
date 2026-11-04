import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createRouter, createApiController, API_ROUTES, HTTP_STATUS } from './index.js';
import { createSecurityService } from '../security/index.js';
import { createAuthService } from '../auth/index.js';
import { createDatabaseService } from '../database/index.js';
import { createStorageService } from '../storage/index.js';

// Helper to simulate mock HTTP req / res objects
function createMockHttp(method, path, headers = {}, body = null) {
  let statusCode = 200;
  let responseHeaders = {};
  let responseData = '';
  let ended = false;

  const req = {
    method,
    url: path,
    headers: { ...headers },
    body,
    on: (evt, cb) => {
      if (evt === 'end') cb();
    }
  };

  const res = {
    writeHead: (code, hdrs = {}) => {
      statusCode = code;
      responseHeaders = { ...responseHeaders, ...hdrs };
      res.headersSent = true;
    },
    setHeader: (k, v) => {
      responseHeaders[k] = v;
    },
    end: (chunk) => {
      if (chunk) responseData += chunk.toString();
      ended = true;
    },
    headersSent: false
  };

  return {
    req,
    res,
    getResponse: () => {
      let json = null;
      try {
        json = JSON.parse(responseData);
      } catch {}
      return {
        statusCode,
        headers: responseHeaders,
        data: responseData,
        json,
        ended
      };
    }
  };
}

describe('API Submodule - Router & ApiController', () => {
  let router;
  let security;
  let db;
  let auth;
  let storage;
  let controller;
  let testUserToken;
  let testUserId;

  beforeEach(async () => {
    security = createSecurityService();
    db = createDatabaseService({ inMemoryOnly: true });
    auth = createAuthService(db);
    storage = createStorageService({ inMemoryOnly: true });
    router = createRouter();

    controller = createApiController(router, { security, auth, database: db, storage });

    // Seed a standard test user
    const regRes = await auth.register('testuser@woobi.com', 'Pass123456!', 'Test User');
    testUserToken = regRes.token;
    testUserId = regRes.user.id;
  });

  // 1. Health Check
  it('1. returns 200 OK with service metadata on /health', async () => {
    const { req, res, getResponse } = createMockHttp('GET', '/health');
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, 200);
    assert.strictEqual(resp.json.status, 'UP');
    assert.ok(resp.json.service.includes('Woobi'));
  });

  // 2. Security Headers & CORS Applied
  it('2. injects security headers and CORS onto every handled endpoint', async () => {
    const { req, res, getResponse } = createMockHttp('GET', '/health');
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.headers['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(resp.headers['X-Frame-Options'], 'SAMEORIGIN');
    assert.ok(resp.headers['Access-Control-Allow-Origin']);
  });

  // 3. User Registration Endpoint - Success
  it('3. registers a new user via POST /api/auth/register', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/auth/register', { 'content-type': 'application/json' }, {
      email: 'newuser@woobi.com',
      password: 'SecurePassword123!',
      displayName: 'New Member'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.CREATED);
    assert.strictEqual(resp.json.success, true);
    assert.strictEqual(resp.json.data.user.email, 'newuser@woobi.com');
  });

  // 4. User Registration Endpoint - Weak Password Rejection
  it('4. rejects registration with weak password via 400 Bad Request', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/auth/register', { 'content-type': 'application/json' }, {
      email: 'weak@woobi.com',
      password: 'weak'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.BAD_REQUEST);
    assert.strictEqual(resp.json.success, false);
    assert.ok(resp.json.error);
  });

  // 5. User Login Endpoint - Success
  it('5. authenticates credentials via POST /api/auth/login and returns bearer token', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/auth/login', { 'content-type': 'application/json' }, {
      email: 'testuser@woobi.com',
      password: 'Pass123456!'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.success, true);
    assert.ok(resp.json.data.token);
  });

  // 6. User Login Endpoint - Invalid Credentials
  it('6. rejects incorrect credentials with 401 Unauthorized', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/auth/login', { 'content-type': 'application/json' }, {
      email: 'testuser@woobi.com',
      password: 'WrongPassword!'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.strictEqual(resp.json.success, false);
  });

  // 7. Protected Route - 401 on Missing Token
  it('7. blocks unauthorized access to protected endpoints when token is absent', async () => {
    const { req, res, getResponse } = createMockHttp('GET', '/api/user/profile');
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.strictEqual(resp.json.success, false);
  });

  // 8. Protected Route - User Profile with Valid Token
  it('8. returns user profile data on GET /api/user/profile with valid token', async () => {
    const { req, res, getResponse } = createMockHttp('GET', '/api/user/profile', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.success, true);
    assert.strictEqual(resp.json.data.email, 'testuser@woobi.com');
  });

  // 9. Update User Profile - Sanitized Display Name
  it('9. updates user display name via PUT /api/user/profile', async () => {
    const { req, res, getResponse } = createMockHttp('PUT', '/api/user/profile', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      displayName: 'Suriya Luxury Stylist'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.data.displayName, 'Suriya Luxury Stylist');
  });

  // 10. Server-Authoritative Subscription - Query Entitlement
  it('10. returns default free entitlement on GET /api/user/subscription', async () => {
    const { req, res, getResponse } = createMockHttp('GET', '/api/user/subscription', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.data.plan, 'free');
    assert.strictEqual(resp.json.data.isPremium, false);
  });

  // 11. Server-Authoritative Subscription - Anti-Tampering Protection
  it('11. rejects client self-granting premium without authorized dev key (403 Forbidden)', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/user/subscription/verify', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      requestedPlan: 'annual' // Attempting to self-grant annual tier
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.FORBIDDEN);
    assert.strictEqual(resp.json.success, false);
    assert.ok(resp.json.error.includes('Unauthorized entitlement upgrade'));
  });

  // 12. Server-Authoritative Subscription - Authorized Upgrade
  it('12. grants premium entitlement when verified with valid authorization key', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/user/subscription/verify', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      requestedPlan: 'annual',
      devVerificationKey: 'WOOBI_DEV_VERIFIED_UPGRADE'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.data.plan, 'annual');
    assert.strictEqual(resp.json.data.isPremium, true);
  });

  // 13. Wardrobe Items - List Empty Initially
  it('13. returns empty array on initial GET /api/wardrobe/items', async () => {
    const { req, res, getResponse } = createMockHttp('GET', '/api/wardrobe/items', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.deepStrictEqual(resp.json.data, []);
  });

  // 14. Wardrobe Items - Create New Garment
  it('14. creates new wardrobe garment via POST /api/wardrobe/items', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/wardrobe/items', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      name: 'Cashmere Trench',
      category: 'outerwear',
      color: 'Camel'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.CREATED);
    assert.strictEqual(resp.json.data.name, 'Cashmere Trench');
    assert.strictEqual(resp.json.data.userId, testUserId);
  });

  // 15. Wardrobe Items - Delete Garment
  it('15. deletes wardrobe garment via DELETE /api/wardrobe/items/:id', async () => {
    const item = await db.wardrobe.create({ userId: testUserId, name: 'To Delete', category: 'top' });

    const { req, res, getResponse } = createMockHttp('DELETE', `/api/wardrobe/items/${item.id}`, {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.data.deleted, true);
  });

  // 16. Saved Looks - Create and Query
  it('16. creates and retrieves saved outfits via /api/looks', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/looks', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      name: 'Nordic Winter Look',
      occasion: 'casual'
    });
    await router.handle(req, res);

    const createResp = getResponse();
    assert.strictEqual(createResp.statusCode, HTTP_STATUS.CREATED);

    const { req: getReq, res: getRes, getResponse: getGetResp } = createMockHttp('GET', '/api/looks', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(getReq, getRes);

    const listResp = getGetResp();
    assert.strictEqual(listResp.json.data.length, 1);
    assert.strictEqual(listResp.json.data[0].name, 'Nordic Winter Look');
  });

  // 17. Avatar Preferences - PUT & GET
  it('17. saves and returns avatar preferences via /api/avatar/preferences', async () => {
    const { req, res, getResponse } = createMockHttp('PUT', '/api/avatar/preferences', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      skinTone: '#C68642',
      hairStyle: 'pompadour'
    });
    await router.handle(req, res);

    const saveResp = getResponse();
    assert.strictEqual(saveResp.statusCode, HTTP_STATUS.OK);

    const { req: getReq, res: getRes, getResponse: getGetResp } = createMockHttp('GET', '/api/avatar/preferences', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(getReq, getRes);

    const fetchResp = getGetResp();
    assert.strictEqual(fetchResp.json.data.skinTone, '#C68642');
  });

  // 18. User Settings - PUT & GET
  it('18. saves and returns application settings via /api/settings', async () => {
    const { req, res, getResponse } = createMockHttp('PUT', '/api/settings', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      appTheme: 'luxury-cream',
      studioLighting: 'editorial_soft'
    });
    await router.handle(req, res);

    const { req: getReq, res: getRes, getResponse: getGetResp } = createMockHttp('GET', '/api/settings', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(getReq, getRes);

    const fetchResp = getGetResp();
    assert.strictEqual(fetchResp.json.data.appTheme, 'luxury-cream');
  });

  // 19. Daily Streak - Query and Increment
  it('19. records daily streak increment via POST /api/streak/record', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/streak/record', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.data.currentStreak, 1);
  });

  // 20. Storage Upload - Base64 Payload Handling
  it('20. uploads image via POST /api/storage/upload using base64 payload', async () => {
    // Synthetic PNG header: 89 50 4E 47 0D 0A 1A 0A
    const pngBuf = Buffer.alloc(32);
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((b, i) => { pngBuf[i] = b; });
    const base64Data = `data:image/png;base64,${pngBuf.toString('base64')}`;

    const { req, res, getResponse } = createMockHttp('POST', '/api/storage/upload', {
      authorization: `Bearer ${testUserToken}`,
      'content-type': 'application/json'
    }, {
      data: base64Data,
      filename: 'wardrobe_snap.png'
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.CREATED);
    assert.strictEqual(resp.json.success, true);
    assert.ok(resp.json.data.url.includes('/api/storage/files/'));
  });

  // 21. User Logout - Session Token Invalidation
  it('21. revokes token on POST /api/auth/logout preventing subsequent calls', async () => {
    const { req: logoutReq, res: logoutRes, getResponse: getLogoutResp } = createMockHttp('POST', '/api/auth/logout', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(logoutReq, logoutRes);

    assert.strictEqual(getLogoutResp().statusCode, HTTP_STATUS.OK);

    // Subsequent request with the same token must fail
    const { req: checkReq, res: checkRes, getResponse: getCheckResp } = createMockHttp('GET', '/api/user/profile', {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(checkReq, checkRes);

    assert.strictEqual(getCheckResp().statusCode, HTTP_STATUS.UNAUTHORIZED);
  });

  // 22. Unmatched Route - Returns false for Static File Server fallback
  it('22. returns false for routes not matched by the API router so static files can be served', async () => {
    const { req, res } = createMockHttp('GET', '/index.html');
    const handled = await router.handle(req, res);
    assert.strictEqual(handled, false);
  });

  // 23. Query String Parsing
  it('23. parses URL search params into req.query', async () => {
    let capturedQuery = null;
    router.get('/api/test-query', (req, res) => {
      capturedQuery = req.query;
      router.sendJson(res, 200, { ok: true });
    });

    const { req, res } = createMockHttp('GET', '/api/test-query?category=tops&season=winter');
    await router.handle(req, res);

    assert.ok(capturedQuery);
    assert.strictEqual(capturedQuery.category, 'tops');
    assert.strictEqual(capturedQuery.season, 'winter');
  });

  // 24. Delete Item of Another User - 404 Not Found / Unauthorized
  it('24. blocks deleting an item owned by another user', async () => {
    const otherItem = await db.wardrobe.create({ userId: 'other_user_id', name: 'Other Item', category: 'top' });

    const { req, res, getResponse } = createMockHttp('DELETE', `/api/wardrobe/items/${otherItem.id}`, {
      authorization: `Bearer ${testUserToken}`
    });
    await router.handle(req, res);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.NOT_FOUND);
  });

  // 25. Rate Limit 429 Error Trigger
  it('25. returns 429 Too Many Requests when rate limit threshold breached', async () => {
    const tightSecurity = createSecurityService({
      RATE_LIMIT: { WINDOW_MS: 10000, MAX_REQUESTS: 1 }
    });
    const tightRouter = createRouter();
    createApiController(tightRouter, { security: tightSecurity, auth, database: db, storage });

    const { req: req1, res: res1 } = createMockHttp('GET', '/health');
    await tightRouter.handle(req1, res1);

    const { req: req2, res: res2, getResponse } = createMockHttp('GET', '/health');
    await tightRouter.handle(req2, res2);

    const resp = getResponse();
    assert.strictEqual(resp.statusCode, HTTP_STATUS.TOO_MANY_REQUESTS);
    assert.strictEqual(resp.json.success, false);
  });
});
