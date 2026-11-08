/**
 * Woobi - 3D Studio Features
 * GarmentInteractions.test.js - Unit & Integration Test Suite for Garment Interactions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  INTERACTION_STATES,
  INTERACTION_EVENTS,
  InteractionsContract
} from './InteractionsContract.js';
import { SelectionFeedback } from './SelectionFeedback.js';
import { GarmentInteractions, createGarmentInteractions } from './GarmentInteractions.js';

// Mock Three.js Mesh with material and emissive properties
function createMockMesh(name, emissiveHex = 0x000000) {
  let hex = emissiveHex;
  return {
    name,
    scale: {
      x: 1, y: 1, z: 1,
      set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    },
    material: {
      emissive: {
        getHex: () => hex,
        setHex: (val) => { hex = val; }
      },
      needsUpdate: false
    }
  };
}

// Mock Three.js Raycaster & Camera environment
function createMockThree() {
  class MockVector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  }

  class MockRaycaster {
    constructor() {
      this.hits = [];
    }
    setFromCamera(pointer, camera) {}
    intersectObjects(objects) {
      return this.hits.filter(h => objects.includes(h.object));
    }
  }

  return {
    Vector2: MockVector2,
    Raycaster: MockRaycaster
  };
}

describe('Garment Interactions Module - Specifications & Contracts', () => {
  it('1. should export interaction states', () => {
    assert.strictEqual(INTERACTION_STATES.IDLE, 'idle');
    assert.strictEqual(INTERACTION_STATES.HOVERED, 'hovered');
    assert.strictEqual(INTERACTION_STATES.SELECTED, 'selected');
  });

  it('2. should export interaction event names', () => {
    assert.strictEqual(INTERACTION_EVENTS.SELECT, 'garment:select');
    assert.strictEqual(INTERACTION_EVENTS.DESELECT, 'garment:deselect');
    assert.strictEqual(INTERACTION_EVENTS.HOVER, 'garment:hover');
    assert.strictEqual(INTERACTION_EVENTS.UNHOVER, 'garment:unhover');
  });

  it('3. should satisfy InteractionsContract API specification', () => {
    assert.strictEqual(InteractionsContract.name, 'GarmentInteractions');
    assert.ok(Array.isArray(InteractionsContract.methods));
    assert.ok(InteractionsContract.methods.includes('selectGarment'));
    assert.ok(InteractionsContract.methods.includes('clearSelection'));
    assert.ok(InteractionsContract.methods.includes('registerInteractiveMesh'));
  });
});

describe('Garment Interactions Module - SelectionFeedback', () => {
  it('4. should apply hover emissive tint to mesh', () => {
    const feedback = new SelectionFeedback({ hoverEmissive: 0x332211 });
    const mesh = createMockMesh('topMesh');
    feedback.applyHover(mesh);
    assert.strictEqual(mesh.material.emissive.getHex(), 0x332211);
    assert.strictEqual(mesh.material.needsUpdate, true);
  });

  it('5. should restore original emissive upon clearing feedback', () => {
    const feedback = new SelectionFeedback({ hoverEmissive: 0x332211 });
    const mesh = createMockMesh('topMesh', 0x111111);
    feedback.applyHover(mesh);
    assert.strictEqual(mesh.material.emissive.getHex(), 0x332211);

    feedback.clearFeedback(mesh);
    assert.strictEqual(mesh.material.emissive.getHex(), 0x111111);
  });

  it('6. should apply selection emissive highlight', () => {
    const feedback = new SelectionFeedback({ selectedEmissive: 0x554433 });
    const mesh = createMockMesh('bottomMesh');
    feedback.applySelection(mesh);
    assert.strictEqual(mesh.material.emissive.getHex(), 0x554433);
  });

  it('7. should clear feedback across all registered meshes with clearAll()', () => {
    const feedback = new SelectionFeedback();
    const meshA = createMockMesh('A', 0x101010);
    const meshB = createMockMesh('B', 0x202020);
    feedback.applyHover(meshA);
    feedback.applyHover(meshB);

    feedback.clearAll();
    assert.strictEqual(meshA.material.emissive.getHex(), 0x101010);
    assert.strictEqual(meshB.material.emissive.getHex(), 0x202020);
  });
});

describe('Garment Interactions Module - Mesh Registry & Selection', () => {
  it('8. should register interactive meshes with metadata', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'cardigan', category: 'top' });

    assert.strictEqual(interactions.getRegisteredMeshes().length, 1);
    assert.strictEqual(interactions.getRegisteredMeshes()[0], mesh);
  });

  it('9. should unregister interactive meshes', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'cardigan' });
    interactions.unregisterInteractiveMesh(mesh);

    assert.strictEqual(interactions.getRegisteredMeshes().length, 0);
  });

  it('10. should select garment by garmentId', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'blazer', category: 'top' });

    const res = interactions.selectGarment('blazer');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.garmentId, 'blazer');
    assert.strictEqual(res.category, 'top');
    assert.strictEqual(res.mesh, mesh);
  });

  it('11. should query active selection via getSelectedGarment', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarBottom');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'denim', category: 'bottom' });

    interactions.selectGarment('denim');
    const selected = interactions.getSelectedGarment();
    assert.ok(selected);
    assert.strictEqual(selected.garmentId, 'denim');
  });

  it('12. should deselect active garment and restore feedback', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop', 0x000000);
    interactions.registerInteractiveMesh(mesh, { garmentId: 'tank', category: 'top' });

    interactions.selectGarment('tank');
    assert.notStrictEqual(mesh.material.emissive.getHex(), 0x000000);

    interactions.deselectGarment();
    assert.strictEqual(interactions.getSelectedGarment(), null);
    assert.strictEqual(mesh.material.emissive.getHex(), 0x000000);
  });

  it('13. should clear all selections via clearSelection', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'tank' });

    interactions.selectGarment('tank');
    interactions.clearSelection();
    assert.strictEqual(interactions.getSelectedGarment(), null);
  });
});

describe('Garment Interactions Module - Events & Raycasting', () => {
  it('14. should emit garment:select event on selection', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'tank', category: 'top' });

    let selectData = null;
    interactions.on(INTERACTION_EVENTS.SELECT, (data) => {
      selectData = data;
    });

    interactions.selectGarment('tank');
    assert.ok(selectData);
    assert.strictEqual(selectData.garmentId, 'tank');
    assert.strictEqual(selectData.state, INTERACTION_STATES.SELECTED);
  });

  it('15. should emit garment:deselect event on deselection', () => {
    const interactions = createGarmentInteractions();
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'tank' });
    interactions.selectGarment('tank');

    let deselectData = null;
    interactions.on(INTERACTION_EVENTS.DESELECT, (data) => {
      deselectData = data;
    });

    interactions.deselectGarment();
    assert.ok(deselectData);
    assert.strictEqual(deselectData.garmentId, 'tank');
  });

  it('16. should allow unsubscribing from event listeners', () => {
    const interactions = createGarmentInteractions();
    let count = 0;
    const unsub = interactions.on(INTERACTION_EVENTS.SELECT, () => { count++; });

    interactions.selectGarment('itemA');
    assert.strictEqual(count, 1);

    unsub();
    interactions.selectGarment('itemB');
    assert.strictEqual(count, 1);
  });

  it('17. should trigger hover events when pointer moves over registered mesh', () => {
    const mockThree = createMockThree();
    const interactions = createGarmentInteractions({}, mockThree);
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'blazer', category: 'top' });

    let hoverData = null;
    interactions.on(INTERACTION_EVENTS.HOVER, (data) => {
      hoverData = data;
    });

    interactions.handleHover(mesh);
    assert.ok(hoverData);
    assert.strictEqual(hoverData.garmentId, 'blazer');
    assert.strictEqual(hoverData.state, INTERACTION_STATES.HOVERED);
  });

  it('18. should trigger unhover events when pointer moves away', () => {
    const mockThree = createMockThree();
    const interactions = createGarmentInteractions({}, mockThree);
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'blazer' });
    interactions.handleHover(mesh);

    let unhoverData = null;
    interactions.on(INTERACTION_EVENTS.UNHOVER, (data) => {
      unhoverData = data;
    });

    interactions.handleUnhover(mesh);
    assert.ok(unhoverData);
    assert.strictEqual(unhoverData.garmentId, 'blazer');
    assert.strictEqual(unhoverData.state, INTERACTION_STATES.IDLE);
  });

  it('19. should execute raycasting intersection against registered meshes', () => {
    const mockThree = createMockThree();
    const interactions = createGarmentInteractions({}, mockThree);
    const mockCamera = {};
    const mockDom = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 800 })
    };
    interactions.setCamera(mockCamera);
    interactions.setDomElement(mockDom);

    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'blazer' });

    interactions.raycaster.hits = [{ object: mesh, distance: 2.5 }];
    const hits = interactions.raycast(200, 400);
    assert.strictEqual(hits.length, 1);
    assert.strictEqual(hits[0].object, mesh);
  });

  it('20. should select garment via pointer down raycast hit', () => {
    const mockThree = createMockThree();
    const mockDom = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 800 }),
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    const interactions = createGarmentInteractions({
      camera: {},
      domElement: mockDom
    }, mockThree);

    const mesh = createMockMesh('AvatarShoes');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'sneakers', category: 'shoes' });

    interactions.raycaster.hits = [{ object: mesh }];
    interactions.handlePointerDown({ clientX: 200, clientY: 700 });

    const selected = interactions.getSelectedGarment();
    assert.ok(selected);
    assert.strictEqual(selected.garmentId, 'sneakers');
  });

  it('21. should update pointer coordinates accurately to NDC (-1 to 1)', () => {
    const mockThree = createMockThree();
    const mockDom = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 })
    };
    const interactions = createGarmentInteractions({ domElement: mockDom }, mockThree);

    // Center click: x=100, y=100 -> NDC (0, 0)
    interactions.updatePointerCoordinates(100, 100);
    assert.strictEqual(Math.round(interactions.pointer.x), 0);
    assert.strictEqual(Math.round(interactions.pointer.y), 0);
  });

  it('22. should not throw on pointer events when hover is disabled', () => {
    const interactions = createGarmentInteractions({ enableHover: false });
    assert.doesNotThrow(() => {
      interactions.handlePointerMove({ clientX: 50, clientY: 50 });
    });
  });

  it('23. should not select garment on pointer down when click selection is disabled', () => {
    const mockThree = createMockThree();
    const mockDom = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 800 })
    };
    const interactions = createGarmentInteractions({
      camera: {},
      domElement: mockDom,
      enableClickSelection: false
    }, mockThree);

    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'tank' });
    interactions.raycaster.hits = [{ object: mesh }];

    interactions.handlePointerDown({ clientX: 200, clientY: 400 });
    assert.strictEqual(interactions.getSelectedGarment(), null);
  });

  it('24. should deselect previously selected garment when a new one is selected', () => {
    const interactions = createGarmentInteractions();
    const meshA = createMockMesh('Top');
    const meshB = createMockMesh('Bottom');
    interactions.registerInteractiveMesh(meshA, { garmentId: 'top_piece' });
    interactions.registerInteractiveMesh(meshB, { garmentId: 'bottom_piece' });

    interactions.selectGarment('top_piece');
    assert.strictEqual(interactions.getSelectedGarment().garmentId, 'top_piece');

    interactions.selectGarment('bottom_piece');
    assert.strictEqual(interactions.getSelectedGarment().garmentId, 'bottom_piece');
  });

  it('25. should cleanly detach listeners and clear resources on dispose', () => {
    const mockDom = {
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    const interactions = createGarmentInteractions({ domElement: mockDom });
    const mesh = createMockMesh('AvatarTop');
    interactions.registerInteractiveMesh(mesh, { garmentId: 'tank' });
    interactions.selectGarment('tank');

    interactions.dispose();
    assert.strictEqual(interactions.getSelectedGarment(), null);
    assert.strictEqual(interactions.getRegisteredMeshes().length, 0);
    assert.strictEqual(interactions.camera, null);
    assert.strictEqual(interactions.domElement, null);
  });
});
