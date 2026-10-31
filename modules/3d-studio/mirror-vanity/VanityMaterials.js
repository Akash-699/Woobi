/**
 * Woobi 3D Studio - Vanity Materials
 * Material definitions for the Calacatta Gold marble tabletop, champagne-brass framing,
 * mirror glass surface, 360° LED halo ring, perfume glass, and bouclé upholstery.
 */

export class VanityMaterials {
  static createMarbleMaterial(THREE, marbleTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: marbleTexture || null,
      roughness: 0.22,
      metalness: 0.02,
      color: 0xFCFAF6
    });
  }

  static createBrassMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xD4AF37, // Warm champagne satin brass
      metalness: 0.88,
      roughness: 0.22
    });
  }

  static createLedGlowMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0xFFF2D2
    });
  }

  static createMirrorMaterial(THREE, reflectionTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: reflectionTexture || null,
      color: 0xEAE6DE,
      roughness: 0.04,
      metalness: 0.94
    });
  }

  static createMirrorBackMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x2A241E,
      roughness: 0.60
    });
  }

  static createGlassMaterial(THREE, isAmber = false) {
    if (isAmber) {
      return new THREE.MeshStandardMaterial({
        color: 0xC88546,
        roughness: 0.12,
        metalness: 0.20,
        transparent: true,
        opacity: 0.85
      });
    }
    return new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.08,
      metalness: 0.15,
      transparent: true,
      opacity: 0.75
    });
  }

  static createBoucleMaterial(THREE, wovenTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: wovenTexture || null,
      color: 0xF5F0E6,
      roughness: 0.84,
      metalness: 0.02
    });
  }
}

export default VanityMaterials;
