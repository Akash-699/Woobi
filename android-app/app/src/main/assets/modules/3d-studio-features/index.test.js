/**
 * Woobi - 3D Studio Features
 * index.test.js - Integration Test Suite for Root Features Entry Point & StudioFeatures Orchestrator
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  StudioFeatures,
  createStudioFeatures,
  StudioFeaturesContract,
  VirtualTryOn,
  GarmentInteractions,
  RecommendationEngine,
  AvatarCustomizer,
  PoseController,
  SavedLooksManager,
  SmartColourMatcher,
  createColourMatcher,
  ColourSelectionInterface,
  ColourTheory,
  GARMENT_CATALOG,
  STUDIO_POSES,
  SKIN_TONE_PRESETS,
  OCCASIONS
} from './index.js';

describe('Root 3D Studio Features Module - Unified Exports', () => {
  it('1. should export all submodule classes and factories', () => {
    assert.ok(VirtualTryOn);
    assert.ok(GarmentInteractions);
    assert.ok(RecommendationEngine);
    assert.ok(AvatarCustomizer);
    assert.ok(PoseController);
    assert.ok(SavedLooksManager);
    assert.ok(SmartColourMatcher);
    assert.ok(createColourMatcher);
    assert.ok(ColourSelectionInterface);
    assert.ok(ColourTheory);
  });

  it('2. should export standard constants and catalogs across submodules', () => {
    assert.ok(GARMENT_CATALOG.tank);
    assert.ok(STUDIO_POSES.EDITORIAL);
    assert.ok(SKIN_TONE_PRESETS.length > 0);
    assert.ok(OCCASIONS.BUSINESS);
  });

  it('3. should provide backward-compatible StudioFeaturesContract', () => {
    assert.ok(StudioFeaturesContract.tryOn);
    assert.ok(StudioFeaturesContract.interactions);
    assert.ok(StudioFeaturesContract.recommendations);
    assert.ok(StudioFeaturesContract.customizer);
    assert.ok(StudioFeaturesContract.animations);
    assert.ok(StudioFeaturesContract.savedLooks);
    assert.ok(StudioFeaturesContract.colourMatching);
  });

  it('4. should instantiate StudioFeatures orchestrator with colourMatcher', () => {
    const features = createStudioFeatures();
    assert.ok(features);
    assert.ok(features.tryOn);
    assert.ok(features.interactions);
    assert.ok(features.recommendations);
    assert.ok(features.customizer);
    assert.ok(features.animations);
    assert.ok(features.savedLooks);
    assert.ok(features.colourMatcher);

    const matchRes = features.colourMatcher.analyzeOutfit({
      shirt: 'Crisp White',
      pants: 'Midnight Navy',
      shoes: 'Espresso Brown'
    });
    assert.strictEqual(matchRes.rating, 'Excellent');
    assert.ok(matchRes.score >= 85);
  });

  it('5. should coordinate look re-equipping between savedLooks and tryOn', () => {
    const features = createStudioFeatures();
    const saveRes = features.savedLooks.saveLook('Test Outfit', {
      top: 'blazer',
      bottom: 'denim',
      shoes: 'loafers'
    });

    const reEquipRes = features.savedLooks.reEquipLook(
      saveRes.look.id,
      features.tryOn,
      features.customizer
    );

    assert.strictEqual(reEquipRes.success, true);
    assert.strictEqual(features.tryOn.getEquippedOutfit().top, 'blazer');
    assert.strictEqual(features.tryOn.getEquippedOutfit().bottom, 'denim');
    assert.strictEqual(features.tryOn.getEquippedOutfit().shoes, 'loafers');
  });

  it('6. should clean up all 6 submodules on dispose()', () => {
    const features = createStudioFeatures();
    assert.doesNotThrow(() => {
      features.dispose();
    });
    assert.strictEqual(features.studio3d, null);
  });
});
