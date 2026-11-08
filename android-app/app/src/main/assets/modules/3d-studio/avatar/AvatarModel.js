/**
 * Woobi - 3D Studio Avatar Module
 * AvatarModel.js - Central Avatar Component Orchestrator & Grounding Manager
 */

import { AvatarMaterials, AVATAR_PALETTE } from './AvatarMaterials.js';
import { AvatarRig } from './AvatarRig.js';
import { AvatarAssets, AVATAR_ASSET_PATHS, FEMALE_AVATAR_PATHS, MALE_AVATAR_PATHS } from './AvatarAssets.js';
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
    this.currentGender = 'female';
    this.genderModels = { female: null, male: null };

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

  loadRiggedAvatarGLB(onSuccess, onError, assetPaths = null, targetGender = null) {
    if (!this.assets) return;

    const genderKey = targetGender || (
      assetPaths === MALE_AVATAR_PATHS ||
      (Array.isArray(assetPaths) && assetPaths.some(p => typeof p === 'string' && p.includes('male'))) ||
      this.currentGender === 'male'
        ? 'male'
        : 'female'
    );

    // If explicit paths were supplied (e.g. [] in tests or custom list), respect them
    const paths = assetPaths !== null
      ? assetPaths
      : (genderKey === 'male' ? MALE_AVATAR_PATHS : FEMALE_AVATAR_PATHS);

    this.assets.loadRiggedModel(
      (model, url) => {
        if (this.isDisposed) return;

        // Cache model for this specific gender
        this.genderModels[genderKey] = model;

        // Bind animation mixer if animations exist on model
        if (model.userData && model.userData.animations && model.userData.animations.length > 0 && this.THREE) {
          const mixer = new this.THREE.AnimationMixer(model);
          model.userData.mixer = mixer;
        }

        // Only mount onto avatarRoot if this gender is currently requested
        if (this.currentGender === genderKey) {
          this.mountGenderModel(genderKey);
        } else {
          // Keep inactive model hidden and unmounted
          model.visible = false;
          if (typeof model.traverse === 'function') {
            model.traverse((c) => { c.visible = false; });
          }
          if (this.avatarRoot && this.avatarRoot.children.includes(model)) {
            this.avatarRoot.remove(model);
          }
        }
        this.activeAvatarType = 'glb';
        if (this.animations && typeof this.animations.setGLTFModel === 'function') {
          this.animations.setGLTFModel(this.gltfAvatarGroup);
        }

        if (onSuccess) onSuccess(model, url);
      },
      (err) => {
        if (this.isDisposed) return;
        // High-definition sculpted avatar remains active as verified fallback
        if (!this.genderModels.female && !this.genderModels.male) {
          this.activeAvatarType = 'sculpted';
          if (this.animations && typeof this.animations.setGLTFModel === 'function') {
            this.animations.setGLTFModel(null);
          }
          if (this.sculptedAvatarGroup) {
            this.sculptedAvatarGroup.visible = true;
            this.sculptedAvatarGroup.traverse((c) => { c.visible = true; });
            if (this.avatarRoot && !this.avatarRoot.children.includes(this.sculptedAvatarGroup)) {
              this.avatarRoot.add(this.sculptedAvatarGroup);
            }
          }
        }
        if (onError) onError(err);
      },
      paths
    );
  }

  mountGenderModel(gender) {
    const targetGender = gender === 'male' || gender === 'masculine' ? 'male' : 'female';
    this.currentGender = targetGender;

    if (!this.avatarRoot) return null;

    // 1. Completely detach and hide sculpted procedural avatar to prevent any static overlap
    if (this.sculptedAvatarGroup) {
      this.sculptedAvatarGroup.visible = false;
      this.sculptedAvatarGroup.traverse((c) => { c.visible = false; });
      if (this.avatarRoot.children.includes(this.sculptedAvatarGroup)) {
        this.avatarRoot.remove(this.sculptedAvatarGroup);
      }
    }

    const targetModel = this.genderModels[targetGender];

    // 2. Detach and hide ALL other gender models
    Object.entries(this.genderModels).forEach(([g, model]) => {
      if (!model) return;
      if (g !== targetGender || model !== targetModel) {
        if (model.userData?.mixer) {
          model.userData.mixer.stopAllAction();
        }
        model.visible = false;
        model.traverse((c) => { c.visible = false; });
        if (this.avatarRoot.children.includes(model)) {
          this.avatarRoot.remove(model);
        }
      }
    });

    // 3. Remove any stray non-shadow children from avatarRoot to prevent ghost meshes
    const childrenToRemove = [];
    this.avatarRoot.children.forEach((child) => {
      if (child.name !== 'AvatarFootContactShadow_Left' &&
          child.name !== 'AvatarFootContactShadow_Right' &&
          child !== targetModel) {
        childrenToRemove.push(child);
      }
    });
    childrenToRemove.forEach((child) => {
      child.visible = false;
      if (typeof child.traverse === 'function') {
        child.traverse((c) => { c.visible = false; });
      }
      this.avatarRoot.remove(child);
    });

    // 4. Attach and show target model
    if (targetModel) {
      targetModel.visible = true;
      targetModel.traverse((c) => { c.visible = true; });
      if (!this.avatarRoot.children.includes(targetModel)) {
        this.avatarRoot.add(targetModel);
      }
      this.gltfAvatarGroup = targetModel;
      this.activeAvatarType = 'glb';

      // 5. Play idle breathing animation on this model
      if (targetModel.userData?.animations && targetModel.userData.animations.length > 0 && this.THREE) {
        if (!targetModel.userData.mixer) {
          targetModel.userData.mixer = new this.THREE.AnimationMixer(targetModel);
        }
        const mixer = targetModel.userData.mixer;
        mixer.stopAllAction();
        const clip = targetModel.userData.animations[0];
        const action = mixer.clipAction(clip);
        action.play();
        if (this.animations) {
          this.animations.setMixer(mixer);
        }
      }
    }

    return targetModel;
  }

  setMannequinGender(gender, callback) {
    const targetGender = gender === 'male' || gender === 'masculine' ? 'male' : 'female';
    this.currentGender = targetGender;

    // Check if target model already loaded
    if (this.genderModels[targetGender]) {
      const model = this.mountGenderModel(targetGender);
      if (callback) callback(model);
      return model;
    }

    // Hide active model while loading new one to prevent static ghosting
    if (this.avatarRoot) {
      this.avatarRoot.children.forEach((child) => {
        if (child.name !== 'AvatarFootContactShadow_Left' &&
            child.name !== 'AvatarFootContactShadow_Right') {
          child.visible = false;
          if (child.userData?.mixer) child.userData.mixer.stopAllAction();
        }
      });
    }

    const paths = targetGender === 'male' ? MALE_AVATAR_PATHS : FEMALE_AVATAR_PATHS;
    this.loadRiggedAvatarGLB(
      (model) => {
        if (callback) callback(model);
      },
      (err) => {
        console.warn('AvatarModel: Failed to switch mannequin to ' + targetGender, err);
        if (this.sculptedAvatarGroup && !this.genderModels.female && !this.genderModels.male) {
          this.sculptedAvatarGroup.visible = true;
          this.sculptedAvatarGroup.traverse((c) => { c.visible = true; });
          if (this.avatarRoot && !this.avatarRoot.children.includes(this.sculptedAvatarGroup)) {
            this.avatarRoot.add(this.sculptedAvatarGroup);
          }
        }
        if (callback) callback(null);
      },
      paths,
      targetGender
    );
  }

  loadMannequin(gender = 'female', onSuccess, onError) {
    if (!this.assets) return;
    this.assets.loadMannequinModel(
      gender,
      (model, url) => {
        if (this.isDisposed) return;
        this.gltfAvatarGroup = model;
        if (this.avatarRoot) {
          this.avatarRoot.add(this.gltfAvatarGroup);
        }
        if (this.sculptedAvatarGroup) {
          this.sculptedAvatarGroup.visible = false;
        }
        this.activeAvatarType = 'mannequin';
        if (this.animations && typeof this.animations.setGLTFModel === 'function') {
          this.animations.setGLTFModel(this.gltfAvatarGroup);
        }
        if (onSuccess) onSuccess(model, url);
      },
      onError
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

    // Cleanly dispose cached gender models
    if (this.genderModels) {
      Object.values(this.genderModels).forEach((model) => {
        if (model) {
          if (model.userData?.mixer) model.userData.mixer.stopAllAction();
          model.traverse((c) => {
            if (c.geometry && typeof c.geometry.dispose === 'function') c.geometry.dispose();
            if (c.material) {
              if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose && m.dispose());
              else if (typeof c.material.dispose === 'function') c.material.dispose();
            }
          });
        }
      });
      this.genderModels = { female: null, male: null };
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
