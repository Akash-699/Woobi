/**
 * Woobi - Settings Module
 * PerformanceContract.js - Graphics Quality Presets, Shadows & Performance Interface
 */

export const PERFORMANCE_PRESETS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  BATTERY_SAVER: 'battery_saver',
  AUTO: 'auto'
};

export const SHADOW_QUALITY = {
  SOFT: 'soft',
  BASIC: 'basic',
  OFF: 'off'
};

export const REFLECTION_QUALITY = {
  FULL: 'full',
  HALF: 'half',
  OFF: 'off'
};

export const DEFAULT_PERFORMANCE = {
  preset: PERFORMANCE_PRESETS.HIGH,
  targetFps: 60,
  maxPixelRatio: 2.0,
  shadows: SHADOW_QUALITY.SOFT,
  reflections: REFLECTION_QUALITY.FULL,
  idleAnimations: true,
  antialias: true
};

export const PERFORMANCE_EVENTS = {
  PRESET_CHANGED: 'performance:preset_changed',
  SHADOWS_CHANGED: 'performance:shadows_changed',
  REFLECTIONS_CHANGED: 'performance:reflections_changed',
  ANIMATIONS_CHANGED: 'performance:animations_changed',
  RESET: 'performance:reset'
};

export const PerformanceContract = {
  name: 'PerformanceSettings',
  version: '1.0.0',
  methods: [
    'getPerformanceSettings',
    'setPreset',
    'setShadowQuality',
    'setReflectionQuality',
    'toggleIdleAnimations',
    'applyToStudio3D',
    'detectOptimalPreset',
    'resetPerformance',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(PERFORMANCE_EVENTS)
};

