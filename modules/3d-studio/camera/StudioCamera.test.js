/**
 * Woobi - 3D Studio Camera Module
 * StudioCamera.test.js - Unit, Preset, Transition, Interaction, Controller, and Disposal Tests
 */

import assert from 'assert';
import {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET,
  getCameraPreset,
  getFovForAspect,
  StudioCamera,
  CameraTransitions,
  CameraInteractions,
  CameraController,
  CameraContract,
  createStudioCamera
} from './index.js';

// ==========================================
// MOCK THREE.JS IMPLEMENTATION FOR NODE.JS
// ==========================================
class MockVector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

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
  clone() {
    return new MockVector3(this.x, this.y, this.z);
  }
  lerp(target, alpha) {
    this.x += (target.x - this.x) * alpha;
    this.y += (target.y - this.y) * alpha;
    this.z += (target.z - this.z) * alpha;
    return this;
  }
}

class MockPerspectiveCamera {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    this.name = '';
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.position = new MockVector3();
    this.lookAtTarget = new MockVector3();
    this.projectionMatrixUpdated = false;
  }
  lookAt(x, y, z) {
    if (typeof x === 'object') {
      this.lookAtTarget.copy(x);
    } else {
      this.lookAtTarget.set(x, y, z);
    }
  }
  updateProjectionMatrix() {
    this.projectionMatrixUpdated = true;
  }
}

class MockRaycaster {
  constructor() {
    this.origin = new MockVector3();
  }
  setFromCamera(coords, camera) {
    this.coords = coords;
    this.camera = camera;
  }
  intersectObjects(objects, recursive) {
    return objects.map(o => ({ object: o, point: new MockVector3() }));
  }
}

const mockTHREE = {
  Vector2: MockVector2,
  Vector3: MockVector3,
  PerspectiveCamera: MockPerspectiveCamera,
  Raycaster: MockRaycaster
};

// ==========================================
// MOCK DOM EVENT TARGET FOR NODE.JS
// ==========================================
class MockEventTarget {
  constructor() {
    this.listeners = new Map();
  }
  addEventListener(type, handler, options) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(handler);
    }
  }
  dispatchEvent(type, eventObj = {}) {
    if (this.listeners.has(type)) {
      for (const handler of this.listeners.get(type)) {
        handler(eventObj);
      }
    }
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 390, height: 750 };
  }
}

// ==========================================
// TEST RUNNER
// ==========================================
let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
  }
}

console.log('\n--- Running Woobi 3D Studio Camera Unit & Contract Tests ---');

// 1. Module Exports & Contract Tests
test('CameraContract defines valid specification', () => {
  assert.strictEqual(CameraContract.name, 'camera');
  assert.strictEqual(CameraContract.version, '1.0.0');
  assert.ok(Array.isArray(CameraContract.presets));
  assert.ok(CameraContract.presets.length >= 6);
  assert.ok(CameraContract.methods.includes('setCameraPreset'));
  assert.ok(CameraContract.methods.includes('dispose'));
});

// 2. Preset Registry Completeness
test('CAMERA_PRESETS contains all required studio viewpoints', () => {
  const required = [
    'STUDIO_OVERVIEW',
    'WARDROBE_CLOSEUP',
    'AVATAR_FULL_BODY',
    'AVATAR_DETAIL',
    'VANITY_VIEW',
    'MIRROR_VIEW'
  ];
  for (const name of required) {
    assert.ok(CAMERA_PRESETS[name], `Missing preset ${name}`);
    assert.strictEqual(typeof CAMERA_PRESETS[name].position.x, 'number');
    assert.strictEqual(typeof CAMERA_PRESETS[name].target.x, 'number');
    assert.strictEqual(typeof CAMERA_PRESETS[name].fovLandscape, 'number');
    assert.strictEqual(typeof CAMERA_PRESETS[name].fovPortrait, 'number');
  }
});

