/**
 * Woobi Core Errors - 3D Error Boundary
 * Shields the 3D Virtual Studio from WebGL context loss, failed GLTF loads,
 * and memory leaks during asset switching.
 */

export class ErrorBoundary3D {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.options = options;
    this.contextLost = false;
    this.restoreCallbacks = [];

    this._bindContextEvents();
  }

  _bindContextEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.contextLost = true;
      console.warn('[ErrorBoundary3D] WebGL context lost! Pausing render loop.');
      if (typeof this.options.onContextLost === 'function') {
        this.options.onContextLost(event);
      }
    }, false);

    this.canvas.addEventListener('webglcontextrestored', (event) => {
      this.contextLost = false;
      console.log('[ErrorBoundary3D] WebGL context restored! Re-initializing textures & shaders.');
      this.restoreCallbacks.forEach(cb => {
        try { cb(); } catch (err) { console.error('[ErrorBoundary3D] Restore error:', err); }
      });
      if (typeof this.options.onContextRestored === 'function') {
        this.options.onContextRestored(event);
      }
    }, false);
  }

  onRestore(callback) {
    this.restoreCallbacks.push(callback);
  }

  /**
   * Safely wraps a GLTF model loading promise.
   * If the model file is corrupt or missing (404), invokes the fallback generator
   * so the 3D studio continues operating with a placeholder proxy.
   */
  async safeLoadModel(modelName, loadPromise, fallbackGenerator) {
    try {
      return await loadPromise;
    } catch (error) {
      console.error(`[ErrorBoundary3D] Failed to load 3D model '${modelName}':`, error);
      if (typeof fallbackGenerator === 'function') {
        console.warn(`[ErrorBoundary3D] Generating procedural proxy for '${modelName}'.`);
        return fallbackGenerator(error);
      }
      return null;
    }
  }

  /**
   * Deeply disposes of a Three.js Object3D hierarchy to prevent GPU VRAM memory leaks.
   */
  disposeHierarchy(rootObject) {
    if (!rootObject) return;

    rootObject.traverse(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => this._disposeMaterial(mat));
        } else {
          this._disposeMaterial(child.material);
        }
      }
    });

    if (rootObject.parent) {
      rootObject.parent.remove(rootObject);
    }
  }

  _disposeMaterial(mat) {
    if (!mat) return;
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap', 'emissiveMap'].forEach(texKey => {
      if (mat[texKey] && typeof mat[texKey].dispose === 'function') {
        mat[texKey].dispose();
      }
    });
    if (typeof mat.dispose === 'function') {
      mat.dispose();
    }
  }
}

export default ErrorBoundary3D;
