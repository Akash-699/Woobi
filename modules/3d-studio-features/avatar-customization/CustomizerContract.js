/**
 * Woobi - 3D Studio Features
 * CustomizerContract.js - Customization Interface Specification & Events
 */

export const CUSTOMIZER_EVENTS = {
  CHANGE: 'customization:change',
  RESET: 'customization:reset',
  UNDO: 'customization:undo',
  REDO: 'customization:redo',
  ERROR: 'customization:error'
};

export const CustomizerContract = {
  name: 'AvatarCustomizer',
  version: '1.0.0',
  methods: [
    'setSkinTone',
    'setHairColor',
    'setHairstyle',
    'setBodyProportions',
    'setGenderPresentation',
    'toggleAccessory',
    'applyConfig',
    'getConfig',
    'undo',
    'redo',
    'canUndo',
    'canRedo',
    'savePreferences',
    'loadPreferences',
    'resetCustomization',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(CUSTOMIZER_EVENTS)
};
