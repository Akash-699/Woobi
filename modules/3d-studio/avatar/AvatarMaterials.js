/**
 * Woobi - 3D Studio Avatar Module
 * AvatarMaterials.js - PBR Material Definitions and Dynamic Color Updates
 */

export const AVATAR_PALETTE = {
  skinWarmIvory: 0xF3D5C6,
  hairRichEspresso: 0x1E120A,
  lipSatinRosy: 0xCE6F66,
  blushSoftCoral: 0xDE8B80,
  scleraWhite: 0xFAF8F5,
  irisEspresso: 0x2A190E,
  pupilDeepBlack: 0x0A0604,
  catchlightWhite: 0xFFFFFF,
  lashBlack: 0x1A100A,
  browDarkBrown: 0x24160E,
  earringWarmBrass: 0xD4AF37,
  cropTankIvory: 0xF7F5F0,
  trousersSand: 0xD8CBB9,
  sneakersWhite: 0xFFFFFF,
  sneakersSole: 0xF8F8F8,
  hairTieDark: 0x140E0A
};

export class AvatarMaterials {
  constructor(textures = {}, THREE = window.THREE) {
    this.THREE = THREE;
    this.textures = textures || {};
    this.skinMaterials = [];
    this.hairMaterials = [];
    this.disposables = [];

    this.initMaterials();
  }

  initMaterials() {
    const THREE = this.THREE;
    if (!THREE) return;

    // Primary Warm Radiant Ivory Skin Material
    this.skinMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.skinWarmIvory,
      roughness: 0.38,
      metalness: 0.02
    });
    this.skinMaterials.push(this.skinMat);
    this.disposables.push(this.skinMat);

    // Rich Espresso Brown Hair Material
    this.hairMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.hairRichEspresso,
      roughness: 0.28,
      metalness: 0.04
    });
    this.hairMaterials.push(this.hairMat);
    this.disposables.push(this.hairMat);

    // Satin Rosy Lip Material
    this.lipMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.lipSatinRosy,
      roughness: 0.24,
      metalness: 0.02
    });
    this.disposables.push(this.lipMat);

    // Soft Blushing Cheek Material
    this.blushMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.blushSoftCoral,
      roughness: 0.55,
      transparent: true,
      opacity: 0.35
    });
    this.disposables.push(this.blushMat);

    // Eye Anatomy Materials
    this.scleraMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.scleraWhite });
    this.irisMat = new THREE.MeshStandardMaterial({ color: AVATAR_PALETTE.irisEspresso, roughness: 0.22 });
    this.pupilMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.pupilDeepBlack });
    this.glintMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.catchlightWhite });
    this.lashMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.lashBlack });
    this.browMat = new THREE.MeshBasicMaterial({ color: AVATAR_PALETTE.browDarkBrown });
    this.hairMaterials.push(this.browMat);
    this.disposables.push(this.scleraMat, this.irisMat, this.pupilMat, this.glintMat, this.lashMat, this.browMat);

    // Gold Hoop Earring Material
    this.hoopMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.earringWarmBrass,
      metalness: 0.90,
      roughness: 0.20
    });
    this.disposables.push(this.hoopMat);

    // Wearable Crop Tank Top Material
    this.tankMat = new THREE.MeshStandardMaterial({
      map: this.textures.ribbedKnit || null,
      color: AVATAR_PALETTE.cropTankIvory,
      roughness: 0.68,
      metalness: 0.02
    });
    this.disposables.push(this.tankMat);

    // Fluid Tailored Sand Trousers Material
    this.trouserMat = new THREE.MeshStandardMaterial({
      map: this.textures.linenWeave || null,
      color: AVATAR_PALETTE.trousersSand,
      roughness: 0.72,
      metalness: 0.01
    });
    this.disposables.push(this.trouserMat);

    // Chunky Platform Sneakers Materials
    this.sneakerMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.sneakersWhite,
      roughness: 0.32,
      metalness: 0.02
    });
    this.soleMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.sneakersSole,
      roughness: 0.45
    });
    this.disposables.push(this.sneakerMat, this.soleMat);

    // Hair Tie Wrap Material
    this.hairTieMat = new THREE.MeshStandardMaterial({
      color: AVATAR_PALETTE.hairTieDark
    });
    this.disposables.push(this.hairTieMat);
  }

  updateSkinTone(hex) {
    if (!hex || !this.THREE) return;
    const col = new this.THREE.Color(hex);
    this.skinMaterials.forEach((mat) => {
      if (mat && mat.color) {
        mat.color.copy(col);
        mat.needsUpdate = true;
      }
    });
  }

  updateHairColor(hex) {
    if (!hex || !this.THREE) return;
    const col = new this.THREE.Color(hex);
    this.hairMaterials.forEach((mat) => {
      if (mat && mat.color) {
        mat.color.copy(col);
        mat.needsUpdate = true;
      }
    });
  }

  registerSkinMaterial(mat) {
    if (mat && !this.skinMaterials.includes(mat)) {
      this.skinMaterials.push(mat);
    }
  }

  registerHairMaterial(mat) {
    if (mat && !this.hairMaterials.includes(mat)) {
      this.hairMaterials.push(mat);
    }
  }

  dispose() {
    this.disposables.forEach((mat) => {
      if (mat && typeof mat.dispose === 'function') {
        mat.dispose();
      }
    });
    this.disposables = [];
    this.skinMaterials = [];
    this.hairMaterials = [];
  }
}
