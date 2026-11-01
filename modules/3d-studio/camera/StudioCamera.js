/**
 * Woobi - 3D Studio Camera Module
 * StudioCamera.js - Three.js PerspectiveCamera Initialization, Aspect Ratio & Bounds
 */

import { CAMERA_PRESETS, DEFAULT_CAMERA_PRESET, getFovForAspect } from './CameraPresets.js';

export class StudioCamera {
  constructor(options = {}, THREE = window.THREE) {
    this.THREE = THREE;
    this.width = options.width || 390;
    this.height = options.height || 750;
    this.aspect = this.width / this.height;

    this.near = options.near || 0.1;
    this.far = options.far || 40.0;
    this.minFov = options.minFov || 26.0;
    this.maxFov = options.maxFov || 66.0;

    this.currentPreset = options.initialPreset || DEFAULT_CAMERA_PRESET;
    this.camera = null;
    this.isDisposed = false;

    this.initCamera();
  }

  initCamera() {
    const THREE = this.THREE;
    if (!THREE) return;

    const preset = CAMERA_PRESETS[this.currentPreset] || CAMERA_PRESETS[DEFAULT_CAMERA_PRESET];
    const initialFov = getFovForAspect(preset, this.aspect);

    this.camera = new THREE.PerspectiveCamera(initialFov, this.aspect, this.near, this.far);
    this.camera.name = 'Studio_PerspectiveCamera';

    this.camera.position.set(preset.position.x, preset.position.y, preset.position.z);
    this.camera.lookAt(preset.target.x, preset.target.y, preset.target.z);
  }

  resize(width, height, zoomFactor = 1.0) {
    if (!this.camera || width <= 0 || height <= 0) return;

    this.width = width;
    this.height = height;
    this.aspect = width / height;
    this.camera.aspect = this.aspect;

    const preset = CAMERA_PRESETS[this.currentPreset] || CAMERA_PRESETS[DEFAULT_CAMERA_PRESET];
    const baseFov = getFovForAspect(preset, this.aspect);
    const targetFov = Math.max(this.minFov, Math.min(this.maxFov, baseFov * zoomFactor));

    this.camera.fov = targetFov;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.isDisposed = true;
    this.camera = null;
  }
}
