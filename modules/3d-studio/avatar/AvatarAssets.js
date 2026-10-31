/**
 * Woobi - 3D Studio Avatar Module
 * AvatarAssets.js - Asynchronous GLB Asset Loader & Fallback Manager
 */

export const AVATAR_ASSET_PATHS = [
  'seren_avatar.glb',
  'assets/models/avatar_female.glb',
  'https://readyplayerme.github.io/visage/female.glb'
];

export class AvatarAssets {
  constructor(materials, THREE = window.THREE) {
    this.THREE = THREE;
    this.materials = materials;
    this.isLoading = false;
    this.isLoaded = false;
    this.activeModel = null;
    this.activeModelUrl = null;
    this.isDisposed = false;
  }

  loadRiggedModel(onSuccess, onError, assetPaths = AVATAR_ASSET_PATHS) {
    const THREE = this.THREE;
    if (!THREE || typeof THREE.GLTFLoader === 'undefined') {
      if (onError) onError(new Error('GLTFLoader not available'));
      return;
    }

    this.isLoading = true;
    const loader = new THREE.GLTFLoader();
    const urls = Array.isArray(assetPaths) ? assetPaths : [assetPaths];

    const tryLoad = (index) => {
      if (this.isDisposed) return;
      if (index >= urls.length) {
        this.isLoading = false;
        if (onError) onError(new Error('All avatar GLB asset paths failed to load.'));
        return;
      }

      const url = urls[index];
      loader.load(
        url,
        (gltf) => {
          if (this.isDisposed) {
            // Clean up to prevent orphaned resources
            if (gltf.scene) {
              gltf.scene.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                  if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
                  else c.material.dispose();
                }
              });
            }
            return;
          }

          const model = gltf.scene;
          model.name = 'GLTFAvatarGroup';

          // Strictly preserve 8cm dais elevation grounding contract
          model.scale.set(0.96, 0.96, 0.96);
          model.position.set(0, 0.080, 0);

          // Apply luxury reference styling and register materials
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.name.includes('Hair')) {
                if (this.materials) {
                  child.material.color = new THREE.Color(0x1E120A);
                  this.materials.registerHairMaterial(child.material);
                }
              } else if (child.name.includes('Head') || child.name.includes('Body')) {
                if (this.materials) {
                  this.materials.registerSkinMaterial(child.material);
                }
              } else if (child.name.includes('Top') || child.name.includes('Shirt')) {
                child.material.color = new THREE.Color(0xF7F5F0);
              } else if (child.name.includes('Bottom') || child.name.includes('Pants')) {
                child.material.color = new THREE.Color(0xD8CBB9);
              } else if (child.name.includes('Footwear') || child.name.includes('Shoes')) {
                child.material.color = new THREE.Color(0xFFFFFF);
              }
            }
          });

          this.activeModel = model;
          this.activeModelUrl = url;
          this.isLoaded = true;
          this.isLoading = false;

          if (onSuccess) onSuccess(model, url);
        },
        undefined,
        (err) => {
          if (this.isDisposed) return;
          console.warn(`AvatarAssets: Model ${url} unavailable, trying next candidate...`);
          tryLoad(index + 1);
        }
      );
    };

    tryLoad(0);
  }

  cancelLoading() {
    this.isDisposed = true;
    this.isLoading = false;
  }

  dispose() {
    this.isDisposed = true;
    this.isLoading = false;
    if (this.activeModel) {
      this.activeModel.traverse((c) => {
        if (c.geometry && typeof c.geometry.dispose === 'function') {
          c.geometry.dispose();
        }
        if (c.material) {
          if (Array.isArray(c.material)) {
            c.material.forEach((m) => m.dispose && m.dispose());
          } else if (typeof c.material.dispose === 'function') {
            c.material.dispose();
          }
        }
      });
      this.activeModel = null;
    }
  }
}
