/**
 * Woobi - 3D Studio Lighting Module
 * StudioLighting.js - Studio Illumination, Sunlight Shadow Cascades, and Shared Fixtures
 */

import { LIGHTING_PRESETS, DEFAULT_LIGHTING_PRESET } from './LightingPresets.js';

export class StudioLighting {
  constructor(THREE = window.THREE) {
    this.THREE = THREE;
    this.currentPreset = DEFAULT_LIGHTING_PRESET;

    // Light references
    this.ambientLight = null;
    this.keySunlight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.wardrobeSpot = null;
    this.vanitySpot = null;

    this.shadowsEnabled = true;
    this.intensityMultiplier = 1.0;
    this.isDisposed = false;
  }

  build(scene, presetName = DEFAULT_LIGHTING_PRESET) {
    const THREE = this.THREE;
    if (!THREE || !scene) return this;

    const preset = LIGHTING_PRESETS[presetName] || LIGHTING_PRESETS[DEFAULT_LIGHTING_PRESET];
    this.currentPreset = preset.name;

    // 1. Ambient Illumination
    this.ambientLight = new THREE.AmbientLight(preset.ambient.color, preset.ambient.intensity);
    this.ambientLight.name = 'Studio_AmbientLight';
    scene.add(this.ambientLight);

    // 2. Primary Key Sunlight with Soft PCF Shadows
    this.keySunlight = new THREE.DirectionalLight(preset.keySunlight.color, preset.keySunlight.intensity);
    this.keySunlight.name = 'Studio_KeySunlight';
    this.keySunlight.position.set(
      preset.keySunlight.position.x,
      preset.keySunlight.position.y,
      preset.keySunlight.position.z
    );
    this.keySunlight.castShadow = this.shadowsEnabled;

    if (preset.keySunlight.shadow) {
      const s = preset.keySunlight.shadow;
      this.keySunlight.shadow.mapSize.width = s.mapSize;
      this.keySunlight.shadow.mapSize.height = s.mapSize;
      this.keySunlight.shadow.camera.near = s.near;
      this.keySunlight.shadow.camera.far = s.far;
      this.keySunlight.shadow.bias = s.bias;

      const d = s.bounds;
      this.keySunlight.shadow.camera.left = -d;
      this.keySunlight.shadow.camera.right = d;
      this.keySunlight.shadow.camera.top = d;
      this.keySunlight.shadow.camera.bottom = -d;
    }
    scene.add(this.keySunlight);

    // 3. Fill Light (Softens shadows across stage & wardrobe)
    this.fillLight = new THREE.DirectionalLight(preset.fillLight.color, preset.fillLight.intensity);
    this.fillLight.name = 'Studio_FillLight';
    this.fillLight.position.set(
      preset.fillLight.position.x,
      preset.fillLight.position.y,
      preset.fillLight.position.z
    );
    scene.add(this.fillLight);

    // 4. Golden Rim Light (Separates hair and shoulders from background wall)
    this.rimLight = new THREE.DirectionalLight(preset.rimLight.color, preset.rimLight.intensity);
    this.rimLight.name = 'Studio_RimLight';
    this.rimLight.position.set(
      preset.rimLight.position.x,
      preset.rimLight.position.y,
      preset.rimLight.position.z
    );
    scene.add(this.rimLight);

    // 5. Wardrobe Accent Spot Light
    const ws = preset.wardrobeSpot;
    this.wardrobeSpot = new THREE.SpotLight(ws.color, ws.intensity, ws.distance, ws.angle, ws.penumbra, ws.decay);
    this.wardrobeSpot.name = 'Studio_WardrobeSpot';
    this.wardrobeSpot.position.set(ws.position.x, ws.position.y, ws.position.z);
    this.wardrobeSpot.target.position.set(ws.target.x, ws.target.y, ws.target.z);
    scene.add(this.wardrobeSpot);
    scene.add(this.wardrobeSpot.target);

    // 6. Vanity Accent Spot Light
    const vs = preset.vanitySpot;
    this.vanitySpot = new THREE.SpotLight(vs.color, vs.intensity, vs.distance, vs.angle, vs.penumbra, vs.decay);
    this.vanitySpot.name = 'Studio_VanitySpot';
    this.vanitySpot.position.set(vs.position.x, vs.position.y, vs.position.z);
    this.vanitySpot.target.position.set(vs.target.x, vs.target.y, vs.target.z);
    scene.add(this.vanitySpot);
    scene.add(this.vanitySpot.target);

    return this;
  }

