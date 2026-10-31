# Module 4: Backend (`modules/backend`)

## Responsibility
Responsible for server-side functionality, database operations, authentication, authorization, media storage, and security middleware.

## Submodules
1. `api/`: HTTP REST router, `/health` health-check endpoint, static file streaming with MIME detection.
2. `auth/`: Authentication tokens, password reset flows, session authorization.
3. `database/`: Data models and repositories for garments, outfits, users, and wear logs.
4. `storage/`: Image uploads, local file storage adapters, avatar GLB hosting.
5. `security/`: Path traversal protection, CORS header enforcement, input sanitization.

## Architectural Boundary & Client Communication
> [!IMPORTANT]
> **Zero Implementation Imports in Browser**:
> Browser client code (`apps/web`, `modules/3d-studio`, `modules/3d-studio-features`, `modules/settings`) must **NEVER** import backend implementation files.
> All communication between browser and backend must occur over **HTTP/REST network requests** (e.g. `fetch('/api/...')`).
