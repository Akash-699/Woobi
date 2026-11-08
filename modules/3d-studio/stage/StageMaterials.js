/**
 * Woobi 3D Studio - Stage Materials
 * Reusable material definitions for the 8.0 cm elevated circular fashion dais,
 * contact shadow disc, stitched trim, and rotation guide arcs.
 */

export class StageMaterials {
  static createShadowMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0x22180F,
      transparent: true,
      opacity: 0.30
    });
  }

  static createDaisMaterial(THREE, wovenTexture = null, bumpTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: wovenTexture || null,
      bumpMap: bumpTexture || null,
      bumpScale: 0.012,
      roughness: 0.70,
      metalness: 0.02,
      color: 0xD2BEA0 // Champagne stone (#D2BEA0)
    });
  }

  static createTrimMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xCBB18D, // Warm beige architectural trim (#CBB18D)
      roughness: 0.82
    });
  }

  static createShagRugMaterial(THREE, shagTexture = null, bumpTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: shagTexture || null,
      bumpMap: bumpTexture || null,
      bumpScale: 0.018,
      roughness: 0.92,
      metalness: 0.0,
      color: 0xFFFFFF,
      transparent: true,
      alphaTest: 0.02
    });
  }

  static createRotationArcMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.60
    });
  }
}

export default StageMaterials;
