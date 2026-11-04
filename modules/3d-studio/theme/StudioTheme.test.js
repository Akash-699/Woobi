/**
 * Woobi - 3D Studio Theme Module
 * StudioTheme.test.js - Unit, Geometry, Preset, Environment, and Disposal Tests
 */

import assert from 'assert';
import {
  StudioTheme,
  ThemeMaterials,
  THEME_PRESETS,
  DEFAULT_THEME_PRESET,
  COLOR_PALETTE,
  createStudioTheme,
  ThemeContract
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

class MockObject3D {
  constructor() {
    this.name = '';
    this.position = new MockVector3();
    this.rotation = {
      x: 0,
      y: 0,
      z: 0,
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    };
    this.scale = new MockVector3(1, 1, 1);
    this.children = [];
    this.parent = null;
    this.receiveShadow = false;
    this.castShadow = false;
  }
  add(child) {
    if (child) {
      child.parent = this;
      this.children.push(child);
    }
  }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }
}

class MockGeometry {
  constructor() {
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
  }
}

class MockMaterial {
  constructor(params = {}) {
    this.color = new MockColor(params.color || 0xffffff);
    this.roughness = params.roughness || 0.5;
    this.metalness = params.metalness || 0;
    this.opacity = params.opacity !== undefined ? params.opacity : 1.0;
    this.transparent = !!params.transparent;
    this.side = params.side || 0;
    this.map = params.map || null;
    this.needsUpdate = false;
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
  }
}

class MockLight {
  constructor(color, intensity) {
    this.name = '';
    this.color = new MockColor(color);
    this.intensity = intensity;
    this.position = new MockVector3();
  }
}

class MockScene extends MockObject3D {
  constructor() {
    super();
    this.background = new MockColor();
    this.fog = {
      color: new MockColor(),
      near: 0.1,
      far: 100
    };
  }
}

const MockTHREE = {
  Group: class extends MockObject3D {},
  Mesh: class extends MockObject3D {
    constructor(geo, mat) {
      super();
      this.geometry = geo;
      this.material = mat;
    }
  },
  PlaneGeometry: class extends MockGeometry {
    constructor(width, height) {
      super();
      this.width = width;
      this.height = height;
    }
  },
  CylinderGeometry: class extends MockGeometry {
    constructor(radiusTop, radiusBottom, height, radialSegments) {
      super();
      this.radiusTop = radiusTop;
      this.radiusBottom = radiusBottom;
      this.height = height;
      this.radialSegments = radialSegments;
    }
  },
  BoxGeometry: class extends MockGeometry {
    constructor(w, h, d) {
      super();
      this.w = w;
      this.h = h;
      this.d = d;
    }
  },
  SphereGeometry: class extends MockGeometry {
    constructor(radius, wSeg, hSeg) {
      super();
      this.radius = radius;
    }
  },
  PointLight: MockLight,
  MeshStandardMaterial: MockMaterial,
  MeshBasicMaterial: MockMaterial,
  Vector3: MockVector3,
  Color: MockColor,
  Fog: class {
    constructor(color, near, far) {
      this.color = new MockColor(color);
      this.near = near;
      this.far = far;
    }
  },
  BackSide: 1
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
console.log('  THEME SPECIFICATION & PALETTE TESTS             ');
console.log('==================================================');

test('DEFAULT_THEME_PRESET must be "luxury-cream"', () => {
  assert.strictEqual(DEFAULT_THEME_PRESET, 'luxury-cream');
  assert.ok(THEME_PRESETS['luxury-cream']);
});

test('COLOR_PALETTE defines all baseline design tokens', () => {
  assert.strictEqual(COLOR_PALETTE.bgScene, 0xF7F3ED);
  assert.strictEqual(COLOR_PALETTE.honeyOak, 0xC69967);
  assert.strictEqual(COLOR_PALETTE.warmBrass, 0xD8B478);
  assert.strictEqual(COLOR_PALETTE.trousersSand, 0xC8BAA7);
});

test('THEME_PRESETS defines luxury-cream, nordic-minimal, and warm-terracotta', () => {
  assert.ok(THEME_PRESETS['luxury-cream']);
  assert.ok(THEME_PRESETS['nordic-minimal']);
  assert.ok(THEME_PRESETS['warm-terracotta']);
});

console.log('\n==================================================');
console.log('  ARCHITECTURE & GEOMETRY TESTS                   ');
console.log('==================================================');

test('StudioTheme mounts root architecture group to Scene', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.ok(theme.group);
  assert.strictEqual(scene.children.includes(theme.group), true);
  assert.strictEqual(theme.group.name, 'StudioTheme_ArchitectureGroup');
});

