/**
 * Woobi - Backend Module
 * SecurityContract.js - Public Interface Contract & Security Policy Configuration
 */

export const SECURITY_POLICIES = {
  // CORS Configuration
  CORS: {
    ALLOWED_ORIGINS: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    MAX_AGE_SECONDS: 86400
  },

  // Security HTTP Headers
  HEADERS: {
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_FRAME_OPTIONS: 'SAMEORIGIN',
    X_XSS_PROTECTION: '1; mode=block',
    STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains',
    CONTENT_SECURITY_POLICY: "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' blob:; media-src 'self' blob: data:;"
  },

  // Rate Limiting Policy
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000,      // 1 minute window
    MAX_REQUESTS: 120,          // 120 requests per minute per IP
    BURST_TOLERANCE: 20,
    ENABLE_IN_DEV: true
  },

  // Input Sanitization
  INPUT_CONSTRAINTS: {
    MAX_BODY_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
    MAX_STRING_LENGTH: 4096,
    DISALLOWED_PATH_PATTERNS: [/\.\./, /\0/, /[<>:"|?*]/]
  }
};

export const SECURITY_EVENTS = {
  RATE_LIMIT_EXCEEDED: 'security:rate_limit_exceeded',
  TRAVERSAL_ATTEMPT: 'security:traversal_attempt',
  AUTH_FAILURE_FLOOD: 'security:auth_failure_flood',
  INVALID_PAYLOAD: 'security:invalid_payload'
};

export const SecurityContract = {
  policies: SECURITY_POLICIES,
  events: SECURITY_EVENTS
};

export default SecurityContract;
