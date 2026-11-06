/**
 * Woobi - Settings Module
 * AppearanceContract.js - Theme Constants, Lighting Presets & Appearance Specifications
 */

export const APP_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export const STUDIO_THEMES = {
  LUXURY_CREAM: 'luxury-cream',
  NORDIC_MINIMAL: 'nordic-minimal',
  WARM_TERRACOTTA: 'warm-terracotta'
};

export const LIGHTING_PRESETS = {
  EDITORIAL_SOFT: 'editorial_soft',
  WARM_ATELIER: 'warm_atelier',
  DRAMATIC_CHIAROSCURO: 'dramatic_chiaroscuro',
  GOLDEN_HOUR: 'golden_hour',
  HIGH_KEY_CLEAN: 'high_key_clean',
  LUXURY_WARM: 'luxury-warm'
};

export const DEFAULT_APPEARANCE = {
  appTheme: APP_THEMES.LIGHT,
  studioTheme: STUDIO_THEMES.LUXURY_CREAM,
  studioLighting: LIGHTING_PRESETS.LUXURY_WARM,
  fontScale: 1.0,
  highContrast: false
};

export const APPEARANCE_EVENTS = {
  APP_THEME_CHANGED: 'appearance:app_theme_changed',
  STUDIO_THEME_CHANGED: 'appearance:studio_theme_changed',
  LIGHTING_CHANGED: 'appearance:lighting_changed',
  RESET: 'appearance:reset'
};

export const AppearanceContract = {
  name: 'AppearanceSettings',
  version: '1.0.0',
  methods: [
    'getAppearance',
    'setAppTheme',
    'setStudioTheme',
    'setStudioLighting',
    'setFontScale',
    'toggleHighContrast',
    'applyToStudio3D',
    'resetAppearance',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(APPEARANCE_EVENTS)
};

