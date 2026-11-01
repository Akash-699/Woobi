# Backend API Submodule (`modules/backend/api`)

## Responsibility
Dispatches incoming HTTP requests, enforces authentication middleware, routes to user-scoped entity controllers, and formats standardized JSON envelopes:
- **Router (`Router.js`)**: Lightweight, dependency-free HTTP router supporting parameter extraction (`:id`, `:filename`), query strings, body parsers, and middleware chains.
- **Controller (`ApiController.js`)**: Implements authenticated REST endpoints for user profiles, wardrobe management, saved looks, avatar customizations, user settings, daily streak counters, image uploads, and server-authoritative subscription verification.
- **Response Envelopes**: Standardized JSON envelopes across all endpoints (`{ success: true, data: ... }` / `{ success: false, error: ... }`).

## Endpoint Summary
- `GET /health`: Health status and service information.
- `POST /api/auth/register`: User registration with scrypt password hashing.
- `POST /api/auth/login`: User authentication issuing HMAC-SHA256 Bearer tokens.
- `POST /api/auth/logout`: Revokes current session token.
- `GET /api/auth/me`: Current session details.
- `GET/PUT /api/user/profile`: Read and update display name.
- `GET /api/user/subscription`: Authoritative subscription entitlement.
- `POST /api/user/subscription/verify`: Server-side entitlement verification.
- `GET/POST /api/wardrobe/items`: User-scoped garment operations.
- `DELETE /api/wardrobe/items/:id`: Delete garment (ownership protected).
- `GET/POST /api/looks`: Saved styling looks.
- `DELETE /api/looks/:id`: Delete saved look (ownership protected).
- `GET/PUT /api/avatar/preferences`: 3D avatar customization sync.
- `GET/PUT /api/settings`: User application and lighting settings.
- `GET/POST /api/streak`: Daily streak logs and increments.
- `POST /api/storage/upload`: Image uploads with magic-byte validation.
- `GET /api/storage/files/:filename`: Authorized user media retrieval.
