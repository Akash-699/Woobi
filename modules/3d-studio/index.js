import { StageModel, STAGE_CONFIG, StageMaterials, createStage } from './stage/index.js';
import { WardrobeModel, WARDROBE_CONFIG, WardrobeMaterials, WardrobeAnimations, WardrobeAssets, createWardrobe } from './wardrobe/index.js';
import { VanityModel, VANITY_CONFIG, VanityMaterials, VanityAssets, MirrorReflection, VanityLighting, createVanity } from './mirror-vanity/index.js';

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
  createVanity
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
    setGender: (gender) => {}, // 'female' | 'male'
    getStandingElevation: () => 0.080, // Y = 0.080m grounded on dais
    triggerPose: (poseName) => {}
  },
  
  lighting: {
    setThemePreset: (preset) => {} // 'luxury-warm' | 'editorial-neutral' | 'soft-evening'
  }
};

export default StudioContract;
