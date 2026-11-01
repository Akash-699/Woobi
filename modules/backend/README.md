# Module 4: Backend (`modules/backend`)

## Responsibility
Responsible for server-side architecture, ACID database persistence, cryptographic authentication, media storage, request routing, application security middleware, and client API SDK for Woobi.

## Submodules
1. **`api/`**: Full REST API router, endpoint controllers, standardized JSON response envelopes, and parameter extraction (`/health`, `/api/auth/*`, `/api/user/*`, `/api/wardrobe/*`, `/api/looks/*`, `/api/avatar/*`, `/api/settings/*`, `/api/streak/*`, `/api/storage/*`).
2. **`auth/`**: Scrypt password hashing with unique 16-byte random salts, constant-time `timingSafeEqual` password verification, stateless HMAC-SHA256 Bearer tokens, token expiration, and logout revocation.
3. **`database/`**: ACID-compliant JSON repository engine featuring atomic file writes (`.tmp` + `renameSync`), tenant isolation by authenticated `userId`, and server-authoritative subscription entitlement management.
4. **`storage/`**: Binary upload validation, true magic-byte MIME sniffing (JPEG, PNG, WebP), path traversal prevention, user-partitioned media directories (`uploads/<userId>/`), and authorized file streaming.
5. **`security/`**: Enterprise HTTP security headers (`nosniff`, `SAMEORIGIN`, CSP, HSTS), CORS preflight handler, sliding-window IP rate limiter, input sanitization, and automated sensitive credential redaction.

## Architectural Boundary & Client Communication
> [!IMPORTANT]
> **Zero Direct Implementation Imports in Browser**:
> Browser client code (`apps/web`, `modules/3d-studio`, `modules/3d-studio-features`, `modules/settings`) must **NEVER** import backend implementation files.
> All communication between browser and backend occurs strictly over **HTTP/REST network requests** (e.g. `fetch('/api/...')` or `ApiClient`).

## Local Development Execution
The live HTTP server in `server.js` automatically mounts `modules/backend/index.js` on startup:
```bash
node server.js
```
The server binds to port 8080 (or next available port in list) and serves:
- Static web application files (`index.html`, `styles.css`, `app.js`, 3D models)
- REST API routes under `/api/*` and `/health`
