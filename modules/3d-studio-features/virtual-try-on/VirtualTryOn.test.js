/**
 * Woobi - 3D Studio Features
 * VirtualTryOn.test.js - Unit & Integration Test Suite for Virtual Try-On
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord
} from './GarmentCatalog.js';
import { TryOnContract, TRY_ON_EVENTS } from './TryOnContract.js';
import { VirtualTryOn, createVirtualTryOn } from './VirtualTryOn.js';

// Mock Three.js-like color and material objects for testing avatar updates
function createMockAvatarModel() {
  const createColor = (initialHex) => ({
    hex: initialHex,
    setHex(val) { this.hex = val; }
  });

  const topMesh = {
    name: 'AvatarTop',
    scale: {
      x: 1, y: 1, z: 1,
      set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    }
  };

  return {
    materials: {
      tankMat: { color: createColor(0xEDE3D2), roughness: 0.65, metalness: 0.05, needsUpdate: false },
      trouserMat: { color: createColor(0xB8AC96), roughness: 0.60, metalness: 0.05, needsUpdate: false },
      sneakerMat: { color: createColor(0xF7F6F2), roughness: 0.35, metalness: 0.05, needsUpdate: false }
    },
    rig: {
      chestGroup: {
        getObjectByName(name) {
          if (name === 'AvatarTop') {
            return topMesh;
          }
          return null;
        }
      }
    }
  };
}

describe('Virtual Try-On Module - Specification & Catalog', () => {
  it('1. should export all standard garment categories', () => {
    assert.strictEqual(GARMENT_CATEGORIES.TOP, 'top');
    assert.strictEqual(GARMENT_CATEGORIES.BOTTOM, 'bottom');
    assert.strictEqual(GARMENT_CATEGORIES.SHOES, 'shoes');
    assert.strictEqual(GARMENT_CATEGORIES.ACCESSORY, 'accessory');
  });

  it('2. should provide predefined tops in GARMENT_CATALOG', () => {
    assert.ok(GARMENT_CATALOG.tank);
    assert.strictEqual(GARMENT_CATALOG.tank.category, GARMENT_CATEGORIES.TOP);
    assert.ok(GARMENT_CATALOG.blazer);
    assert.strictEqual(GARMENT_CATALOG.blazer.category, GARMENT_CATEGORIES.TOP);
    assert.ok(GARMENT_CATALOG.cardigan);
  });

  it('3. should provide predefined bottoms in GARMENT_CATALOG', () => {
    assert.ok(GARMENT_CATALOG.taupe_wide);
    assert.strictEqual(GARMENT_CATALOG.taupe_wide.category, GARMENT_CATEGORIES.BOTTOM);
    assert.ok(GARMENT_CATALOG.denim);
  });

  it('4. should provide predefined shoes in GARMENT_CATALOG', () => {
    assert.ok(GARMENT_CATALOG.sneakers);
    assert.strictEqual(GARMENT_CATALOG.sneakers.category, GARMENT_CATEGORIES.SHOES);
    assert.ok(GARMENT_CATALOG.loafers);
  });

  it('5. should resolve garment records via getGarmentRecord', () => {
    const record = getGarmentRecord('tank');
    assert.strictEqual(record.id, 'tank');
    assert.strictEqual(record.name, 'Crop Tank');
  });

  it('6. should normalize legacy garment aliases (e.g. wide_linen -> taupe_wide)', () => {
    const record = getGarmentRecord('wide_linen');
    assert.ok(record);
    assert.strictEqual(record.id, 'taupe_wide');
  });

  it('7. should return null for unknown garment IDs in getGarmentRecord', () => {
    assert.strictEqual(getGarmentRecord('non_existent_piece'), null);
  });

  it('8. should adhere to TryOnContract specifications', () => {
    assert.strictEqual(TryOnContract.name, 'VirtualTryOn');
    assert.ok(Array.isArray(TryOnContract.methods));
    assert.ok(TryOnContract.methods.includes('equipGarment'));
    assert.ok(TryOnContract.methods.includes('removeGarment'));
    assert.ok(TryOnContract.methods.includes('getEquippedOutfit'));
  });
});

describe('Virtual Try-On Module - State & Swapping Logic', () => {
  it('9. should instantiate with default outfit configuration', () => {
    const tryOn = createVirtualTryOn();
    const outfit = tryOn.getEquippedOutfit();
    assert.strictEqual(outfit.top, DEFAULT_OUTFIT.top);
    assert.strictEqual(outfit.bottom, DEFAULT_OUTFIT.bottom);
    assert.strictEqual(outfit.shoes, DEFAULT_OUTFIT.shoes);
  });

  it('10. should allow equipping a top by category and id', () => {
    const tryOn = createVirtualTryOn();
    const res = tryOn.equipGarment('top', 'blazer');
    assert.strictEqual(res.success, true);
    assert.strictEqual(tryOn.getEquippedOutfit().top, 'blazer');
  });

  it('11. should allow equipping a garment by passing garment ID alone', () => {
    const tryOn = createVirtualTryOn();
    const res = tryOn.equipGarment('denim');
    assert.strictEqual(res.success, true);
    assert.strictEqual(tryOn.getEquippedOutfit().bottom, 'denim');
  });

  it('12. should reject equipping invalid garment IDs', () => {
    const tryOn = createVirtualTryOn();
    const res = tryOn.equipGarment('top', 'invalid_garment_xyz');
    assert.strictEqual(res.success, false);
    assert.ok(res.error);
  });

  it('13. should correctly report isEquipped for active garments', () => {
    const tryOn = createVirtualTryOn();
    tryOn.equipGarment('top', 'blazer');
    assert.strictEqual(tryOn.isEquipped('blazer'), true);
    assert.strictEqual(tryOn.isEquipped('tank'), false);
  });

  it('14. should return the full garment object via getEquippedGarment', () => {
    const tryOn = createVirtualTryOn();
    tryOn.equipGarment('shoes', 'loafers');
    const equipped = tryOn.getEquippedGarment('shoes');
    assert.ok(equipped);
    assert.strictEqual(equipped.id, 'loafers');
    assert.strictEqual(equipped.name, 'Polished Leather Loafers');
  });

  it('15. should remove equipped garments by category', () => {
    const tryOn = createVirtualTryOn();
    const res = tryOn.removeGarment('top');
    assert.strictEqual(res.success, true);
    assert.strictEqual(tryOn.getEquippedOutfit().top, null);
    assert.strictEqual(tryOn.getEquippedGarment('top'), null);
  });

  it('16. should gracefully handle removal of an empty category', () => {
    const tryOn = createVirtualTryOn();
    tryOn.removeGarment('accessory');
    const res = tryOn.removeGarment('accessory');
    assert.strictEqual(res.success, false);
  });

  it('17. should replace garments smoothly via replaceGarment', () => {
    const tryOn = createVirtualTryOn();
    const res = tryOn.replaceGarment('bottom', 'denim');
    assert.strictEqual(res.success, true);
    assert.strictEqual(tryOn.getEquippedOutfit().bottom, 'denim');
  });

  it('18. should reset to default outfit when resetTryOn is called', () => {
    const tryOn = createVirtualTryOn();
    tryOn.equipGarment('top', 'navy_shirt');
    tryOn.equipGarment('bottom', 'denim');
    tryOn.resetTryOn();
    assert.strictEqual(tryOn.getEquippedOutfit().top, DEFAULT_OUTFIT.top);
    assert.strictEqual(tryOn.getEquippedOutfit().bottom, DEFAULT_OUTFIT.bottom);
  });
});

describe('Virtual Try-On Module - Avatar Synchronization & Events', () => {
  it('19. should fire tryon:equip event when a garment is equipped', () => {
    const tryOn = createVirtualTryOn();
    let emitted = null;
    tryOn.on(TRY_ON_EVENTS.EQUIP, (data) => {
      emitted = data;
    });

    tryOn.equipGarment('top', 'cardigan');
    assert.ok(emitted);
    assert.strictEqual(emitted.garmentId, 'cardigan');
    assert.strictEqual(emitted.category, 'top');
  });

  it('20. should fire tryon:replace event when replacing an equipped item', () => {
    const tryOn = createVirtualTryOn();
    let replaceData = null;
    tryOn.on(TRY_ON_EVENTS.REPLACE, (data) => {
      replaceData = data;
    });

    tryOn.equipGarment('shoes', 'loafers');
    assert.ok(replaceData);
    assert.strictEqual(replaceData.previousId, 'sneakers');
    assert.strictEqual(replaceData.garmentId, 'loafers');
  });

  it('21. should allow unsubscribing from events', () => {
    const tryOn = createVirtualTryOn();
    let count = 0;
    const unsub = tryOn.on(TRY_ON_EVENTS.EQUIP, () => { count++; });

    tryOn.equipGarment('top', 'blazer');
    assert.strictEqual(count, 1);

    unsub();
    tryOn.equipGarment('top', 'tank');
    assert.strictEqual(count, 1);
  });

  it('22. should apply garment material attributes to avatarModel top', () => {
    const mockAvatar = createMockAvatarModel();
    const tryOn = createVirtualTryOn(mockAvatar);

    tryOn.equipGarment('top', 'blazer');
    const blazer = GARMENT_CATALOG.blazer;
    assert.strictEqual(mockAvatar.materials.tankMat.color.hex, blazer.color);
    assert.strictEqual(mockAvatar.materials.tankMat.roughness, blazer.roughness);
    assert.strictEqual(mockAvatar.materials.tankMat.metalness, blazer.metalness);
    assert.strictEqual(mockAvatar.materials.tankMat.needsUpdate, true);
  });

  it('23. should apply mesh scale multipliers on avatar top geometry', () => {
    const mockAvatar = createMockAvatarModel();
    const tryOn = createVirtualTryOn(mockAvatar);

    tryOn.equipGarment('top', 'cardigan');
    const topMesh = mockAvatar.rig.chestGroup.getObjectByName('AvatarTop');
    assert.strictEqual(topMesh.scale.x, GARMENT_CATALOG.cardigan.scaleMultiplier.x);
    assert.strictEqual(topMesh.scale.y, GARMENT_CATALOG.cardigan.scaleMultiplier.y);
  });

  it('24. should apply garment material attributes to avatarModel bottoms', () => {
    const mockAvatar = createMockAvatarModel();
    const tryOn = createVirtualTryOn(mockAvatar);

    tryOn.equipGarment('bottom', 'denim');
    assert.strictEqual(mockAvatar.materials.trouserMat.color.hex, GARMENT_CATALOG.denim.color);
    assert.strictEqual(mockAvatar.materials.trouserMat.roughness, GARMENT_CATALOG.denim.roughness);
  });

  it('25. should apply garment material attributes to avatarModel shoes', () => {
    const mockAvatar = createMockAvatarModel();
    const tryOn = createVirtualTryOn(mockAvatar);

    tryOn.equipGarment('shoes', 'sandals');
    assert.strictEqual(mockAvatar.materials.sneakerMat.color.hex, GARMENT_CATALOG.sandals.color);
  });

  it('26. should clean up listeners and references on dispose', () => {
    const tryOn = createVirtualTryOn(createMockAvatarModel());
    let called = false;
    tryOn.on(TRY_ON_EVENTS.EQUIP, () => { called = true; });

    tryOn.dispose();
    assert.strictEqual(tryOn.avatarModel, null);
    tryOn.equipGarment('top', 'tank');
    assert.strictEqual(called, false);
  });
});
