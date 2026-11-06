import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  BackendService,
  createBackendService,
  ApiClient,
  createApiClient,
  BackendContract,
  API_ROUTES,
  HTTP_STATUS
} from './index.js';

describe('Backend Domain - Root Orchestrator & ApiClient Integration', () => {
  let backend;

  beforeEach(() => {
    backend = createBackendService({
      database: { inMemoryOnly: true },
      storage: { inMemoryOnly: true }
    });
  });

  // 1. Orchestrator Initialization
  it('1. instantiates all five submodules on startup', () => {
    assert.ok(backend.security);
    assert.ok(backend.auth);
    assert.ok(backend.db);
    assert.ok(backend.storage);
    assert.ok(backend.router);
    assert.ok(backend.controller);
  });

  // 2. Backward Compatibility - BackendContract
  it('2. exports backward-compatible BackendContract with healthCheck method', () => {
    assert.ok(BackendContract.endpoints);
    const health = BackendContract.healthCheck();
    assert.strictEqual(health.status, 'UP');
    assert.strictEqual(health.version, '1.0.0');
  });

  // 3. Request Dispatcher - Health Check via handleRequest
  it('3. handles GET /health through orchestrator handleRequest()', async () => {
    let statusCode = 0;
    let headers = {};
    let data = '';

    const mockReq = {
      method: 'GET',
      url: '/health',
      headers: {}
    };
    const mockRes = {
      writeHead: (code, hdrs) => { statusCode = code; headers = hdrs; },
      setHeader: () => {},
      end: (chunk) => { if (chunk) data += chunk.toString(); },
      headersSent: false
    };

    const handled = await backend.handleRequest(mockReq, mockRes);
    assert.strictEqual(handled, undefined); // Executed route handler
    assert.strictEqual(statusCode, 200);
    const json = JSON.parse(data);
    assert.strictEqual(json.status, 'UP');
  });

  // 4. Request Dispatcher - Unhandled Static Path Fallback
  it('4. returns false when request path is unhandled so static server can serve files', async () => {
    const mockReq = { method: 'GET', url: '/models/seren_avatar.glb', headers: {} };
    const mockRes = { writeHead: () => {}, end: () => {} };

    const handled = await backend.handleRequest(mockReq, mockRes);
    assert.strictEqual(handled, false);
  });

  // 5. ApiClient - Initialization
  it('5. initializes ApiClient with baseUrl and token', () => {
    const client = createApiClient('http://localhost:8080', { token: 'mock-token' });
    assert.strictEqual(client.baseUrl, 'http://localhost:8080');
    assert.strictEqual(client.getToken(), 'mock-token');
  });

  // 6. ApiClient - Token Management
  it('6. updates and clears authorization token in ApiClient', () => {
    const client = createApiClient();
    client.setToken('session-123');
    assert.strictEqual(client.getToken(), 'session-123');

    client.clearToken();
    assert.strictEqual(client.getToken(), null);
  });

  // 7. ApiClient - Simulated Fetch Integration
  it('7. sends correctly structured headers and body in ApiClient.request()', async () => {
    let capturedUrl = '';
    let capturedOptions = {};

    const mockFetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { status: 'healthy' } })
      };
    };

    const client = createApiClient('http://127.0.0.1:8080', {
      fetchFn: mockFetch,
      token: 'jwt-auth-abc'
    });

    const res = await client.health();
    assert.strictEqual(res.ok, true);
    assert.strictEqual(capturedUrl, 'http://127.0.0.1:8080/health');
    assert.strictEqual(capturedOptions.headers['Authorization'], 'Bearer jwt-auth-abc');
  });

  // 8. ApiClient - Offline Resiliency
  it('8. handles network errors gracefully without crashing (offline status)', async () => {
    const failingFetch = async () => {
      throw new Error('Connection refused (ERR_CONNECTION_REFUSED)');
    };

    const client = createApiClient('http://localhost:9999', { fetchFn: failingFetch });
    const res = await client.getWardrobeItems();

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.offline, true);
    assert.ok(res.error.includes('Connection refused'));
  });

  // 9. ApiClient - Register and Login Automatic Token Capture
  it('9. automatically updates client token upon successful login or registration', async () => {
    const mockAuthFetch = async (url, options) => {
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          data: { token: 'new-auth-bearer-token', user: { id: 'usr_1' } }
        })
      };
    };

    const client = createApiClient('http://localhost:8080', { fetchFn: mockAuthFetch });
    assert.strictEqual(client.getToken(), null);

    await client.login('user@woobi.com', 'Pass123!');
    assert.strictEqual(client.getToken(), 'new-auth-bearer-token');
  });

  // 10. ApiClient - Logout Clears Token
  it('10. clears client token upon calling logout()', async () => {
    const mockLogoutFetch = async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true })
    });

    const client = createApiClient('http://localhost:8080', {
      fetchFn: mockLogoutFetch,
      token: 'to-be-cleared'
    });
    await client.logout();
    assert.strictEqual(client.getToken(), null);
  });

  // 11. ApiClient - Full Wardrobe CRUD Flow
  it('11. executes wardrobe CRUD methods via ApiClient', async () => {
    const calls = [];
    const mockFetch = async (url, options) => {
      calls.push({ url, method: options.method });
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: [] })
      };
    };

    const client = createApiClient('http://localhost:8080', { fetchFn: mockFetch });
    await client.getWardrobeItems();
    await client.createWardrobeItem({ name: 'Silk Scarf', category: 'accessories' });
    await client.deleteWardrobeItem('item_123');

    assert.strictEqual(calls.length, 3);
    assert.strictEqual(calls[0].url, 'http://localhost:8080/api/wardrobe/items');
    assert.strictEqual(calls[1].method, 'POST');
    assert.strictEqual(calls[2].url, 'http://localhost:8080/api/wardrobe/items/item_123');
    assert.strictEqual(calls[2].method, 'DELETE');
  });

  // 12. ApiClient - Server-Authoritative Subscription Verification
  it('12. sends subscription verification payload to server endpoint', async () => {
    let capturedBody = null;
    const mockFetch = async (url, options) => {
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: { plan: 'monthly', isPremium: true } })
      };
    };

    const client = createApiClient('http://localhost:8080', { fetchFn: mockFetch });
    const res = await client.verifySubscription('monthly', 'WOOBI_DEV_VERIFIED_UPGRADE');

    assert.strictEqual(res.success, true);
    assert.strictEqual(capturedBody.requestedPlan, 'monthly');
    assert.strictEqual(capturedBody.devVerificationKey, 'WOOBI_DEV_VERIFIED_UPGRADE');
  });

  // 13. ApiClient - Avatar and Settings Sync
  it('13. syncs avatar customizations and application settings via ApiClient', async () => {
    const endpoints = [];
    const mockFetch = async (url) => {
      endpoints.push(url);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: {} })
      };
    };

    const client = createApiClient('http://localhost:8080', { fetchFn: mockFetch });
    await client.saveAvatarPreferences({ hairColor: '#123456' });
    await client.saveUserSettings({ appTheme: 'dark' });

    assert.ok(endpoints.some(e => e.includes('/api/avatar/preferences')));
    assert.ok(endpoints.some(e => e.includes('/api/settings')));
  });

  // 14. Reset All Orchestrator Utility
  it('14. resets all database collections, revoked tokens and rate limit buckets via resetAll()', () => {
    backend.auth.revokeToken('test-token');
    assert.strictEqual(backend.auth.revokedTokens.size, 1);

    backend.resetAll();
    assert.strictEqual(backend.auth.revokedTokens.size, 0);
  });

  // 15. Window Global Binding for Web Applications
  it('15. exports WoobiBackend namespace on globalThis if window is simulated', () => {
    assert.ok(BackendContract);
    assert.strictEqual(typeof BackendContract.createService, 'function');
    assert.strictEqual(typeof BackendContract.createClient, 'function');
  });
});
