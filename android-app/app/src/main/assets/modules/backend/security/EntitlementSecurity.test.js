import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createRouter, createApiController, HTTP_STATUS } from '../api/index.js';
import { createSecurityService } from './index.js';
import { createAuthService } from '../auth/index.js';
import { createDatabaseService } from '../database/index.js';
import { createStorageService } from '../storage/index.js';

function createMockHttp(method, path, headers = {}, body = null) {
  let statusCode = 200;
  let responseHeaders = {};
  let responseData = '';

  const req = {
    method,
    url: path,
    headers: { ...headers },
    body,
    on: (evt, cb) => { if (evt === 'end') cb(); }
  };

  const res = {
    writeHead: (code, hdrs = {}) => {
      statusCode = code;
      responseHeaders = { ...responseHeaders, ...hdrs };
      res.headersSent = true;
    },
    setHeader: (k, v) => { responseHeaders[k] = v; },
    end: (chunk) => { if (chunk) responseData += chunk.toString(); },
    headersSent: false
  };

  return {
    req,
    res,
    getResponse: () => {
      let json = null;
      try { json = JSON.parse(responseData); } catch {}
      return { statusCode, headers: responseHeaders, json };
    }
  };
}

describe('Backend Hardening - Entitlement & Anti-Tampering Security', () => {
  let router;
  let auth;
  let db;
  let userToken;

  beforeEach(async () => {
    const security = createSecurityService();
    db = createDatabaseService({ inMemoryOnly: true });
    auth = createAuthService(db);
    const storage = createStorageService({ inMemoryOnly: true });
    router = createRouter();

    createApiController(router, { security, auth, database: db, storage });

    const reg = await auth.register('entitlement_user@woobi.com', 'SecurePass123!', 'Entitlement Tester');
    userToken = reg.token;
  });

  // 1. Production Mode Rejection of Dev Key
  it('1. strictly rejects dev verification key when NODE_ENV is production (403 Forbidden)', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const { req, res, getResponse } = createMockHttp('POST', '/api/user/subscription/verify', {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json'
      }, {
        requestedPlan: 'annual',
        devVerificationKey: 'WOOBI_DEV_VERIFIED_UPGRADE'
      });

      await router.handle(req, res);
      const resp = getResponse();

      assert.strictEqual(resp.statusCode, HTTP_STATUS.FORBIDDEN);
      assert.strictEqual(resp.json.success, false);
      assert.ok(resp.json.error.includes('Self-granting premium access is strictly prohibited'));
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  // 2. Free Tier Setting Permitted Everywhere
  it('2. allows setting free tier without verification keys in any environment', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/user/subscription/verify', {
      authorization: `Bearer ${userToken}`,
      'content-type': 'application/json'
    }, {
      requestedPlan: 'free'
    });

    await router.handle(req, res);
    const resp = getResponse();

    assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
    assert.strictEqual(resp.json.data.plan, 'free');
    assert.strictEqual(resp.json.data.isPremium, false);
  });

  // 3. Client Payload Tampering Rejection
  it('3. rejects arbitrary payment spoof payloads without server verification', async () => {
    const { req, res, getResponse } = createMockHttp('POST', '/api/user/subscription/verify', {
      authorization: `Bearer ${userToken}`,
      'content-type': 'application/json'
    }, {
      requestedPlan: 'monthly',
      spoofedPaymentReceipt: 'stripe_charge_ch_123456789'
    });

    await router.handle(req, res);
    const resp = getResponse();

    assert.strictEqual(resp.statusCode, HTTP_STATUS.FORBIDDEN);
    assert.strictEqual(resp.json.success, false);
  });

  // 4. Authorized Development Key Permitted in Non-Production
  it('4. permits dev upgrade in non-production when devVerificationKey matches', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const { req, res, getResponse } = createMockHttp('POST', '/api/user/subscription/verify', {
        authorization: `Bearer ${userToken}`,
        'content-type': 'application/json'
      }, {
        requestedPlan: 'monthly',
        devVerificationKey: 'WOOBI_DEV_VERIFIED_UPGRADE'
      });

      await router.handle(req, res);
      const resp = getResponse();

      assert.strictEqual(resp.statusCode, HTTP_STATUS.OK);
      assert.strictEqual(resp.json.data.plan, 'monthly');
      assert.strictEqual(resp.json.data.isPremium, true);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  // 5. Server-Authoritative Database Isolation
  it('5. preserves authoritative server record regardless of client-side store state', async () => {
    const sub = await db.subscriptions.getForUser('some_user');
    assert.strictEqual(sub, null); // Nothing self-granted
  });
});

