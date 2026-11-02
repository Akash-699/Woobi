# Backend Security Submodule (`modules/backend/security`)

## Responsibility
Enforces application security standards across all incoming HTTP requests and outgoing responses:
- **Mandatory Security Headers**: Injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Strict-Transport-Security`, and strict `Content-Security-Policy`.
- **CORS Handling**: Validates permitted origins, exposes authorized headers, and handles preflight `OPTIONS` requests.
- **Rate Limiting**: Sliding-window IP rate limiter preventing DDoS, credential stuffing, and brute force attacks.
- **Path Traversal Protection**: Rejects `../`, null bytes, control characters, and absolute filesystem paths.
- **Input Sanitization**: Cleans control characters and prevents injection attacks.
- **Sensitive Data Redaction**: Automatically scrubs credentials, password hashes, and tokens from error logs and diagnostic responses.

## Key APIs
- `applySecurityHeaders(res)`: Sets enterprise HTTP response security headers.
- `handleCors(req, res)`: Manages CORS headers and handles preflight requests.
- `checkRateLimit(ip)`: Sliding-window rate limiter per client IP.
- `validatePath(targetPath)`: Validates relative filesystem paths.
- `redactSensitiveData(obj)`: Masks sensitive values with `[REDACTED]`.
