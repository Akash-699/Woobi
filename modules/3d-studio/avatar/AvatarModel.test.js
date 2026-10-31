/**
 * Woobi - 3D Studio Avatar Module
 * AvatarModel.test.js - Unit, Rig, Morphs, Grounding, Animation, and Disposal Tests
 */

import assert from 'assert';
import {
  AvatarModel,
  AvatarMaterials,
  AvatarRig,
  AvatarAssets,
  AvatarMorphs,
  AvatarAnimations,
  AvatarController,
  AVATAR_CONFIG,
  AVATAR_PALETTE,
  AVATAR_ASSET_PATHS,
  PROPORTION_PRESETS,
  createAvatar,
  AvatarContract
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
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }
}

class MockColor {
  constructor(color = 0xffffff) {
    this.set(color);
  }
  set(color) {
    this.value = color;
    return this;
  }
  copy(col) {
    this.value = col.value;
    return this;
  }
  multiplyScalar(s) {
    return this;
  }
}

class MockObject3D {
  constructor() {
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
    this.visible = true;
    this.name = '';
    this.children = [];
    this.parent = null;
    this.userData = {};
  }
  add(child) {
    if (child) {
      child.parent = this;
      this.children.push(child);
    }
    return this;
  }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
    return this;
  }
  getObjectByName(name) {
    if (this.name === name) return this;
    for (const c of this.children) {
      const found = c.getObjectByName ? c.getObjectByName(name) : null;
      if (found) return found;
    }
    return null;
  }
  traverse(cb) {
    cb(this);
    this.children.forEach(c => c.traverse && c.traverse(cb));
  }
}

class MockGeometry {
  constructor() {
    this.disposed = false;
  }
  scale(x, y, z) { return this; }
  dispose() {
    this.disposed = true;
  }
}

class MockMaterial {
  constructor(params = {}) {
    this.color = new MockColor(params.color || 0xffffff);
    this.roughness = params.roughness || 0.5;
    this.metalness = params.metalness || 0;
    this.map = params.map || null;
    this.needsUpdate = false;
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
  }
}

const MockTHREE = {
  Group: class MockGroup extends MockObject3D {},
  Mesh: class MockMesh extends MockObject3D {
    constructor(geo, mat) {
      super();
      this.isMesh = true;
      this.geometry = geo;
      this.material = mat;
      this.castShadow = false;
      this.receiveShadow = false;
    }
  },
  SphereGeometry: class extends MockGeometry {},
  CylinderGeometry: class extends MockGeometry {},
  BoxGeometry: class extends MockGeometry {},
  TorusGeometry: class extends MockGeometry {},
  MeshStandardMaterial: MockMaterial,
  MeshBasicMaterial: MockMaterial,
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
console.log('  AVATAR SPECIFICATION & GROUNDING TESTS          ');
console.log('==================================================');

test('Dais elevation must be exactly 0.080m (8.0 cm)', () => {
  assert.strictEqual(AVATAR_CONFIG.daisElevation, 0.080);
});

test('AvatarContract.getElevation() must return 0.080m', () => {
  assert.strictEqual(AvatarContract.getElevation(), 0.080);
});

test('Primary asset path must reference authentic seren_avatar.glb', () => {
  assert.strictEqual(AVATAR_ASSET_PATHS[0], 'seren_avatar.glb');
});

test('Asset paths list must include local and Ready Player Me fallbacks', () => {
  assert.strictEqual(AVATAR_ASSET_PATHS.length >= 2, true);
  assert.strictEqual(AVATAR_ASSET_PATHS.includes('assets/models/avatar_female.glb'), true);
});

console.log('\n==================================================');
console.log('  MATERIALS & COLOR CUSTOMIZATION TESTS           ');
console.log('==================================================');

test('AvatarMaterials initializes all PBR skin and hair materials', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  assert.strictEqual(mats.skinMaterials.length >= 1, true);
  assert.strictEqual(mats.hairMaterials.length >= 2, true);
  assert.strictEqual(mats.disposables.length >= 10, true);
});

