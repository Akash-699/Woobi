/**
 * Automated Test Suite: Woobi 3D Studio - Wardrobe Specification, Construction, Animation & Disposal Tests
 */

import { WARDROBE_CONFIG, WardrobeModel } from './WardrobeModel.js';
import { WardrobeAnimations } from './WardrobeAnimations.js';
import { WARDROBE_ASSET_PATHS } from './WardrobeAssets.js';

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
console.log('  WARDROBE SPECIFICATION & DIMENSIONS TESTS       ');
console.log('==================================================');

// 1. Scale and Dimension Calculations
const expectedScale = 2.40 / 3.00;
assert(Math.abs(WARDROBE_CONFIG.scale - expectedScale) < 0.0001, 'Wardrobe scale factor must be 2.40/3.00 (0.80)');
assert(Math.abs(WARDROBE_CONFIG.width - (2.20 * expectedScale)) < 0.0001, 'Wardrobe width must be exactly 1.76m');
assert(Math.abs(WARDROBE_CONFIG.height - (3.00 * expectedScale)) < 0.0001, 'Wardrobe height must be exactly 2.40m');
assert(Math.abs(WARDROBE_CONFIG.depth - (0.65 * expectedScale)) < 0.0001, 'Wardrobe depth must be exactly 0.52m');

// 2. Position and Orientation
assert(WARDROBE_CONFIG.position.x === -0.96, 'Wardrobe X position must be -0.96m');
assert(WARDROBE_CONFIG.position.y === 0, 'Wardrobe Y position must be 0m (ground floor)');
assert(WARDROBE_CONFIG.position.z === -0.32, 'Wardrobe Z position must be -0.32m');
assert(WARDROBE_CONFIG.rotationY === 0.30, 'Wardrobe rotation Y must be 0.30 rad');

// 3. Asset Paths
assert(Array.isArray(WARDROBE_ASSET_PATHS) && WARDROBE_ASSET_PATHS.length >= 2, 'Wardrobe must have primary Astra path and fallback');
assert(WARDROBE_ASSET_PATHS[0].includes('Astra'), 'Primary asset path must reference Astra 3D GLB');

console.log('\n==================================================');
console.log('  DOOR ANIMATIONS & STATE CONTROLLER TESTS        ');
console.log('==================================================');

const anim = new WardrobeAnimations();
assert(anim.getState().isOpen === false, 'Wardrobe starts in closed state');
assert(anim.getState().currentAngle === 0, 'Door angle starts at 0 rad');

// Door Open
anim.open();
assert(anim.getState().isOpen === true, 'anim.open() marks door open');
assert(anim.getState().targetAngle > 1.5, 'anim.open() sets target angle to ~105 degrees');

// Animation Step
const changed = anim.update();
assert(changed === true, 'anim.update() advances door animation');
assert(anim.getState().currentAngle > 0, 'Door angle increases during opening animation');

// Door Close
anim.close();
assert(anim.getState().isOpen === false, 'anim.close() targets closed angle');

console.log('\n==================================================');
console.log('  SCENE-CONSTRUCTION, FALLBACK & DISPOSAL TESTS   ');
console.log('==================================================');

class MockDisposable {
  constructor() { this.disposed = false; }
  dispose() { this.disposed = true; }
}

class MockGroup extends MockDisposable {
  constructor() {
    super();
    this.name = '';
    this.children = [];
    this.visible = true;
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
    this.userData = {};
  }
}

const mockTHREE = {
  Group: MockGroup,
  Mesh: MockMesh,
  BoxGeometry: class extends MockDisposable {},
  CylinderGeometry: class extends MockDisposable {},
  MeshBasicMaterial: class extends MockDisposable {},
  MeshStandardMaterial: class extends MockDisposable {
    constructor(cfg) { super(); this.map = cfg?.map || null; }
  },
  PointLight: class extends MockDisposable {
    constructor() { super(); this.position = { set() {} }; }
  },
  GLTFLoader: class {
    load(path, onSuccess, onProgress, onError) {
      if (typeof onError === 'function') onError(new Error('Simulated GLB 404'));
    }
  }
};

const mockScene = new MockGroup();
const mockSharedOakTexture = new MockDisposable();

const wardrobe = new WardrobeModel();
const wardrobeGroup = wardrobe.build(mockScene, { oak: mockSharedOakTexture }, mockTHREE);

// Scene Construction Test
assert(mockScene.children.includes(wardrobeGroup), 'wardrobe.build() mounts root onto the Scene');
assert(wardrobe.interactiveObjects.length > 0, 'wardrobe registers raycast hitBox in interactiveObjects');
assert(wardrobe.interactiveObjects[0].userData.interactiveType === 'wardrobe', 'hitBox has correct interactiveType');

// Fallback Test
assert(wardrobe.isGLBLoaded === false, 'When GLB is missing, isGLBLoaded is cleanly set to false');
const proceduralWardrobe = wardrobeGroup.children.find(c => c.name === 'procedural_wardrobe');
assert(proceduralWardrobe && proceduralWardrobe.visible === true, 'Procedural wardrobe remains active and visible');

// Safe Disposal Test
wardrobe.dispose(mockScene);
assert(!mockScene.children.includes(wardrobeGroup), 'wardrobe.dispose() cleanly removes wardrobe from Scene');
assert(wardrobe.disposables.length === 0, 'wardrobe.dispose() clears disposables array');
assert(mockSharedOakTexture.disposed === false, 'wardrobe.dispose() NEVER disposes shared external oak texture');

console.log('--------------------------------------------------');
if (failures === 0) {
  console.log(`SUCCESS: All ${tests} Wardrobe specification, construction, animation, and disposal tests passed.`);
  process.exit(0);
} else {
  console.error(`FAILURE: ${failures} out of ${tests} tests failed.`);
  process.exit(1);
}
