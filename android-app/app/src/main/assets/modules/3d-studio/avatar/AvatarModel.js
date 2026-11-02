/**
 * Woobi - 3D Studio Avatar Module
 * AvatarModel.js - Central Avatar Component Orchestrator & Grounding Manager
 */

import { AvatarMaterials, AVATAR_PALETTE } from './AvatarMaterials.js';
import { AvatarRig } from './AvatarRig.js';
import { AvatarAssets, AVATAR_ASSET_PATHS } from './AvatarAssets.js';
import { AvatarMorphs, PROPORTION_PRESETS } from './AvatarMorphs.js';
import { AvatarAnimations } from './AvatarAnimations.js';

export const AVATAR_CONFIG = {
  daisElevation: 0.080, // Exactly 8cm stage elevation
  defaultGender: 'female',
  defaultSkinTone: '#F3D5C6',
  defaultHairStyle: 'bun',
  defaultHairColor: '#1E120A',
  defaultProportions: 'regular',
  defaultTop: 'tank',
  defaultBottom: 'wide_linen',
  defaultShoes: 'sneakers',
  defaultAccessories: {
    watch: true,
    earrings: true,
    necklace: false
  }
};

export class AvatarModel {
  constructor(THREE = window.THREE) {
    this.THREE = THREE;
    this.avatarRoot = null;
    this.sculptedAvatarGroup = null;
    this.gltfAvatarGroup = null;
    this.activeAvatarType = 'sculpted'; // 'sculpted' or 'glb'

    this.materials = null;
    this.rig = null;
    this.assets = null;
    this.morphs = null;
    this.animations = null;

    this.isDisposed = false;
  }

  build(scene, textures = {}, THREE = this.THREE) {
    if (THREE) this.THREE = THREE;
    const _THREE = this.THREE;
    if (!_THREE) return null;

    // 1. Initialize Materials
    this.materials = new AvatarMaterials(textures, _THREE);

    // 2. Initialize Anatomical Rig & Hierarchy
    this.rig = new AvatarRig(this.materials, _THREE);
    this.avatarRoot = this.rig.buildRig();
    this.sculptedAvatarGroup = this.rig.sculptedAvatarGroup;

    // 3. Initialize Morphs & Proportions
    this.morphs = new AvatarMorphs(this.avatarRoot, this.rig);

    // 4. Initialize Animations (Idle breathing, blinking, rotation)
    this.animations = new AvatarAnimations(this.avatarRoot, this.rig, _THREE);

    // 5. Initialize Assets Manager
    this.assets = new AvatarAssets(this.materials, _THREE);

    // 6. Mount onto Scene
    if (scene && this.avatarRoot) {
      scene.add(this.avatarRoot);
    }

    return this;
  }

  loadRiggedAvatarGLB(onSuccess, onError, assetPaths = AVATAR_ASSET_PATHS) {
    if (!this.assets) return;

    this.assets.loadRiggedModel(
      (model, url) => {
        if (this.isDisposed) return;
        this.gltfAvatarGroup = model;
        if (this.avatarRoot) {
          this.avatarRoot.add(this.gltfAvatarGroup);
        }
        if (this.sculptedAvatarGroup) {
          this.sculptedAvatarGroup.visible = false;
        }
        this.activeAvatarType = 'glb';

        if (onSuccess) onSuccess(model, url);
      },
      (err) => {
        if (this.isDisposed) return;
        // High-definition sculpted avatar remains active as verified fallback
        this.activeAvatarType = 'sculpted';
        if (this.sculptedAvatarGroup) {
          this.sculptedAvatarGroup.visible = true;
        }
        if (onError) onError(err);
      },
      assetPaths
    );
  }

  getElevation() {
    return AVATAR_CONFIG.daisElevation;
  }

  update(delta, time) {
    if (this.animations && !this.isDisposed) {
      this.animations.update(delta, time);
    }
  }

  dispose(scene) {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Remove from scene
    if (scene && this.avatarRoot) {
      scene.remove(this.avatarRoot);
    }

    // Cancel pending asset loads and dispose loaded GLB
    if (this.assets) {
      this.assets.dispose();
      this.assets = null;
    }

    // Dispose animations
    if (this.animations) {
      this.animations.dispose();
      this.animations = null;
    }

    // Dispose rig geometries
    if (this.rig) {
      this.rig.dispose();
      this.rig = null;
    }

    // Dispose internal materials
    if (this.materials) {
      this.materials.dispose();
      this.materials = null;
    }

    this.morphs = null;
    this.avatarRoot = null;
    this.sculptedAvatarGroup = null;
    this.gltfAvatarGroup = null;
  }
}
