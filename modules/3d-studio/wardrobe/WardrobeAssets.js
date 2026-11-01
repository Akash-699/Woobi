/**
 * Woobi 3D Studio - Wardrobe Assets
 * Handles GLTF/GLB asset loading, Astra styling pipeline integration,
 * and graceful fallback resolution for the 3D wardrobe.
 */

export const WARDROBE_ASSET_PATHS = [
  '3D- Wardrobe by Astra/wardrobe.glb',
  'wardrobe.glb'
];

export class WardrobeAssets {
  /**
   * Attempts to load authentic Astra GLB wardrobe asset.
   * @param {Object} THREE Three.js global instance
   * @param {number} scale Normalization scale factor
   * @param {Function} onLoaded Callback when GLB is successfully loaded and styled
   * @param {Function} onError Callback if all GLB paths fail
   */
  static loadAstraWardrobe(THREE, scale, onLoaded, onError) {
    if (!THREE || typeof THREE.GLTFLoader === 'undefined') {
      if (typeof onError === 'function') onError(new Error('GLTFLoader not available'));
      return;
    }

    const gltfLoader = new THREE.GLTFLoader();

    const tryLoad = (idx) => {
      if (idx >= WARDROBE_ASSET_PATHS.length) {
        if (typeof onError === 'function') onError(new Error('All wardrobe GLB paths failed'));
        return;
      }

      gltfLoader.load(
        WARDROBE_ASSET_PATHS[idx],
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(scale, scale, scale);
          model.position.set(0, 0, 0);
          model.rotation.y = Math.PI;

          // Apply authentic 100% matched Astra materials & styling pipeline
          if (typeof window !== 'undefined') {
            const styling = window.AstraWardrobeStyling;
            if (styling && typeof styling.applyMaterials === 'function') {
              styling.applyMaterials(model);
            }
          }

          if (typeof onLoaded === 'function') onLoaded(model);
        },
        undefined,
        () => tryLoad(idx + 1)
      );
    };

    tryLoad(0);
  }
}

export default WardrobeAssets;
