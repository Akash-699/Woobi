/**
 * Woobi - 3D Studio Camera Module
 * CameraTransitions.js - Smooth Position/Target Lerping, Zoom Damping & FOV Interpolation
 */

import { CAMERA_PRESETS, DEFAULT_CAMERA_PRESET, getFovForAspect } from './CameraPresets.js';

export class CameraTransitions {
  constructor(options = {}, THREE = window.THREE) {
    this.THREE = THREE;

    this.positionLerpSpeed = options.positionLerpSpeed || 0.075;
    this.lookAtLerpSpeed = options.lookAtLerpSpeed || 0.075;
    this.fovLerpSpeed = options.fovLerpSpeed || 0.10;

    this.minZoomFactor = options.minZoomFactor !== undefined ? options.minZoomFactor : 0.70;
    this.maxZoomFactor = options.maxZoomFactor !== undefined ? options.maxZoomFactor : 1.40;
    this.zoomFactor = 1.0;

    this.minFov = options.minFov || 26.0;
    this.maxFov = options.maxFov || 66.0;

    this.currentPreset = options.initialPreset || DEFAULT_CAMERA_PRESET;
    const initial = CAMERA_PRESETS[this.currentPreset] || CAMERA_PRESETS[DEFAULT_CAMERA_PRESET];

    this.targetCameraPos = new THREE.Vector3(initial.position.x, initial.position.y, initial.position.z);
    this.targetCameraLookAt = new THREE.Vector3(initial.target.x, initial.target.y, initial.target.z);
    this.currentCameraLookAt = new THREE.Vector3(initial.target.x, initial.target.y, initial.target.z);
  }

  setPreset(presetName) {
    const preset = CAMERA_PRESETS[presetName];
    if (!preset) return false;

    this.currentPreset = presetName;
    this.targetCameraPos.set(preset.position.x, preset.position.y, preset.position.z);
    this.targetCameraLookAt.set(preset.target.x, preset.target.y, preset.target.z);
    return true;
  }

  focusOn(targetPos, cameraPos = null) {
    if (targetPos) {
      this.targetCameraLookAt.set(targetPos.x, targetPos.y, targetPos.z);
    }
    if (cameraPos) {
      this.targetCameraPos.set(cameraPos.x, cameraPos.y, cameraPos.z);
    }
  }

  setZoomFactor(factor) {
    this.zoomFactor = Math.max(this.minZoomFactor, Math.min(this.maxZoomFactor, factor));
  }

  addZoomDelta(delta) {
    this.setZoomFactor(this.zoomFactor + delta);
  }

  update(camera, aspect) {
    if (!camera) return;

    // 1. Smooth Camera Position & LookAt Lerp
    // Zooming in (zoomFactor < 1.0) dollys closer towards the avatar for outfit inspection
    // Clamped so camera never dollys further back than the baseline studio overview
    let effectivePos = this.targetCameraPos;
    if (this.zoomFactor < 1.0 && this.targetCameraPos && this.targetCameraLookAt) {
      const zoomDelta = this.zoomFactor - 1.0;
      const dollyOffset = zoomDelta * 3.5;
      const dx = this.targetCameraPos.x - this.targetCameraLookAt.x;
      const dy = this.targetCameraPos.y - this.targetCameraLookAt.y;
      const dz = this.targetCameraPos.z - this.targetCameraLookAt.z;
      const len = Math.hypot(dx, dy, dz) || 1.0;
      effectivePos = {
        x: this.targetCameraPos.x + (dx / len) * dollyOffset,
        y: this.targetCameraPos.y + (dy / len) * dollyOffset,
        z: this.targetCameraPos.z + (dz / len) * dollyOffset
      };
    }

    camera.position.lerp(effectivePos, this.positionLerpSpeed);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, this.lookAtLerpSpeed);
    camera.lookAt(this.currentCameraLookAt);

    // 2. Update FOV with zoom damping
    const preset = CAMERA_PRESETS[this.currentPreset] || CAMERA_PRESETS[DEFAULT_CAMERA_PRESET];
    const baseFov = getFovForAspect(preset, aspect || camera.aspect);
    const targetFov = Math.max(this.minFov, Math.min(this.maxFov, baseFov * this.zoomFactor));

    camera.fov += (targetFov - camera.fov) * this.fovLerpSpeed;
    camera.updateProjectionMatrix();
  }

  dispose() {
    this.targetCameraPos = null;
    this.targetCameraLookAt = null;
    this.currentCameraLookAt = null;
  }
}
