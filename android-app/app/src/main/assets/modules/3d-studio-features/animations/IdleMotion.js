/**
 * Woobi - 3D Studio Features
 * IdleMotion.js - Procedural Secondary Motion Curves (Breathing, Micro-Sway & Natural Posture Dynamics)
 */

export class IdleMotion {
  constructor(options = {}) {
    this.options = Object.assign({
      enabled: true,
      breathingSpeed: 1.6,
      breathingAmplitude: 0.0035,
      swaySpeed: 0.8,
      swayAmplitude: 0.002
    }, options);

    this.baseChestY = 1.22;
    this.baseHeadY = 1.54;
  }

  setEnabled(enabled) {
    this.options.enabled = !!enabled;
  }

  calculateBreath(time) {
    if (!this.options.enabled) return 0;
    return Math.sin(time * this.options.breathingSpeed) * this.options.breathingAmplitude;
  }

  calculateSway(time) {
    if (!this.options.enabled) return 0;
    return Math.sin(time * this.options.swaySpeed) * this.options.swayAmplitude;
  }

  apply(rig, time) {
    if (!rig || !this.options.enabled) return;

    const breath = this.calculateBreath(time);
    const sway = this.calculateSway(time);

    if (rig.chestGroup && rig.chestGroup.position) {
      rig.chestGroup.position.y = this.baseChestY + breath;
      if (rig.chestGroup.rotation) {
        rig.chestGroup.rotation.z = sway * 0.5;
      }
    }

    if (rig.headGroup && rig.headGroup.position) {
      rig.headGroup.position.y = this.baseHeadY + breath * 0.6;
    }
  }
}
