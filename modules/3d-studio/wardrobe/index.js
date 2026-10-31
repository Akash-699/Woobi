/**
 * Woobi 3D Studio - Wardrobe Submodule Public Interface
 */

import { WardrobeModel, WARDROBE_CONFIG } from './WardrobeModel.js';
import { WardrobeMaterials } from './WardrobeMaterials.js';
import { WardrobeAnimations } from './WardrobeAnimations.js';
import { WardrobeAssets } from './WardrobeAssets.js';

export {
  WardrobeModel,
  WARDROBE_CONFIG,
  WardrobeMaterials,
  WardrobeAnimations,
  WardrobeAssets
};

/**
 * Convenience factory to create and mount the 3D wardrobe in the scene.
 */
export function createWardrobe(scene, textures, THREE) {
  const wardrobe = new WardrobeModel();
  wardrobe.build(scene, textures, THREE);
  return wardrobe;
}

export const WardrobeContract = {
  WardrobeModel,
  WARDROBE_CONFIG,
  WardrobeMaterials,
  WardrobeAnimations,
  WardrobeAssets,
  createWardrobe
};

if (typeof window !== 'undefined') {
  window.WoobiWardrobe = WardrobeContract;
}

export default WardrobeContract;
