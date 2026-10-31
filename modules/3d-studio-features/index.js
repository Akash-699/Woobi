/**
 * @module modules/3d-studio-features
 * Public interface specification for Woobi 3D Studio Features.
 */

export const StudioFeaturesContract = {
  // Virtual Try-on
  tryOn: {
    previewGarment: (garmentId) => {},
    clearPreview: () => {},
    openTryOnModal: (garment) => {}
  },
  
  // Recommendations & Styling
  recommendations: {
    generateDailyLooks: (occasion, weather) => {},
    cycleLook: (direction) => {}, // 'next' | 'prev'
    getDailyStreakData: () => {}
  },
  
  // Garment Interactions
  interactions: {
    handleCanvasClick: (raycastHit) => {},
    handleHover: (raycastHit) => {},
    triggerInteractiveObject: (objectId) => {}
  },
  
  // Saved Looks & Streak
  savedLooks: {
    saveCurrentLook: () => {},
    markLookWorn: (lookId) => {},
    uploadStreakPhoto: (file) => {}
  }
};

export default StudioFeaturesContract;
