/**
 * Woobi - 3D Studio Theme Module
 * StudioTheme.js - Room Architecture, Curved Back Wall, Floor, Window Shadows & Environment Atmosphere
 */

import { THEME_PRESETS, DEFAULT_THEME_PRESET, COLOR_PALETTE } from './ThemePresets.js';
import { ThemeMaterials } from './ThemeMaterials.js';

export class StudioTheme {
  constructor(THREE = window.THREE) {
    this.THREE = THREE;
    this.currentPreset = DEFAULT_THEME_PRESET;

    this.group = null;
    this.materials = null;
    this.floor = null;
    this.backWall = null;
    this.windowShadowGroup = null;
    this.softboxGroup = null;
    this.foliageGroup = null;

    this.disposables = [];
    this.isDisposed = false;
  }

  build(scene, textures = {}, presetName = DEFAULT_THEME_PRESET, THREE = this.THREE) {
    if (THREE) this.THREE = THREE;
    const _THREE = this.THREE;
    if (!_THREE || !scene) return this;

    const preset = THEME_PRESETS[presetName] || THEME_PRESETS[DEFAULT_THEME_PRESET];
    this.currentPreset = preset.name;

    // 1. Initialize PBR Materials
    this.materials = new ThemeMaterials(textures, _THREE);
    this.materials.initMaterials(this.currentPreset);

    // 2. Setup Scene Background & Atmospheric Fog
    scene.background = new _THREE.Color(preset.bgScene);
    scene.fog = new _THREE.Fog(preset.fog.color, preset.fog.near, preset.fog.far);

    // Root Group
    this.group = new _THREE.Group();
    this.group.name = 'StudioTheme_ArchitectureGroup';

    // 3. Polished Marble Tile Flooring (28x28m extended spacious layout)
    const floorGeo = new _THREE.PlaneGeometry(28, 28);
    this.floor = new _THREE.Mesh(floorGeo, this.materials.floorMat);
    this.floor.name = 'Studio_Floor';
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
    this.floor.receiveShadow = true;
    this.group.add(this.floor);
    this.disposables.push(floorGeo);

    // 4. Smooth Curved Architectural Back Wall (Cylinder radius 12.0m, height 8.0m)
    const wallGeo = new _THREE.CylinderGeometry(12.0, 12.0, 8.0, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
    this.backWall = new _THREE.Mesh(wallGeo, this.materials.wallMat);
    this.backWall.name = 'Studio_BackWall';
    this.backWall.position.set(0, 4.0, 8.2);
    this.backWall.rotation.y = Math.PI; // Orient curved wall behind avatar towards negative Z
    this.backWall.receiveShadow = false; // Smooth back wall illumination without shadow map frustum clipping
    this.group.add(this.backWall);
    this.disposables.push(wallGeo);

    // 5. Projected Window Mullion Sunlight Shadow on Wall/Floor
    this.windowShadowGroup = new _THREE.Group();
    this.windowShadowGroup.name = 'Studio_WindowShadow';
    this.windowShadowGroup.position.set(1.4, 2.1, -1.8);
    this.windowShadowGroup.rotation.set(-0.25, 0.45, -0.2);

    for (let w = 0; w < 4; w++) {
      const paneGeo = new _THREE.PlaneGeometry(0.38, 0.58);
      const pane = new _THREE.Mesh(paneGeo, this.materials.shadowBarMat);
      pane.position.set((w % 2 === 0 ? -0.22 : 0.22), (w < 2 ? 0.32 : -0.32), 0);
      this.windowShadowGroup.add(pane);
      this.disposables.push(paneGeo);
    }
    this.group.add(this.windowShadowGroup);

    // 6. Overhead Studio Softbox Light Fixture on Arm (Top Left matching reference)
    this.softboxGroup = new _THREE.Group();
    this.softboxGroup.name = 'Studio_SoftboxFixture';
    this.softboxGroup.position.set(-2.15, 2.95, 1.10);
    this.softboxGroup.rotation.set(0.38, 0.46, -0.24);

    const housingGeo = new _THREE.BoxGeometry(0.34, 0.48, 0.22);
    const softboxHousing = new _THREE.Mesh(housingGeo, this.materials.softboxHousingMat);
    this.softboxGroup.add(softboxHousing);
    this.disposables.push(housingGeo);

    const diffuserGeo = new _THREE.PlaneGeometry(0.31, 0.45);
    const diffuser = new _THREE.Mesh(diffuserGeo, this.materials.diffuserMat);
    diffuser.position.set(0, 0, 0.112);
    this.softboxGroup.add(diffuser);
    this.disposables.push(diffuserGeo);

    // Local Softbox Glow Light
    const softboxGlow = new _THREE.PointLight(0xFFF9EE, 0.90, 3.8);
    softboxGlow.name = 'Studio_SoftboxGlow';
    softboxGlow.position.set(0, 0, 0.36);
    this.softboxGroup.add(softboxGlow);

    const armGeo = new _THREE.CylinderGeometry(0.012, 0.012, 0.38, 12);
    const arm = new _THREE.Mesh(armGeo, this.materials.armMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, 0.12, -0.24);
    this.softboxGroup.add(arm);
    this.disposables.push(armGeo);

    this.group.add(this.softboxGroup);

    // 7. Cinematic Foreground Framing Foliage
    // Kept in hierarchy for contract specification, but hidden (visible = false)
    // to eliminate the dark strip artifacts on the floor when zooming out fully
    this.foliageGroup = new _THREE.Group();
    this.foliageGroup.name = 'Studio_FramingFoliage';
    this.foliageGroup.position.set(-1.85, 0.15, 2.40);
    this.foliageGroup.visible = false;

    for (let l = 0; l < 4; l++) {
      const leafGeo = new _THREE.SphereGeometry(0.12, 12, 12);
      const fgLeaf = new _THREE.Mesh(leafGeo, this.materials.fgLeafMat);
      fgLeaf.scale.set(1.6, 0.18, 0.85);
      fgLeaf.rotation.set(-0.3 + l * 0.2, 0.5 + l * 0.3, -0.4);
      fgLeaf.position.set(l * 0.08, l * 0.12, -l * 0.06);
      fgLeaf.visible = false;
      this.foliageGroup.add(fgLeaf);
      this.disposables.push(leafGeo);
    }
    this.group.add(this.foliageGroup);

    // Mount to Scene
    scene.add(this.group);

    return this;
  }

  applyTheme(presetName, scene) {
    if (!this.THREE || this.isDisposed) return;
    const preset = THEME_PRESETS[presetName];
    if (!preset) return;

    this.currentPreset = preset.name;

    // Update scene background and fog
    if (scene) {
      if (scene.background && scene.background.set) {
        scene.background.set(preset.bgScene);
      }
      if (scene.fog) {
        if (scene.fog.color && scene.fog.color.set) {
          scene.fog.color.set(preset.fog.color);
        }
        scene.fog.near = preset.fog.near;
        scene.fog.far = preset.fog.far;
      }
    }

    // Update architectural materials
    if (this.materials) {
      this.materials.applyPreset(presetName);
    }
  }

  getThemeState() {
    return {
      currentPreset: this.currentPreset,
      availablePresets: Object.keys(THEME_PRESETS),
      colorPalette: { ...COLOR_PALETTE },
      isMounted: !!this.group,
      hasFloor: !!this.floor,
      hasBackWall: !!this.backWall,
      hasWindowShadow: !!this.windowShadowGroup,
      hasSoftbox: !!this.softboxGroup,
      hasFoliage: !!this.foliageGroup
    };
  }

  dispose(scene) {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Remove from scene
    if (scene && this.group) {
      scene.remove(this.group);
    }

    // Dispose geometries
    this.disposables.forEach((geo) => {
      if (geo && typeof geo.dispose === 'function') {
        geo.dispose();
      }
    });
    this.disposables = [];

    // Dispose materials
    if (this.materials) {
      this.materials.dispose();
      this.materials = null;
    }

    this.group = null;
    this.floor = null;
    this.backWall = null;
    this.windowShadowGroup = null;
    this.softboxGroup = null;
    this.foliageGroup = null;
  }
}
