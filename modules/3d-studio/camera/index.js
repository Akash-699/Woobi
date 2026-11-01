/**
 * Woobi - 3D Studio Camera Module
 * index.js - Public Module Interface & Factory
 */

import { CAMERA_PRESETS, DEFAULT_CAMERA_PRESET, getCameraPreset, getFovForAspect } from './CameraPresets.js';
import { StudioCamera } from './StudioCamera.js';
import { CameraTransitions } from './CameraTransitions.js';
import { CameraInteractions } from './CameraInteractions.js';
import { CameraController } from './CameraController.js';

export {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET,
  getCameraPreset,
  getFovForAspect,
  StudioCamera,
  CameraTransitions,
  CameraInteractions,
  CameraController
};

export const CameraContract = {
  name: 'camera',
  version: '1.0.0',
  presets: Object.keys(CAMERA_PRESETS),
  methods: [
    'setCameraPreset',
    'focusOnObject',
    'resetCamera',
    'setZoomFactor',
    'addZoomDelta',
    'resize',
    'update',
    'raycastClick',
    'getState',
    'dispose'
  ]
};

export function createStudioCamera(canvasOrOptions = {}, maybeOptions = {}, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
  let options = {};
  if (canvasOrOptions && (canvasOrOptions instanceof (typeof HTMLElement !== 'undefined' ? HTMLElement : Object) || canvasOrOptions.tagName)) {
    options = Object.assign({}, maybeOptions, { canvas: canvasOrOptions });
  } else if (typeof canvasOrOptions === 'object') {
    options = Object.assign({}, canvasOrOptions);
  }

  const threeLib = THREE || (typeof window !== 'undefined' ? window.THREE : null);
  return new CameraController(options, threeLib);
}

// Global Browser Window Bridge for legacy non-bundled scripts
if (typeof window !== 'undefined') {
  window.WoobiCamera = {
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
}