test('materials.updateSkinTone() propagates hex color to skin materials', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  mats.updateSkinTone('#CF9E76');
  mats.skinMaterials.forEach(m => {
    assert.strictEqual(m.color.value, '#CF9E76');
  });
});

test('materials.updateHairColor() propagates hex color to hair materials', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  mats.updateHairColor('#4A2E18');
  mats.hairMaterials.forEach(m => {
    assert.strictEqual(m.color.value, '#4A2E18');
  });
});

test('materials.registerSkinMaterial() tracks additional mesh materials', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  const extraMat = new MockMaterial();
  mats.registerSkinMaterial(extraMat);
  mats.updateSkinTone('#5A3A26');
  assert.strictEqual(extraMat.color.value, '#5A3A26');
});

console.log('\n==================================================');
console.log('  ANATOMICAL RIG & SCENE HIERARCHY TESTS          ');
console.log('==================================================');

test('AvatarRig builds full hierarchy and enforces 8cm dais grounding', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  const rig = new AvatarRig(mats, MockTHREE);
  const root = rig.buildRig();

  assert.strictEqual(root.name, 'AvatarRoot');
  assert.strictEqual(root.position.y, 0.080);
});

test('Rig contains head, chest, midriff, arms, hips, legs, and sneakers', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  const rig = new AvatarRig(mats, MockTHREE);
  rig.buildRig();

  assert.ok(rig.headGroup);
  assert.ok(rig.chestGroup);
  assert.strictEqual(rig.eyelids.length, 2);
  assert.ok(rig.hairStyles.bun);
  assert.strictEqual(rig.disposables.length >= 25, true);
});

test('Head group is positioned at y = 1.54m above root', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  const rig = new AvatarRig(mats, MockTHREE);
  rig.buildRig();
  assert.strictEqual(rig.headGroup.position.y, 1.54);
});

test('Chest group is positioned at y = 1.22m above root', () => {
  const mats = new AvatarMaterials({}, MockTHREE);
  const rig = new AvatarRig(mats, MockTHREE);
  rig.buildRig();
  assert.strictEqual(rig.chestGroup.position.y, 1.22);
});

console.log('\n==================================================');
console.log('  PROPORTION MORPHS & GENDER PRESENTATION TESTS   ');
console.log('==================================================');

test('PROPORTION_PRESETS defines valid scale configurations', () => {
  assert.ok(PROPORTION_PRESETS.regular);
  assert.ok(PROPORTION_PRESETS.petite);
  assert.ok(PROPORTION_PRESETS.tall);
  assert.ok(PROPORTION_PRESETS.athletic);
  assert.ok(PROPORTION_PRESETS.curvy);
});

test('setBodyProportions("athletic") scales root to (1.05, 1.02, 1.05)', () => {
  const root = new MockTHREE.Group();
  root.position.set(0, 0.080, 0);
  const morphs = new AvatarMorphs(root);
  morphs.setBodyProportions('athletic');

  assert.strictEqual(root.scale.x, 1.05);
  assert.strictEqual(root.scale.y, 1.02);
  assert.strictEqual(root.scale.z, 1.05);
  // Grounding check
  assert.strictEqual(root.position.y, 0.080);
});

test('setGenderPresentation("masculine") applies athletic preset', () => {
  const root = new MockTHREE.Group();
  root.position.set(0, 0.080, 0);
  const morphs = new AvatarMorphs(root);
  morphs.setGenderPresentation('masculine');

  assert.strictEqual(morphs.currentGender, 'masculine');
  assert.strictEqual(root.scale.x, 1.05);
  assert.strictEqual(root.position.y, 0.080);
});

test('setGenderPresentation("feminine") applies regular preset', () => {
  const root = new MockTHREE.Group();
  root.position.set(0, 0.080, 0);
  const morphs = new AvatarMorphs(root);
  morphs.setGenderPresentation('feminine');

  assert.strictEqual(morphs.currentGender, 'feminine');
  assert.strictEqual(root.scale.x, 1.00);
  assert.strictEqual(root.position.y, 0.080);
});

