/**
 * Woobi - Backend Module
 * AuthService.js - Secure Password Hashing (scrypt), HMAC-SHA256 Token Signing & Session Authorization
 */

import crypto from 'node:crypto';
import { AUTH_CONFIG, AUTH_ROLES, AUTH_EVENTS } from './AuthContract.js';

export class AuthService {
  constructor(databaseService = null, options = {}) {
    this.db = databaseService;
    this.options = { ...AUTH_CONFIG, ...options };
    this.signingSecret = process.env.WOOBI_AUTH_SECRET || this.options.DEFAULT_SIGNING_SECRET;
    this.revokedTokens = new Set();
    this.listeners = new Map();

    // Warm up revocation cache from persistent DB if available
    if (this.db && this.db.revokedTokens && typeof this.db.revokedTokens.getAll === 'function') {
      try {
        const persisted = this.db.revokedTokens.getAll();
        for (const item of persisted) {
          if (item && item.token) this.revokedTokens.add(item.token);
        }
      } catch {}
    }
  }

  // Event Subscription
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`AuthService event error [${event}]:`, err);
        }
      }
    }
  }

  /**
   * Validates password strength against policy
   * @param {string} password 
   * @returns {{ valid: boolean, error: string | null }}
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password must be a non-empty string' };
    }
    const policy = this.options.PASSWORD_POLICY;
    if (password.length < policy.MIN_LENGTH) {
      return { valid: false, error: `Password must be at least ${policy.MIN_LENGTH} characters long` };
    }
    if (policy.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    if (policy.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }
    if (policy.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one digit' };
    }
    if (policy.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one special character' };
    }
    return { valid: true, error: null };
  }

  /**
   * Hashes a password using crypto.scryptSync with a cryptographically secure random salt
   * @param {string} password 
   * @returns {string} Salt:Hash format
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(this.options.SALT_BYTE_LENGTH).toString('hex');
    const hash = crypto.scryptSync(password, salt, this.options.KEY_BYTE_LENGTH).toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies password against stored Salt:Hash in constant time
   * @param {string} password Plaintext password
   * @param {string} storedHash Salt:Hash string
   * @returns {boolean} True if matched
   */
  verifyPassword(password, storedHash) {
    if (!password || !storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
      return false;
    }
    try {
      const [salt, originalHash] = storedHash.split(':');
      const hashBuffer = Buffer.from(originalHash, 'hex');
      const testHash = crypto.scryptSync(password, salt, this.options.KEY_BYTE_LENGTH);
      return crypto.timingSafeEqual(hashBuffer, testHash);
    } catch {
      return false;
    }
  }

  /**
   * Generates a signed Bearer session token
   * @param {object} payload Payload containing userId, email, role, etc.
   * @returns {string} Bearer token
   */
  generateToken(payload = {}) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Date.now() + this.options.TOKEN_EXPIRY_MS;
    const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Date.now() })).toString('base64url');
    const signature = crypto.createHmac('sha256', this.signingSecret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  /**
   * Verifies a Bearer session token and returns decoded payload
   * @param {string} token 
   * @returns {{ valid: boolean, payload: object | null, error: string | null }}
   */
  verifyToken(token) {
    if (!token || typeof token !== 'string') {
      return { valid: false, payload: null, error: 'Token missing or invalid' };
    }

    if (this.revokedTokens.has(token)) {
      return { valid: false, payload: null, error: 'Token has been revoked' };
    }

    if (this.db && this.db.revokedTokens && typeof this.db.revokedTokens.getAll === 'function') {
      const persisted = this.db.revokedTokens.getAll();
      if (persisted.some(r => r && r.token === token)) {
        this.revokedTokens.add(token);
        return { valid: false, payload: null, error: 'Token has been revoked' };
      }
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, payload: null, error: 'Malformed token structure' };
    }

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', this.signingSecret).update(`${header}.${body}`).digest('base64url');

    try {
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { valid: false, payload: null, error: 'Invalid token signature' };
      }

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (Date.now() > payload.exp) {
        return { valid: false, payload: null, error: 'Token has expired' };
      }

      return { valid: true, payload, error: null };
    } catch {
      return { valid: false, payload: null, error: 'Failed to decode token payload' };
    }
  }

  /**
   * Revokes / blacklists a token on logout
   * @param {string} token 
   */
  revokeToken(token) {
    if (token) {
      this.revokedTokens.add(token);
      if (this.db && this.db.revokedTokens && typeof this.db.revokedTokens.revoke === 'function') {
        try {
          this.db.revokedTokens.revoke(token);
        } catch {}
      }
      this.emit(AUTH_EVENTS.TOKEN_REVOKED, { token });
    }
  }

  /**
   * Registers a new user account
   * @param {string} email 
   * @param {string} password 
   * @param {string} displayName 
   * @returns {{ success: boolean, user?: object, token?: string, error?: string }}
   */
  async register(email, password, displayName = 'Woobi User') {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Valid email address is required' };
    }

    const passCheck = this.validatePassword(password);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.error };
    }

    if (!this.db) {
      return { success: false, error: 'Database service unavailable' };
    }

    const existing = await this.db.users.findByEmail(email.toLowerCase());
    if (existing) {
      return { success: false, error: 'User with this email already exists' };
    }

    const passwordHash = this.hashPassword(password);
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;

    const newUser = await this.db.users.create({
      id: userId,
      email: email.toLowerCase(),
      displayName: displayName.trim(),
      passwordHash,
      role: AUTH_ROLES.USER,
      createdAt: new Date().toISOString()
    });

    const token = this.generateToken({ userId: newUser.id, email: newUser.email, role: newUser.role });
    this.emit(AUTH_EVENTS.REGISTERED, { userId: newUser.id, email: newUser.email });

    return {
      success: true,
      user: { id: newUser.id, email: newUser.email, displayName: newUser.displayName, role: newUser.role },
      token
    };
  }

  /**
   * Authenticates user with credentials
   * @param {string} email 
   * @param {string} password 
   * @returns {{ success: boolean, user?: object, token?: string, error?: string }}
   */
  async login(email, password) {
    if (!email || !password) {
      this.emit(AUTH_EVENTS.FAILED_ATTEMPT, { email });
      return { success: false, error: 'Email and password required' };
    }

    if (!this.db) {
      return { success: false, error: 'Database service unavailable' };
    }

    const user = await this.db.users.findByEmail(email.toLowerCase());
    if (!user) {
      this.emit(AUTH_EVENTS.FAILED_ATTEMPT, { email });
      return { success: false, error: 'Invalid email or password' };
    }

    const valid = this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      this.emit(AUTH_EVENTS.FAILED_ATTEMPT, { email });
      return { success: false, error: 'Invalid email or password' };
    }

    const token = this.generateToken({ userId: user.id, email: user.email, role: user.role });
    this.emit(AUTH_EVENTS.LOGGED_IN, { userId: user.id, email: user.email });

    return {
      success: true,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      token
    };
  }

  /**
   * Extracts and authenticates request header (Authorization: Bearer <token>)
   * @param {object} req Incoming HTTP request
   * @returns {{ authenticated: boolean, user: object | null, error: string | null }}
   */
  authenticateRequest(req) {
    if (!req || !req.headers) {
      return { authenticated: false, user: null, error: 'Missing request headers' };
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, user: null, error: 'Missing or malformed Authorization header' };
    }

    const token = authHeader.slice(7).trim();
    const result = this.verifyToken(token);
    if (!result.valid) {
      return { authenticated: false, user: null, error: result.error };
    }

    return {
      authenticated: true,
      user: result.payload,
      token,
      error: null
    };
  }
}

export function createAuthService(databaseService = null, options = {}) {
  return new AuthService(databaseService, options);
}

export default AuthService;
