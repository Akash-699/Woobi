import { StageModel, STAGE_CONFIG, StageMaterials, createStage } from './stage/index.js';
import { WardrobeModel, WARDROBE_CONFIG, WardrobeMaterials, WardrobeAnimations, WardrobeAssets, createWardrobe } from './wardrobe/index.js';
import { VanityModel, VANITY_CONFIG, VanityMaterials, VanityAssets, MirrorReflection, VanityLighting, createVanity } from './mirror-vanity/index.js';
import {
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
  PROPORTION_PRESETS,
  createAvatar,
  AvatarContract
} from './avatar/index.js';

export {
  StageModel,
  STAGE_CONFIG,
  StageMaterials,
  createStage,
  WardrobeModel,
  WARDROBE_CONFIG,
  WardrobeMaterials,
  WardrobeAnimations,
  WardrobeAssets,
  createWardrobe,
  VanityModel,
  VANITY_CONFIG,
  VanityMaterials,
  VanityAssets,
  MirrorReflection,
  VanityLighting,
  createVanity,
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
  PROPORTION_PRESETS,
  createAvatar,
  AvatarContract
};

export const StudioContract = {
  // Scene lifecycle
  initScene: (canvasElement, options) => {},
  destroyScene: () => {},
  
  // Camera controls
  setCameraPreset: (presetName) => {}, // 'STUDIO_OVERVIEW' | 'AVATAR_FULL_BODY' | 'AVATAR_DETAIL'
  getCameraState: () => {},
  
  // 3D Objects & Managers
  stage: {
    getDaisElevation: () => STAGE_CONFIG.daisElevation, // 0.080 m
    getDaisRadius: () => STAGE_CONFIG.radius,           // 0.95 m
    getShadowRadius: () => STAGE_CONFIG.shadowRadius,   // 1.18 m
    createStage: (scene, textures, THREE) => createStage(scene, textures, THREE)
  },
  
  wardrobe: {
    createWardrobe: (scene, textures, THREE) => createWardrobe(scene, textures, THREE),
    openDoors: () => {},
    closeDoors: () => {},
    toggleDoors: () => {},
    isDoorOpen: () => false,
    getConfig: () => WARDROBE_CONFIG
  },
  
  vanity: {
    createVanity: (scene, textures, THREE) => createVanity(scene, textures, THREE),
    focusMirror: () => {},
    resetFocus: () => {},
    setLightsEnabled: (enabled) => {},
    getConfig: () => VANITY_CONFIG
  },
  
  avatar: {
    createAvatar: (scene, textures, THREE) => createAvatar(scene, textures, THREE),
    createController: (avatarModel) => new AvatarController(avatarModel),
    setGender: (controller, gender) => controller && controller.setGenderPresentation(gender),
    getStandingElevation: () => AVATAR_CONFIG.daisElevation, // Y = 0.080m grounded on dais
    triggerPose: (poseName) => {},
    getConfig: () => ({ ...AVATAR_CONFIG })
  },
  
  lighting: {
    setThemePreset: (preset) => {} // 'luxury-warm' | 'editorial-neutral' | 'soft-evening'
  }
};

export default StudioContract;