test('Dais elevation remains strictly 0.080m after all proportion adjustments', () => {
  const root = new MockTHREE.Group();
  root.position.set(0, 0.080, 0);
  const morphs = new AvatarMorphs(root);

  Object.keys(PROPORTION_PRESETS).forEach((preset) => {
    morphs.setBodyProportions(preset);
    assert.strictEqual(root.position.y, 0.080, `Elevation displaced on preset ${preset}`);
  });
});

console.log('\n==================================================');
console.log('  IDLE ANIMATIONS & ROTATION DAMPING TESTS        ');
console.log('==================================================');

test('Rotation damping smoothly approaches targetRotationY', () => {
  const root = new MockTHREE.Group();
  const anim = new AvatarAnimations(root, null, MockTHREE);
  anim.setTargetRotation(1.0);
  anim.update(0.016, 0);

  assert.strictEqual(anim.avatarRotationY > 0, true);
  assert.strictEqual(anim.avatarRotationY < 1.0, true);
  assert.strictEqual(root.rotation.y, anim.avatarRotationY);
});

test('Idle breathing modulates chest and head position Y', () => {
  const root = new MockTHREE.Group();
  const mats = new AvatarMaterials({}, MockTHREE);
  const rig = new AvatarRig(mats, MockTHREE);
  rig.buildRig();

  const anim = new AvatarAnimations(root, rig, MockTHREE);
  const initialChestY = rig.chestGroup.position.y;
  // Advance time where sin(time * 1.6) > 0
  anim.update(0.016, 1.0);

  assert.notStrictEqual(rig.chestGroup.position.y, initialChestY);
  assert.strictEqual(Math.abs(rig.chestGroup.position.y - 1.22) <= 0.005, true);
});

test('Periodic blinking updates eyelid scale Y', () => {
  const root = new MockTHREE.Group();
  const mats = new AvatarMaterials({}, MockTHREE);
  const rig = new AvatarRig(mats, MockTHREE);
  rig.buildRig();

  const anim = new AvatarAnimations(root, rig, MockTHREE);
  // Advance blink timer past nextBlinkTime
  anim.blinkTimer = 3.5;
  anim.update(0.05, 1.0);

  assert.strictEqual(anim.isBlinking, true);
  assert.strictEqual(rig.eyelids[0].scale.y > 0.02, true);
});

console.log('\n==================================================');
console.log('  CONTROLLER & STATE PERSISTENCE TESTS            ');
console.log('==================================================');

test('AvatarController initializes with default configuration', () => {
  const model = new AvatarModel(MockTHREE);
  const scene = new MockTHREE.Group();
  model.build(scene, {}, MockTHREE);

  const controller = new AvatarController(model);
  assert.strictEqual(controller.avatarConfig.skinTone, AVATAR_CONFIG.defaultSkinTone);
  assert.strictEqual(controller.avatarConfig.gender, AVATAR_CONFIG.defaultGender);
});

test('controller.setSkinTone() updates config and active materials', () => {
  const model = new AvatarModel(MockTHREE);
  const scene = new MockTHREE.Group();
  model.build(scene, {}, MockTHREE);

  const controller = new AvatarController(model);
  controller.setSkinTone('#E8BF9E');
  assert.strictEqual(controller.avatarConfig.skinTone, '#E8BF9E');
  assert.strictEqual(model.materials.skinMat.color.value, '#E8BF9E');
});

test('controller.toggleAccessory() updates visibility and persisted config', () => {
  const model = new AvatarModel(MockTHREE);
  const scene = new MockTHREE.Group();
  model.build(scene, {}, MockTHREE);

  const controller = new AvatarController(model);
  controller.toggleAccessory('earrings', false);
  assert.strictEqual(controller.avatarConfig.accessories.earrings, false);
  assert.strictEqual(model.rig.accessories.earrings[0].visible, false);
  controller.toggleAccessory('earrings', true);
  assert.strictEqual(controller.avatarConfig.accessories.earrings, true);
  assert.strictEqual(model.rig.accessories.earrings[0].visible, true);
});

