import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AuthService, createAuthService, AUTH_CONFIG, AUTH_ROLES, AUTH_EVENTS } from './index.js';

// In-memory mock database service
function createMockDatabase() {
  const users = new Map();
  return {
    users: {
      findByEmail: async (email) => {
        for (const u of users.values()) {
          if (u.email === email) return { ...u };
        }
        return null;
      },
      findById: async (id) => users.get(id) || null,
      create: async (data) => {
        users.set(data.id, { ...data });
        return { ...data };
      }
    }
  };
}

describe('Authentication Submodule - AuthService', () => {
  let auth;
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDatabase();
    auth = createAuthService(mockDb);
  });

  // 1. Password Policy - Length
  it('1. rejects passwords shorter than configured minimum length', () => {
    const res = auth.validatePassword('Short1');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('at least 8 characters'));
  });

  // 2. Password Policy - Uppercase
  it('2. rejects passwords without uppercase letters', () => {
    const res = auth.validatePassword('lowercase123');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('uppercase letter'));
  });

  // 3. Password Policy - Lowercase
  it('3. rejects passwords without lowercase letters', () => {
    const res = auth.validatePassword('UPPERCASE123');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('lowercase letter'));
  });

  // 4. Password Policy - Digits
  it('4. rejects passwords without numeric digits', () => {
    const res = auth.validatePassword('NoDigitsHere');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('at least one digit'));
  });

  // 5. Password Policy - Valid
  it('5. accepts passwords meeting all complexity criteria', () => {
    const res = auth.validatePassword('ValidPassword123');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.error, null);
  });

  // 6. Password Hashing & Salt Uniqueness
  it('6. produces unique hashes for the same password due to random salting', () => {
    const hash1 = auth.hashPassword('MyPassword123');
    const hash2 = auth.hashPassword('MyPassword123');

    assert.notStrictEqual(hash1, hash2);
    assert.ok(hash1.includes(':'));
    assert.ok(hash2.includes(':'));
  });

  // 7. Password Verification - Correct Password
  it('7. verifies correct password against hashed representation', () => {
    const hash = auth.hashPassword('SecretAuraPass1!');
    const isValid = auth.verifyPassword('SecretAuraPass1!', hash);
    assert.strictEqual(isValid, true);
  });

  // 8. Password Verification - Incorrect Password
  it('8. rejects incorrect password verification', () => {
    const hash = auth.hashPassword('SecretAuraPass1!');
    const isValid = auth.verifyPassword('WrongPassword123', hash);
    assert.strictEqual(isValid, false);
  });

  // 9. Password Verification - Malformed Hash
  it('9. safely returns false when verifying against malformed hash string', () => {
    assert.strictEqual(auth.verifyPassword('Password123', 'invalid-hash-no-salt'), false);
    assert.strictEqual(auth.verifyPassword('Password123', null), false);
  });

  // 10. Token Generation & Structure
  it('10. generates valid tripartite HMAC-SHA256 bearer tokens', () => {
    const token = auth.generateToken({ userId: 'usr_123', role: 'user' });
    const parts = token.split('.');
    assert.strictEqual(parts.length, 3);
  });

  // 11. Token Verification - Valid Token
  it('11. successfully verifies and decodes valid session token', () => {
    const token = auth.generateToken({ userId: 'usr_456', email: 'test@woobi.com', role: 'user' });
    const res = auth.verifyToken(token);

    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.payload.userId, 'usr_456');
    assert.strictEqual(res.payload.email, 'test@woobi.com');
  });

  // 12. Token Verification - Tampered Signature
  it('12. rejects token with tampered payload or signature', () => {
    const token = auth.generateToken({ userId: 'usr_normal', role: 'user' });
    const parts = token.split('.');
    // Tamper with payload to elevate role to admin
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'usr_normal', role: 'admin' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const res = auth.verifyToken(tamperedToken);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('signature'));
  });

  // 13. Token Verification - Expired Token
  it('13. rejects expired session tokens', () => {
    const shortAuth = createAuthService(mockDb, { TOKEN_EXPIRY_MS: -1000 }); // expired in past
    const expiredToken = shortAuth.generateToken({ userId: 'usr_789' });

    const res = shortAuth.verifyToken(expiredToken);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('expired'));
  });

  // 14. Token Revocation on Logout
  it('14. invalidates token once revoked on logout', () => {
    const token = auth.generateToken({ userId: 'usr_logout_test' });
    assert.strictEqual(auth.verifyToken(token).valid, true);

    auth.revokeToken(token);
    const postRevoke = auth.verifyToken(token);
    assert.strictEqual(postRevoke.valid, false);
    assert.ok(postRevoke.error.includes('revoked'));
  });

  // 15. User Registration - Success
  it('15. registers new user account with secure credentials and session token', async () => {
    const res = await auth.register('suriya@example.com', 'AuraSecurePass1!', 'Suriya');
    assert.strictEqual(res.success, true);
    assert.ok(res.user.id.startsWith('usr_'));
    assert.strictEqual(res.user.email, 'suriya@example.com');
    assert.strictEqual(res.user.displayName, 'Suriya');
    assert.ok(res.token);
  });

  // 16. User Registration - Duplicate Email Prevention
  it('16. prevents registration with already existing email address', async () => {
    await auth.register('duplicate@example.com', 'AuraSecurePass1!', 'User One');
    const res = await auth.register('duplicate@example.com', 'AnotherPass123!', 'User Two');

    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('already exists'));
  });

  // 17. User Registration - Invalid Email
  it('17. rejects invalid email formats during registration', async () => {
    const res = await auth.register('not-an-email', 'ValidPass123!', 'Name');
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('Valid email'));
  });

  // 18. User Login - Successful Authentication
  it('18. logs in user with correct credentials and issues new token', async () => {
    await auth.register('login@example.com', 'CorrectPass1!', 'Login User');
    const loginRes = await auth.login('login@example.com', 'CorrectPass1!');

    assert.strictEqual(loginRes.success, true);
    assert.ok(loginRes.token);
    assert.strictEqual(loginRes.user.email, 'login@example.com');
  });

  // 19. User Login - Incorrect Password
  it('19. rejects login when password does not match', async () => {
    await auth.register('login2@example.com', 'CorrectPass1!', 'Login User');
    const loginRes = await auth.login('login2@example.com', 'WrongPassword123');

    assert.strictEqual(loginRes.success, false);
    assert.strictEqual(loginRes.error, 'Invalid email or password');
  });

  // 20. User Login - Non-existent Account
  it('20. rejects login when email does not exist', async () => {
    const loginRes = await auth.login('ghost@example.com', 'SomePass123!');
    assert.strictEqual(loginRes.success, false);
    assert.strictEqual(loginRes.error, 'Invalid email or password');
  });

  // 21. Request Authentication Middleware - Valid Header
  it('21. authenticates HTTP request with Bearer Authorization header', () => {
    const token = auth.generateToken({ userId: 'usr_req_1', role: 'user' });
    const req = {
      headers: { authorization: `Bearer ${token}` }
    };

    const authRes = auth.authenticateRequest(req);
    assert.strictEqual(authRes.authenticated, true);
    assert.strictEqual(authRes.user.userId, 'usr_req_1');
  });

  // 22. Request Authentication Middleware - Missing Header
  it('22. fails authentication when Authorization header is missing', () => {
    const req = { headers: {} };
    const authRes = auth.authenticateRequest(req);
    assert.strictEqual(authRes.authenticated, false);
    assert.ok(authRes.error.includes('Missing or malformed'));
  });

  // 23. Request Authentication Middleware - Non-Bearer Scheme
  it('23. fails authentication when scheme is not Bearer', () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const authRes = auth.authenticateRequest(req);
    assert.strictEqual(authRes.authenticated, false);
    assert.ok(authRes.error.includes('Missing or malformed'));
  });

  // 24. Event Emission - Registration Event
  it('24. emits auth:registered event upon new account creation', async () => {
    let emitted = null;
    auth.on(AUTH_EVENTS.REGISTERED, (d) => { emitted = d; });

    await auth.register('event_test@example.com', 'SecurePass1!', 'Event User');
    assert.ok(emitted);
    assert.strictEqual(emitted.email, 'event_test@example.com');
  });

  // 25. Event Emission - Failed Attempt Event
  it('25. emits auth:failed_attempt event on incorrect login', async () => {
    let failedData = null;
    auth.on(AUTH_EVENTS.FAILED_ATTEMPT, (d) => { failedData = d; });

    await auth.login('nonexistent@example.com', 'badpass');
    assert.ok(failedData);
    assert.strictEqual(failedData.email, 'nonexistent@example.com');
  });
});
