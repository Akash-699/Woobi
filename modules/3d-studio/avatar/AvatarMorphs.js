/**
 * Woobi - 3D Studio Avatar Module
 * AvatarMorphs.js - Body Proportion Presets, Scaling, Gender Presentation, and Grounding Enforcer
 */

export const PROPORTION_PRESETS = {
  regular: { scaleX: 1.00, scaleY: 1.00 },
  petite: { scaleX: 0.94, scaleY: 0.94 },
  tall: { scaleX: 0.98, scaleY: 1.06 },
  athletic: { scaleX: 1.05, scaleY: 1.02 },
  curvy: { scaleX: 1.08, scaleY: 1.00 }
};

export class AvatarMorphs {
  constructor(avatarRoot, rig = null) {
    this.avatarRoot = avatarRoot;
    this.rig = rig;
    this.currentPreset = 'regular';
    this.currentGender = 'female';
    this.daisElevation = 0.080; // 8cm stage elevation
  }

  setBodyProportions(presetName) {
    const preset = PROPORTION_PRESETS[presetName] || PROPORTION_PRESETS.regular;
    this.currentPreset = presetName in PROPORTION_PRESETS ? presetName : 'regular';

    if (this.avatarRoot) {
      this.avatarRoot.scale.set(preset.scaleX, preset.scaleY, preset.scaleX);
      // Strictly maintain dais elevation
      this.avatarRoot.position.y = this.daisElevation;
    }

    return preset;
  }

  setGenderPresentation(gender) {
    this.currentGender = gender;
    if (gender === 'masculine') {
      return this.setBodyProportions('athletic');
    } else {
      return this.setBodyProportions('regular');
    }
  }

  toggleAccessory(name, isActive) {
    if (!this.rig || !this.rig.accessories) return;

    if (name === 'earrings' && this.rig.accessories.earrings) {
      this.rig.accessories.earrings.forEach((earring) => {
        earring.visible = isActive;
      });
    }
  }

  getProportions() {
    return {
      preset: this.currentPreset,
      gender: this.currentGender,
      scale: this.avatarRoot ? { ...this.avatarRoot.scale } : { x: 1, y: 1, z: 1 },
      elevation: this.daisElevation
    };
  }
}
