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
import {
  StudioLighting,
  LIGHTING_PRESETS,
  DEFAULT_LIGHTING_PRESET,
  LightingController,
  createStudioLighting,
  LightingContract
} from './lighting/index.js';
import {
  StudioTheme,
  ThemeMaterials,
  THEME_PRESETS,
  DEFAULT_THEME_PRESET,
  COLOR_PALETTE,
  createStudioTheme,
  ThemeContract
} from './theme/index.js';
import {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET,
  getCameraPreset,
  getFovForAspect,
  StudioCamera,
  CameraTransitions,
  CameraInteractions,
  CameraController,
  CameraContract,
  createStudioCamera
} from './camera/index.js';

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
  AvatarContract,
  StudioLighting,
  LIGHTING_PRESETS,
  DEFAULT_LIGHTING_PRESET,
  LightingController,
  createStudioLighting,
  LightingContract,
  StudioTheme,
  ThemeMaterials,
  THEME_PRESETS,
  DEFAULT_THEME_PRESET,
  COLOR_PALETTE,
  createStudioTheme,
  ThemeContract,
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET,
  getCameraPreset,
  getFovForAspect,
  StudioCamera,
  CameraTransitions,
  CameraInteractions,
  CameraController,
  CameraContract,
  createStudioCamera
};

export const StudioContract = {
  // Scene lifecycle
  initScene: (canvasElement, options) => {},
  destroyScene: () => {},
  
  // Camera controls
  setCameraPreset: (presetName) => {}, // 'STUDIO_OVERVIEW' | 'WARDROBE_CLOSEUP' | 'AVATAR_FULL_BODY' | 'AVATAR_DETAIL' | 'VANITY_VIEW' | 'MIRROR_VIEW'
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
    triggerPose: (poseName) => {
      console.warn('Avatar: Posing system is reserved for Studio Features module (Phase 5). Currently unsupported.');
      return false;
    },
    getConfig: () => ({ ...AVATAR_CONFIG })
  },
  
  lighting: {
    createLighting: (scene, presetName, THREE) => createStudioLighting(scene, presetName, THREE),
    createController: (lightingInstance) => new LightingController(lightingInstance),
    getPresets: () => ({ ...LIGHTING_PRESETS }),
    setThemePreset: (controller, preset) => controller && controller.applyPreset(preset)
  },

  theme: {
    createTheme: (scene, textures, presetName, THREE) => createStudioTheme(scene, textures, presetName, THREE),
    getPresets: () => ({ ...THEME_PRESETS }),
    getPalette: () => ({ ...COLOR_PALETTE }),
    applyTheme: (themeInstance, presetName, scene) => themeInstance && themeInstance.applyTheme(presetName, scene)
  },

  camera: {
    createCamera: (canvas, options, THREE) => createStudioCamera(canvas, options, THREE),
    getPresets: () => ({ ...CAMERA_PRESETS }),
    setPreset: (cameraController, presetName) => cameraController && cameraController.setCameraPreset(presetName),
    resetCamera: (cameraController) => cameraController && cameraController.resetCamera(),
    getState: (cameraController) => cameraController && cameraController.getState()
  }
};

export default StudioContract;
