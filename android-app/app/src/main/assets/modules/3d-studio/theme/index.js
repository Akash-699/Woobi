/**
 * Woobi - 3D Studio Theme Module
 * index.js - Public Entry Point, Factory, ThemeContract, and Browser Bridge
 */

import { StudioTheme } from './StudioTheme.js';
import { ThemeMaterials } from './ThemeMaterials.js';
import { THEME_PRESETS, DEFAULT_THEME_PRESET, COLOR_PALETTE } from './ThemePresets.js';

export {
  StudioTheme,
  ThemeMaterials,
  THEME_PRESETS,
  DEFAULT_THEME_PRESET,
  COLOR_PALETTE
};

/**
 * Factory function to create and mount the studio theme architecture.
 * @param {THREE.Scene} scene
 * @param {Object} textures
 * @param {string} presetName
 * @param {Object} THREE
 * @returns {StudioTheme}
 */
export function createStudioTheme(scene, textures = {}, presetName = DEFAULT_THEME_PRESET, THREE = window.THREE) {
  const theme = new StudioTheme(THREE);
  theme.build(scene, textures, presetName, THREE);
  return theme;
}

/**
 * Public Theme Module Specification Contract
 */
export const ThemeContract = {
  createTheme: (scene, textures, presetName, THREE) => createStudioTheme(scene, textures, presetName, THREE),
  getPresets: () => ({ ...THEME_PRESETS }),
  getPalette: () => ({ ...COLOR_PALETTE }),
  getDefaultPreset: () => DEFAULT_THEME_PRESET
};

// Global browser window bridge for live runtime integration
if (typeof window !== 'undefined') {
  window.WoobiTheme = {
    StudioTheme,
    ThemeMaterials,
    THEME_PRESETS,
    DEFAULT_THEME_PRESET,
    COLOR_PALETTE,
    createStudioTheme,
    ThemeContract
  };
}
