import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SecurityService, createSecurityService, SECURITY_POLICIES, SECURITY_EVENTS } from './index.js';

describe('Security Submodule - SecurityService', () => {
  let security;

  beforeEach(() => {
    security = createSecurityService();
  });

  // 1. Initialization
  it('1. initializes with default security policies', () => {
    assert.strictEqual(typeof security.options.CORS, 'object');
    assert.strictEqual(typeof security.options.HEADERS, 'object');
    assert.strictEqual(typeof security.options.RATE_LIMIT, 'object');
  });

  // 2. Custom configuration override
  it('2. allows overriding security policies via options', () => {
    const custom = createSecurityService({
      RATE_LIMIT: { WINDOW_MS: 5000, MAX_REQUESTS: 10 }
    });
    assert.strictEqual(custom.options.RATE_LIMIT.MAX_REQUESTS, 10);
  });

  // 3. Security Headers Injection
  it('3. applies standard security headers to response object', () => {
    const headers = {};
    const mockRes = {
      setHeader: (k, v) => { headers[k] = v; }
    };
    security.applySecurityHeaders(mockRes);

    assert.strictEqual(headers['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(headers['X-Frame-Options'], 'SAMEORIGIN');
    assert.strictEqual(headers['X-XSS-Protection'], '1; mode=block');
    assert.ok(headers['Strict-Transport-Security'].includes('max-age='));
    assert.ok(headers['Content-Security-Policy'].includes("default-src 'self'"));
  });

  // 4. Safe handling of invalid response object in applySecurityHeaders
  it('4. gracefully ignores null or invalid response objects in applySecurityHeaders', () => {
    assert.doesNotThrow(() => security.applySecurityHeaders(null));
    assert.doesNotThrow(() => security.applySecurityHeaders({}));
  });

  // 5. CORS Header Generation
  it('5. applies CORS headers for valid origin', () => {
    const headers = {};
    const mockReq = { headers: { origin: 'http://localhost:8080' }, method: 'GET' };
    const mockRes = { setHeader: (k, v) => { headers[k] = v; } };

    const handled = security.handleCors(mockReq, mockRes);
    assert.strictEqual(handled, false);
    assert.strictEqual(headers['Access-Control-Allow-Origin'], 'http://localhost:8080');
    assert.ok(headers['Access-Control-Allow-Methods'].includes('GET'));
  });

  // 6. CORS Preflight OPTIONS Handling
  it('6. handles and terminates preflight OPTIONS requests with 204 status', () => {
    let statusCode = null;
    let ended = false;
    const mockReq = { headers: { origin: 'http://localhost:8080' }, method: 'OPTIONS' };
    const mockRes = {
      setHeader: () => {},
      writeHead: (code) => { statusCode = code; },
      end: () => { ended = true; }
    };

    const handled = security.handleCors(mockReq, mockRes);
    assert.strictEqual(handled, true);
    assert.strictEqual(statusCode, 204);
    assert.strictEqual(ended, true);
  });

  // 7. CORS Fallback for Non-Whitelisted Origin in Local Dev
  it('7. falls back to wildcard origin when unrecognized in local dev', () => {
    const headers = {};
    const mockReq = { headers: { origin: 'http://unknown-domain.com' }, method: 'GET' };
    const mockRes = { setHeader: (k, v) => { headers[k] = v; } };

    security.handleCors(mockReq, mockRes);
    assert.strictEqual(headers['Access-Control-Allow-Origin'], '*');
  });

  // 8. Rate Limiting - Initial Request
  it('8. permits initial requests and tracks remaining capacity', () => {
    const status = security.checkRateLimit('192.168.1.5');
    assert.strictEqual(status.allowed, true);
    assert.strictEqual(status.remaining, SECURITY_POLICIES.RATE_LIMIT.MAX_REQUESTS - 1);
    assert.ok(status.resetMs > 0);
  });

  // 9. Rate Limiting - Threshold Enforcement
  it('9. blocks requests once rate limit threshold is exceeded', () => {
    const tightSecurity = createSecurityService({
      RATE_LIMIT: { WINDOW_MS: 10000, MAX_REQUESTS: 3 }
    });

    assert.strictEqual(tightSecurity.checkRateLimit('10.0.0.1').allowed, true);
    assert.strictEqual(tightSecurity.checkRateLimit('10.0.0.1').allowed, true);
    assert.strictEqual(tightSecurity.checkRateLimit('10.0.0.1').allowed, true);

    const fourth = tightSecurity.checkRateLimit('10.0.0.1');
    assert.strictEqual(fourth.allowed, false);
    assert.strictEqual(fourth.remaining, 0);
  });

  // 10. Rate Limiting - Event Emission on Overflow
  it('10. emits security:rate_limit_exceeded event when threshold breached', () => {
    const tightSecurity = createSecurityService({
      RATE_LIMIT: { WINDOW_MS: 10000, MAX_REQUESTS: 1 }
    });

    let emitted = null;
    tightSecurity.on(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, (data) => {
      emitted = data;
    });

    tightSecurity.checkRateLimit('10.0.0.2');
    tightSecurity.checkRateLimit('10.0.0.2');

    assert.ok(emitted);
    assert.strictEqual(emitted.ip, '10.0.0.2');
    assert.strictEqual(emitted.count, 2);
  });

  // 11. Rate Limiting - Independent Client Tracking
  it('11. tracks rate limits independently across different client IPs', () => {
    const tightSecurity = createSecurityService({
      RATE_LIMIT: { WINDOW_MS: 10000, MAX_REQUESTS: 2 }
    });

    tightSecurity.checkRateLimit('client-A');
    tightSecurity.checkRateLimit('client-A');
    assert.strictEqual(tightSecurity.checkRateLimit('client-A').allowed, false);

    // client-B should still have capacity
    assert.strictEqual(tightSecurity.checkRateLimit('client-B').allowed, true);
  });

  // 12. Path Traversal - Parent Directory Attack Prevention
  it('12. blocks parent directory traversal attempts (../)', () => {
    const res = security.validatePath('../../../etc/passwd');
    assert.strictEqual(res.safe, false);
    assert.ok(res.error.includes('unauthorized traversal'));
  });

  // 13. Path Traversal - Null Byte Injection
  it('13. blocks null byte character injection', () => {
    const res = security.validatePath('assets/image.png\0.exe');
    assert.strictEqual(res.safe, false);
    assert.ok(res.error.includes('unauthorized traversal'));
  });

  // 14. Path Traversal - Absolute Paths
  it('14. blocks absolute paths and Windows drive letter notation', () => {
    assert.strictEqual(security.validatePath('/etc/shadow').safe, false);
    assert.strictEqual(security.validatePath('\\windows\\system32').safe, false);
    assert.strictEqual(security.validatePath('C:\\Windows').safe, false);
  });

  // 15. Path Traversal - Valid Relative Paths
  it('15. permits safe relative asset paths', () => {
    const res = security.validatePath('assets/textures/fabric_denim.jpg');
    assert.strictEqual(res.safe, true);
    assert.strictEqual(res.error, null);
  });

  // 16. Path Traversal - Event Emission
  it('16. emits security:traversal_attempt event on forbidden path', () => {
    let eventData = null;
    security.on(SECURITY_EVENTS.TRAVERSAL_ATTEMPT, (d) => { eventData = d; });

    security.validatePath('../../secret.env');
    assert.ok(eventData);
    assert.strictEqual(eventData.path, '../../secret.env');
  });

  // 17. Input Sanitization - Control Characters
  it('17. sanitizes null bytes and control characters from string inputs', () => {
    const raw = 'Hello\0World\r\nTest';
    const cleaned = security.sanitizeString(raw);
    assert.strictEqual(cleaned, 'HelloWorld Test');
  });

  // 18. Input Sanitization - HTML / XSS Special Characters
  it('18. escapes quotes and backslashes in user string inputs', () => {
    const raw = 'John "O\'Connor"\\Test';
    const cleaned = security.sanitizeString(raw);
    assert.strictEqual(cleaned, 'John &quot;O&#39;Connor&quot;&#92;Test');
  });

  // 19. Input Sanitization - Max Length Truncation
  it('19. truncates excessively long input strings to configured limit', () => {
    const custom = createSecurityService({
      INPUT_CONSTRAINTS: { MAX_STRING_LENGTH: 10, DISALLOWED_PATH_PATTERNS: [] }
    });
    const longStr = '12345678901234567890';
    assert.strictEqual(custom.sanitizeString(longStr).length, 10);
  });

  // 20. Sensitive Data Redaction - Password & Secrets
  it('20. redacts passwords, tokens and secrets from object logs', () => {
    const input = {
      username: 'suriya',
      password: 'SuperSecretPassword123!',
      nested: {
        authToken: 'jwt-token-xyz',
        profileName: 'Aura User'
      }
    };

    const redacted = security.redactSensitiveData(input);
    assert.strictEqual(redacted.username, 'suriya');
    assert.strictEqual(redacted.password, '[REDACTED]');
    assert.strictEqual(redacted.nested.authToken, '[REDACTED]');
    assert.strictEqual(redacted.nested.profileName, 'Aura User');
  });

  // 21. Sensitive Data Redaction - Immutability
  it('21. does not mutate original object during redaction', () => {
    const original = { password: 'secret123' };
    security.redactSensitiveData(original);
    assert.strictEqual(original.password, 'secret123');
  });

  // 22. Safe Handling of Empty or Non-String in validatePath
  it('22. flags empty or non-string paths as unsafe', () => {
    assert.strictEqual(security.validatePath('').safe, false);
    assert.strictEqual(security.validatePath(null).safe, false);
    assert.strictEqual(security.validatePath(123).safe, false);
  });

  // 23. Rate Limiting Reset Window Expiry
  it('23. resets client count after window expires', () => {
    const tightSecurity = createSecurityService({
      RATE_LIMIT: { WINDOW_MS: 50, MAX_REQUESTS: 1 }
    });
    tightSecurity.checkRateLimit('1.1.1.1');
    assert.strictEqual(tightSecurity.checkRateLimit('1.1.1.1').allowed, false);

    // Fast-forward bucket resetTime manually to simulate passage of time
    tightSecurity.rateLimitBuckets.get('1.1.1.1').resetTime = Date.now() - 10;
    assert.strictEqual(tightSecurity.checkRateLimit('1.1.1.1').allowed, true);
  });

  // 24. Safe String Sanitization with null/undefined
  it('24. returns empty string when sanitizing null or undefined', () => {
    assert.strictEqual(security.sanitizeString(null), '');
    assert.strictEqual(security.sanitizeString(undefined), '');
    assert.strictEqual(security.sanitizeString({}), '');
  });

  // 25. Event Handler Error Resiliency
  it('25. catches and does not crash when an event subscriber throws an error', () => {
    security.on(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, () => {
      throw new Error('Subscriber failed');
    });
    assert.doesNotThrow(() => {
      security.emit(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, { ip: '1.2.3.4' });
    });
  });
});
