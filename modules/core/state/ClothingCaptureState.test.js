/**
 * Woobi - Core State Module
 * ClothingCaptureState.test.js - Unit tests for clothing capture limits, categories, and slot management
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  ClothingCaptureState,
  CLOTHING_CATEGORIES,
  CATEGORY_LIMITS,
  TOTAL_LIMIT,
  CAPTURE_EVENTS
} from './ClothingCaptureState.js';

describe('ClothingCaptureState Engine', () => {
  let state;

  beforeEach(() => {
    state = new ClothingCaptureState();
  });

  test('Initializes with zero captured photos and correct limits', () => {
    const summary = state.getSlotSummary();
    assert.equal(summary.shirt.count, 0);
    assert.equal(summary.shirt.max, 7);
    assert.equal(summary.shirt.remaining, 7);
    assert.equal(summary.shirt.isFull, false);

    assert.equal(summary.pant.count, 0);
    assert.equal(summary.pant.max, 7);
    assert.equal(summary.pant.remaining, 7);
    assert.equal(summary.pant.isFull, false);

    assert.equal(summary.shoe.count, 0);
    assert.equal(summary.shoe.max, 2);
    assert.equal(summary.shoe.remaining, 2);
    assert.equal(summary.shoe.isFull, false);

    assert.equal(summary.total.count, 0);
    assert.equal(summary.total.max, 16);
    assert.equal(summary.total.remaining, 16);
    assert.equal(summary.total.isFull, false);
  });

  test('Allows adding up to 7 shirts and strictly rejects the 8th', () => {
    state.setActiveCategory('shirt');

    for (let i = 1; i <= 7; i++) {
      assert.equal(state.canAdd('shirt'), true);
      const res = state.addConfirmedPhoto('shirt', `data:image/jpeg;base64,shirt_${i}`, { name: `Shirt ${i}` });
      assert.equal(res.success, true);
      assert.equal(state.getRemainingSlots('shirt'), 7 - i);
    }

    assert.equal(state.getPhotos('shirt').length, 7);
    assert.equal(state.canAdd('shirt'), false);
    assert.equal(state.getRemainingSlots('shirt'), 0);

    // Attempting to exceed 7 shirts must be rejected
    const excess = state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,shirt_8');
    assert.equal(excess.success, false);
    assert.match(excess.error, /Maximum limit of 7 reached/);
    assert.equal(state.getPhotos('shirt').length, 7);
  });

  test('Allows adding up to 7 pants and strictly rejects the 8th', () => {
    state.setActiveCategory('pant');

    for (let i = 1; i <= 7; i++) {
      assert.equal(state.canAdd('pant'), true);
      const res = state.addConfirmedPhoto('pant', `data:image/jpeg;base64,pant_${i}`, { name: `Pant ${i}` });
      assert.equal(res.success, true);
      assert.equal(state.getRemainingSlots('pant'), 7 - i);
    }

    assert.equal(state.getPhotos('pant').length, 7);
    assert.equal(state.canAdd('pant'), false);
    assert.equal(state.getRemainingSlots('pant'), 0);

    // Attempting to exceed 7 pants must be rejected
    const excess = state.addConfirmedPhoto('pant', 'data:image/jpeg;base64,pant_8');
    assert.equal(excess.success, false);
    assert.match(excess.error, /Maximum limit of 7 reached/);
    assert.equal(state.getPhotos('pant').length, 7);
  });

  test('Allows adding up to 2 shoes and strictly rejects the 3rd', () => {
    state.setActiveCategory('shoe');

    for (let i = 1; i <= 2; i++) {
      assert.equal(state.canAdd('shoe'), true);
      const res = state.addConfirmedPhoto('shoe', `data:image/jpeg;base64,shoe_${i}`, { name: `Shoe ${i}` });
      assert.equal(res.success, true);
      assert.equal(state.getRemainingSlots('shoe'), 2 - i);
    }

    assert.equal(state.getPhotos('shoe').length, 2);
    assert.equal(state.canAdd('shoe'), false);
    assert.equal(state.getRemainingSlots('shoe'), 0);

    // Attempting to exceed 2 shoes must be rejected
    const excess = state.addConfirmedPhoto('shoe', 'data:image/jpeg;base64,shoe_3');
    assert.equal(excess.success, false);
    assert.match(excess.error, /Maximum limit of 2 reached/);
    assert.equal(state.getPhotos('shoe').length, 2);
  });

  test('Switching categories retains previously confirmed items', () => {
    // Add 2 shirts
    state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,shirt_1');
    state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,shirt_2');

    // Switch to pant
    state.setActiveCategory('pant');
    state.addConfirmedPhoto('pant', 'data:image/jpeg;base64,pant_1');

    // Switch to shoe
    state.setActiveCategory('shoe');
    state.addConfirmedPhoto('shoe', 'data:image/jpeg;base64,shoe_1');

    // Switch back to shirt
    state.setActiveCategory('shirt');

    // Check that all confirmed photos are intact
    assert.equal(state.getPhotos('shirt').length, 2);
    assert.equal(state.getPhotos('pant').length, 1);
    assert.equal(state.getPhotos('shoe').length, 1);
    assert.equal(state.getTotalCount(), 4);

    const summary = state.getSlotSummary();
    assert.equal(summary.shirt.remaining, 5);
    assert.equal(summary.pant.remaining, 6);
    assert.equal(summary.shoe.remaining, 1);
    assert.equal(summary.total.count, 4);
  });

  test('Removing a photo frees its slot and allows replacement', () => {
    state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,s1', { name: 'S1' });
    const res2 = state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,s2', { name: 'S2' });
    assert.equal(state.getRemainingSlots('shirt'), 5);

    // Remove s2
    const removedRes = state.removePhoto('shirt', res2.item.id);
    assert.equal(removedRes.success, true);
    assert.equal(removedRes.freedSlot, true);
    assert.equal(state.getRemainingSlots('shirt'), 6);
    assert.equal(state.getPhotos('shirt').length, 1);

    // Replace with a new photo
    const replaced = state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,s_new', { name: 'S New' });
    assert.equal(replaced.success, true);
    assert.equal(state.getPhotos('shirt').length, 2);
    assert.equal(state.getRemainingSlots('shirt'), 5);
  });

  test('Reaching absolute maximum capacity (7 + 7 + 2 = 16)', () => {
    for (let i = 0; i < 7; i++) state.addConfirmedPhoto('shirt', `data:img/shirt_${i}`);
    for (let i = 0; i < 7; i++) state.addConfirmedPhoto('pant', `data:img/pant_${i}`);
    for (let i = 0; i < 2; i++) state.addConfirmedPhoto('shoe', `data:img/shoe_${i}`);

    const summary = state.getSlotSummary();
    assert.equal(summary.total.count, 16);
    assert.equal(summary.total.remaining, 0);
    assert.equal(summary.total.isFull, true);
    assert.equal(summary.shirt.isFull, true);
    assert.equal(summary.pant.isFull, true);
    assert.equal(summary.shoe.isFull, true);
  });

  test('Exports confirmed photos to standard Woobi wardrobe item schema', () => {
    state.addConfirmedPhoto('shirt', 'data:image/jpeg;base64,shirt_a', { name: 'Linen Shirt' });
    state.addConfirmedPhoto('pant', 'data:image/jpeg;base64,pant_a', { name: 'Chino Pant' });
    state.addConfirmedPhoto('shoe', 'data:image/jpeg;base64,shoe_a', { name: 'Sneakers' });

    const exported = state.exportToWardrobeItems();
    assert.equal(exported.length, 3);

    const shirt = exported.find(i => i.subCategory === 'Shirt');
    assert.ok(shirt);
    assert.equal(shirt.name, 'Linen Shirt');
    assert.equal(shirt.category, 'Tops');
    assert.equal(shirt.condition, 'clean');
    assert.equal(shirt.fit, 'perfect');

    const pant = exported.find(i => i.subCategory === 'Pant');
    assert.ok(pant);
    assert.equal(pant.name, 'Chino Pant');
    assert.equal(pant.category, 'Bottoms');
    assert.equal(pant.condition, 'clean');

    const shoe = exported.find(i => i.subCategory === 'Shoe');
    assert.ok(shoe);
    assert.equal(shoe.name, 'Sneakers');
    assert.equal(shoe.category, 'Shoes');
    assert.equal(shoe.condition, 'clean');
  });

  test('Emits events on update, confirmation, removal, and clearing', () => {
    let confirmedCount = 0;
    let removedCount = 0;
    let updateCount = 0;

    state.on(CAPTURE_EVENTS.CONFIRMED, () => confirmedCount++);
    state.on(CAPTURE_EVENTS.REMOVED, () => removedCount++);
    state.on(CAPTURE_EVENTS.UPDATED, () => updateCount++);

    const res = state.addConfirmedPhoto('shirt', 'data:img');
    assert.equal(confirmedCount, 1);
    assert.ok(updateCount >= 1);

    state.removePhoto('shirt', res.item.id);
    assert.equal(removedCount, 1);

    state.clearAll();
    assert.equal(state.getTotalCount(), 0);
  });
});

