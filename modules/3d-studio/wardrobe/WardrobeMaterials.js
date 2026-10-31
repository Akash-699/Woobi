/**
 * Woobi 3D Studio - Wardrobe Materials
 * Standardized PBR material configurations for the natural honey-oak wardrobe,
 * warm brass hardware, 3000K LED lighting, luxury storage, garments, and accessories.
 */

export class WardrobeMaterials {
  static createOakMaterial(THREE, woodTexture = null) {
    return new THREE.MeshStandardMaterial({
      map: woodTexture || null,
      color: 0xC89C6A, // Honey natural oak
      roughness: 0.42,
      metalness: 0.02
    });
  }

  static createBrassMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xD4AF37, // Warm satin brass
      metalness: 0.88,
      roughness: 0.24
    });
  }

  static createLedMaterial(THREE) {
    return new THREE.MeshBasicMaterial({
      color: 0xFFF2D0 // Warm 3000K recessed glow
    });
  }

  static createBoxMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xFAF7F2,
      roughness: 0.60
    });
  }

  static createPlantMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x3E5E36,
      roughness: 0.55
    });
  }

  static createPotMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0x3A3632,
      roughness: 0.50
    });
  }

  static createBagMaterial(THREE) {
    return new THREE.MeshStandardMaterial({
      color: 0xFDFBF7,
      roughness: 0.40,
      metalness: 0.02
    });
  }

  static createKnitMaterial(THREE, isCream = true) {
    return new THREE.MeshStandardMaterial({
      color: isCream ? 0xF3EFE6 : 0x8C8984,
      roughness: 0.85
    });
  }
}

export default WardrobeMaterials;
