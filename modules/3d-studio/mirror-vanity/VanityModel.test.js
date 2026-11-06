/**
 * Automated Test Suite: Woobi 3D Studio - Vanity Specification, Materials, Reflection & Disposal Tests
 */

import { VANITY_CONFIG, VanityModel } from './VanityModel.js';
import { VANITY_ASSET_PATHS } from './VanityAssets.js';
import { VanityLighting } from './VanityLighting.js';
import { MirrorReflection } from './MirrorReflection.js';

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
console.log('  VANITY SPECIFICATION & DIMENSIONS TESTS         ');
console.log('==================================================');

// 1. Position and Rotation
assert(VANITY_CONFIG.position.x === 1.15, 'Vanity X position must be 1.15m');
assert(VANITY_CONFIG.position.y === 0, 'Vanity Y position must be 0m (ground floor)');
assert(VANITY_CONFIG.position.z === -2.20, 'Vanity Z position must be -2.20m');
assert(VANITY_CONFIG.rotationY === -0.32, 'Vanity rotation Y must be -0.32 rad (angled towards stage)');

// 2. Table and Mirror Dimensions
assert(VANITY_CONFIG.tableHeight === 0.84, 'Vanity table height must be 0.84m');
assert(VANITY_CONFIG.tableWidth === 0.98, 'Vanity table width must be 0.98m');
assert(VANITY_CONFIG.tableDepth === 0.46, 'Vanity table depth must be 0.46m');
assert(VANITY_CONFIG.mirrorRadius === 0.48, 'Arched circular mirror radius must be 0.48m');

// 3. Stool Dimensions
assert(VANITY_CONFIG.stoolPosition.x === 0.12, 'Stool X position must be 0.12m');
assert(VANITY_CONFIG.stoolPosition.z === 0.42, 'Stool Z position must be 0.42m');
assert(VANITY_CONFIG.stoolRadius === 0.25, 'Stool cushion radius must be 0.25m');
assert(VANITY_CONFIG.stoolHeight === 0.40, 'Stool height must be 0.40m');

// 4. Asset Configuration
assert(Array.isArray(VANITY_ASSET_PATHS) && VANITY_ASSET_PATHS.length >= 1, 'Vanity must define authentic GLB paths');
assert(VANITY_ASSET_PATHS[0] === 'seren_vanity.glb', 'Primary asset path must reference seren_vanity.glb');

console.log('\n==================================================');
console.log('  LIGHTING & REFLECTION PIPELINE TESTS            ');
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
    this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
  }
  add(child) { this.children.push(child); }
  remove(child) { this.children = this.children.filter(c => c !== child); }
}

class MockMesh extends MockDisposable {
  constructor(geo, mat) {
    super();
    this.geometry = geo;
    this.material = mat || { map: null, needsUpdate: false };
    this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
    this.receiveShadow = false;
    this.castShadow = false;
    this.visible = true;
    this.userData = {};
  }
}

class MockRenderTarget extends MockDisposable {
  constructor(w, h) {
    super();
    this.width = w;
    this.height = h;
    this.texture = { id: 'mock_reflection_tex' };
  }
}

const mockTHREE = {
  Group: MockGroup,
  Mesh: MockMesh,
  BoxGeometry: class extends MockDisposable {},
  CylinderGeometry: class extends MockDisposable {},
  CircleGeometry: class extends MockDisposable {},
  TorusGeometry: class extends MockDisposable {},
  SphereGeometry: class extends MockDisposable {},
  MeshBasicMaterial: class extends MockDisposable {},
  MeshStandardMaterial: class extends MockDisposable {
    constructor(cfg) { super(); this.map = cfg?.map || null; }
  },
  PointLight: class extends MockDisposable {
    constructor(color, intensity, dist) {
      super();
      this.color = color;
      this.intensity = intensity;
      this.distance = dist;
      this.position = { set() {} };
    }
  },
  PerspectiveCamera: class extends MockDisposable {
    constructor(fov, aspect, near, far) { super(); }
  },
  WebGLRenderTarget: MockRenderTarget,
  RGBFormat: 1022,
  LinearFilter: 1006,
  GLTFLoader: class {
    load(path, onSuccess, onProgress, onError) {
      if (typeof onError === 'function') onError(new Error('Simulated GLB 404'));
    }
  }
};

// Test VanityLighting
const mockParent = new MockGroup();
const lighting = new VanityLighting();
lighting.init(mockTHREE, mockParent);
assert(lighting.light !== null, 'VanityLighting initializes PointLight');
assert(lighting.light.intensity === 1.4, 'Vanity light initial intensity is 1.4');

lighting.setEnabled(false);
assert(lighting.light.intensity === 0, 'lighting.setEnabled(false) dims intensity to 0');

lighting.setEnabled(true);
assert(lighting.light.intensity === 1.4, 'lighting.setEnabled(true) restores intensity to 1.4');

// Test MirrorReflection
const mockScene = new MockGroup();
const mockMirrorMesh = new MockMesh();
const reflection = new MirrorReflection({ resolution: 512 });
reflection.init(mockTHREE, mockScene, mockMirrorMesh);
assert(reflection.renderTarget !== null, 'MirrorReflection creates WebGLRenderTarget');
assert(mockMirrorMesh.material.map === reflection.renderTarget.texture, 'Mirror mesh material binds reflection texture');

console.log('\n==================================================');
console.log('  SCENE-CONSTRUCTION, FALLBACK & DISPOSAL TESTS   ');
console.log('==================================================');

const mockSharedMarbleTexture = new MockDisposable();
const mockSharedWovenTexture = new MockDisposable();

const vanity = new VanityModel();
const vanityRoot = vanity.build(mockScene, { calacatta: mockSharedMarbleTexture, wovenRug: mockSharedWovenTexture }, mockTHREE);

// Scene Construction Test
assert(mockScene.children.includes(vanityRoot), 'vanity.build() mounts root group onto the Scene');
assert(vanity.interactiveObjects.length > 0, 'vanity registers raycast hitBox in interactiveObjects');
assert(vanity.interactiveObjects[0].userData.interactiveType === 'vanity', 'hitBox has correct interactiveType');

// Fallback Test
assert(vanity.isGLBLoaded === false, 'When GLB is missing, isGLBLoaded is set to false');
const proceduralVanity = vanityRoot.children.find(c => c.name === 'procedural_vanity');
assert(proceduralVanity && proceduralVanity.visible === true, 'Procedural vanity remains active and visible');

// Safe Resource Cleanup Test
vanity.dispose(mockScene);
assert(!mockScene.children.includes(vanityRoot), 'vanity.dispose() removes vanity root from Scene');
assert(vanity.disposables.length === 0, 'vanity.dispose() clears disposables array');
assert(vanity.reflection.renderTarget === null, 'vanity.dispose() disposes WebGLRenderTarget');
assert(mockSharedMarbleTexture.disposed === false, 'vanity.dispose() NEVER disposes external shared marble texture');
assert(mockSharedWovenTexture.disposed === false, 'vanity.dispose() NEVER disposes external shared bouclé texture');

console.log('--------------------------------------------------');
if (failures === 0) {
  console.log(`SUCCESS: All ${tests} Vanity specification, lighting, reflection, and disposal tests passed.`);
  process.exit(0);
} else {
  console.error(`FAILURE: ${failures} out of ${tests} tests failed.`);
  process.exit(1);
}
