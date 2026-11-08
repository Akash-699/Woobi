/**
 * Woobi 3D Studio - Vanity Lighting
 * Dedicated lighting controller for the mirror halo LED ring and warm radiance glow.
 */

export class VanityLighting {
  constructor(options = {}) {
    this.color = options.color || 0xFFE8BE;
    this.baseIntensity = options.intensity !== undefined ? options.intensity : 1.4;
    this.distance = options.distance || 3.2;
    this.light = null;
    this.isEnabled = true;
  }

  init(THREE, parentGroup) {
    if (!THREE || !parentGroup || typeof THREE.PointLight === 'undefined') return;

    this.light = new THREE.PointLight(this.color, this.baseIntensity, this.distance);
    this.light.position.set(0, 0, 0.25);
    parentGroup.add(this.light);
  }

  setEnabled(enabled) {
    this.isEnabled = !!enabled;
    if (this.light) {
      this.light.intensity = this.isEnabled ? this.baseIntensity : 0;
    }
  }

  setIntensity(intensity) {
    this.baseIntensity = intensity;
    if (this.light && this.isEnabled) {
      this.light.intensity = intensity;
    }
  }

  dispose(parentGroup) {
    if (this.light) {
      if (parentGroup) {
        parentGroup.remove(this.light);
      }
      if (typeof this.light.dispose === 'function') {
        this.light.dispose();
      }
      this.light = null;
    }
  }
}

export default VanityLighting;
