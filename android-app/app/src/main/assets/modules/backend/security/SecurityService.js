/**
 * Woobi - Backend Module
 * SecurityService.js - Rate limiting, CORS, headers, path traversal protection & input sanitization
 */

import { SECURITY_POLICIES, SECURITY_EVENTS } from './SecurityContract.js';

export class SecurityService {
  constructor(options = {}) {
    this.options = { ...SECURITY_POLICIES, ...options };
    this.rateLimitBuckets = new Map(); // ip -> { count, resetTime }
    this.listeners = new Map();
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
          console.error(`SecurityService event error [${event}]:`, err);
        }
      }
    }
  }

  /**
   * Applies mandatory enterprise security headers to outgoing HTTP response
   * @param {object} res Node.js HTTP ServerResponse or mock
   */
  applySecurityHeaders(res) {
    if (!res || typeof res.setHeader !== 'function') return;

    const headers = this.options.HEADERS;
    res.setHeader('X-Content-Type-Options', headers.X_CONTENT_TYPE_OPTIONS);
    res.setHeader('X-Frame-Options', headers.X_FRAME_OPTIONS);
    res.setHeader('X-XSS-Protection', headers.X_XSS_PROTECTION);
    res.setHeader('Strict-Transport-Security', headers.STRICT_TRANSPORT_SECURITY);
    res.setHeader('Content-Security-Policy', headers.CONTENT_SECURITY_POLICY);
  }

  /**
   * Evaluates CORS headers and responds to preflight OPTIONS requests
   * @param {object} req Incoming HTTP request
   * @param {object} res Outgoing HTTP response
   * @returns {boolean} True if preflight was completely handled
   */
  handleCors(req, res) {
    if (!req || !res || typeof res.setHeader !== 'function') return false;

    const origin = req.headers ? (req.headers.origin || req.headers.Origin || '') : '';
    const cors = this.options.CORS;

    // Check if origin is allowed or wildcard in local dev
    let allowOrigin = '*';
    if (origin && cors.ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin;
    }

    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', cors.ALLOWED_METHODS.join(', '));
    res.setHeader('Access-Control-Allow-Headers', cors.ALLOWED_HEADERS.join(', '));
    res.setHeader('Access-Control-Max-Age', String(cors.MAX_AGE_SECONDS));

    if (req.method === 'OPTIONS') {
      if (typeof res.writeHead === 'function') {
        res.writeHead(204);
      }
      if (typeof res.end === 'function') {
        res.end();
      }
      return true;
    }

    return false;
  }

  /**
   * Rate limiting using sliding window counter per client IP
   * @param {string} ip Client IP address
   * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
   */
  checkRateLimit(ip = '127.0.0.1') {
    const now = Date.now();
    const windowMs = this.options.RATE_LIMIT.WINDOW_MS;
    const maxRequests = this.options.RATE_LIMIT.MAX_REQUESTS;

    let bucket = this.rateLimitBuckets.get(ip);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 0, resetTime: now + windowMs };
      this.rateLimitBuckets.set(ip, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, maxRequests - bucket.count);
    const allowed = bucket.count <= maxRequests;

    if (!allowed) {
      this.emit(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, { ip, count: bucket.count, maxRequests });
    }

    // Prune stale buckets periodically
    if (this.rateLimitBuckets.size > 1000) {
      this.pruneBuckets(now);
    }

    return {
      allowed,
      remaining,
      resetMs: Math.max(0, bucket.resetTime - now)
    };
  }

  pruneBuckets(now) {
    for (const [key, b] of this.rateLimitBuckets.entries()) {
      if (now > b.resetTime) {
        this.rateLimitBuckets.delete(key);
      }
    }
  }

  /**
   * Sanitizes generic string input to prevent XSS and control character injection
   * @param {string} str Input string
   * @returns {string} Sanitized string
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[\0\x08\x09\x1a\n\r"'\\]/g, (char) => {
        switch (char) {
          case '\0': return '';
          case '\n': return ' ';
          case '\r': return '';
          case "'": return '&#39;';
          case '"': return '&quot;';
          case '\\': return '&#92;';
          default: return '';
        }
      })
      .trim()
      .slice(0, this.options.INPUT_CONSTRAINTS.MAX_STRING_LENGTH);
  }

  /**
   * Validates file path to strictly prevent directory traversal attacks (../, null bytes, special chars)
   * @param {string} targetPath Relative path requested
   * @returns {{ safe: boolean, error: string | null }}
   */
  validatePath(targetPath) {
    if (typeof targetPath !== 'string' || !targetPath.trim()) {
      return { safe: false, error: 'Path must be a non-empty string' };
    }

    // Check against disallowed patterns (.. or null bytes or forbidden characters)
    for (const pattern of this.options.INPUT_CONSTRAINTS.DISALLOWED_PATH_PATTERNS) {
      if (pattern.test(targetPath)) {
        this.emit(SECURITY_EVENTS.TRAVERSAL_ATTEMPT, { path: targetPath, pattern: pattern.toString() });
        return { safe: false, error: 'Path contains unauthorized traversal or control characters' };
      }
    }

    // Check for drive letters, root slashes, or colon
    if (targetPath.startsWith('/') || targetPath.startsWith('\\') || /^[a-zA-Z]:/.test(targetPath)) {
      this.emit(SECURITY_EVENTS.TRAVERSAL_ATTEMPT, { path: targetPath, reason: 'Absolute path forbidden' });
      return { safe: false, error: 'Absolute paths are strictly forbidden' };
    }

    return { safe: true, error: null };
  }

  /**
   * Redacts sensitive fields (passwords, tokens, secrets) before logging or returning
   * @param {object} obj Object to sanitize
   * @returns {object} Clean copy
   */
  redactSensitiveData(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'authToken', 'authorization'];
    const copy = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.some(k => lower.includes(k))) {
        copy[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        copy[key] = this.redactSensitiveData(value);
      } else {
        copy[key] = value;
      }
    }

    return copy;
  }
}

export function createSecurityService(options = {}) {
  return new SecurityService(options);
}

export default SecurityService;
