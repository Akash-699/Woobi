/**
 * Woobi 3D Studio - Mirror Reflection Pipeline
 * Manages the offscreen WebGL render target and virtual reflection camera
 * for the illuminated grooming mirror.
 */

export class MirrorReflection {
  constructor(options = {}) {
    this.resolution = options.resolution || 512;
    this.renderTarget = null;
    this.mirrorCamera = null;
    this.mirrorMesh = null;
    this.scene = null;
    this.isContextLost = false;
  }

  /**
   * Initializes the reflection pipeline and binds the texture to the mirror mesh.
   */
  init(THREE, scene, mirrorMesh) {
    if (!THREE || !scene) return;
    this.scene = scene;
    this.mirrorMesh = mirrorMesh;

    try {
      this.renderTarget = new THREE.WebGLRenderTarget(this.resolution, this.resolution, {
        format: THREE.RGBFormat || 1022,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter || 1006,
        magFilter: THREE.LinearFilter || 1006
      });

      this.mirrorCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
      scene.add(this.mirrorCamera);

      if (this.mirrorMesh && this.mirrorMesh.material) {
        this.mirrorMesh.material.map = this.renderTarget.texture;
        this.mirrorMesh.material.needsUpdate = true;
      }
    } catch (err) {
      console.warn('[MirrorReflection] Failed to initialize WebGL render target:', err);
    }
  }

  /**
   * Safely updates the reflection texture using the provided renderer.
   */
  update(renderer, scene) {
    if (!renderer || !this.renderTarget || !this.mirrorCamera || this.isContextLost) return;

    if (this.mirrorMesh) {
      this.mirrorMesh.visible = false; // Hide mirror surface to prevent feedback loop
    }

    try {
      renderer.setRenderTarget(this.renderTarget);
      renderer.render(scene, this.mirrorCamera);
      renderer.setRenderTarget(null);
    } catch (err) {
      console.warn('[MirrorReflection] Error rendering mirror reflection:', err);
    } finally {
      if (this.mirrorMesh) {
        this.mirrorMesh.visible = true;
      }
    }
  }

  handleContextLost() {
    this.isContextLost = true;
  }

  handleContextRestored(THREE) {
    this.isContextLost = false;
    if (this.scene && this.mirrorMesh) {
      this.init(THREE, this.scene, this.mirrorMesh);
    }
  }

  dispose() {
    if (this.mirrorCamera && this.scene) {
      this.scene.remove(this.mirrorCamera);
      this.mirrorCamera = null;
    }
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    this.mirrorMesh = null;
    this.scene = null;
  }
}

export default MirrorReflection;
