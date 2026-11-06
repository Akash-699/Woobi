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
    this.backWall.position.set(0, 4.0, 7.0);
    this.backWall.rotation.y = Math.PI; // Orient curved wall behind avatar towards negative Z
    this.backWall.receiveShadow = false; // Smooth back wall illumination without shadow map frustum clipping
    this.group.add(this.backWall);
    this.disposables.push(wallGeo);

    // 4.5. Opposing Architectural Studio Wall & Room Enclosure (Completing the 360° Room)
    // Closes the front 198° of the room cylinder so reflections in the vanity mirror show a complete, finished room
    const frontWallGeo = new _THREE.CylinderGeometry(12.0, 12.0, 8.0, 48, 1, true, -Math.PI * 0.55, Math.PI * 1.1);
    this.frontWall = new _THREE.Mesh(frontWallGeo, this.materials.frontWallMat || this.materials.wallMat);
    this.frontWall.name = 'Studio_FrontWall';
    this.frontWall.position.set(0, 4.0, 7.0);
    this.frontWall.receiveShadow = false;
    this.group.add(this.frontWall);
    this.disposables.push(frontWallGeo);

    // 4.6. Architectural Studio Ceiling
    const ceilingGeo = (typeof _THREE.CircleGeometry === 'function')
      ? new _THREE.CircleGeometry(12.0, 48)
      : new _THREE.CylinderGeometry(12.0, 12.0, 0.05, 32);
    this.ceiling = new _THREE.Mesh(ceilingGeo, this.materials.ceilingMat || this.materials.wallMat);
    this.ceiling.name = 'Studio_Ceiling';
    this.ceiling.rotation.x = Math.PI / 2;
    this.ceiling.position.set(0, 8.0, 7.0);
    this.group.add(this.ceiling);
    this.disposables.push(ceilingGeo);

    // 4.7. Baseboard Skirting Moulding
    const baseboardGeo = new _THREE.CylinderGeometry(11.96, 11.96, 0.22, 64, 1, true);
    const baseboardMat = new _THREE.MeshStandardMaterial({ color: 0x362518, roughness: 0.5, side: _THREE.BackSide });
    this.baseboard = new _THREE.Mesh(baseboardGeo, baseboardMat);
    this.baseboard.name = 'Studio_Baseboard';
    this.baseboard.position.set(0, 0.11, 7.0);
    this.group.add(this.baseboard);
    this.disposables.push(baseboardGeo, baseboardMat);

    // 4.8. Opposing French Loft Studio Windows & Architecture (Reflected in Vanity Mirror)
    this.opposingArchitecture = new _THREE.Group();
    this.opposingArchitecture.name = 'Studio_OpposingArchitecture';
    this.opposingArchitecture.position.set(-4.6, 3.6, 10.3);
    this.opposingArchitecture.rotation.y = 0.38;

    // Window frame
    const winFrameGeo = new _THREE.BoxGeometry(4.2, 5.8, 0.08);
    const winFrameMat = new _THREE.MeshStandardMaterial({ color: 0x221D18, roughness: 0.5 });
    const winFrame = new _THREE.Mesh(winFrameGeo, winFrameMat);
    this.opposingArchitecture.add(winFrame);
    this.disposables.push(winFrameGeo, winFrameMat);

    // Translucent soft sky glow panes
    const winPaneGeo = new _THREE.PlaneGeometry(3.9, 5.5);
    const winPaneMat = new _THREE.MeshBasicMaterial({ color: 0xFDF8ED, transparent: true, opacity: 0.88 });
    const winPane = new _THREE.Mesh(winPaneGeo, winPaneMat);
    winPane.position.z = 0.045;
    this.opposingArchitecture.add(winPane);
    this.disposables.push(winPaneGeo, winPaneMat);

    // Window mullions (3 vertical, 4 horizontal)
    for (let c = -1; c <= 1; c++) {
      const vMullGeo = new _THREE.BoxGeometry(0.04, 5.5, 0.06);
      const vMull = new _THREE.Mesh(vMullGeo, winFrameMat);
      vMull.position.set(c * 0.95, 0, 0.05);
      this.opposingArchitecture.add(vMull);
      this.disposables.push(vMullGeo);
    }
    for (let r = -2; r <= 2; r++) {
      const hMullGeo = new _THREE.BoxGeometry(3.9, 0.04, 0.06);
      const hMull = new _THREE.Mesh(hMullGeo, winFrameMat);
      hMull.position.set(0, r * 0.95, 0.05);
      this.opposingArchitecture.add(hMull);
      this.disposables.push(hMullGeo);
    }

    // Warm ambient light from window
    const winLight = (typeof _THREE.DirectionalLight === 'function')
      ? new _THREE.DirectionalLight(0xFFF0D6, 0.45)
      : (typeof _THREE.PointLight === 'function' ? new _THREE.PointLight(0xFFF0D6, 0.45, 10) : null);
    if (winLight) {
      winLight.position.set(0, 0, 1.0);
      this.opposingArchitecture.add(winLight);
    }

    // Opposing Wall Studio Console & Decor
    const consoleGeo = new _THREE.BoxGeometry(1.8, 0.72, 0.42);
    const consoleMat = new _THREE.MeshStandardMaterial({ color: 0x483220, roughness: 0.45 });
    const consoleMesh = new _THREE.Mesh(consoleGeo, consoleMat);
    consoleMesh.position.set(-1.8, -2.4, 0.25);
    this.opposingArchitecture.add(consoleMesh);
    this.disposables.push(consoleGeo, consoleMat);

    this.group.add(this.opposingArchitecture);

    // 5. Projected Window Mullion Sunlight Shadow on Wall/Floor
    this.windowShadowGroup = new _THREE.Group();
    this.windowShadowGroup.name = 'Studio_WindowShadow';
    this.windowShadowGroup.position.set(1.4, 2.1, -1.8);
    this.windowShadowGroup.rotation.set(-0.25, 0.45, -0.2);
    this.windowShadowGroup.visible = false; // Hidden to remove window glare projection from wall and mirror

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
    this.frontWall = null;
    this.ceiling = null;
    this.baseboard = null;
    this.opposingArchitecture = null;
    this.windowShadowGroup = null;
    this.softboxGroup = null;
    this.foliageGroup = null;
  }
}
