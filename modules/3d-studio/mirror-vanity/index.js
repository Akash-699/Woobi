/**
 * Woobi 3D Studio - Mirror & Vanity Submodule Public Interface
 */

import { VanityModel, VANITY_CONFIG } from './VanityModel.js';
import { VanityMaterials } from './VanityMaterials.js';
import { VanityAssets } from './VanityAssets.js';
import { MirrorReflection } from './MirrorReflection.js';
import { VanityLighting } from './VanityLighting.js';

export {
  VanityModel,
  VANITY_CONFIG,
  VanityMaterials,
  VanityAssets,
  MirrorReflection,
  VanityLighting
};

/**
 * Convenience factory to create and mount the mirror & vanity in the 3D scene.
 */
export function createVanity(scene, textures, THREE) {
  const vanity = new VanityModel();
  vanity.build(scene, textures, THREE);
  return vanity;
}

export const VanityContract = {
  VanityModel,
  VANITY_CONFIG,
  VanityMaterials,
  VanityAssets,
  MirrorReflection,
  VanityLighting,
  createVanity
};

if (typeof window !== 'undefined') {
  window.WoobiVanity = VanityContract;
}

export default VanityContract;
