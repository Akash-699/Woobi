/**
 * Woobi - 3D Studio Lighting Module
 * StudioLighting.test.js - Unit, Preset, Shadow, Controller, and Disposal Tests
 */

import assert from 'assert';
import {
  StudioLighting,
  LIGHTING_PRESETS,
  DEFAULT_LIGHTING_PRESET,
  LightingController,
  createStudioLighting,
  LightingContract
} from './index.js';

// ==========================================
// MOCK THREE.JS IMPLEMENTATION FOR NODE.JS
// ==========================================
class MockVector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

class MockColor {
  constructor(color = 0xffffff) {
    this.value = color;
  }
  set(color) {
    this.value = color;
    return this;
  }
}

class MockLight {
  constructor(color = 0xffffff, intensity = 1.0) {
    this.name = '';
    this.color = new MockColor(color);
    this.intensity = intensity;
    this.position = new MockVector3();
    this.visible = true;
    this.castShadow = false;
  }
}

class MockDirectionalLight extends MockLight {
  constructor(color, intensity) {
    super(color, intensity);
    this.shadow = {
      mapSize: { width: 512, height: 512 },
      camera: { near: 0.1, far: 100, left: -5, right: 5, top: 5, bottom: -5 },
      bias: 0,
      map: {
        dispose() { this.disposed = true; }
      }
    };
  }
}

class MockSpotLight extends MockLight {
  constructor(color, intensity, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 1) {
    super(color, intensity);
    this.distance = distance;
    this.angle = angle;
    this.penumbra = penumbra;
    this.decay = decay;
    this.target = { position: new MockVector3() };
  }
}

class MockScene {
  constructor() {
    this.children = [];
  }
  add(obj) {
    if (obj && !this.children.includes(obj)) {
      this.children.push(obj);
    }
  }
  remove(obj) {
    const idx = this.children.indexOf(obj);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
  }
  getObjectByName(name) {
    return this.children.find(c => c.name === name) || null;
  }
}

const MockTHREE = {
  AmbientLight: MockLight,
  DirectionalLight: MockDirectionalLight,
  SpotLight: MockSpotLight,
  Vector3: MockVector3,
  Color: MockColor
};

// ==========================================
// TEST SUITE EXECUTION
// ==========================================
let passedCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('==================================================');
console.log('  LIGHTING SPECIFICATION & FIXTURE TESTS          ');
console.log('==================================================');

test('DEFAULT_LIGHTING_PRESET must be "luxury-warm"', () => {
  assert.strictEqual(DEFAULT_LIGHTING_PRESET, 'luxury-warm');
  assert.ok(LIGHTING_PRESETS['luxury-warm']);
});

test('LIGHTING_PRESETS defines luxury-warm, editorial-neutral, and soft-evening', () => {
  assert.ok(LIGHTING_PRESETS['luxury-warm']);
  assert.ok(LIGHTING_PRESETS['editorial-neutral']);
  assert.ok(LIGHTING_PRESETS['soft-evening']);
});

test('StudioLighting mounts all 6 shared light fixtures to Scene', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);

  assert.ok(lighting.ambientLight);
  assert.ok(lighting.keySunlight);
  assert.ok(lighting.fillLight);
  assert.ok(lighting.rimLight);
  assert.ok(lighting.wardrobeSpot);
  assert.ok(lighting.vanitySpot);

  assert.strictEqual(scene.children.includes(lighting.ambientLight), true);
  assert.strictEqual(scene.children.includes(lighting.keySunlight), true);
  assert.strictEqual(scene.children.includes(lighting.fillLight), true);
  assert.strictEqual(scene.children.includes(lighting.rimLight), true);
  assert.strictEqual(scene.children.includes(lighting.wardrobeSpot), true);
  assert.strictEqual(scene.children.includes(lighting.vanitySpot), true);
});

test('Ambient light matches baseline color and intensity (0xFFF6EC, 0.68)', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.ambientLight.color.value, 0xFFF6EC);
  assert.strictEqual(lighting.ambientLight.intensity, 0.68);
});

