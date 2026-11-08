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
    this.mirrorPosition = options.mirrorPosition || { x: 2.25, y: 1.25, z: -3.50 };
    this.lookAtPosition = options.lookAtPosition || { x: 0.0, y: 1.15, z: 0.0 };
    this.fov = options.fov || 24;
    this.near = options.near || 1.8;
    this.far = options.far || 60;
  }

  /**
   * Initializes the reflection pipeline and binds the texture to the mirror mesh.
   */
  init(THREE, scene, mirrorMesh) {
    if (!THREE || !scene) return;
    this.scene = scene;
    this.mirrorMesh = mirrorMesh;

    try {
      const format = (typeof THREE.RGBAFormat !== 'undefined') ? THREE.RGBAFormat : (THREE.RGBFormat || 1022);
      this.renderTarget = new THREE.WebGLRenderTarget(this.resolution, this.resolution, {
        format: format,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter || 1006,
        magFilter: THREE.LinearFilter || 1006
      });

      // True optical planar reflection camera with realistic perspective matching room distance
      this.mirrorCamera = new THREE.PerspectiveCamera(this.fov, 0.62, this.near, this.far);
      if (this.mirrorCamera.position && typeof this.mirrorCamera.position.set === 'function') {
        this.mirrorCamera.position.set(this.mirrorPosition.x, this.mirrorPosition.y, this.mirrorPosition.z);
      }
      if (typeof this.mirrorCamera.lookAt === 'function') {
        this.mirrorCamera.lookAt(this.lookAtPosition.x, this.lookAtPosition.y, this.lookAtPosition.z);
      }
      scene.add(this.mirrorCamera);

      if (this.mirrorMesh) {
        this.bindMirrorMesh(this.mirrorMesh, THREE);
      }
    } catch (err) {
      console.warn('[MirrorReflection] Failed to initialize WebGL render target:', err);
    }
  }

  /**
   * Binds a mirror mesh (either procedural or loaded from GLB) to the reflection texture,
   * generating UV texture coordinates if missing from the mesh geometry.
   */
  bindMirrorMesh(mesh, THREEInstance = null) {
    if (!mesh) return;
    this.mirrorMesh = mesh;

    const THREE = THREEInstance || (typeof window !== 'undefined' ? window.THREE : null);

    // If mesh geometry lacks UVs (like seren_vanity.glb's Mirror_Surface), generate planar UVs
    if (THREE && mesh.geometry && !mesh.geometry.attributes?.uv && mesh.geometry.attributes?.position && typeof THREE.BufferAttribute !== 'undefined') {
      const pos = mesh.geometry.attributes.position;
      if (typeof mesh.geometry.computeBoundingBox === 'function') {
        mesh.geometry.computeBoundingBox();
      }
      const bb = mesh.geometry.boundingBox;
      const minX = bb ? bb.min.x : -0.505;
      const maxX = bb ? bb.max.x : 0.505;
      const minY = bb ? bb.min.y : 0;
      const maxY = bb ? bb.max.y : 1.625;
      const spanX = (maxX - minX) || 1.0;
      const spanY = (maxY - minY) || 1.0;

      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        // Horizontal flip for true optical mirror reflection
        uvs[i * 2] = 1.0 - ((x - minX) / spanX);
        uvs[i * 2 + 1] = (y - minY) / spanY;
      }
      mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    if (this.renderTarget) {
      if (THREE && typeof THREE.MeshBasicMaterial !== 'undefined') {
        mesh.material = new THREE.MeshBasicMaterial({
          map: this.renderTarget.texture,
          toneMapped: false
        });
        mesh.material.map = this.renderTarget.texture;
      } else if (mesh.material) {
        mesh.material.map = this.renderTarget.texture;
        if (mesh.material.color && typeof mesh.material.color.setHex === 'function') {
          mesh.material.color.setHex(0xFFFFFF);
        }
        mesh.material.needsUpdate = true;
      }
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  }

  /**
   * Safely updates the reflection texture using the provided renderer.
   */
  update(renderer, scene, mainCamera = null) {
    if (!renderer || !this.renderTarget || !this.mirrorCamera || this.isContextLost) return;

    if (this.mirrorMesh) {
      this.mirrorMesh.visible = false; // Hide mirror surface to prevent feedback loop
    }

    try {
      // Calculate true optical planar reflection position if main viewer camera is provided
      if (mainCamera && mainCamera.position) {
        const pX = 0.95, pY = 1.45, pZ = -0.15;
        const nX = -0.3144, nY = 0, nZ = 0.9493; // Normal facing into room

        const cX = mainCamera.position.x;
        const cY = mainCamera.position.y;
        const cZ = mainCamera.position.z;

        const vX = cX - pX;
        const vY = cY - pY;
        const vZ = cZ - pZ;

        const dot = vX * nX + vY * nY + vZ * nZ;

        const refX = cX - 2 * dot * nX;
        const refY = cY;
        const refZ = cZ - 2 * dot * nZ;

        if (this.mirrorCamera.position && typeof this.mirrorCamera.position.set === 'function') {
          this.mirrorCamera.position.set(refX, refY, refZ);
        }
        if (typeof this.mirrorCamera.lookAt === 'function') {
          this.mirrorCamera.lookAt(this.lookAtPosition.x, this.lookAtPosition.y, this.lookAtPosition.z);
        }
        this.mirrorCamera.fov = 24;
        this.mirrorCamera.near = Math.max(1.5, dot * 0.85);
        this.mirrorCamera.far = 60.0;
        if (typeof this.mirrorCamera.updateProjectionMatrix === 'function') {
          this.mirrorCamera.updateProjectionMatrix();
        }
      } else {
        if (this.mirrorCamera.position && typeof this.mirrorCamera.position.set === 'function') {
          this.mirrorCamera.position.set(this.mirrorPosition.x, this.mirrorPosition.y, this.mirrorPosition.z);
        }
        if (typeof this.mirrorCamera.lookAt === 'function') {
          this.mirrorCamera.lookAt(this.lookAtPosition.x, this.lookAtPosition.y, this.lookAtPosition.z);
        }
        this.mirrorCamera.far = 60.0;
        if (typeof this.mirrorCamera.updateProjectionMatrix === 'function') {
          this.mirrorCamera.updateProjectionMatrix();
        }
      }

      // Temporarily extend fog distance so the mirror reflection captures the complete room architecture without void fading
      const origFog = scene.fog;
      if (origFog && typeof origFog.color !== 'undefined') {
        const FogClass = (scene.fog && scene.fog.constructor) || (typeof window !== 'undefined' && window.THREE && window.THREE.Fog);
        if (FogClass) {
          scene.fog = new FogClass(origFog.color, 18.0, 60.0);
        }
      }

      renderer.setRenderTarget(this.renderTarget);
      renderer.render(scene, this.mirrorCamera);
      renderer.setRenderTarget(null);

      if (origFog) {
        scene.fog = origFog;
      }
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