test('Scene background and fog match luxury-cream preset (0xF7F3ED, 9-24m)', () => {
  const scene = new MockScene();
  createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.strictEqual(scene.background.value, 0xF7F3ED);
  assert.strictEqual(scene.fog.color.value, 0xF7F3ED);
  assert.strictEqual(scene.fog.near, 9.0);
  assert.strictEqual(scene.fog.far, 24.0);
});

test('Floor geometry is exactly 28m x 28m plane with receiveShadow = true', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.ok(theme.floor);
  assert.strictEqual(theme.floor.geometry.width, 28);
  assert.strictEqual(theme.floor.geometry.height, 28);
  assert.strictEqual(theme.floor.position.y, 0);
  assert.strictEqual(theme.floor.receiveShadow, true);
});

test('Curved back wall radius is 12.0m and height is 8.0m', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.ok(theme.backWall);
  assert.strictEqual(theme.backWall.geometry.radiusTop, 12.0);
  assert.strictEqual(theme.backWall.geometry.radiusBottom, 12.0);
  assert.strictEqual(theme.backWall.geometry.height, 8.0);
  assert.strictEqual(theme.backWall.position.y, 4.0);
});

test('Back wall material uses BackSide and serene cream plaster (0xF7F2EA)', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.strictEqual(theme.backWall.material.color.value, 0xF7F2EA);
  assert.strictEqual(theme.backWall.material.side, MockTHREE.BackSide);
  assert.strictEqual(theme.backWall.material.roughness, 0.88);
});

test('Window shadow group contains 4 panes at (1.4, 2.1, -1.8)', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.ok(theme.windowShadowGroup);
  assert.strictEqual(theme.windowShadowGroup.children.length, 4);
  assert.strictEqual(theme.windowShadowGroup.position.x, 1.4);
  assert.strictEqual(theme.windowShadowGroup.position.y, 2.1);
  assert.strictEqual(theme.windowShadowGroup.position.z, -1.8);
});

test('Window shadow material is transparent with opacity 0.075', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);
  const pane = theme.windowShadowGroup.children[0];

  assert.strictEqual(pane.material.transparent, true);
  assert.strictEqual(pane.material.opacity, 0.075);
});

test('Overhead softbox fixture positioned at (-2.15, 2.95, 1.10)', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.ok(theme.softboxGroup);
  assert.strictEqual(theme.softboxGroup.position.x, -2.15);
  assert.strictEqual(theme.softboxGroup.position.y, 2.95);
  assert.strictEqual(theme.softboxGroup.position.z, 1.10);
});

test('Softbox includes local glow point light (0xFFF9EE, 0.90, 3.8m)', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);
  const glow = theme.softboxGroup.children.find(c => c.name === 'Studio_SoftboxGlow');

  assert.ok(glow);
  assert.strictEqual(glow.color.value, 0xFFF9EE);
  assert.strictEqual(glow.intensity, 0.90);
});

test('Foreground framing foliage contains 4 leaf spheres for depth-of-field', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  assert.ok(theme.foliageGroup);
  assert.strictEqual(theme.foliageGroup.children.length, 4);
  assert.strictEqual(theme.foliageGroup.position.x, -1.85);
  assert.strictEqual(theme.foliageGroup.position.z, 2.40);
});

console.log('\n==================================================');
console.log('  THEME PRESET APPLICATION TESTS                  ');
console.log('==================================================');

test('applyTheme("nordic-minimal") updates background, fog, and materials', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  theme.applyTheme('nordic-minimal', scene);
  assert.strictEqual(theme.currentPreset, 'nordic-minimal');
  assert.strictEqual(scene.background.value, 0xF2F2F4);
  assert.strictEqual(scene.fog.color.value, 0xF2F2F4);
  assert.strictEqual(scene.fog.near, 10.0);
  assert.strictEqual(scene.fog.far, 25.0);
  assert.strictEqual(theme.materials.wallMat.color.value, 0xEEEEF2);
});

