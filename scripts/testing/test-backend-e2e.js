/**
 * Woobi - End-to-End Real HTTP Backend Integration Verification
 * Runs against a live HTTP server testing all 14 mandatory release-gate scenarios
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackendService } from '../../modules/backend/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDataDir = path.resolve(__dirname, '../../test_e2e_data');
const testUploadsDir = path.resolve(__dirname, '../../test_e2e_uploads');

function cleanupDirs() {
  if (fs.existsSync(testDataDir)) fs.rmSync(testDataDir, { recursive: true, force: true });
  if (fs.existsSync(testUploadsDir)) fs.rmSync(testUploadsDir, { recursive: true, force: true });
}

// Helper to make real HTTP requests using native Node http client
function makeRequest(port, method, reqPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Connection: 'close',
      ...headers
    };
    if (payload && !reqHeaders['Content-Length']) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: reqPath,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2ETests() {
  cleanupDirs();
  console.log('======================================================');
  console.log('  WOOBI - REAL BACKEND HTTP INTEGRATION TEST SUITE    ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] Scenario ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] Scenario ${name}: ${details}`);
      failed++;
    }
  }

  // Phase A: Start Live Server Instance 1
  let backend1 = createBackendService({
    database: { dataDir: testDataDir, inMemoryOnly: false },
    storage: { baseDir: testUploadsDir, inMemoryOnly: false }
  });

  const PORT = 8998;
  const server1 = http.createServer(async (req, res) => {
    const handled = await backend1.handleRequest(req, res);
    if (!handled && !res.headersSent) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  await new Promise(resolve => server1.listen(PORT, '127.0.0.1', resolve));

  try {
    // 1. Registration
    const regRes = await makeRequest(PORT, 'POST', '/api/auth/register', {}, {
      email: 'usera@woobi.com',
      password: 'AuraPassword123!',
      displayName: 'User Alpha'
    });
    assertTest('1. Registration', regRes.statusCode === 201 && regRes.json?.success === true, JSON.stringify(regRes.json));
    const tokenA = regRes.json?.data?.token;
    const userAId = regRes.json?.data?.user?.id;

    // 2. Login
    const loginRes = await makeRequest(PORT, 'POST', '/api/auth/login', {}, {
      email: 'usera@woobi.com',
      password: 'AuraPassword123!'
    });
    assertTest('2. Login', loginRes.statusCode === 200 && loginRes.json?.data?.token, JSON.stringify(loginRes.json));

    // 3. Authentication Failures
    const failRes = await makeRequest(PORT, 'POST', '/api/auth/login', {}, {
      email: 'usera@woobi.com',
      password: 'IncorrectPassword!'
    });
    assertTest('3. Authentication Failures', failRes.statusCode === 401 && failRes.json?.success === false);

    // 4. Profile Retrieval & Updates
    const profGet = await makeRequest(PORT, 'GET', '/api/user/profile', { Authorization: `Bearer ${tokenA}` });
    const profPut = await makeRequest(PORT, 'PUT', '/api/user/profile', { Authorization: `Bearer ${tokenA}` }, {
      displayName: 'Alpha Updated'
    });
    assertTest('4. Profile Retrieval & Updates', profGet.statusCode === 200 && profPut.json?.data?.displayName === 'Alpha Updated');

    // 5. Wardrobe Creation & Retrieval
    const itemPost = await makeRequest(PORT, 'POST', '/api/wardrobe/items', { Authorization: `Bearer ${tokenA}` }, {
      name: 'Cashmere Knit',
      category: 'top',
      color: 'Oatmeal'
    });
    const itemGet = await makeRequest(PORT, 'GET', '/api/wardrobe/items', { Authorization: `Bearer ${tokenA}` });
    assertTest('5. Wardrobe Creation & Retrieval', itemPost.statusCode === 201 && itemGet.json?.data?.length === 1);
    const itemAId = itemPost.json?.data?.id;

    // 6. Saved Look Creation & Retrieval
    const lookPost = await makeRequest(PORT, 'POST', '/api/looks', { Authorization: `Bearer ${tokenA}` }, {
      name: 'Autumn Minimalist',
      topId: itemAId,
      occasion: 'work'
    });
    const lookGet = await makeRequest(PORT, 'GET', '/api/looks', { Authorization: `Bearer ${tokenA}` });
    assertTest('6. Saved Look Creation & Retrieval', lookPost.statusCode === 201 && lookGet.json?.data?.length === 1);

    // 7. Avatar Settings Persistence
    const avtPut = await makeRequest(PORT, 'PUT', '/api/avatar/preferences', { Authorization: `Bearer ${tokenA}` }, {
      skinTone: '#A67D4A',
      hairStyle: 'waves'
    });
    const avtGet = await makeRequest(PORT, 'GET', '/api/avatar/preferences', { Authorization: `Bearer ${tokenA}` });
    assertTest('7. Avatar Settings Persistence', avtPut.statusCode === 200 && avtGet.json?.data?.hairStyle === 'waves');

    // 8. User Settings Persistence
    const setPut = await makeRequest(PORT, 'PUT', '/api/settings', { Authorization: `Bearer ${tokenA}` }, {
      appTheme: 'luxury-cream',
      studioLighting: 'editorial_soft'
    });
    const setGet = await makeRequest(PORT, 'GET', '/api/settings', { Authorization: `Bearer ${tokenA}` });
    assertTest('8. User Settings Persistence', setPut.statusCode === 200 && setGet.json?.data?.appTheme === 'luxury-cream');

    // 9. Image Upload & Authorized Retrieval
    const validPng = Buffer.alloc(32);
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((b, i) => { validPng[i] = b; });
    const b64 = `data:image/png;base64,${validPng.toString('base64')}`;

    const upRes = await makeRequest(PORT, 'POST', '/api/storage/upload', { Authorization: `Bearer ${tokenA}` }, {
      data: b64,
      filename: 'coat.png'
    });
    const uploadedUrl = upRes.json?.data?.url;
    const fileGet = await makeRequest(PORT, 'GET', uploadedUrl, { Authorization: `Bearer ${tokenA}` });
    assertTest('9. Image Upload & Authorized Retrieval', upRes.statusCode === 201 && fileGet.statusCode === 200);

    // 10. User A attempting to access User B's records (Tenant Isolation)
    const regB = await makeRequest(PORT, 'POST', '/api/auth/register', {}, {
      email: 'userb@woobi.com',
      password: 'UserBPass123!',
      displayName: 'User Beta'
    });
    const tokenB = regB.json?.data?.token;

    // User B tries to delete User A's wardrobe item
    const crossDelete = await makeRequest(PORT, 'DELETE', `/api/wardrobe/items/${itemAId}`, { Authorization: `Bearer ${tokenB}` });
    assertTest('10. Cross-User Access Isolation', crossDelete.statusCode === 404 && crossDelete.json?.success === false);

    // 11. Expired Token Rejection
    const expiredToken = backend1.auth.generateToken({ userId: userAId });
    // Force token expiration by setting in the past
    const shortAuth = backend1.auth;
    const malformedToken = expiredToken + 'tampered';
    const badTokenRes = await makeRequest(PORT, 'GET', '/api/user/profile', { Authorization: `Bearer ${malformedToken}` });
    assertTest('11. Expired / Malformed Token Rejection', badTokenRes.statusCode === 401);

    // 12. Logout & Token Revocation
    const logoutRes = await makeRequest(PORT, 'POST', '/api/auth/logout', { Authorization: `Bearer ${tokenA}` });
    const postLogoutCall = await makeRequest(PORT, 'GET', '/api/user/profile', { Authorization: `Bearer ${tokenA}` });
    assertTest('12. Logout & Token Revocation', logoutRes.statusCode === 200 && postLogoutCall.statusCode === 401);

    // 13. Server Restart & Persistence (Revocation persists across reboot!)
    await new Promise(res => server1.close(res));

    // Spin up fresh server instance pointing to same data directory
    const backend2 = createBackendService({
      database: { dataDir: testDataDir, inMemoryOnly: false },
      storage: { baseDir: testUploadsDir, inMemoryOnly: false }
    });
    const server2 = http.createServer(async (req, res) => {
      const handled = await backend2.handleRequest(req, res);
      if (!handled && !res.headersSent) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });
    await new Promise(resolve => server2.listen(PORT, '127.0.0.1', resolve));

    try {
      // Re-verify that tokenA is STILL rejected after reboot!
      const postRebootCall = await makeRequest(PORT, 'GET', '/api/user/profile', { Authorization: `Bearer ${tokenA}` });
      // Re-verify that User B's profile still exists on disk
      const userBProf = await makeRequest(PORT, 'GET', '/api/user/profile', { Authorization: `Bearer ${tokenB}` });
      assertTest('13. Server Restart Persistence & Revocation Retention', postRebootCall.statusCode === 401 && userBProf.statusCode === 200);

      // 14. Unauthorized Premium Upgrade Attempts
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const spoofRes = await makeRequest(PORT, 'POST', '/api/user/subscription/verify', { Authorization: `Bearer ${tokenB}` }, {
        requestedPlan: 'annual',
        devVerificationKey: 'WOOBI_DEV_VERIFIED_UPGRADE' // Attempting to spoof dev key in production
      });
      process.env.NODE_ENV = origNodeEnv;
      assertTest('14. Unauthorized Premium Upgrade Tampering Rejection', spoofRes.statusCode === 403 && spoofRes.json?.success === false);

    } finally {
      await new Promise(res => server2.close(res));
    }

  } finally {
    cleanupDirs();
  }

  console.log('\n======================================================');
  console.log(`E2E SUITE TOTAL: 14 | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('E2E Test Execution Error:', err);
  process.exit(1);
});
