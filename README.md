# Woobi — Your wardrobe, reimagined

**A virtual fashion wardrobe and interactive 3D styling studio by [Troyz Solutions](https://www.troyzsolutions.com/).**

[![Woobi CI](https://github.com/Troyz-Solutions/Woobi/actions/workflows/ci.yml/badge.svg)](https://github.com/Troyz-Solutions/Woobi/actions/workflows/ci.yml)
[![Repository](https://img.shields.io/badge/GitHub-Troyz--Solutions%2FWoobi-24292f)](https://github.com/Troyz-Solutions/Woobi)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Android-blue)
![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monorepo-167d6c)

> **Project status:** The modularization work is implemented on development/integration branches and is under review. The default `main` branch may not yet include everything documented here. This README belongs to the Phase 9 development lineage, **not a statement that the app has launched to production**.

## What is Woobi?

Woobi is a fashion technology project built to make the clothes people already own more useful. Users can organize their wardrobe, explore outfit combinations, customize a digital avatar, interact with a 3D dressing room, and save looks for later.

The central idea is simple: **good outfits, already yours.** Instead of suggesting that users buy more clothes, Woobi is designed to help them discover new ways to wear their existing wardrobe.

**Product capabilities implemented or represented in the Phase 9 codebase:**

- **Digital wardrobe:** organize garments and associated photos/metadata.
- **Interactive 3D studio:** explore a virtual wardrobe, stage, mirror and vanity with responsive cameras and lighting.
- **Avatar customization:** change supported presentation, proportions, skin/hair options and accessories.
- **Virtual try-on:** apply supported garment representations to the avatar; this is **not** a claim of photorealistic cloth fitting for arbitrary uploads.
- **Outfit recommendations:** rule/preset-based matching, color harmony and occasion-related scoring; no independently verified production ML model is implied.
- **Saved looks:** save, recall and manage outfit combinations.
- **Personal settings:** appearance, privacy, notifications, performance and account preferences.
- **Backend APIs:** authentication, wardrobe records, saved looks, settings, uploads and user-scoped data access.

Some capabilities depend on the configured server, assets, operating system and user permissions. Tests and modules existing in the repository do not themselves guarantee production availability.

## Technology at a glance

| Layer | Implementation |
| --- | --- |
| Web application | JavaScript, HTML, CSS |
| 3D rendering | Three.js / WebGL; GLB assets |
| Server | Node.js HTTP server and modular REST handlers |
| Authentication | Server-signed bearer tokens and password hashing |
| Development data | Local, file-backed JSON collections; user-scoped uploads |
| Android | Android application wrapping web content via WebView |
| Collaboration | GitHub feature branches, pull requests, CODEOWNERS and GitHub Actions |
| Testing | Node-based module suites, HTTP integration tests and architectural boundary validation |

The current JSON persistence layer is designed for a **single server process**. It is not a substitute for a production-grade multi-writer database without further validation. Production deployment and real-device acceptance remain separate release gates.

## Repository architecture

Woobi uses **one repository with five primary module domains**. A module owns a specific responsibility and exposes a public interface to the rest of the application.

```text
Woobi/
├── modules/
│   ├── core/                    # App bootstrap, login, navigation, shared UI, state, errors
│   │   └── login/               # Selected playable login page and source assets
│   ├── 3d-studio/               # Physical 3D scene and rendering
│   │   ├── stage/
│   │   ├── wardrobe/
│   │   ├── mirror-vanity/
│   │   ├── avatar/
│   │   ├── lighting/
│   │   ├── theme/
│   │   └── camera/
│   ├── 3d-studio-features/      # User-facing interactions and styling logic
│   │   ├── virtual-try-on/
│   │   ├── garment-interactions/
│   │   ├── outfit-recommendations/
│   │   ├── avatar-customization/
│   │   ├── animations/
│   │   └── saved-looks/
│   ├── settings/
│   │   ├── account/
│   │   ├── appearance/
│   │   ├── privacy/
│   │   ├── notifications/
│   │   └── performance/
│   └── backend/
│       ├── api/
│       ├── auth/
│       ├── database/
│       ├── storage/
│       └── security/
├── android-app/                # Existing Android Gradle project
├── apps/                       # Application organization / integration scaffolding
├── assets/                     # Shared assets where present
├── scripts/
│   ├── testing/
│   └── validation/
├── docs/                       # Architecture and operations references
├── .github/
│   ├── workflows/
│   └── CODEOWNERS
├── index.html                  # Current web entry point
├── app.js                      # Existing UI orchestration bridge
├── studio3d.js                 # Existing 3D orchestration bridge
├── server.js                   # Web and API server entry point
└── package.json
```

**Why keep a monorepo?** Developers can work on individual components while sharing one integration baseline, central contracts, regression tests and release process. The modules are not necessarily standalone deployable applications.

### What each domain owns

| Module | Owns | Does not own |
| --- | --- | --- |
| `core` | Navigation, app state, bootstrap, reusable UI, errors | Garment rendering or user database records |
| `3d-studio` | Physical models, materials, camera, lighting, scene lifecycle | Outfit recommendation decisions |
| `3d-studio-features` | Try-on workflow, picking, suggestions, poses, saved looks | Low-level scene geometry ownership |
| `settings` | User controls for themes, privacy, notifications, account and performance | Server authentication authority |
| `backend` | HTTP API, authentication, user data and upload protection | Client-side rendering and DOM |

### Example: selecting and saving an outfit

1. The user selects an item in the web or Android interface.
2. `garment-interactions` handles the interaction; `virtual-try-on` coordinates supported avatar changes.
3. `3d-studio/avatar`, the wardrobe and renderer visualize the result.
4. `saved-looks` stores the selected combination locally and can communicate with available authenticated API functionality.
5. `core` coordinates the application state; the backend enforces server-side ownership where it is used.

Public contracts are the intended integration boundary. Avoid importing a sibling module's private implementation files or creating competing stores and render loops.

## 3D Studio: seven components

| Component | Responsibility |
| --- | --- |
| Stage | Circular dais, grounding rules and contact shadows |
| Wardrobe | Cabinet model, door motion, materials and interaction target |
| Mirror & Vanity | Vanity furniture, cosmetics, mirror render target and accent lighting |
| Avatar | Character geometry/GLB, rig, appearance and proportions |
| Lighting | Shared illumination, shadows and atmospheric lighting presets |
| Theme | Room materials, floor, wall and studio atmosphere |
| Camera | Six viewpoint presets, transitions, mouse and touch controls |

The interactive **feature** modules orchestrate user actions on this physical scene. They should consume its documented interfaces rather than duplicate its objects or animation loops.

## Get started locally

### Requirements

- **Git** and **Git LFS** for repository and large 3D assets.
- **Node.js 20+** (use the version supported by the current project and CI).
- A modern browser with WebGL support.
- For Android development: **JDK 17**, Android SDK / Android Studio and the existing Gradle wrapper.
- **PowerShell / pwsh** for the architectural boundary checker.

### Clone the correct branch

The full modular implementation currently resides on the published Phase 9 feature branch while stacked integration PRs are under review:

```bash
git clone https://github.com/Troyz-Solutions/Woobi.git
cd Woobi
git switch feature/phase-9-production-readiness
git lfs pull
```

After the reviewed integration PRs have merged, developers should use the updated `main` branch instead.

### Start the app and backend

```bash
npm start
# equivalent: node server.js
```

Open **http://localhost:8080/**. The Node server serves the current web entry point and the supported `/api/*` endpoints. A basic server health endpoint is available at `/health`.

For any server configuration beyond local development, consult `.env.example` and `docs/PRODUCTION_RUNBOOK.md`. Supply secrets through the appropriate environment mechanism; **never commit `.env` or credentials**. A template file is documentation, not proof that secrets are loaded automatically.

### Run the tests

```bash
# Master regression suite (reported latest baseline: 642 tests)
npm test

# Live local HTTP API scenarios (reported: 14)
npm run test:e2e

# Architecture boundary validation
npm run validate:boundaries
```

The 642-test count is the latest **coding-agent-reported development-branch baseline**; always trust the results of the current branch's actual CI run rather than a fixed badge or number in this document. Some scene tests run with simulated/headless rendering and do not replace real hardware verification.

### Build Android

From the `android-app/` directory:

```bash
# macOS / Linux
./gradlew assembleDebug

# Windows PowerShell
.\gradlew.bat assembleDebug
```

The debug APK is generated under `android-app/app/build/outputs/apk/debug/`. An APK building successfully does **not** mean it has passed device, WebView or release-signing acceptance.

## Security, privacy and data boundaries

- **Authentication:** API operations use server-validated credentials/tokens; never treat the client's displayed account state as proof of authorization.
- **User isolation:** API handlers are intended to enforce per-user access to wardrobe records, looks and files.
- **Subscriptions:** Client-side premium flags do not establish paid entitlement. Production payment/verification integration must be separately configured and verified.
- **Uploads:** The storage layer checks supported image signatures and user-scoped paths. Do not use it as a general-purpose untrusted-file processing service without additional review.
- **Local-first behavior:** Some user settings and looks are stored in browser storage; server sync depends on actual API and account configuration.
- **Database:** Local JSON persistence is configured for a single Node server process; lock expiry and recovery under failure need operational scrutiny. Keep backups and test restoration.
- **Environment:** HTTPS/TLS, secure secrets, persistence volumes, monitoring and real-device testing are required before production use.

**Do not expose production user information in issues, PRs, screenshots or test data.**

## Contributing to Woobi

Woobi is developed through a reviewed workflow operated by Troyz Solutions and its contributors.

1. Pick up an assigned Work Deck task and identify its owning module.
2. Fork the repository (or use an authorized feature branch).
3. Create a descriptive branch, for example `feature/WD-123-wardrobe-lighting`.
4. Make focused changes within the relevant module; use public interfaces for cross-module calls.
5. Run the affected tests, `npm test`, and boundary validation.
6. Provide screenshots or screen recordings for visual changes.
7. Open a pull request against the **correct integration base**; link the Work Deck task and summarize testing.
8. Wait for designated reviewers and required CI checks. Do not push directly to protected `main`.

```bash
git switch -c feature/WD-123-wardrobe-lighting
node modules/3d-studio/wardrobe/WardrobeModel.test.js
npm test
git add .
git commit -m "feat(wardrobe): improve interior lighting"
git push origin feature/WD-123-wardrobe-lighting
```

See [CONTRIBUTING.md](CONTRIBUTING.md), `.github/CODEOWNERS`, and the pull request template for details. CODEOWNERS is a review routing aid; GitHub branch protection/rulesets determine what is enforced.

## Development and release status

The transformation was delivered as a series of architecture and implementation phases. It is **not yet equivalent to a completed public production release**.

| Stage | Status |
| --- | --- |
| Five-domain monorepo and seven physical studio modules | Implemented on migration branches |
| Six feature, five settings and five backend submodules | Implemented on Phase 5–9 development lineage |
| Local automated regression and HTTP tests | Reported passing by coding agent |
| PR #6 — foundation and 3D Studio | Review and merge required |
| PR #7 — features, settings, backend and release work | Stacked on PR #6; review and merge required |
| Real-device Android testing, browser performance and staging | Separate acceptance still required |
| Production deployment | Not authorized |

- [PR #6 — foundation and studio migration](https://github.com/Troyz-Solutions/Woobi/pull/6)
- [PR #7 — feature and release migration](https://github.com/Troyz-Solutions/Woobi/pull/7)

After PR #6 merges, PR #7's base and checks must be revalidated before an authorized merge.

## Documentation

- [Contributor guide](CONTRIBUTING.md)
- [Production operations runbook](docs/PRODUCTION_RUNBOOK.md)
- [GitHub Actions CI](.github/workflows/ci.yml)
- [Architecture and module ownership](modules/)
- [Environment template](.env.example)

## Project ownership

**Woobi** is developed and maintained by **Troyz Solutions** with contributions from the engineering team and participating interns.

Website: **https://www.troyzsolutions.com/**  
Repository: **https://github.com/Troyz-Solutions/Woobi**

For contribution rules and rights relating to repository content, consult the applicable repository license and organization policies.

© 2026 Troyz Solutions.
