/**
 * Woobi - 3D Studio Avatar Module
 * index.js - Public Entry Point, AvatarContract, Factory, and Browser Bridge
 */

import { AvatarModel, AVATAR_CONFIG } from './AvatarModel.js';
import { AvatarMaterials, AVATAR_PALETTE } from './AvatarMaterials.js';
import { AvatarRig } from './AvatarRig.js';
import { AvatarAssets, AVATAR_ASSET_PATHS, MANNEQUIN_ASSET_PATHS } from './AvatarAssets.js';
import { AvatarMorphs, PROPORTION_PRESETS } from './AvatarMorphs.js';
import { AvatarAnimations } from './AvatarAnimations.js';
import { AvatarController } from './AvatarController.js';

export {
  AvatarModel,
  AvatarMaterials,
  AvatarRig,
  AvatarAssets,
  AvatarMorphs,
  AvatarAnimations,
  AvatarController,
  AVATAR_CONFIG,
  AVATAR_PALETTE,
  AVATAR_ASSET_PATHS,
  MANNEQUIN_ASSET_PATHS,
  PROPORTION_PRESETS
};

/**
 * Factory function to create and mount the Avatar component.
 * @param {THREE.Scene} scene
 * @param {Object} textures
 * @param {Object} THREE
 * @returns {AvatarModel}
 */
export function createAvatar(scene, textures = {}, THREE = window.THREE) {
  const model = new AvatarModel(THREE);
  model.build(scene, textures, THREE);
  return model;
}

/**
 * Public Avatar Module Specification Contract
 */
export const AvatarContract = {
  createAvatar: (scene, textures, THREE) => createAvatar(scene, textures, THREE),
  createController: (avatarModel) => new AvatarController(avatarModel),
  getElevation: () => AVATAR_CONFIG.daisElevation,
  getConfig: () => ({ ...AVATAR_CONFIG }),
  getPalette: () => ({ ...AVATAR_PALETTE }),
  getAssetPaths: () => [...AVATAR_ASSET_PATHS],
  getMannequinPaths: () => ({ ...MANNEQUIN_ASSET_PATHS })
};

// Global browser window bridge for live runtime integration
if (typeof window !== 'undefined') {
  window.WoobiAvatar = {
    AvatarModel,
    AvatarMaterials,
    AvatarRig,
    AvatarAssets,
    AvatarMorphs,
    AvatarAnimations,
    AvatarController,
    AVATAR_CONFIG,
    AVATAR_PALETTE,
    AVATAR_ASSET_PATHS,
    MANNEQUIN_ASSET_PATHS,
    PROPORTION_PRESETS,
    createAvatar,
    AvatarContract
  };
}
