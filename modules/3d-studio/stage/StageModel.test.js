/**
 * Automated Test Suite: Woobi 3D Studio - Stage Specification Tests
 */

import { STAGE_CONFIG, StageModel } from './StageModel.js';

let failures = 0;
let tests = 0;

function assert(condition, testName) {
  tests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
  } else {
    failures++;
    console.error(`  [FAIL] ${testName}`);
  }
}

console.log('==================================================');
console.log('  STAGE MODEL SPECIFICATION & GROUNDING TESTS     ');
console.log('==================================================');

// 1. Dais Elevation Contract
assert(STAGE_CONFIG.daisElevation === 0.080, 'Dais elevation must be exactly 0.080m (8.0 cm)');

// 2. Stage Dimensions
assert(STAGE_CONFIG.radius === 0.95, 'Primary stage radius must be 0.95m');
assert(STAGE_CONFIG.thickness === 0.080, 'Stage dais thickness must match 0.080m');

// 3. Contact Shadow Disc
assert(STAGE_CONFIG.shadowRadius === 1.18, 'Contact shadow radius must be 1.18m');
assert(STAGE_CONFIG.shadowOpacity === 0.30, 'Contact shadow opacity must be 0.30');

// 4. StageModel Instance Contract
const stage = new StageModel();
assert(typeof stage.build === 'function', 'StageModel must implement build()');
assert(typeof stage.getElevation === 'function', 'StageModel must implement getElevation()');
assert(stage.getElevation() === 0.080, 'stage.getElevation() must return 0.080m for avatar grounding');
assert(typeof stage.dispose === 'function', 'StageModel must implement dispose()');

// 5. GLB Fallback Configuration
assert(Array.isArray(STAGE_CONFIG.glbPaths) && STAGE_CONFIG.glbPaths.length >= 2, 'Stage must define fallback paths for seren_stage.glb');

console.log('--------------------------------------------------');
if (failures === 0) {
  console.log(`SUCCESS: All ${tests} Stage specification tests passed.`);
  process.exit(0);
} else {
  console.error(`FAILURE: ${failures} out of ${tests} tests failed.`);
  process.exit(1);
}
