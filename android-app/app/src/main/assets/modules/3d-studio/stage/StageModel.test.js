/**
 * Automated Test Suite: Woobi 3D Studio - Stage Specification, Construction, Disposal & Fallback Tests
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

console.log('\n==================================================');
console.log('  SCENE-CONSTRUCTION, DISPOSAL & FALLBACK TESTS   ');
console.log('==================================================');

// Mock Three.js environment for rigorous headless testing
class MockDisposable {
  constructor() { this.disposed = false; }
  dispose() { this.disposed = true; }
}

class MockGroup extends MockDisposable {
  constructor() {
    super();
    this.name = '';
    this.children = [];
    this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    this.rotation = { x: 0, y: 0, z: 0 };
  }
  add(child) { this.children.push(child); }
  remove(child) { this.children = this.children.filter(c => c !== child); }
}

class MockMesh extends MockDisposable {
  constructor(geo, mat) {
    super();
    this.geometry = geo;
    this.material = mat;
    this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.receiveShadow = false;
    this.castShadow = false;
    this.visible = true;
  }
}

const mockTHREE = {
  Group: MockGroup,
  Mesh: MockMesh,
  CircleGeometry: class extends MockDisposable {},
  CylinderGeometry: class extends MockDisposable {},
  TorusGeometry: class extends MockDisposable {},
  MeshBasicMaterial: class extends MockDisposable {},
  MeshStandardMaterial: class extends MockDisposable {
    constructor(cfg) { super(); this.map = cfg?.map || null; }
  },
  GLTFLoader: class {
    load(path, onSuccess, onProgress, onError) {
      // Simulate invalid GLB paths triggering onError fallback
      if (path.includes('invalid') || path.includes('seren_stage')) {
        if (typeof onError === 'function') onError(new Error('Simulated GLB 404'));
      }
    }
  }
};

const mockScene = new MockGroup();
const mockSharedTexture = new MockDisposable(); // Shared texture owned outside the stage

// 6. Scene Construction Test
const testStage = new StageModel();
const stageRoot = testStage.build(mockScene, { wovenRug: mockSharedTexture }, mockTHREE);

assert(mockScene.children.includes(stageRoot), 'testStage.build() mounts root group onto the Scene');
assert(stageRoot.children.length >= 4, 'Stage hierarchy contains shadow disc, dais platform, trim, and guide arcs');

// 7. Invalid GLB Fallback Test
assert(testStage.glbLoaded === false, 'Invalid/missing GLB paths cleanly fall back to procedural dais platform');
const proceduralDais = stageRoot.children.find(c => c.geometry instanceof mockTHREE.CylinderGeometry);
assert(proceduralDais && proceduralDais.visible === true, 'Procedural dais remains visible and active when GLB is not loaded');

// 8. Safe Resource Cleanup & Shared Texture Preservation Test
testStage.dispose(mockScene);
assert(!mockScene.children.includes(stageRoot), 'stage.dispose() cleanly removes stage from Scene');
assert(testStage.disposables.length === 0, 'stage.dispose() clears internal disposables list');
assert(mockSharedTexture.disposed === false, 'stage.dispose() NEVER disposes shared external textures');

console.log('--------------------------------------------------');
if (failures === 0) {
  console.log(`SUCCESS: All ${tests} Stage specification, construction, fallback, and disposal tests passed.`);
  process.exit(0);
} else {
  console.error(`FAILURE: ${failures} out of ${tests} tests failed.`);
  process.exit(1);
}