test('controller.applyAvatarConfig() applies complete configuration batch', () => {
  const model = new AvatarModel(MockTHREE);
  const scene = new MockTHREE.Group();
  model.build(scene, {}, MockTHREE);

  const controller = new AvatarController(model);
  controller.applyAvatarConfig({
    skinTone: '#A06B49',
    hairColor: '#5A3A26',
    proportions: 'tall',
    gender: 'female'
  });

  assert.strictEqual(controller.avatarConfig.skinTone, '#A06B49');
  assert.strictEqual(controller.avatarConfig.hairColor, '#5A3A26');
  assert.strictEqual(controller.avatarConfig.proportions, 'tall');
  assert.strictEqual(model.avatarRoot.scale.y, 1.06);
  assert.strictEqual(model.avatarRoot.position.y, 0.080);
});

test('controller.getAvatarState() returns complete snapshot', () => {
  const model = new AvatarModel(MockTHREE);
  const scene = new MockTHREE.Group();
  model.build(scene, {}, MockTHREE);

  const controller = new AvatarController(model);
  const state = controller.getAvatarState();
  assert.strictEqual(state.activeType, 'sculpted');
  assert.strictEqual(state.isGrounded, true);
  assert.strictEqual(state.elevation, 0.080);
});

console.log('\n==================================================');
console.log('  SCENE MOUNT, FALLBACK & DISPOSAL TESTS          ');
console.log('==================================================');

test('createAvatar() mounts avatarRoot onto the scene', () => {
  const scene = new MockTHREE.Group();
  const avatar = createAvatar(scene, {}, MockTHREE);

  assert.strictEqual(scene.children.includes(avatar.avatarRoot), true);
  assert.strictEqual(avatar.avatarRoot.position.y, 0.080);
});

test('GLB load failure cleanly falls back to procedural sculpted avatar', () => {
  const scene = new MockTHREE.Group();
  const avatar = createAvatar(scene, {}, MockTHREE);

  // Trigger load with empty paths (will fail cleanly)
  avatar.loadRiggedAvatarGLB(
    () => {},
    (err) => {
      assert.ok(err);
      assert.strictEqual(avatar.activeAvatarType, 'sculpted');
      assert.strictEqual(avatar.sculptedAvatarGroup.visible, true);
    },
    []
  );
});

test('avatar.dispose() removes root from scene and clears resources', () => {
  const scene = new MockTHREE.Group();
  const avatar = createAvatar(scene, {}, MockTHREE);
  assert.strictEqual(scene.children.length, 1);

  avatar.dispose(scene);
  assert.strictEqual(scene.children.length, 0);
  assert.strictEqual(avatar.isDisposed, true);
});

test('avatar.dispose() is safe against double invocation', () => {
  const scene = new MockTHREE.Group();
  const avatar = createAvatar(scene, {}, MockTHREE);

  avatar.dispose(scene);
  // Second call must not throw
  assert.doesNotThrow(() => {
    avatar.dispose(scene);
  });
});

test('avatar.dispose() NEVER disposes external shared studio textures', () => {
  let knitDisposed = false;
  let linenDisposed = false;
  const sharedTextures = {
    ribbedKnit: { name: 'ribbedKnit', dispose() { knitDisposed = true; } },
    linenWeave: { name: 'linenWeave', dispose() { linenDisposed = true; } }
  };

  const scene = new MockTHREE.Group();
  const avatar = createAvatar(scene, sharedTextures, MockTHREE);
  avatar.dispose(scene);

  assert.strictEqual(knitDisposed, false, 'External ribbedKnit texture must never be disposed by avatar module');
  assert.strictEqual(linenDisposed, false, 'External linenWeave texture must never be disposed by avatar module');
});

console.log('--------------------------------------------------');
console.log(`SUCCESS: All ${passedCount} Avatar specification, hierarchy, morph, animation, fallback, and disposal tests passed.`);
