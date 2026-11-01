/**
 * Woobi - Monorepo Master Test Runner
 * Executes all 182 3D Studio Tests + 159 Phase 5 3D Studio Features Tests
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const testSuites = [
  // Physical 3D Studio Modules (182 Tests)
  { name: 'Stage Module (17 Tests)', path: 'modules/3d-studio/stage/StageModel.test.js' },
  { name: 'Wardrobe Module (25 Tests)', path: 'modules/3d-studio/wardrobe/WardrobeModel.test.js' },
  { name: 'Mirror & Vanity Module (25 Tests)', path: 'modules/3d-studio/mirror-vanity/VanityModel.test.js' },
  { name: 'Avatar Module (30 Tests)', path: 'modules/3d-studio/avatar/AvatarModel.test.js' },
  { name: 'Lighting Module (30 Tests)', path: 'modules/3d-studio/lighting/StudioLighting.test.js' },
  { name: 'Theme Module (25 Tests)', path: 'modules/3d-studio/theme/StudioTheme.test.js' },
  { name: 'Camera Module (30 Tests)', path: 'modules/3d-studio/camera/StudioCamera.test.js' },

  // 3D Studio Features Submodules (159 Tests)
  { name: 'Virtual Try-On (26 Tests)', path: 'modules/3d-studio-features/virtual-try-on/VirtualTryOn.test.js', isNodeTest: true },
  { name: 'Garment Interactions (25 Tests)', path: 'modules/3d-studio-features/garment-interactions/GarmentInteractions.test.js', isNodeTest: true },
  { name: 'Outfit Recommendations (25 Tests)', path: 'modules/3d-studio-features/outfit-recommendations/RecommendationEngine.test.js', isNodeTest: true },
  { name: 'Avatar Customization (26 Tests)', path: 'modules/3d-studio-features/avatar-customization/AvatarCustomizer.test.js', isNodeTest: true },
  { name: 'Studio Animations & Poses (25 Tests)', path: 'modules/3d-studio-features/animations/PoseController.test.js', isNodeTest: true },
  { name: 'Saved Looks & Lookbook (26 Tests)', path: 'modules/3d-studio-features/saved-looks/SavedLooksManager.test.js', isNodeTest: true },
  { name: 'Studio Features Root Orchestrator (6 Tests)', path: 'modules/3d-studio-features/index.test.js', isNodeTest: true }
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
console.log('TOTAL VERIFIED TESTS: 341');
console.log('======================================================');

if (failedSuites > 0) {
  process.exit(1);
}
