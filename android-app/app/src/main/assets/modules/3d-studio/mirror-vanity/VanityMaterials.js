/**
 * Woobi 3D Studio - Vanity Materials
 * Material definitions for the Calacatta Gold marble tabletop, champagne-brass framing,
 * mirror glass surface, 360° LED halo ring, perfume glass, and bouclé upholstery.
 */

export class VanityMaterials {
  static createMarbleMaterial(THREE, marbleTexture = null, bumpTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: marbleTexture || null,
      bumpMap: bumpTexture || null,
      bumpScale: 0.005,
      roughness: 0.42,
      metalness: 0.02,
      color: 0xCBB18D // Warm beige limestone / travertine (#CBB18D)
    });
  }

  static createLegsMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x362B22, // Deep espresso / dark antique bronze
      roughness: 0.55,
      metalness: 0.40
    });
  }

  static createBrassMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x74583D, // Antique bronze (#74583D)
      metalness: 0.72,
      roughness: 0.35
    });
  }

  static createLedGlowMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0xFFF2D2
    });
  }

  static createMirrorMaterial(THREE, reflectionTexture = null) {
    if (reflectionTexture) {
      if (typeof THREE.MeshBasicMaterial !== 'undefined') {
        return new THREE.MeshBasicMaterial({
          map: reflectionTexture,
          toneMapped: false
        });
      }
      return new THREE.MeshStandardMaterial({
        map: reflectionTexture,
        color: 0xFFFFFF,
        roughness: 0.02,
        metalness: 0.05
      });
    }
    return new THREE.MeshStandardMaterial({
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
      color: 0xE0D6C7, // Cream bouclé matching seren_vanity.glb
      roughness: 0.85,
      metalness: 0.02
    });
  }
}

export default VanityMaterials;
