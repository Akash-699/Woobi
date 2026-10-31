/**
 * @module modules/3d-studio
 * Public interface specification for Woobi 3D Studio.
 * External modules must interact with the 3D scene exclusively through this contract.
 */

export const StudioContract = {
  // Scene lifecycle
  initScene: (canvasElement, options) => {},
  destroyScene: () => {},
  
  // Camera controls
  setCameraPreset: (presetName) => {}, // 'STUDIO_OVERVIEW' | 'AVATAR_FULL_BODY' | 'AVATAR_DETAIL'
  getCameraState: () => {},
  
  // 3D Objects & Managers
  stage: {
    getDaisElevation: () => 0.080, // 8.0 cm elevated dais
    getDaisRadius: () => 0.95,     // 1.90m diameter
    setRotation: (angleY) => {},
    triggerRotationArc: () => {}
  },
  
  wardrobe: {
    openDoors: () => {},
    closeDoors: () => {},
    toggleDoors: () => {},
    isDoorOpen: () => false
  },
  
  vanity: {
    focusMirror: () => {},
    resetFocus: () => {}
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
