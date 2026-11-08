/**
 * Woobi - 3D Studio Features
 * AvatarCustomizer.test.js - Unit & Integration Test Suite for Avatar Customization
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG
} from './CustomizationPresets.js';
import { CUSTOMIZER_EVENTS, CustomizerContract } from './CustomizerContract.js';
import { AvatarCustomizer, createAvatarCustomizer } from './AvatarCustomizer.js';

// Mock storage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

function createMockAvatar() {
  return {
    materials: {
      skinTone: null,
      hairColor: null,
      updateSkinTone(hex) { this.skinTone = hex; },
      updateHairColor(hex) { this.hairColor = hex; }
    },
    morphs: {
      proportions: null,
      gender: null,
      accessories: {},
      setBodyProportions(preset) { this.proportions = preset; },
      setGenderPresentation(gender) { this.gender = gender; },
      toggleAccessory(name, val) { this.accessories[name] = val; }
    }
  };
}

describe('Avatar Customization Module - Presets & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('1. should provide diverse skin tone presets', () => {
    assert.ok(SKIN_TONE_PRESETS.length >= 5);
    assert.ok(SKIN_TONE_PRESETS.some(s => s.id === 'alabaster'));
    assert.ok(SKIN_TONE_PRESETS.some(s => s.id === 'golden_beige'));
    assert.ok(SKIN_TONE_PRESETS.some(s => s.id === 'espresso'));
  });

  it('2. should provide hair color presets', () => {
    assert.ok(HAIR_COLOR_PRESETS.length >= 5);
    assert.ok(HAIR_COLOR_PRESETS.some(h => h.id === 'onyx'));
    assert.ok(HAIR_COLOR_PRESETS.some(h => h.id === 'copper'));
    assert.ok(HAIR_COLOR_PRESETS.some(h => h.id === 'platinum'));
  });

  it('3. should provide supported hairstyles', () => {
    assert.ok(HAIR_STYLES.length >= 4);
    assert.ok(HAIR_STYLES.some(h => h.id === 'bun'));
    assert.ok(HAIR_STYLES.some(h => h.id === 'bob'));
  });

  it('4. should provide body proportion presets', () => {
    assert.ok(BODY_PROPORTIONS.length >= 4);
    assert.ok(BODY_PROPORTIONS.some(p => p.id === 'regular'));
    assert.ok(BODY_PROPORTIONS.some(p => p.id === 'tall'));
  });

  it('5. should satisfy CustomizerContract specification', () => {
    assert.strictEqual(CustomizerContract.name, 'AvatarCustomizer');
    assert.ok(Array.isArray(CustomizerContract.methods));
    assert.ok(CustomizerContract.methods.includes('setSkinTone'));
    assert.ok(CustomizerContract.methods.includes('setHairColor'));
    assert.ok(CustomizerContract.methods.includes('undo'));
    assert.ok(CustomizerContract.methods.includes('redo'));
  });
});

describe('Avatar Customization Module - Customization Operations', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('6. should initialize with default configuration', () => {
    const customizer = createAvatarCustomizer();
    const config = customizer.getConfig();
    assert.strictEqual(config.skinTone, DEFAULT_AVATAR_CONFIG.skinTone);
    assert.strictEqual(config.hairColor, DEFAULT_AVATAR_CONFIG.hairColor);
    assert.strictEqual(config.gender, DEFAULT_AVATAR_CONFIG.gender);
  });

  it('7. should update skin tone using preset ID', () => {
    const customizer = createAvatarCustomizer();
    customizer.setSkinTone('espresso');
    const espresso = SKIN_TONE_PRESETS.find(s => s.id === 'espresso');
    assert.strictEqual(customizer.getConfig().skinTone, espresso.hex);
  });

  it('8. should update skin tone using raw hex', () => {
    const customizer = createAvatarCustomizer();
    customizer.setSkinTone('#D1A384');
    assert.strictEqual(customizer.getConfig().skinTone, '#D1A384');
  });

  it('9. should update hair color using preset ID', () => {
    const customizer = createAvatarCustomizer();
    customizer.setHairColor('copper');
    const copper = HAIR_COLOR_PRESETS.find(h => h.id === 'copper');
    assert.strictEqual(customizer.getConfig().hairColor, copper.hex);
  });

  it('10. should update hair color using raw hex', () => {
    const customizer = createAvatarCustomizer();
    customizer.setHairColor('#553322');
    assert.strictEqual(customizer.getConfig().hairColor, '#553322');
  });

  it('11. should update hairstyle', () => {
    const customizer = createAvatarCustomizer();
    customizer.setHairstyle('bob');
    assert.strictEqual(customizer.getConfig().hairStyle, 'bob');
  });

  it('12. should update body proportions', () => {
    const customizer = createAvatarCustomizer();
    customizer.setBodyProportions('tall');
    assert.strictEqual(customizer.getConfig().proportions, 'tall');
  });

  it('13. should update gender presentation', () => {
    const customizer = createAvatarCustomizer();
    customizer.setGenderPresentation('masculine');
    assert.strictEqual(customizer.getConfig().gender, 'masculine');
  });

  it('14. should toggle accessories', () => {
    const customizer = createAvatarCustomizer();
    customizer.toggleAccessory('watch', true);
    assert.strictEqual(customizer.getConfig().accessories.watch, true);

    customizer.toggleAccessory('watch', false);
    assert.strictEqual(customizer.getConfig().accessories.watch, false);
  });

  it('15. should apply multiple configuration fields at once via applyConfig', () => {
    const customizer = createAvatarCustomizer();
    customizer.applyConfig({
      gender: 'masculine',
      proportions: 'athletic',
      skinTone: '#A26F47'
    });
    const cfg = customizer.getConfig();
    assert.strictEqual(cfg.gender, 'masculine');
    assert.strictEqual(cfg.proportions, 'athletic');
    assert.strictEqual(cfg.skinTone, '#A26F47');
  });

  it('16. should reset configuration to default via resetCustomization', () => {
    const customizer = createAvatarCustomizer();
    customizer.setSkinTone('espresso');
    customizer.setHairstyle('pixie');
    customizer.resetCustomization();

    const cfg = customizer.getConfig();
    assert.strictEqual(cfg.skinTone, DEFAULT_AVATAR_CONFIG.skinTone);
    assert.strictEqual(cfg.hairStyle, DEFAULT_AVATAR_CONFIG.hairStyle);
  });
});

describe('Avatar Customization Module - Undo / Redo & History', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('17. should track history and allow undo', () => {
    const customizer = createAvatarCustomizer();
    const initialSkin = customizer.getConfig().skinTone;

    customizer.setSkinTone('espresso');
    assert.strictEqual(customizer.canUndo(), true);

    const undone = customizer.undo();
    assert.strictEqual(undone, true);
    assert.strictEqual(customizer.getConfig().skinTone, initialSkin);
  });

  it('18. should allow redo after undo', () => {
    const customizer = createAvatarCustomizer();
    customizer.setSkinTone('espresso');
    const espressoHex = customizer.getConfig().skinTone;

    customizer.undo();
    assert.strictEqual(customizer.canRedo(), true);

    const redone = customizer.redo();
    assert.strictEqual(redone, true);
    assert.strictEqual(customizer.getConfig().skinTone, espressoHex);
  });

  it('19. should return false when undoing on empty stack', () => {
    const customizer = createAvatarCustomizer();
    assert.strictEqual(customizer.undo(), false);
  });

  it('20. should return false when redoing on empty stack', () => {
    const customizer = createAvatarCustomizer();
    assert.strictEqual(customizer.redo(), false);
  });
});

describe('Avatar Customization Module - Avatar Sync, Events & Storage', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('21. should update avatarModel materials on skinTone change', () => {
    const mockAvatar = createMockAvatar();
    const customizer = createAvatarCustomizer(mockAvatar);

    customizer.setSkinTone('#DEB192');
    assert.strictEqual(mockAvatar.materials.skinTone, '#DEB192');
  });

  it('22. should update avatarModel morphs on proportions change', () => {
    const mockAvatar = createMockAvatar();
    const customizer = createAvatarCustomizer(mockAvatar);

    customizer.setBodyProportions('petite');
    assert.strictEqual(mockAvatar.morphs.proportions, 'petite');
  });

  it('23. should emit customization:change events', () => {
    const customizer = createAvatarCustomizer();
    let changeData = null;
    customizer.on(CUSTOMIZER_EVENTS.CHANGE, (data) => {
      changeData = data;
    });

    customizer.setHairstyle('bob');
    assert.ok(changeData);
    assert.strictEqual(changeData.field, 'hairStyle');
    assert.strictEqual(changeData.value, 'bob');
  });

  it('24. should persist preferences to localStorage under dual keys', () => {
    const customizer = createAvatarCustomizer();
    customizer.setSkinTone('#DEB192');

    const serenRaw = mockStorage.get('seren_avatar_prefs');
    const woobiRaw = mockStorage.get('woobi_avatar_prefs');
    assert.ok(serenRaw);
    assert.ok(woobiRaw);
    assert.strictEqual(JSON.parse(serenRaw).skinTone, '#DEB192');
  });

  it('25. should restore preferences from localStorage on instantiation', () => {
    mockStorage.set('seren_avatar_prefs', JSON.stringify({
      skinTone: '#A26F47',
      hairStyle: 'pixie'
    }));

    const customizer = createAvatarCustomizer();
    const cfg = customizer.getConfig();
    assert.strictEqual(cfg.skinTone, '#A26F47');
    assert.strictEqual(cfg.hairStyle, 'pixie');
  });

  it('26. should clean up listeners and history on dispose', () => {
    const customizer = createAvatarCustomizer();
    customizer.setSkinTone('espresso');

    customizer.dispose();
    assert.strictEqual(customizer.avatarModel, null);
    assert.strictEqual(customizer.canUndo(), false);
  });
});
