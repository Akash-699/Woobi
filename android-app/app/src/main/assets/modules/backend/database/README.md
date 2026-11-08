# Backend Database Submodule (`modules/backend/database`)

## Responsibility
Provides an ACID-compliant repository engine with atomic file writes, user-scoped tenant isolation, and schema migration tracking:
- **Atomic Persistence**: Writes serialized JSON payloads to temporary files before synchronously renaming them (`fs.renameSync`), eliminating corrupted records during unexpected crashes.
- **Strict User Scoping**: Enforces authenticated `userId` filters across all read, update, and delete queries on user-owned entities (wardrobe items, saved looks, avatar customizations, streak logs).
- **Server-Authoritative Entitlements**: Manages premium subscription entitlements (`SubscriptionRepository`) independently from client-side state.
- **In-Memory & Test Flexibility**: Supports rapid isolated in-memory modes for automated CI testing alongside durable filesystem persistence for local runtime.

## Entity Repositories
- `users`: Identity records, email addresses, password hashes, and roles.
- `wardrobe`: User garment metadata (category, color, seasonality, fit, condition, photo).
- `looks`: Saved styling outfits, occasion tags, and bookmarks.
- `avatar`: 3D avatar customization preferences (skin tone, hairstyle, hair color, body proportions).
- `settings`: Global application, 3D theme, and lighting preferences.
- `streak`: Daily outfit logging history and streak counters.
- `subscriptions`: Server-verified subscription entitlement records.
