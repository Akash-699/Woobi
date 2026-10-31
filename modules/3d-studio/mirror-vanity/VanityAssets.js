/**
 * Woobi 3D Studio - Vanity Assets
 * Asynchronous GLTF/GLB loader for the authentic Seren Luxury Vanity and Arched Mirror,
 * with error handling and fallback resolution.
 */

export const VANITY_ASSET_PATHS = [
  'seren_vanity.glb',
  '3D - Vanity/seren_vanity.glb'
];

export class VanityAssets {
  /**
   * Loads authentic GLB vanity model.
   * @param {Object} THREE Three.js global instance
   * @param {Function} onLoaded Callback when model is loaded
   * @param {Function} onError Callback if all asset paths fail
   */
  static loadVanityGLB(THREE, onLoaded, onError) {
    if (!THREE || typeof THREE.GLTFLoader === 'undefined') {
      if (typeof onError === 'function') onError(new Error('GLTFLoader not available'));
      return;
    }

    const gltfLoader = new THREE.GLTFLoader();

    const tryLoad = (idx) => {
      if (idx >= VANITY_ASSET_PATHS.length) {
        if (typeof onError === 'function') onError(new Error('All vanity GLB paths failed'));
        return;
      }

      gltfLoader.load(
        VANITY_ASSET_PATHS[idx],
        (gltf) => {
          const model = gltf.scene;
          model.position.set(0, 0, 0);

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          if (typeof onLoaded === 'function') onLoaded(model);
        },
        undefined,
        () => tryLoad(idx + 1)
      );
    };

    tryLoad(0);
  }
}

export default VanityAssets;
