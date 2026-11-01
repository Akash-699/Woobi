# Woobi Monorepo — Engineering & Contribution Guide
Troyz Solutions — Production Engineering & Contributor Handbook

Welcome to the **Woobi** corporate modular monorepo. This document establishes standard engineering practices, architectural boundaries, Git workflows, and testing requirements for all software engineers, interns, and contributors.

---

## 1. Prerequisites & Environment Setup

Ensure your local development environment meets the following specifications before contributing:

| Component | Minimum Version | Verification Command | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` (LTS recommended) | `node -v` | Application runtime & test runner |
| **npm** | `>= 9.0.0` | `npm -v` | Package management |
| **Git & Git LFS** | Git `>= 2.30.0`, LFS installed | `git lfs version` | Version control & 3D GLB assets |
| **Java JDK** | OpenJDK 17 (or Android Studio JBR) | `javac -version` | Android APK assembly |
| **Android SDK** | SDK Platform 34, Build-Tools 34.0.0 | Android Studio SDK Manager | Mobile client compilation |

### Initial Repository Setup
```bash
# 1. Clone repository
git clone https://github.com/Troyz-Solutions/Woobi.git
cd Woobi

# 2. Pull Git LFS binary assets (3D GLB models & textures)
git lfs install
git lfs pull

# 3. Install dependencies
npm install

# 4. Verify test baseline
npm test
```

---

## 2. Monorepo Architecture & Boundary Rules

Woobi follows strict domain modularity with 5 physical modules:

```
Woobi/
├── modules/
│   ├── core/                    # Authoritative Reactive Store, Navigation Router & Bridges
│   │   ├── state/
│   │   ├── navigation/
│   │   └── index.js
│   ├── 3d-studio/               # Physical Three.js Studio Models & Lighting
│   │   ├── stage/
│   │   ├── wardrobe/
│   │   ├── mirror-vanity/
│   │   ├── avatar/
│   │   ├── lighting/
│   │   ├── theme/
│   │   ├── camera/
│   │   └── index.js
│   ├── 3d-studio-features/      # High-Level Studio User Features
│   │   ├── virtual-try-on/
│   │   ├── garment-interactions/
│   │   ├── outfit-recommendations/
│   │   ├── avatar-customization/
│   │   ├── animations/
│   │   ├── saved-looks/
│   │   └── index.js
│   ├── settings/                # User Preferences & Configuration
│   │   ├── account/
│   │   ├── appearance/
│   │   ├── privacy/
│   │   ├── notifications/
│   │   ├── performance/
│   │   └── index.js
│   └── backend/                 # Secure REST API, Authentication, Database & Storage
│       ├── security/
│       ├── auth/
│       ├── database/
│       ├── storage/
│       ├── api/
│       └── index.js
├── scripts/
│   ├── testing/                 # Master Test Runner & E2E Suites
│   └── validation/              # Architectural Boundary Enforcer
└── android-app/                 # Android WebView Wrapper
```

### Architectural Commandments
1. **Public Interface Access Only**: Always import from a module's root index (`modules/<module>/index.js`). **Never** deep-import private files across modules (e.g., `import ... from '../backend/database/DatabaseService.js'` in frontend code is strictly prohibited).
2. **Browser-Safe Boundaries**: Frontend code must never import backend internal services (`DatabaseService`, `SecurityService`, `AuthService`). Frontend code communicates with the backend exclusively via `ApiClient` over HTTP REST or `localStorage` client bridges.
3. **No Circular Dependencies**: Module dependencies flow strictly: `Features` & `Settings` -> `3D Studio` & `Core` -> `Browser DOM`.
4. **Automated Enforcement**: All pull requests are verified by `scripts/validation/validate-boundaries.ps1`. Any boundary violation breaks CI.

---

## 3. Git Workflow & Branch Conventions

### Branch Naming Conventions
Always create dedicated branches named according to the Work Deck ticket:
- **Features**: `feature/WD-<TICKET_ID>-<short-description>` (e.g., `feature/WD-102-outfit-share-sheet`)
- **Bug Fixes**: `fix/WD-<TICKET_ID>-<bug-description>` (e.g., `fix/WD-108-wardrobe-kinematics`)
- **Refactoring**: `refactor/WD-<TICKET_ID>-<scope>` (e.g., `refactor/WD-201-shader-optimization`)
- **Documentation**: `docs/WD-<TICKET_ID>-<topic>` (e.g., `docs/WD-305-api-runbook`)

### Fork & Branching Step-by-Step
```bash
# 1. Ensure you have the latest upstream main
git checkout main
git pull upstream main

