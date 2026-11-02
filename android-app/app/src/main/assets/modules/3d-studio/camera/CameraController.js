/**
 * Woobi - 3D Studio Camera Module
 * CameraController.js - Unified Controller for Studio Camera, Transitions & Interactions
 */

import { StudioCamera } from './StudioCamera.js';
import { CameraTransitions } from './CameraTransitions.js';
import { CameraInteractions } from './CameraInteractions.js';
import { CAMERA_PRESETS, DEFAULT_CAMERA_PRESET } from './CameraPresets.js';

export class CameraController {
  constructor(options = {}, THREE = window.THREE) {
    this.THREE = THREE;
    this.options = options;

    // 1. Initialize Perspective Camera
    this.studioCamera = new StudioCamera(options, THREE);
    this.camera = this.studioCamera.camera;

    // 2. Initialize Transitions Engine
    this.transitions = new CameraTransitions(options, THREE);

    // 3. Initialize Interactions
    this.interactions = new CameraInteractions({
      onRotate: options.onRotate || null,
      onZoom: (delta) => this.addZoomDelta(delta),
      onClick: options.onClick || null,
      onResize: options.onResize || null
    });

    if (options.canvas) {
      this.interactions.attach(options.canvas, options.window || (typeof window !== 'undefined' ? window : null));
    }

    // Raycaster for click selection
    this.raycaster = THREE ? new THREE.Raycaster() : null;
    this.mouse = THREE ? new THREE.Vector2() : null;

    this.isDisposed = false;
  }

  get currentPreset() {
    return this.transitions.currentPreset;
  }

  get currentCameraState() {
    return this.transitions.currentPreset;
  }

  get zoomFactor() {
    return this.transitions.zoomFactor;
  }

  setCameraPreset(presetName) {
    const success = this.transitions.setPreset(presetName);
    if (success) {
      this.studioCamera.currentPreset = presetName;
    }
    return success;
  }

  focusOnObject(target, cameraPos = null) {
    this.transitions.focusOn(target, cameraPos);
  }

  resetCamera() {
    return this.setCameraPreset(DEFAULT_CAMERA_PRESET);
  }

  setZoomFactor(factor) {
    this.transitions.setZoomFactor(factor);
  }

  addZoomDelta(delta) {
    this.transitions.addZoomDelta(delta);
  }

  resize(width, height) {
    if (!this.studioCamera || this.isDisposed) return;
    this.studioCamera.resize(width, height, this.transitions.zoomFactor);
  }

  update(delta = 0.016) {
    if (this.isDisposed || !this.camera) return;
    this.transitions.update(this.camera, this.studioCamera.aspect);
  }

  /**
   * Raycast click detection against interactive objects (wardrobe, vanity, avatar, etc.)
   */
  raycastClick(clientX, clientY, canvas, interactiveObjects, onHitCallback) {
    if (!this.raycaster || !this.camera || !canvas || !interactiveObjects) return null;

    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.interactiveType && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData.interactiveType && typeof onHitCallback === 'function') {
        onHitCallback(obj.userData.interactiveType, obj.userData);
      }
      return obj;
    }
    return null;
  }

  getState() {
    return {
      currentPreset: this.currentPreset,
      position: this.camera ? {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      } : null,
      targetCameraPos: this.transitions.targetCameraPos ? {
        x: this.transitions.targetCameraPos.x,
        y: this.transitions.targetCameraPos.y,
        z: this.transitions.targetCameraPos.z
      } : null,
      zoomFactor: this.transitions.zoomFactor,
      aspect: this.studioCamera.aspect,
      fov: this.camera ? this.camera.fov : null,
      isDisposed: this.isDisposed
    };
  }

  dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.interactions) {
      this.interactions.dispose();
      this.interactions = null;
    }

    if (this.transitions) {
      this.transitions.dispose();
      this.transitions = null;
    }

    if (this.studioCamera) {
      this.studioCamera.dispose();
      this.studioCamera = null;
    }

    this.camera = null;
    this.raycaster = null;
    this.mouse = null;
    this.options = null;
  }
}
