/**
 * Woobi 3D Studio - Wardrobe Model
 * Encapsulates the natural honey-oak wardrobe furniture, Astra GLB model loader,
 * shelves, hanging garment rails, accessories, point lights, and hit boxes.
 */

import { WardrobeMaterials } from './WardrobeMaterials.js';
import { WardrobeAssets } from './WardrobeAssets.js';
import { WardrobeAnimations } from './WardrobeAnimations.js';

export const WARDROBE_CONFIG = {
  scale: 2.40 / 3.00,
  width: 2.20 * (2.40 / 3.00),
  height: 3.00 * (2.40 / 3.00),
  depth: 0.65 * (2.40 / 3.00),
  position: { x: -1.20, y: 0, z: -2.40 },
  rotationY: 0.35
};

export class WardrobeModel {
  constructor(options = {}) {
    this.config = Object.assign({}, WARDROBE_CONFIG, options);
    this.group = null;
    this.disposables = [];
    this.interactiveObjects = [];
    this.animations = new WardrobeAnimations();
    this.isGLBLoaded = false;
  }

  /**
   * Builds the wardrobe hierarchy and mounts it to the scene.
   */
  build(scene, textures = {}, THREEInstance = (typeof window !== 'undefined' ? window.THREE : null)) {
    const THREE = THREEInstance;
    if (!THREE || !scene) {
      throw new Error('[WardrobeModel] THREE or scene missing during wardrobe build.');
    }

    this.group = new THREE.Group();
    this.group.name = 'woobi_wardrobe_root';
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.y = this.config.rotationY;

    const { width, height, depth, scale } = this.config;

    // 1. Raycastable hit box for touch / click interaction
    const hitGeo = new THREE.BoxGeometry(width + 0.2, height, depth + 0.3);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitGeo, hitMat);
    hitBox.position.set(0, height / 2, 0);
    hitBox.userData = { interactiveType: 'wardrobe', name: 'Built-in Oak Wardrobe' };
    this.group.add(hitBox);
    this.interactiveObjects.push(hitBox);
    this.disposables.push(hitGeo, hitMat);

    // 2. Procedural Built-In Natural Oak Wardrobe
    const proceduralGroup = new THREE.Group();
    proceduralGroup.name = 'procedural_wardrobe';

    const oakMat = WardrobeMaterials.createOakMaterial(THREE, textures.oak, textures.oakBump);
    const brassMat = WardrobeMaterials.createBrassMaterial(THREE);
    const ledMat = WardrobeMaterials.createLedMaterial(THREE);
    this.disposables.push(oakMat, brassMat, ledMat);

    // Outer Frame
    const topCapGeo = new THREE.BoxGeometry(width, 0.040, depth);
    const topCap = new THREE.Mesh(topCapGeo, oakMat);
    topCap.position.set(0, height - 0.020, 0);
    topCap.castShadow = true;
    proceduralGroup.add(topCap);
    this.disposables.push(topCapGeo);

    const sideGeo = new THREE.BoxGeometry(0.040, height, depth);
    const leftSide = new THREE.Mesh(sideGeo, oakMat);
    leftSide.position.set(-width / 2 + 0.020, height / 2, 0);
    leftSide.castShadow = true;
    proceduralGroup.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, oakMat);
    rightSide.position.set(width / 2 - 0.020, height / 2, 0);
    rightSide.castShadow = true;
    proceduralGroup.add(rightSide);
    this.disposables.push(sideGeo);

    const backGeo = new THREE.BoxGeometry(width - 0.08, height - 0.04, 0.02);
    const backBoard = new THREE.Mesh(backGeo, oakMat);
    backBoard.position.set(0, height / 2, -depth / 2 + 0.01);
    backBoard.receiveShadow = true;
    proceduralGroup.add(backBoard);
    this.disposables.push(backGeo);

    const plinthGeo = new THREE.BoxGeometry(width, 0.12, depth - 0.04);
    const plinth = new THREE.Mesh(plinthGeo, oakMat);
    plinth.position.set(0, 0.06, 0.02);
    proceduralGroup.add(plinth);
    this.disposables.push(plinthGeo);

    // Shelves with integrated warm LED glow strips
    const shelfYPositions = [0.12, 0.52, 0.94, 1.34, 2.22];
    const shelfGeo = new THREE.BoxGeometry(width - 0.08, 0.030, depth - 0.02);
    this.disposables.push(shelfGeo);

    shelfYPositions.forEach((shY) => {
      const shelf = new THREE.Mesh(shelfGeo, oakMat);
      shelf.position.set(0, shY, 0);
      shelf.receiveShadow = true;
      shelf.castShadow = true;
      proceduralGroup.add(shelf);

      if (shY > 0.12) {
        const ledStripGeo = new THREE.BoxGeometry(width - 0.09, 0.010, 0.032);
        const ledStrip = new THREE.Mesh(ledStripGeo, ledMat);
        ledStrip.position.set(0, shY - 0.020, 0.08);
        proceduralGroup.add(ledStrip);
        this.disposables.push(ledStripGeo);
      }
    });

    // Internal shelf warm point lights
    if (typeof THREE.PointLight !== 'undefined') {
      const shelfLight1 = new THREE.PointLight(0xFFA834, 1.15, 2.8);
      shelfLight1.position.set(0, 2.15, 0.14);
      proceduralGroup.add(shelfLight1);

      const shelfLight2 = new THREE.PointLight(0xFFA834, 0.90, 2.2);
      shelfLight2.position.set(0, 1.25, 0.14);
      proceduralGroup.add(shelfLight2);
    }

    // Top Shelf Luxury White Box with Brass Pull
    const boxMat = WardrobeMaterials.createBoxMaterial(THREE);
    const boxGeo = new THREE.BoxGeometry(0.32, 0.18, 0.36);
    const topBox = new THREE.Mesh(boxGeo, boxMat);
    topBox.position.set(-0.25, 2.33, 0);
    topBox.castShadow = true;
    proceduralGroup.add(topBox);
    this.disposables.push(boxMat, boxGeo);

    // Main clothing rail
    const railGeo = new THREE.CylinderGeometry(0.011, 0.011, width - 0.08, 16);
    const rail = new THREE.Mesh(railGeo, brassMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.12, 0);
    rail.castShadow = true;
    proceduralGroup.add(rail);
    this.disposables.push(railGeo);

    this.group.add(proceduralGroup);

    // 3. Attempt to load authentic Astra 3D GLB wardrobe
    WardrobeAssets.loadAstraWardrobe(
      THREE,
      scale,
      (model) => {
        this.group.add(model);
        this.isGLBLoaded = true;
        proceduralGroup.visible = false;
      },
      () => {
        // Procedural group remains visible as primary representation
        this.isGLBLoaded = false;
      }
    );

    scene.add(this.group);
    return this.group;
  }

  openDoors() {
    this.animations.open();
  }

  closeDoors() {
    this.animations.close();
  }

  toggleDoors() {
    this.animations.toggle();
  }

  getWardrobeState() {
    return {
      isGLBLoaded: this.isGLBLoaded,
      ...this.animations.getState()
    };
  }

  dispose(scene) {
    if (this.group && scene) {
      scene.remove(this.group);
    }
    this.disposables.forEach(d => {
      if (d && typeof d.dispose === 'function') {
        d.dispose();
      }
    });
    this.disposables = [];
    this.interactiveObjects = [];
    this.group = null;
  }
}

export default WardrobeModel;