// 3. Exact Preset Coordinates Verification
test('STUDIO_OVERVIEW and WARDROBE_CLOSEUP match baseline studio coordinates', () => {
  const overview = CAMERA_PRESETS.STUDIO_OVERVIEW;
  assert.strictEqual(overview.position.x, 0.0);
  assert.strictEqual(overview.position.y, 1.22);
  assert.strictEqual(overview.position.z, 3.10);
  assert.strictEqual(overview.target.x, -0.08);
  assert.strictEqual(overview.target.y, 1.08);

  const wardrobe = CAMERA_PRESETS.WARDROBE_CLOSEUP;
  assert.strictEqual(wardrobe.position.x, -0.96);
  assert.strictEqual(wardrobe.position.y, 1.20);
  assert.strictEqual(wardrobe.position.z, 2.50);
});

// 4. Default Preset Fallback
test('getCameraPreset falls back to DEFAULT_CAMERA_PRESET on unknown key', () => {
  const fallback = getCameraPreset('UNKNOWN_PRESET_XYZ');
  assert.strictEqual(fallback.name, 'STUDIO_OVERVIEW');
});

// 5. Portrait vs Landscape FOV Logic
test('getFovForAspect returns fovPortrait when aspect < 0.75 and fovLandscape when >= 0.75', () => {
  const preset = CAMERA_PRESETS.STUDIO_OVERVIEW;
  const portraitFov = getFovForAspect(preset, 0.52); // Portrait aspect
  assert.strictEqual(portraitFov, 56);

  const landscapeFov = getFovForAspect(preset, 1.77); // Landscape 16:9
  assert.strictEqual(landscapeFov, 42);
});

// 6. StudioCamera Construction
test('StudioCamera initializes PerspectiveCamera with correct parameters', () => {
  const cam = new StudioCamera({ width: 390, height: 750, initialPreset: 'STUDIO_OVERVIEW' }, mockTHREE);
  assert.ok(cam.camera);
  assert.strictEqual(cam.camera.name, 'Studio_PerspectiveCamera');
  assert.strictEqual(cam.camera.near, 0.1);
  assert.strictEqual(cam.camera.far, 40.0);
  assert.strictEqual(cam.camera.position.x, 0.0);
  assert.strictEqual(cam.camera.position.y, 1.22);
  assert.strictEqual(cam.camera.position.z, 3.10);
});

// 7. StudioCamera Aspect Ratio Calculation
test('StudioCamera computes correct aspect ratio', () => {
  const cam = new StudioCamera({ width: 800, height: 600 }, mockTHREE);
  assert.strictEqual(cam.aspect, 800 / 600);
  assert.strictEqual(cam.camera.aspect, 800 / 600);
});

// 8. StudioCamera Resize
test('StudioCamera resize updates aspect and re-computes fov with projection matrix update', () => {
  const cam = new StudioCamera({ width: 390, height: 750 }, mockTHREE);
  cam.camera.projectionMatrixUpdated = false;

  cam.resize(1920, 1080);
  assert.strictEqual(cam.width, 1920);
  assert.strictEqual(cam.height, 1080);
  assert.strictEqual(cam.aspect, 1920 / 1080);
  assert.strictEqual(cam.camera.fov, 42); // Landscape fov for STUDIO_OVERVIEW
  assert.strictEqual(cam.camera.projectionMatrixUpdated, true);
});

// 9. StudioCamera Resize Guarding
test('StudioCamera resize ignores non-positive width/height safely', () => {
  const cam = new StudioCamera({ width: 390, height: 750 }, mockTHREE);
  cam.resize(0, -100);
  assert.strictEqual(cam.width, 390);
  assert.strictEqual(cam.height, 750);
});

// 10. StudioCamera Disposal
test('StudioCamera disposal sets isDisposed and nullifies camera reference', () => {
  const cam = new StudioCamera({ width: 390, height: 750 }, mockTHREE);
  cam.dispose();
  assert.strictEqual(cam.isDisposed, true);
  assert.strictEqual(cam.camera, null);
});

// 11. CameraTransitions Initialization
test('CameraTransitions initializes target vectors from initial preset', () => {
  const trans = new CameraTransitions({ initialPreset: 'AVATAR_FULL_BODY' }, mockTHREE);
  assert.strictEqual(trans.currentPreset, 'AVATAR_FULL_BODY');
  assert.strictEqual(trans.targetCameraPos.x, 0.0);
  assert.strictEqual(trans.targetCameraPos.y, 1.10);
  assert.strictEqual(trans.targetCameraPos.z, 2.10);
  assert.strictEqual(trans.targetCameraLookAt.y, 1.00);
});