test('applyTheme("warm-terracotta") updates rich earth tones', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  theme.applyTheme('warm-terracotta', scene);
  assert.strictEqual(theme.currentPreset, 'warm-terracotta');
  assert.strictEqual(scene.background.value, 0xF4EDE4);
  assert.strictEqual(theme.materials.wallMat.color.value, 0xF0E2D2);
  assert.strictEqual(theme.materials.shadowBarMat.opacity, 0.090);
});

test('theme.getThemeState() returns full architecture and preset metrics', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);
  const state = theme.getThemeState();

  assert.strictEqual(state.currentPreset, 'luxury-cream');
  assert.strictEqual(state.isMounted, true);
  assert.strictEqual(state.hasFloor, true);
  assert.strictEqual(state.hasBackWall, true);
  assert.strictEqual(state.hasWindowShadow, true);
  assert.strictEqual(state.hasSoftbox, true);
  assert.strictEqual(state.hasFoliage, true);
});

console.log('\n==================================================');
console.log('  DISPOSAL & RESOURCE MANAGEMENT TESTS            ');
console.log('==================================================');

test('theme.dispose() removes architecture group from scene', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);
  assert.strictEqual(scene.children.includes(theme.group), true);

  theme.dispose(scene);
  assert.strictEqual(scene.children.includes(theme.group), false);
  assert.strictEqual(theme.isDisposed, true);
});

test('theme.dispose() disposes internal geometries', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);
  const floorGeo = theme.floor.geometry;

  theme.dispose(scene);
  assert.strictEqual(floorGeo.disposed, true);
});

test('theme.dispose() is safe against double invocation', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);

  theme.dispose(scene);
  assert.doesNotThrow(() => {
    theme.dispose(scene);
  });
});

test('theme.dispose() NEVER disposes external shared creamMarble texture', () => {
  let marbleDisposed = false;
  const sharedTextures = {
    creamMarble: { name: 'creamMarble', dispose() { marbleDisposed = true; } }
  };

  const scene = new MockScene();
  const theme = createStudioTheme(scene, sharedTextures, 'luxury-cream', MockTHREE);
  theme.dispose(scene);

  assert.strictEqual(marbleDisposed, false, 'External creamMarble texture must never be disposed by theme module');
});

test('ThemeMaterials initializes with all environmental materials', () => {
  const mats = new ThemeMaterials({}, MockTHREE);
  assert.ok(mats.floorMat);
  assert.ok(mats.wallMat);
  assert.ok(mats.shadowBarMat);
  assert.ok(mats.softboxHousingMat);
  assert.ok(mats.diffuserMat);
  assert.ok(mats.armMat);
  assert.ok(mats.fgLeafMat);
  assert.strictEqual(mats.disposables.length >= 7, true);
});

test('ThemeMaterials.applyPreset updates wall roughness and floor color', () => {
  const mats = new ThemeMaterials({}, MockTHREE);
  mats.applyPreset('nordic-minimal');
  assert.strictEqual(mats.wallMat.color.value, 0xEEEEF2);
  assert.strictEqual(mats.wallMat.roughness, 0.85);
  assert.strictEqual(mats.floorMat.color.value, 0xF8F8FA);
});

test('ThemeMaterials.dispose cleans up internal materials array', () => {
  const mats = new ThemeMaterials({}, MockTHREE);
  const wallMat = mats.wallMat;
  mats.dispose();
  assert.strictEqual(wallMat.disposed, true);
  assert.strictEqual(mats.disposables.length, 0);
});

test('createStudioTheme returns instance with valid floor and backWall references', () => {
  const scene = new MockScene();
  const theme = createStudioTheme(scene, {}, 'luxury-cream', MockTHREE);
  assert.ok(theme.floor);
  assert.ok(theme.backWall);
  assert.strictEqual(theme.currentPreset, 'luxury-cream');
});

test('ThemeContract provides immutable copies of presets and palettes', () => {
  const presets = ThemeContract.getPresets();
  const palette = ThemeContract.getPalette();
  assert.ok(presets['luxury-cream']);
  assert.ok(palette.bgScene);

  presets['hacked'] = true;
  palette['hacked'] = true;
  assert.strictEqual(ThemeContract.getPresets()['hacked'], undefined);
  assert.strictEqual(ThemeContract.getPalette()['hacked'], undefined);
});

console.log('--------------------------------------------------');
console.log(`SUCCESS: All ${passedCount} StudioTheme specification, geometry, preset, and disposal tests passed.`);
