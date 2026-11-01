# Woobi

[![Woobi CI & Release Gate](https://github.com/Troyz-Solutions/Woobi/actions/workflows/ci.yml/badge.svg)](https://github.com/Troyz-Solutions/Woobi/actions/workflows/ci.yml)

**Woobi** is an editorial 3D virtual styling dressing room and fashion technology monorepo application engineered and owned by **Troyz Solutions**.

---

## 1. System Architecture

Woobi follows a strict 5-domain monorepo architecture with clean architectural boundaries and zero circular dependencies:

```text
modules/
├── 3d-studio/            # Physical WebGL 3D Studio Engine
│   ├── stage/            # 8.0cm Dais stage platform and woven rug
│   ├── wardrobe/         # Oak/brass wardrobe closet with kinematics
│   ├── mirror-vanity/    # Arched vanity table with WebGL mirror reflections
│   ├── avatar/           # Sculpted humanoid avatar rig with bone hierarchy
│   ├── lighting/         # 3-point editorial lighting system & presets
│   ├── theme/            # Atmosphere palettes (luxury-cream, nordic, terracotta)
│   └── camera/           # Cinematic camera presets and orbit controls
│
├── 3d-studio-features/   # Interactive Fashion Capabilities
│   ├── virtual-try-on/   # Garment attachment and cloth layering
│   ├── garment-interactions/ # Wardrobe door kinematics and garment selection
│   ├── outfit-recommendations/ # AI styling rules & color harmony algorithms
│   ├── avatar-customization/ # Skin tones, hairstyles, proportions, accessories
│   ├── animations/       # Organic idle breathing and mannequin pose controller
│   └── saved-looks/      # Wardrobe lookbook and bookmarking manager
│
├── settings/             # User & Application Configuration
│   ├── account/          # Profile editing, plan subscriptions, session management
│   ├── appearance/       # App themes, studio atmospheres, lighting presets
│   ├── privacy/          # Local-first governance, data export, cache purging
│   ├── notifications/    # 24-hr reminder schedules, permission management
│   └── performance/      # Graphics fidelity, shadow maps, battery saver mode
│
├── backend/              # Server-Side Services & REST API
│   ├── api/              # HTTP REST router & controllers (/api/*, /health)
│   ├── auth/             # Scrypt password hashing, HMAC-SHA256 Bearer tokens
│   ├── database/         # ACID-resilient JSON repository with mutex writes & recovery
│   ├── storage/          # Magic-byte file validation (JPEG, PNG, WebP) & user isolation
│   └── security/         # Security headers, CORS preflights, sliding rate limiting
│
└── core/                 # Shared Monorepo Utilities & State
    ├── state/            # Authoritative central Store (window.woobiStore)
    ├── navigation/       # NavigationRouter with screen state mapping
    └── api/              # Browser-safe HTTP fetch client
```

---

## 2. Quickstart & Local Development

### Prerequisites
- **Node.js**: v20 or v24+ (native standard library; zero external npm runtime dependencies required)
- **PowerShell** (for boundary validation)
- **Android Studio / JDK 17** (optional, for Android APK builds)

### Running the Application & Backend Server
```bash
# Start the unified Woobi application server (serves web UI and REST API on port 8080)
node server.js
```
Open `http://localhost:8080/` in any modern web browser.

---

## 3. Automated Quality Gates & Testing

Woobi enforces a comprehensive 631-test automated regression suite covering all 5 architectural domains:

```bash
# Execute full master monorepo test suite (29 suites, 631 verified tests)
node scripts/testing/run-all-tests.js

# Execute real HTTP End-to-End backend integration suite (14 scenarios)
node scripts/testing/test-backend-e2e.js

# Validate module boundaries and circular dependency isolation
powershell -ExecutionPolicy Bypass -File scripts/validation/validate-boundaries.ps1
```

---

## 4. Android Native Application Build

Woobi includes a native Android shell with WebView integration for cross-platform deployment:

```bash
cd android-app
./gradlew assembleDebug
```
The compiled debug APK is generated at `android-app/app/build/outputs/apk/debug/app-debug.apk`.

---

## 5. Environment Configuration

Copy `.env.example` to `.env` to customize local development settings:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Local server port | `8080` |
| `WOOBI_AUTH_SECRET` | HMAC-SHA256 session token signing key | `dev-secret-key-32bytes-min-len!!` |
| `WOOBI_DATA_DIR` | Database file directory | `./data` |
| `WOOBI_STORAGE_DIR` | Uploaded images directory | `./uploads` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |

---

## 6. Monorepo Architectural Boundary Rules

1. **Zero Browser-to-Backend Imports**: Browser code (`index.html`, `app.js`, `modules/3d-studio*`, `modules/settings`) must **NEVER** import backend implementation files directly. Communication occurs exclusively over HTTP REST (`fetch('/api/...')`).
2. **Public Index Target**: Cross-module imports must target the public module entry point (`modules/<module>/index.js`), never deep internal files.
3. **Authoritative State**: State synchronization flows through `modules/core/state/Store.js`. No competing shadow stores are permitted.

---

## 7. Contribution Workflow

- Interns and contributors must work in a fork or dedicated feature branch (`feature/WD-123-short-description`), never directly on `main`.
- Open a Pull Request against `main` and link the assigned Work Deck task.
- Ensure all 631 regression tests, boundary validations, and Android builds pass before requesting review.
- An authorized Troyz Solutions administrator reviews and merges accepted pull requests.

&copy; 2026 **Troyz Solutions**. All rights reserved.
