/**
 * Woobi - 3D Studio Theme Module
 * ThemeMaterials.js - Studio Architecture PBR Material Definitions & Preset Updates
 */

import { THEME_PRESETS, DEFAULT_THEME_PRESET } from './ThemePresets.js';

export class ThemeMaterials {
  constructor(textures = {}, THREE = window.THREE) {
    this.THREE = THREE;
    this.textures = textures || {};
    this.disposables = [];

    this.initMaterials();
  }

  initMaterials(presetName = DEFAULT_THEME_PRESET) {
    const THREE = this.THREE;
    if (!THREE) return;

    const preset = THEME_PRESETS[presetName] || THEME_PRESETS[DEFAULT_THEME_PRESET];

    // 1. Polished Marble Tile Flooring Material
    this.floorMat = new THREE.MeshStandardMaterial({
      map: this.textures.creamMarble || null,
      roughness: preset.floor.roughness,
      metalness: preset.floor.metalness,
      color: preset.floor.color
    });
    this.disposables.push(this.floorMat);

    // 2. Smooth Architectural Wall Plaster Material
    this.wallMat = new THREE.MeshStandardMaterial({
      color: preset.wall.color,
      roughness: preset.wall.roughness,
      metalness: preset.wall.metalness,
      side: THREE.BackSide
    });
    this.disposables.push(this.wallMat);

    // 3. Projected Window Mullion Shadow Material
    this.shadowBarMat = new THREE.MeshBasicMaterial({
      color: preset.windowShadow.color,
      transparent: true,
      opacity: preset.windowShadow.opacity
    });
    this.disposables.push(this.shadowBarMat);

    // 4. Overhead Studio Softbox Fixture Materials
    this.softboxHousingMat = new THREE.MeshStandardMaterial({
      color: 0x1A1816,
      roughness: 0.55
    });
    this.diffuserMat = new THREE.MeshBasicMaterial({
      color: 0xFFFDF8
    });
    this.armMat = new THREE.MeshStandardMaterial({
      color: 0x2A2724,
      metalness: 0.60,
      roughness: 0.40
    });
    this.disposables.push(this.softboxHousingMat, this.diffuserMat, this.armMat);

    // 5. Cinematic Foreground Framing Foliage Leaf Material
    this.fgLeafMat = new THREE.MeshStandardMaterial({
      color: preset.foliage.color,
      roughness: preset.foliage.roughness,
      metalness: preset.foliage.metalness
    });
    this.disposables.push(this.fgLeafMat);
  }

  applyPreset(presetName) {
    if (!this.THREE) return;
    const preset = THEME_PRESETS[presetName];
    if (!preset) return;

    if (this.floorMat) {
      this.floorMat.color.set(preset.floor.color);
      this.floorMat.roughness = preset.floor.roughness;
      this.floorMat.metalness = preset.floor.metalness;
      this.floorMat.needsUpdate = true;
    }

    if (this.wallMat) {
      this.wallMat.color.set(preset.wall.color);
      this.wallMat.roughness = preset.wall.roughness;
      this.wallMat.metalness = preset.wall.metalness;
      this.wallMat.needsUpdate = true;
    }

    if (this.shadowBarMat) {
      this.shadowBarMat.color.set(preset.windowShadow.color);
      this.shadowBarMat.opacity = preset.windowShadow.opacity;
      this.shadowBarMat.needsUpdate = true;
    }

    if (this.fgLeafMat) {
      this.fgLeafMat.color.set(preset.foliage.color);
      this.fgLeafMat.roughness = preset.foliage.roughness;
      this.fgLeafMat.metalness = preset.foliage.metalness;
      this.fgLeafMat.needsUpdate = true;
    }
  }

  dispose() {
    this.disposables.forEach((mat) => {
      if (mat && typeof mat.dispose === 'function') {
        mat.dispose();
      }
    });
    this.disposables = [];
  }
}
