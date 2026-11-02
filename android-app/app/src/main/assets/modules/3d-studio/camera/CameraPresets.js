/**
 * Woobi - 3D Studio Camera Module
 * CameraPresets.js - Viewpoint Presets, Positions, Targets & Portrait/Landscape FOVs
 */

export const CAMERA_PRESETS = {
  STUDIO_OVERVIEW: {
    name: 'STUDIO_OVERVIEW',
    position: { x: 0.0, y: 1.22, z: 3.10 },
    target: { x: -0.08, y: 1.08, z: 0.0 },
    fovLandscape: 42,
    fovPortrait: 56
  },
  WARDROBE_CLOSEUP: {
    name: 'WARDROBE_CLOSEUP',
    position: { x: -0.96, y: 1.20, z: 2.50 },
    target: { x: -0.96, y: 1.20, z: -0.32 },
    fovLandscape: 38,
    fovPortrait: 54
  },
  AVATAR_FULL_BODY: {
    name: 'AVATAR_FULL_BODY',
    position: { x: 0.0, y: 1.10, z: 2.10 },
    target: { x: 0.0, y: 1.00, z: 0.0 },
    fovLandscape: 36,
    fovPortrait: 44
  },
  AVATAR_DETAIL: {
    name: 'AVATAR_DETAIL',
    position: { x: 0.0, y: 1.44, z: 1.10 },
    target: { x: 0.0, y: 1.38, z: 0.0 },
    fovLandscape: 30,
    fovPortrait: 36
  },
  VANITY_VIEW: {
    name: 'VANITY_VIEW',
    position: { x: 0.65, y: 1.25, z: 1.55 },
    target: { x: 0.85, y: 1.20, z: -0.10 },
    fovLandscape: 38,
    fovPortrait: 46
  },
  MIRROR_VIEW: {
    name: 'MIRROR_VIEW',
    position: { x: 0.65, y: 1.25, z: 1.55 },
    target: { x: 0.85, y: 1.20, z: -0.10 },
    fovLandscape: 38,
    fovPortrait: 46
  }
};

export const DEFAULT_CAMERA_PRESET = 'STUDIO_OVERVIEW';

export function getCameraPreset(name) {
  return CAMERA_PRESETS[name] || CAMERA_PRESETS[DEFAULT_CAMERA_PRESET];
}

export function getFovForAspect(preset, aspect) {
  const p = typeof preset === 'string' ? getCameraPreset(preset) : preset;
  const isPortrait = aspect < 0.75;
  return isPortrait ? p.fovPortrait : p.fovLandscape;
}
