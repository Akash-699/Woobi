/**
 * Woobi - 3D Studio Avatar Module
 * AvatarMorphs.js - Body Proportion Presets, Scaling, Gender Presentation, and Grounding Enforcer
 */

export const PROPORTION_PRESETS = {
  regular: { scaleX: 1.00, scaleY: 1.00 },
  slim_fit: { scaleX: 0.92, scaleY: 1.02, scaleZ: 0.90 },
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
    this.bodyFat = 25; // 0 to 100 scale (25 = slim & fit)
    this.waistDefinition = 70; // 0 to 100 scale
    this.daisElevation = 0.080; // 8cm stage elevation
  }

  setBodyProportions(presetName) {
    const preset = PROPORTION_PRESETS[presetName] || PROPORTION_PRESETS.regular;
    this.currentPreset = presetName in PROPORTION_PRESETS ? presetName : 'regular';

    if (this.avatarRoot) {
      this.avatarRoot.scale.set(preset.scaleX, preset.scaleY, preset.scaleZ || preset.scaleX);
      this.avatarRoot.position.y = this.daisElevation;
    }

    return preset;
  }

  setBodyComposition({ bodyFat, waistDefinition } = {}) {
    if (typeof bodyFat !== 'undefined') this.bodyFat = Math.max(0, Math.min(100, Number(bodyFat)));
    if (typeof waistDefinition !== 'undefined') this.waistDefinition = Math.max(0, Math.min(100, Number(waistDefinition)));
    return this.applyComposition();
  }

  applyComposition() {
    const preset = PROPORTION_PRESETS[this.currentPreset] || PROPORTION_PRESETS.regular;
    const fatMultiplier = 0.86 + (this.bodyFat / 100) * 0.36;
    const waistMultiplier = 1.08 - (this.waistDefinition / 100) * 0.16;

    const baseZ = preset.scaleZ || preset.scaleX;
    const finalX = preset.scaleX * fatMultiplier * waistMultiplier;
    const finalZ = baseZ * fatMultiplier * (waistMultiplier * 0.95);
    const finalY = preset.scaleY;

    if (this.avatarRoot) {
      this.avatarRoot.scale.set(finalX, finalY, finalZ);
      this.avatarRoot.position.y = this.daisElevation;
    }

    return { scaleX: finalX, scaleY: finalY, scaleZ: finalZ };
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
      bodyFat: this.bodyFat,
      waistDefinition: this.waistDefinition,
      scale: this.avatarRoot ? { ...this.avatarRoot.scale } : { x: 1, y: 1, z: 1 },
      elevation: this.daisElevation
    };
  }
}
