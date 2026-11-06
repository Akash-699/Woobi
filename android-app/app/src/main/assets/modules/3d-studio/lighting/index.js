/**
 * Woobi - 3D Studio Lighting Module
 * index.js - Public Entry Point, Factory, LightingContract, and Browser Bridge
 */

import { StudioLighting } from './StudioLighting.js';
import { LIGHTING_PRESETS, DEFAULT_LIGHTING_PRESET } from './LightingPresets.js';
import { LightingController } from './LightingController.js';

export {
  StudioLighting,
  LIGHTING_PRESETS,
  DEFAULT_LIGHTING_PRESET,
  LightingController
};

/**
 * Factory function to create and mount the studio lighting.
 * @param {THREE.Scene} scene
 * @param {string} presetName
 * @param {Object} THREE
 * @returns {StudioLighting}
 */
export function createStudioLighting(scene, presetName = DEFAULT_LIGHTING_PRESET, THREE = window.THREE) {
  const lighting = new StudioLighting(THREE);
  lighting.build(scene, presetName);
  return lighting;
}

/**
 * Public Lighting Module Specification Contract
 */
export const LightingContract = {
  createLighting: (scene, presetName, THREE) => createStudioLighting(scene, presetName, THREE),
  createController: (lightingInstance) => new LightingController(lightingInstance),
  getPresets: () => ({ ...LIGHTING_PRESETS }),
  getDefaultPreset: () => DEFAULT_LIGHTING_PRESET
};

// Global browser window bridge for live runtime integration
if (typeof window !== 'undefined') {
  window.WoobiLighting = {
    StudioLighting,
    LIGHTING_PRESETS,
    DEFAULT_LIGHTING_PRESET,
    LightingController,
    createStudioLighting,
    LightingContract
  };
}