// 12. CameraTransitions setPreset
test('CameraTransitions setPreset switches target coordinates', () => {
  const trans = new CameraTransitions({ initialPreset: 'STUDIO_OVERVIEW' }, mockTHREE);
  const ok = trans.setPreset('VANITY_VIEW');
  assert.strictEqual(ok, true);
  assert.strictEqual(trans.currentPreset, 'VANITY_VIEW');
  assert.strictEqual(trans.targetCameraPos.x, 0.65);
  assert.strictEqual(trans.targetCameraPos.y, 1.25);
  assert.strictEqual(trans.targetCameraPos.z, 1.55);
  assert.strictEqual(trans.targetCameraLookAt.x, 0.85);
});

// 13. CameraTransitions setPreset Invalid Handling
test('CameraTransitions setPreset returns false for invalid preset', () => {
  const trans = new CameraTransitions({}, mockTHREE);
  const ok = trans.setPreset('INVALID_PRESET');
  assert.strictEqual(ok, false);
  assert.strictEqual(trans.currentPreset, 'STUDIO_OVERVIEW');
});

// 14. CameraTransitions focusOn Custom Target
test('CameraTransitions focusOn updates targetCameraLookAt and optional camera position', () => {
  const trans = new CameraTransitions({}, mockTHREE);
  trans.focusOn({ x: 1.0, y: 2.0, z: 3.0 }, { x: 4.0, y: 5.0, z: 6.0 });
  assert.strictEqual(trans.targetCameraLookAt.x, 1.0);
  assert.strictEqual(trans.targetCameraLookAt.y, 2.0);
  assert.strictEqual(trans.targetCameraLookAt.z, 3.0);
  assert.strictEqual(trans.targetCameraPos.x, 4.0);
  assert.strictEqual(trans.targetCameraPos.y, 5.0);
  assert.strictEqual(trans.targetCameraPos.z, 6.0);
});

// 15. Zoom Factor Clamping Bounds [0.7, 1.4]
test('CameraTransitions clamps zoomFactor strictly between 0.7 and 1.4', () => {
  const trans = new CameraTransitions({}, mockTHREE);
  trans.setZoomFactor(2.5);
  assert.strictEqual(trans.zoomFactor, 1.40);

  trans.setZoomFactor(0.2);
  assert.strictEqual(trans.zoomFactor, 0.70);

  trans.setZoomFactor(1.0);
  trans.addZoomDelta(0.2);
  assert.strictEqual(trans.zoomFactor, 1.20);
});

// 16. CameraTransitions Update Lerp
test('CameraTransitions update lerps camera position and lookAt towards targets', () => {
  const trans = new CameraTransitions({ initialPreset: 'STUDIO_OVERVIEW', positionLerpSpeed: 0.5 }, mockTHREE);
  const camera = new MockPerspectiveCamera(50, 1);
  camera.position.set(0, 0, 0);

  trans.setPreset('WARDROBE_CLOSEUP'); // target x: -0.96
  trans.update(camera, 1.0);

  // Position should have moved halfway towards target
  assert.ok(camera.position.x < 0);
  assert.ok(Math.abs(camera.position.x - (-0.48)) < 0.01);
});

// 17. CameraTransitions FOV Damping & Clamping [26, 66]
test('CameraTransitions update damps FOV and clamps to minFov/maxFov', () => {
  const trans = new CameraTransitions({ initialPreset: 'STUDIO_OVERVIEW', minFov: 26, maxFov: 66 }, mockTHREE);
  const camera = new MockPerspectiveCamera(40, 0.5); // portrait
  trans.setZoomFactor(1.4); // Target: 56 * 1.4 = 78.4 -> clamped to 66

  for (let i = 0; i < 50; i++) {
    trans.update(camera, 0.5);
  }
  assert.ok(camera.fov <= 66.01);
  assert.ok(camera.fov >= 65.5);
});

// 18. CameraInteractions Construction & Callbacks
test('CameraInteractions stores callback handlers correctly', () => {
  let rotated = 0;
  const interactions = new CameraInteractions({
    onRotate: (delta) => { rotated += delta; }
  });
  assert.strictEqual(typeof interactions.onRotate, 'function');
  assert.strictEqual(interactions.isAttached, false);
});

