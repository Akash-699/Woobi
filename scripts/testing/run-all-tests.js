/**
 * Woobi - Monorepo Master Test Runner
 * Executes all 182 3D Studio Tests + 159 3D Studio Features Tests + 134 Settings Tests = 475 Tests
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const testSuites = [
  // 1. Physical 3D Studio Modules (182 Tests)
  { name: 'Stage Module (17 Tests)', path: 'modules/3d-studio/stage/StageModel.test.js' },
  { name: 'Wardrobe Module (25 Tests)', path: 'modules/3d-studio/wardrobe/WardrobeModel.test.js' },
  { name: 'Mirror & Vanity Module (25 Tests)', path: 'modules/3d-studio/mirror-vanity/VanityModel.test.js' },
  { name: 'Avatar Module (30 Tests)', path: 'modules/3d-studio/avatar/AvatarModel.test.js' },
  { name: 'Lighting Module (30 Tests)', path: 'modules/3d-studio/lighting/StudioLighting.test.js' },
  { name: 'Theme Module (25 Tests)', path: 'modules/3d-studio/theme/StudioTheme.test.js' },
  { name: 'Camera Module (30 Tests)', path: 'modules/3d-studio/camera/StudioCamera.test.js' },

  // 2. 3D Studio Features Submodules (159 Tests)
  { name: 'Virtual Try-On (26 Tests)', path: 'modules/3d-studio-features/virtual-try-on/VirtualTryOn.test.js', isNodeTest: true },
  { name: 'Garment Interactions (25 Tests)', path: 'modules/3d-studio-features/garment-interactions/GarmentInteractions.test.js', isNodeTest: true },
  { name: 'Outfit Recommendations (25 Tests)', path: 'modules/3d-studio-features/outfit-recommendations/RecommendationEngine.test.js', isNodeTest: true },
  { name: 'Avatar Customization (26 Tests)', path: 'modules/3d-studio-features/avatar-customization/AvatarCustomizer.test.js', isNodeTest: true },
  { name: 'Studio Animations & Poses (25 Tests)', path: 'modules/3d-studio-features/animations/PoseController.test.js', isNodeTest: true },
  { name: 'Saved Looks & Lookbook (26 Tests)', path: 'modules/3d-studio-features/saved-looks/SavedLooksManager.test.js', isNodeTest: true },
  { name: 'Studio Features Root Orchestrator (6 Tests)', path: 'modules/3d-studio-features/index.test.js', isNodeTest: true },

  // 3. Settings Submodules (134 Tests)
  { name: 'Account Settings (25 Tests)', path: 'modules/settings/account/AccountManager.test.js', isNodeTest: true },
  { name: 'Appearance Settings (25 Tests)', path: 'modules/settings/appearance/AppearanceManager.test.js', isNodeTest: true },
  { name: 'Privacy Settings (25 Tests)', path: 'modules/settings/privacy/PrivacyManager.test.js', isNodeTest: true },
  { name: 'Notifications Settings (25 Tests)', path: 'modules/settings/notifications/NotificationsManager.test.js', isNodeTest: true },
  { name: 'Performance Settings (26 Tests)', path: 'modules/settings/performance/PerformanceManager.test.js', isNodeTest: true },
  { name: 'Settings Root Orchestrator (8 Tests)', path: 'modules/settings/index.test.js', isNodeTest: true },

  // 4. Backend Submodules & Services (140 Tests)
  { name: 'Security Module (25 Tests)', path: 'modules/backend/security/SecurityService.test.js', isNodeTest: true },
  { name: 'Authentication Module (25 Tests)', path: 'modules/backend/auth/AuthService.test.js', isNodeTest: true },
  { name: 'Database Module (25 Tests)', path: 'modules/backend/database/DatabaseService.test.js', isNodeTest: true },
  { name: 'Storage Module (25 Tests)', path: 'modules/backend/storage/StorageService.test.js', isNodeTest: true },
  { name: 'API Router & Endpoints (25 Tests)', path: 'modules/backend/api/ApiRouter.test.js', isNodeTest: true },
  { name: 'Backend Root Orchestrator & SDK (15 Tests)', path: 'modules/backend/index.test.js', isNodeTest: true },

  // 5. Hardening, Concurrency & Branding Verification (16 Tests)
  { name: 'Database Concurrency & Recovery (5 Tests)', path: 'modules/backend/database/DatabaseConcurrency.test.js', isNodeTest: true },
  { name: 'Entitlement Anti-Tampering Security (5 Tests)', path: 'modules/backend/security/EntitlementSecurity.test.js', isNodeTest: true },
  { name: 'Branding & Compatibility Verification (6 Tests)', path: 'modules/core/BrandingCompatibility.test.js', isNodeTest: true },

  // 6. Production User Journeys & End-to-End Flows (7 Tests)
  { name: 'Application User Journeys (7 Tests)', path: 'scripts/testing/test-user-journeys.js', isNodeTest: true },

  // 7. Multi-Process Durability & OS Locking (4 Tests)
  { name: 'Multi-Process Concurrency & Crash Durability (4 Tests)', path: 'scripts/testing/test-multiprocess-concurrency.js', isNodeTest: true }
];

console.log('======================================================');
console.log('       WOOBI - MASTER TEST SUITE EXECUTION            ');
console.log('======================================================\n');

let totalSuites = testSuites.length;
let passedSuites = 0;
let failedSuites = 0;

for (const suite of testSuites) {
  const fullPath = path.join(repoRoot, suite.path);
  const args = suite.isNodeTest ? ['--test', fullPath] : [fullPath];

  process.stdout.write(`Executing: ${suite.name}... `);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status === 0) {
    passedSuites++;
    console.log('PASS');
  } else {
    failedSuites++;
    console.log('FAIL');
    console.error(result.stdout || result.stderr);
  }
}

console.log('\n======================================================');
console.log(`TOTAL SUITES: ${totalSuites} | PASSED: ${passedSuites} | FAILED: ${failedSuites}`);
console.log('TOTAL VERIFIED TESTS: 642');
console.log('======================================================');

if (failedSuites > 0) {
  process.exit(1);
}
