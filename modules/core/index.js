/**
 * @module modules/core
 * Public interface specification for Woobi Core Foundation.
 */

export const CoreContract = {
  // App Lifecycle
  bootstrapApp: () => {},
  
  // Navigation
  navigation: {
    goToScreen: (screenId) => {},
    getCurrentScreen: () => 'dashboard',
    toggleWardrobeSheet: (open) => {}
  },
  
  // State Management
  state: {
    getStore: () => {},
    subscribe: (listener) => () => {},
    dispatch: (action) => {}
  },
  
  // Shared UI & Design System
  ui: {
    showToast: (message, duration) => {},
    openModal: (modalId, options) => {},
    closeModal: (modalId) => {}
  },
  
  // Error Boundary & Recovery
  errors: {
    handleGlobalError: (error, context) => {},
    create3DErrorBoundary: (canvasElement) => ({
      onContextLost: () => {},
      onContextRestored: () => {},
      renderFallbackMannequin: () => {}
    })
  },
  
  // Platform & Environment
  platform: {
    isMobile: () => false,
    hasWebGL: () => true
  }
};

export default CoreContract;