// 19. CameraInteractions Attach & Detach
test('CameraInteractions attaches and detaches event listeners cleanly', () => {
  const mockCanvas = new MockEventTarget();
  const mockWindow = new MockEventTarget();
  const interactions = new CameraInteractions();

  interactions.attach(mockCanvas, mockWindow);
  assert.strictEqual(interactions.isAttached, true);
  assert.ok(mockCanvas.listeners.has('mousedown'));
  assert.ok(mockWindow.listeners.has('mousemove'));
  assert.ok(mockCanvas.listeners.has('wheel'));

  interactions.detach();
  assert.strictEqual(interactions.isAttached, false);
  assert.strictEqual(mockCanvas.listeners.get('mousedown').size, 0);
  assert.strictEqual(mockWindow.listeners.get('mousemove').size, 0);
  assert.strictEqual(mockCanvas.listeners.get('wheel').size, 0);
});

// 20. Mouse Drag Triggers onRotate
test('CameraInteractions mouse drag dispatches onRotate with delta', () => {
  const mockCanvas = new MockEventTarget();
  const mockWindow = new MockEventTarget();
  let rotateDelta = 0;

  const interactions = new CameraInteractions({
    onRotate: (delta) => { rotateDelta += delta; }
  });
  interactions.attach(mockCanvas, mockWindow);

  mockCanvas.dispatchEvent('mousedown', { clientX: 100, clientY: 100 });
  mockWindow.dispatchEvent('mousemove', { clientX: 120, clientY: 100 }); // +20px

  assert.ok(interactions.hasDragged);
  assert.ok(Math.abs(rotateDelta - (20 * 0.008)) < 0.001);

  interactions.dispose();
});

// 21. Mouse Click Triggers onClick Without Drag
test('CameraInteractions click without drag triggers onClick', () => {
  const mockCanvas = new MockEventTarget();
  const mockWindow = new MockEventTarget();
  let clickedCoords = null;

  const interactions = new CameraInteractions({
    onClick: (x, y) => { clickedCoords = { x, y }; }
  });
  interactions.attach(mockCanvas, mockWindow);

  mockCanvas.dispatchEvent('mousedown', { clientX: 50, clientY: 80 });
  mockWindow.dispatchEvent('mouseup', { clientX: 50, clientY: 80 });

  assert.ok(clickedCoords);
  assert.strictEqual(clickedCoords.x, 50);
  assert.strictEqual(clickedCoords.y, 80);

  interactions.dispose();
});

// 22. Touch Drag Triggers onRotate
test('CameraInteractions touch drag triggers onRotate with touch sensitivity', () => {
  const mockCanvas = new MockEventTarget();
  const mockWindow = new MockEventTarget();
  let rotateDelta = 0;

  const interactions = new CameraInteractions({
    onRotate: (delta) => { rotateDelta += delta; }
  });
  interactions.attach(mockCanvas, mockWindow);

  mockCanvas.dispatchEvent('touchstart', {
    touches: [{ clientX: 100, clientY: 100 }]
  });
  mockWindow.dispatchEvent('touchmove', {
    touches: [{ clientX: 110, clientY: 100 }] // +10px
  });

  assert.ok(interactions.hasDragged);
  assert.ok(Math.abs(rotateDelta - (10 * 0.009)) < 0.001);

  interactions.dispose();
});

// 23. Touch Pinch Triggers onZoom
test('CameraInteractions two-finger pinch triggers onZoom', () => {
  const mockCanvas = new MockEventTarget();
  const mockWindow = new MockEventTarget();
  let zoomChange = 0;

  const interactions = new CameraInteractions({
    onZoom: (delta) => { zoomChange += delta; }
  });
  interactions.attach(mockCanvas, mockWindow);

  mockCanvas.dispatchEvent('touchstart', {
    touches: [
      { clientX: 100, clientY: 100 },
      { clientX: 200, clientY: 100 }
    ] // dist = 100
  });
  mockWindow.dispatchEvent('touchmove', {
    touches: [
      { clientX: 80, clientY: 100 },
      { clientX: 220, clientY: 100 }
    ] // dist = 140, diff = 40
  });

  assert.ok(zoomChange < 0); // Pinch-out expands / zooms in

  interactions.dispose();
});