test('Key Sunlight matches baseline color and intensity (0xFFF7E6, 1.25)', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.keySunlight.color.value, 0xFFF7E6);
  assert.strictEqual(lighting.keySunlight.intensity, 1.25);
  assert.strictEqual(lighting.keySunlight.position.x, 2.8);
  assert.strictEqual(lighting.keySunlight.position.y, 4.8);
  assert.strictEqual(lighting.keySunlight.position.z, 3.0);
});

test('Key Sunlight shadow camera matches 1024x1024 and bounds 2.4m', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.keySunlight.shadow.mapSize.width, 1024);
  assert.strictEqual(lighting.keySunlight.shadow.mapSize.height, 1024);
  assert.strictEqual(lighting.keySunlight.shadow.camera.near, 0.5);
  assert.strictEqual(lighting.keySunlight.shadow.camera.far, 10.0);
  assert.strictEqual(lighting.keySunlight.shadow.bias, -0.0002);
  assert.strictEqual(lighting.keySunlight.shadow.camera.left, -2.4);
  assert.strictEqual(lighting.keySunlight.shadow.camera.right, 2.4);
});

test('Fill light matches baseline color and intensity (0xFDF1E2, 0.42)', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.fillLight.color.value, 0xFDF1E2);
  assert.strictEqual(lighting.fillLight.intensity, 0.42);
  assert.strictEqual(lighting.fillLight.position.x, -2.6);
});

test('Rim light matches baseline color and intensity (0xFFE5BE, 0.85)', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.rimLight.color.value, 0xFFE5BE);
  assert.strictEqual(lighting.rimLight.intensity, 0.85);
  assert.strictEqual(lighting.rimLight.position.z, -2.4);
});

test('Wardrobe spotlight targets oak wardrobe position (-0.96, 1.22, -0.32)', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.wardrobeSpot.intensity, 0.50);
  assert.strictEqual(lighting.wardrobeSpot.target.position.x, -0.96);
  assert.strictEqual(lighting.wardrobeSpot.target.position.y, 1.22);
  assert.strictEqual(lighting.wardrobeSpot.target.position.z, -0.32);
});

test('Vanity spotlight targets dressing mirror console position (0.90, 1.20, -0.10)', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.vanitySpot.intensity, 0.80);
  assert.strictEqual(lighting.vanitySpot.target.position.x, 0.90);
  assert.strictEqual(lighting.vanitySpot.target.position.y, 1.20);
});

console.log('\n==================================================');
console.log('  LIGHTING PRESET & CONTROLLER TESTS              ');
console.log('==================================================');

test('applyPreset("editorial-neutral") updates colors and positions', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  lighting.applyPreset('editorial-neutral');

  assert.strictEqual(lighting.currentPreset, 'editorial-neutral');
  assert.strictEqual(lighting.ambientLight.color.value, 0xF4F5F8);
  assert.strictEqual(lighting.keySunlight.color.value, 0xFFFFFF);
  assert.strictEqual(lighting.fillLight.color.value, 0xEAECEF);
});

test('applyPreset("soft-evening") updates golden hour color palette', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  lighting.applyPreset('soft-evening');

  assert.strictEqual(lighting.currentPreset, 'soft-evening');
  assert.strictEqual(lighting.ambientLight.color.value, 0xF2E4D5);
  assert.strictEqual(lighting.keySunlight.color.value, 0xFFDDB0);
  assert.strictEqual(lighting.rimLight.color.value, 0xFFA866);
});

test('LightingController successfully switches presets', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  const controller = LightingContract.createController(lighting);

  const ok = controller.applyPreset('editorial-neutral');
  assert.strictEqual(ok, true);
  assert.strictEqual(controller.activePreset, 'editorial-neutral');
  assert.strictEqual(lighting.currentPreset, 'editorial-neutral');
});

test('LightingController rejects unknown preset name cleanly', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  const controller = LightingContract.createController(lighting);

  const ok = controller.applyPreset('nonexistent-preset');
  assert.strictEqual(ok, false);
  assert.strictEqual(controller.activePreset, 'luxury-warm');
});

test('setIntensityMultiplier() scales all active light intensities proportionally', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  lighting.setIntensityMultiplier(1.5);

  assert.strictEqual(lighting.ambientLight.intensity, 0.68 * 1.5);
  assert.strictEqual(lighting.keySunlight.intensity, 1.25 * 1.5);
  assert.strictEqual(lighting.fillLight.intensity, 0.42 * 1.5);
});

