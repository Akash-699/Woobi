/**
 * Woobi - 3D Studio Avatar Module
 * AvatarController.js - Avatar State, Customization API & Preferences Persistence
 */

import { AVATAR_CONFIG } from './AvatarModel.js';

export class AvatarController {
  constructor(avatarModel) {
    this.model = avatarModel;
    this.avatarConfig = {
      gender: AVATAR_CONFIG.defaultGender,
      skinTone: AVATAR_CONFIG.defaultSkinTone,
      hairStyle: AVATAR_CONFIG.defaultHairStyle,
      hairColor: AVATAR_CONFIG.defaultHairColor,
      proportions: AVATAR_CONFIG.defaultProportions,
      top: AVATAR_CONFIG.defaultTop,
      bottom: AVATAR_CONFIG.defaultBottom,
      shoes: AVATAR_CONFIG.defaultShoes,
      accessories: { ...AVATAR_CONFIG.defaultAccessories }
    };

    this.loadSavedPreferences();
  }

  setSkinTone(hex) {
    if (!hex) return;
    this.avatarConfig.skinTone = hex;
    if (this.model && this.model.materials) {
      this.model.materials.updateSkinTone(hex);
    }
    this.savePreferences();
  }

  setHairColor(hex) {
    if (!hex) return;
    this.avatarConfig.hairColor = hex;
    if (this.model && this.model.materials) {
      this.model.materials.updateHairColor(hex);
    }
    this.savePreferences();
  }

  setHairstyle(styleName) {
    if (!styleName) return;
    this.avatarConfig.hairStyle = styleName;
    this.savePreferences();
  }

  setBodyProportions(preset) {
    if (!preset) return;
    this.avatarConfig.proportions = preset;
    if (this.model && this.model.morphs) {
      this.model.morphs.setBodyProportions(preset);
    }
    this.savePreferences();
  }

  setGenderPresentation(gender) {
    if (!gender) return;
    this.avatarConfig.gender = gender;
    if (this.model && this.model.morphs) {
      this.model.morphs.setGenderPresentation(gender);
    }
    this.savePreferences();
  }

  toggleAccessory(name, isActive) {
    if (!name) return;
    if (!this.avatarConfig.accessories) {
      this.avatarConfig.accessories = {};
    }
    this.avatarConfig.accessories[name] = isActive;
    if (this.model && this.model.morphs) {
      this.model.morphs.toggleAccessory(name, isActive);
    }
    this.savePreferences();
  }

  applyAvatarConfig(cfg) {
    if (!cfg) return;
    if (cfg.gender) this.setGenderPresentation(cfg.gender);
    if (cfg.skinTone) this.setSkinTone(cfg.skinTone);
    if (cfg.hairColor) this.setHairColor(cfg.hairColor);
    if (cfg.hairStyle) this.setHairstyle(cfg.hairStyle);
    if (cfg.proportions) this.setBodyProportions(cfg.proportions);
    if (cfg.accessories) {
      Object.entries(cfg.accessories).forEach(([acc, val]) => {
        this.toggleAccessory(acc, val);
      });
    }
  }

  setTargetRotation(targetY) {
    if (this.model && this.model.animations) {
      this.model.animations.setTargetRotation(targetY);
    }
  }

  addRotation(deltaY) {
    if (this.model && this.model.animations) {
      this.model.animations.addRotation(deltaY);
    }
  }

  loadSavedPreferences() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('seren_avatar_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.avatarConfig = Object.assign(this.avatarConfig, parsed);
        }
      }
    } catch (e) {
      console.warn('AvatarController: Could not read avatar prefs from storage', e);
    }
  }

  savePreferences() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('seren_avatar_prefs', JSON.stringify(this.avatarConfig));
      }
    } catch (e) {
      console.warn('AvatarController: Could not persist avatar prefs', e);
    }
  }

  getAvatarState() {
    return {
      activeType: this.model ? this.model.activeAvatarType : 'uninitialized',
      config: { ...this.avatarConfig },
      proportions: this.model && this.model.morphs ? this.model.morphs.getProportions() : null,
      isGrounded: true,
      elevation: AVATAR_CONFIG.daisElevation
    };
  }

  update(delta, time) {
    if (this.model) {
      this.model.update(delta, time);
    }
  }

  dispose(scene) {
    if (this.model) {
      this.model.dispose(scene);
      this.model = null;
    }
  }
}