  applyPreset(presetName) {
    if (!this.THREE || this.isDisposed) return;
    const preset = LIGHTING_PRESETS[presetName];
    if (!preset) return;

    this.currentPreset = preset.name;

    if (this.ambientLight) {
      this.ambientLight.color.set(preset.ambient.color);
      this.ambientLight.intensity = preset.ambient.intensity * this.intensityMultiplier;
    }

    if (this.keySunlight) {
      this.keySunlight.color.set(preset.keySunlight.color);
      this.keySunlight.intensity = preset.keySunlight.intensity * this.intensityMultiplier;
      this.keySunlight.position.set(
        preset.keySunlight.position.x,
        preset.keySunlight.position.y,
        preset.keySunlight.position.z
      );
    }

    if (this.fillLight) {
      this.fillLight.color.set(preset.fillLight.color);
      this.fillLight.intensity = preset.fillLight.intensity * this.intensityMultiplier;
      this.fillLight.position.set(
        preset.fillLight.position.x,
        preset.fillLight.position.y,
        preset.fillLight.position.z
      );
    }

    if (this.rimLight) {
      this.rimLight.color.set(preset.rimLight.color);
      this.rimLight.intensity = preset.rimLight.intensity * this.intensityMultiplier;
      this.rimLight.position.set(
        preset.rimLight.position.x,
        preset.rimLight.position.y,
        preset.rimLight.position.z
      );
    }

    if (this.wardrobeSpot) {
      this.wardrobeSpot.color.set(preset.wardrobeSpot.color);
      this.wardrobeSpot.intensity = preset.wardrobeSpot.intensity * this.intensityMultiplier;
    }

    if (this.vanitySpot) {
      this.vanitySpot.color.set(preset.vanitySpot.color);
      this.vanitySpot.intensity = preset.vanitySpot.intensity * this.intensityMultiplier;
    }
  }

  setIntensityMultiplier(multiplier) {
    this.intensityMultiplier = Math.max(0.1, Math.min(3.0, multiplier));
    this.applyPreset(this.currentPreset);
  }

  setShadowsEnabled(enabled) {
    this.shadowsEnabled = !!enabled;
    if (this.keySunlight) {
      this.keySunlight.castShadow = this.shadowsEnabled;
    }
  }

  getLightingState() {
    return {
      currentPreset: this.currentPreset,
      intensityMultiplier: this.intensityMultiplier,
      shadowsEnabled: this.shadowsEnabled,
      hasAmbient: !!this.ambientLight,
      hasKeySunlight: !!this.keySunlight,
      hasFillLight: !!this.fillLight,
      hasRimLight: !!this.rimLight,
      hasWardrobeSpot: !!this.wardrobeSpot,
      hasVanitySpot: !!this.vanitySpot
    };
  }

  dispose(scene) {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (scene) {
      if (this.ambientLight) scene.remove(this.ambientLight);
      if (this.keySunlight) scene.remove(this.keySunlight);
      if (this.fillLight) scene.remove(this.fillLight);
      if (this.rimLight) scene.remove(this.rimLight);
      if (this.wardrobeSpot) {
        scene.remove(this.wardrobeSpot);
        if (this.wardrobeSpot.target) scene.remove(this.wardrobeSpot.target);
      }
      if (this.vanitySpot) {
        scene.remove(this.vanitySpot);
        if (this.vanitySpot.target) scene.remove(this.vanitySpot.target);
      }
    }

    // Release shadow map resources
    if (this.keySunlight && this.keySunlight.shadow && this.keySunlight.shadow.map) {
      this.keySunlight.shadow.map.dispose();
    }

    this.ambientLight = null;
    this.keySunlight = null;
    this.fillLight = null;
    this.rimLight = null;
    this.wardrobeSpot = null;
    this.vanitySpot = null;
  }
}
