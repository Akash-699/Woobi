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

  static createDaisMaterial(THREE, wovenTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: wovenTexture || null,
      roughness: 0.82,
      metalness: 0.01,
      color: 0xF2ECE2
    });
  }

  static createTrimMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xDFD6C8,
      roughness: 0.85
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