test('setShadowsEnabled(false) turns off key sunlight castShadow', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(lighting.keySunlight.castShadow, true);

  lighting.setShadowsEnabled(false);
  assert.strictEqual(lighting.keySunlight.castShadow, false);
  assert.strictEqual(lighting.shadowsEnabled, false);
});

test('setShadowsEnabled(true) restores key sunlight castShadow', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  lighting.setShadowsEnabled(false);
  lighting.setShadowsEnabled(true);
  assert.strictEqual(lighting.keySunlight.castShadow, true);
});

test('controller.setAccentLightsEnabled(false) hides wardrobe and vanity spots', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  const controller = LightingContract.createController(lighting);

  controller.setAccentLightsEnabled(false);
  assert.strictEqual(lighting.wardrobeSpot.visible, false);
  assert.strictEqual(lighting.vanitySpot.visible, false);

  controller.setAccentLightsEnabled(true);
  assert.strictEqual(lighting.wardrobeSpot.visible, true);
  assert.strictEqual(lighting.vanitySpot.visible, true);
});

test('controller.getState() returns complete lighting state snapshot', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  const controller = LightingContract.createController(lighting);
  const state = controller.getState();

  assert.strictEqual(state.activePreset, 'luxury-warm');
  assert.strictEqual(state.availablePresets.length, 3);
  assert.strictEqual(state.lighting.hasKeySunlight, true);
  assert.strictEqual(state.lighting.shadowsEnabled, true);
});

console.log('\n==================================================');
console.log('  NON-INTERFERENCE & DISPOSAL TESTS               ');
console.log('==================================================');

test('Lighting module never touches or modifies Wardrobe_LED light', () => {
  const scene = new MockScene();
  const wardrobeLed = new MockTHREE.SpotLight(0xFFE5BE, 1.0);
  wardrobeLed.name = 'Wardrobe_LED';
  scene.add(wardrobeLed);

  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  lighting.applyPreset('editorial-neutral');

  // Wardrobe LED must remain unmutated by studio lighting
  assert.strictEqual(wardrobeLed.color.value, 0xFFE5BE);
  assert.strictEqual(wardrobeLed.intensity, 1.0);
});

test('Lighting module never touches or modifies Vanity_MirrorHaloLight', () => {
  const scene = new MockScene();
  const vanityHalo = new MockTHREE.AmbientLight(0xFFE8BE, 1.4);
  vanityHalo.name = 'Vanity_MirrorHaloLight';
  scene.add(vanityHalo);

  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  lighting.applyPreset('soft-evening');

  // Vanity Halo light must remain unmutated by studio lighting
  assert.strictEqual(vanityHalo.color.value, 0xFFE8BE);
  assert.strictEqual(vanityHalo.intensity, 1.4);
});

test('lighting.dispose() cleanly removes all shared lights from Scene', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  assert.strictEqual(scene.children.length >= 6, true);

  lighting.dispose(scene);
  assert.strictEqual(scene.children.length, 0);
  assert.strictEqual(lighting.isDisposed, true);
  assert.strictEqual(lighting.keySunlight, null);
});

test('lighting.dispose() is safe against double invocation', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);

  lighting.dispose(scene);
  assert.doesNotThrow(() => {
    lighting.dispose(scene);
  });
});

test('lighting.getLightingState() returns accurate metrics and references', () => {
  const scene = new MockScene();
  const lighting = createStudioLighting(scene, 'luxury-warm', MockTHREE);
  const state = lighting.getLightingState();
  assert.strictEqual(state.currentPreset, 'luxury-warm');
  assert.strictEqual(state.hasAmbient, true);
  assert.strictEqual(state.hasKeySunlight, true);
  assert.strictEqual(state.intensityMultiplier, 1.0);
});

test('LightingContract.getPresets() provides immutable copy of preset dictionary', () => {
  const presets = LightingContract.getPresets();
  assert.ok(presets['luxury-warm']);
  presets['custom-hack'] = true;
  assert.strictEqual(LightingContract.getPresets()['custom-hack'], undefined);
});

console.log('--------------------------------------------------');
console.log(`SUCCESS: All ${passedCount} StudioLighting specification, preset, shadow, and disposal tests passed.`);