# 2. Create your feature branch from main
git checkout -b feature/WD-123-new-lighting-preset

# 3. Make atomic, well-tested commits
git add .
git commit -m "feat(lighting): add golden-hour studio lighting preset with sunset falloff"

# 4. Push to your fork or origin
git push origin feature/WD-123-new-lighting-preset
```

### Conventional Commit Standards
Format all commit messages with Conventional Commits:
- `feat(module): description` (new user-facing feature)
- `fix(module): description` (bug fix)
- `refactor(module): description` (code change that neither fixes a bug nor adds a feature)
- `test(module): description` (adding or refactoring tests)
- `docs(topic): description` (documentation updates)
- `perf(module): description` (performance optimization)

---

## 4. End-to-End Code Modification Tutorial

### Example: Adding a New Studio Lighting Preset

1. **Update Preset Constants**:
   In `modules/3d-studio/lighting/LightingPresets.js`, append the new preset definition:
   ```javascript
   export const LIGHTING_PRESETS = {
     // ... existing presets
     GOLDEN_HOUR: 'golden_hour'
   };
   ```

2. **Implement Lighting Intensity & Color**:
   In `modules/3d-studio/lighting/StudioLighting.js`, handle `'golden_hour'` in `applyPreset()`:
   ```javascript
   case LIGHTING_PRESETS.GOLDEN_HOUR:
     this.keyLight.color.setHex(0xFFB347);
     this.keyLight.intensity = 1.4;
     this.fillLight.color.setHex(0xFF7043);
     this.fillLight.intensity = 0.6;
     break;
   ```

3. **Add Automated Unit Tests**:
   In `modules/3d-studio/lighting/StudioLighting.test.js`, add test assertions:
   ```javascript
   it('applies golden_hour preset with warm sunset tones', () => {
     lighting.applyPreset('golden_hour');
     assert.strictEqual(lighting.getCurrentPreset(), 'golden_hour');
   });
   ```

4. **Verify Boundaries & Tests**:
   ```bash
   node --test modules/3d-studio/lighting/StudioLighting.test.js
   powershell -ExecutionPolicy Bypass -File scripts/validation/validate-boundaries.ps1
   npm test
   ```

---

## 5. Verification Commands

Before opening a Pull Request, execute the mandatory verification pipeline:

```bash
# 1. Validate architectural boundaries (Zero violations required)
powershell -ExecutionPolicy Bypass -File scripts/validation/validate-boundaries.ps1

# 2. Run the 30-suite master regression test suite (638 tests)
npm test

# 3. Run real backend HTTP integration suite (14 scenarios)
npm run test:e2e

# 4. Assemble Android debug APK (clean build required)
cd android-app && gradlew.bat assembleDebug && cd ..
```

---

## 6. Pull Request & Code Review Governance

1. **Target Branch**: All PRs must target `main`.
2. **PR Description**: Use the standard repository PR template. Include:
   - Work Deck ticket ID (e.g., `Closes WD-123`).
   - Summary of changes and technical approach.
   - Test results (paste test counts and boundary verification output).
   - Screenshots/video captures for visual or UI changes.
3. **Review Requirements**:
   - Every PR requires review and approval from designated **CODEOWNERS**.
   - Interns and contributors **must not self-merge** PRs.
   - All 4 GitHub CI workflow checks (`Boundary Validation`, `Regression Suite`, `HTTP E2E`, `Android APK`) must pass green.
4. **Security & Secrets**:
   - **Never commit credentials**, API keys, `.env` files, or private customer records.
   - Any sensitive parameter changes require explicit architectural review.