// 24. Mouse Wheel Triggers onZoom
test('CameraInteractions mouse wheel triggers onZoom with delta', () => {
  const mockCanvas = new MockEventTarget();
  let zoomDelta = 0;

  const interactions = new CameraInteractions({
    onZoom: (delta) => { zoomDelta += delta; }
  });
  interactions.attach(mockCanvas);

  let defaultPrevented = false;
  mockCanvas.dispatchEvent('wheel', {
    deltaY: 120,
    preventDefault: () => { defaultPrevented = true; }
  });

  assert.strictEqual(defaultPrevented, true);
  assert.ok(Math.abs(zoomDelta - (120 * 0.001)) < 0.001);

  interactions.dispose();
});

// 25. CameraController Coordination
test('CameraController coordinates camera, transitions, and interactions', () => {
  const mockCanvas = new MockEventTarget();
  const controller = new CameraController({
    canvas: mockCanvas,
    width: 390,
    height: 750,
    initialPreset: 'STUDIO_OVERVIEW'
  }, mockTHREE);

  assert.ok(controller.camera);
  assert.strictEqual(controller.currentPreset, 'STUDIO_OVERVIEW');
  assert.strictEqual(controller.zoomFactor, 1.0);

  controller.setCameraPreset('AVATAR_DETAIL');
  assert.strictEqual(controller.currentPreset, 'AVATAR_DETAIL');

  controller.update(0.016);
  controller.dispose();
  assert.strictEqual(controller.isDisposed, true);
});

// 26. CameraController getState
test('CameraController getState returns diagnostic snapshot', () => {
  const controller = new CameraController({ initialPreset: 'VANITY_VIEW' }, mockTHREE);
  const state = controller.getState();

  assert.strictEqual(state.currentPreset, 'VANITY_VIEW');
  assert.strictEqual(typeof state.zoomFactor, 'number');
  assert.strictEqual(typeof state.aspect, 'number');
  assert.strictEqual(typeof state.targetCameraPos.x, 'number');
  assert.strictEqual(state.isDisposed, false);

  controller.dispose();
});

// 27. CameraController Raycast Selection
test('CameraController raycastClick traverses parent hierarchy for interactiveType', () => {
  const controller = new CameraController({}, mockTHREE);
  const mockCanvas = new MockEventTarget();

  const childMesh = {
    userData: {},
    parent: {
      userData: { interactiveType: 'wardrobe', id: 'wardrobe_cabinet' },
      parent: null
    }
  };

  let clickedType = null;
  let clickedData = null;

  const hit = controller.raycastClick(100, 100, mockCanvas, [childMesh], (type, data) => {
    clickedType = type;
    clickedData = data;
  });

  assert.ok(hit);
  assert.strictEqual(clickedType, 'wardrobe');
  assert.strictEqual(clickedData.id, 'wardrobe_cabinet');

  controller.dispose();
});

// 28. Double Dispose Safety
test('Double disposal is idempotent and does not throw', () => {
  const controller = new CameraController({}, mockTHREE);
  assert.doesNotThrow(() => {
    controller.dispose();
    controller.dispose();
  });
});

// 29. Factory Function createStudioCamera
test('createStudioCamera instantiates CameraController correctly', () => {
  const mockCanvas = new MockEventTarget();
  const controller = createStudioCamera(mockCanvas, { width: 400, height: 800 }, mockTHREE);

  assert.ok(controller instanceof CameraController);
  assert.strictEqual(controller.currentPreset, 'STUDIO_OVERVIEW');
  controller.dispose();
});

// 30. Reset Camera Helper
test('CameraController resetCamera restores STUDIO_OVERVIEW preset', () => {
  const controller = new CameraController({ initialPreset: 'WARDROBE_CLOSEUP' }, mockTHREE);
  assert.strictEqual(controller.currentPreset, 'WARDROBE_CLOSEUP');

  controller.resetCamera();
  assert.strictEqual(controller.currentPreset, 'STUDIO_OVERVIEW');
  controller.dispose();
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
