/**
 * Woobi - 3D Studio Features
 * AvatarCustomizer.js - Avatar Customization Orchestrator, Undo/Redo & Storage Coordinator
 */

import {
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG
} from './CustomizationPresets.js';
import { CUSTOMIZER_EVENTS } from './CustomizerContract.js';

export class AvatarCustomizer {
  constructor(avatarModel = null, options = {}) {
    this.avatarModel = avatarModel;
    this.options = Object.assign({
      storageKey: 'seren_avatar_prefs',
      secondaryStorageKey: 'woobi_avatar_prefs',
      maxHistory: 30,
      autoSave: true
    }, options);

    this.currentConfig = {
      gender: DEFAULT_AVATAR_CONFIG.gender,
      skinTone: DEFAULT_AVATAR_CONFIG.skinTone,
      hairStyle: DEFAULT_AVATAR_CONFIG.hairStyle,
      hairColor: DEFAULT_AVATAR_CONFIG.hairColor,
      proportions: DEFAULT_AVATAR_CONFIG.proportions,
      accessories: { ...DEFAULT_AVATAR_CONFIG.accessories }
    };

    this.undoStack = [];
    this.redoStack = [];

    this.listeners = new Map();

    this.loadPreferences();
  }

  setAvatarModel(avatarModel) {
    this.avatarModel = avatarModel;
    this.applyToAvatar(this.currentConfig);
  }

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`AvatarCustomizer error [${event}]:`, e);
        }
      });
    }
  }

  getConfig() {
    return {
      ...this.currentConfig,
      accessories: { ...this.currentConfig.accessories }
    };
  }

  pushHistory() {
    this.undoStack.push(JSON.stringify(this.currentConfig));
    if (this.undoStack.length > this.options.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return false;
    this.redoStack.push(JSON.stringify(this.currentConfig));
    const previous = JSON.parse(this.undoStack.pop());
    this.currentConfig = previous;
    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.UNDO, { config: this.getConfig() });
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  redo() {
    if (!this.canRedo()) return false;
    this.undoStack.push(JSON.stringify(this.currentConfig));
    const next = JSON.parse(this.redoStack.pop());
    this.currentConfig = next;
    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.REDO, { config: this.getConfig() });
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  setSkinTone(hex) {
    if (!hex) return false;
    // Normalize preset ID or hex string
    let resolvedHex = hex;
    const preset = SKIN_TONE_PRESETS.find(p => p.id === hex);
    if (preset) resolvedHex = preset.hex;

    if (this.currentConfig.skinTone === resolvedHex) return true;

    this.pushHistory();
    this.currentConfig.skinTone = resolvedHex;
    this.applyToAvatar({ skinTone: resolvedHex });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'skinTone', value: resolvedHex, config: this.getConfig() });
    return true;
  }

  setHairColor(hex) {
    if (!hex) return false;
    let resolvedHex = hex;
    const preset = HAIR_COLOR_PRESETS.find(p => p.id === hex);
    if (preset) resolvedHex = preset.hex;

    if (this.currentConfig.hairColor === resolvedHex) return true;

    this.pushHistory();
    this.currentConfig.hairColor = resolvedHex;
    this.applyToAvatar({ hairColor: resolvedHex });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'hairColor', value: resolvedHex, config: this.getConfig() });
    return true;
  }

  setHairstyle(styleId) {
    if (!styleId) return false;
    if (this.currentConfig.hairStyle === styleId) return true;

    this.pushHistory();
    this.currentConfig.hairStyle = styleId;
    this.applyToAvatar({ hairStyle: styleId });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'hairStyle', value: styleId, config: this.getConfig() });
    return true;
  }

  setBodyProportions(presetId) {
    if (!presetId) return false;
    if (this.currentConfig.proportions === presetId) return true;

    this.pushHistory();
    this.currentConfig.proportions = presetId;
    this.applyToAvatar({ proportions: presetId });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'proportions', value: presetId, config: this.getConfig() });
    return true;
  }

  setGenderPresentation(gender) {
    if (!gender) return false;
    if (this.currentConfig.gender === gender) return true;

    this.pushHistory();
    this.currentConfig.gender = gender;
    this.applyToAvatar({ gender });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'gender', value: gender, config: this.getConfig() });
    return true;
  }

  toggleAccessory(name, isActive) {
    if (!name) return false;
    const currentVal = !!this.currentConfig.accessories[name];
    const nextVal = isActive !== undefined ? !!isActive : !currentVal;

    if (currentVal === nextVal) return true;

    this.pushHistory();
    this.currentConfig.accessories[name] = nextVal;
    this.applyToAvatar({ accessory: { name, active: nextVal } });
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { field: 'accessories', accessory: name, value: nextVal, config: this.getConfig() });
    return true;
  }

  applyConfig(cfg) {
    if (!cfg) return false;
    this.pushHistory();

    if (cfg.gender) this.currentConfig.gender = cfg.gender;
    if (cfg.skinTone) this.currentConfig.skinTone = cfg.skinTone;
    if (cfg.hairColor) this.currentConfig.hairColor = cfg.hairColor;
    if (cfg.hairStyle) this.currentConfig.hairStyle = cfg.hairStyle;
    if (cfg.proportions) this.currentConfig.proportions = cfg.proportions;
    if (cfg.accessories) {
      this.currentConfig.accessories = { ...this.currentConfig.accessories, ...cfg.accessories };
    }

    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  applyToAvatar(cfg) {
    if (!this.avatarModel) return;

    // 1. Materials: Skin & Hair
    if (this.avatarModel.materials) {
      if (cfg.skinTone && typeof this.avatarModel.materials.updateSkinTone === 'function') {
        this.avatarModel.materials.updateSkinTone(cfg.skinTone);
      }
      if (cfg.hairColor && typeof this.avatarModel.materials.updateHairColor === 'function') {
        this.avatarModel.materials.updateHairColor(cfg.hairColor);
      }
    }

    // 2. Morphs: Proportions, Gender & Accessories
    if (this.avatarModel.morphs) {
      if (cfg.proportions && typeof this.avatarModel.morphs.setBodyProportions === 'function') {
        this.avatarModel.morphs.setBodyProportions(cfg.proportions);
      }
      if (cfg.gender && typeof this.avatarModel.morphs.setGenderPresentation === 'function') {
        this.avatarModel.morphs.setGenderPresentation(cfg.gender);
      }
      if (cfg.accessory && typeof this.avatarModel.morphs.toggleAccessory === 'function') {
        this.avatarModel.morphs.toggleAccessory(cfg.accessory.name, cfg.accessory.active);
      } else if (cfg.accessories) {
        Object.entries(cfg.accessories).forEach(([acc, val]) => {
          this.avatarModel.morphs.toggleAccessory(acc, val);
        });
      }
    }
  }

  resetCustomization() {
    this.pushHistory();
    this.currentConfig = {
      gender: DEFAULT_AVATAR_CONFIG.gender,
      skinTone: DEFAULT_AVATAR_CONFIG.skinTone,
      hairStyle: DEFAULT_AVATAR_CONFIG.hairStyle,
      hairColor: DEFAULT_AVATAR_CONFIG.hairColor,
      proportions: DEFAULT_AVATAR_CONFIG.proportions,
      accessories: { ...DEFAULT_AVATAR_CONFIG.accessories }
    };

    this.applyToAvatar(this.currentConfig);
    if (this.options.autoSave) this.savePreferences();

    this.emit(CUSTOMIZER_EVENTS.RESET, { config: this.getConfig() });
    this.emit(CUSTOMIZER_EVENTS.CHANGE, { config: this.getConfig() });
    return true;
  }

  savePreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.currentConfig);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.secondaryStorageKey, data);
    } catch (e) {
      console.warn('AvatarCustomizer: could not save preferences', e);
    }
  }

  loadPreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.options.storageKey) ||
                  localStorage.getItem(this.options.secondaryStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.currentConfig = Object.assign(this.currentConfig, parsed);
        }
      }
    } catch (e) {
      console.warn('AvatarCustomizer: could not load preferences', e);
    }
  }

  dispose() {
    this.listeners.clear();
    this.undoStack = [];
    this.redoStack = [];
    this.avatarModel = null;
  }
}

export function createAvatarCustomizer(avatarModel = null, options = {}) {
  return new AvatarCustomizer(avatarModel, options);
}
