/**
 * SÉRÉN STUDIO — WARDROBE 3D COMPONENT (STEP 1)
 * High-Fidelity, Production-Grade 3D Natural Light-Oak Cupboard
 * Featuring Volumetric Garments, Storage Boxes, Trailing Ivy, Handbag,
 * Folded Knitwear, Footwear Collection, and Integrated 3000K LED Lighting.
 *
 * Modular & reusable component designed for Three.js / React Three Fiber pipelines.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Wardrobe3D = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class Wardrobe3D {
    /**
     * @param {Object} options
     * @param {number} [options.width=2.20] - Wardrobe width in meters
     * @param {number} [options.height=2.95] - Wardrobe height in meters
     * @param {number} [options.depth=0.65] - Wardrobe depth in meters
     * @param {number} [options.panelThickness=0.038] - Solid oak panel thickness
     * @param {boolean} [options.enableLights=true] - Enable integrated LED lights
     * @param {number} [options.ledIntensity=1.0] - Base intensity multiplier for 3000K LEDs
     */
    constructor(options = {}) {
      this.width = options.width || 2.20;
      this.height = options.height || 2.95;
      this.depth = options.depth || 0.65;
      this.panelThickness = options.panelThickness || 0.038;
      this.enableLights = options.enableLights !== false;
      this.ledIntensity = options.ledIntensity !== undefined ? options.ledIntensity : 1.0;

      this.group = new THREE.Group();
      this.group.name = 'Wardrobe3D_Root';

      this.textures = {};
      this.materials = {};
      this.ledLights = [];
      this.ledStrips = [];
      this.garmentGroup = new THREE.Group();
      this.garmentGroup.name = 'Hanging_Garments';

      this.initTextures();
      this.initMaterials();
      this.buildStructure();
      this.buildUpperShelves();
      this.buildClothingSection();
      this.buildMiddleDisplay();
      this.buildLowerShelves();
      this.buildDrawersSection();
      this.buildFootwearDisplay();
      this.buildIntegratedLighting();
    }

    /**
     * Creates high-resolution procedural textures for physically based rendering
     */
    initTextures() {
      // 1. Natural Light Honey Oak Grain (512x1024)
      const oakCanvas = document.createElement('canvas');
      oakCanvas.width = 512;
      oakCanvas.height = 1024;
      const oCtx = oakCanvas.getContext('2d');
      oCtx.fillStyle = '#C89D6C'; // Warm natural oak base
      oCtx.fillRect(0, 0, 512, 1024);

      // Fine grain pores and organic growth lines
      for (let y = 0; y < 1024; y += 3) {
        oCtx.strokeStyle = Math.random() > 0.4 ? 'rgba(145, 95, 50, 0.14)' : 'rgba(215, 185, 145, 0.22)';
        oCtx.lineWidth = 1.4;
        oCtx.beginPath();
        oCtx.moveTo(0, y);
        oCtx.bezierCurveTo(
          128, y + Math.sin(y * 0.03) * 6,
          384, y - Math.sin(y * 0.02) * 5,
          512, y
        );
        oCtx.stroke();
      }
      this.textures.oak = new THREE.CanvasTexture(oakCanvas);
      this.textures.oak.wrapS = THREE.RepeatWrapping;
      this.textures.oak.wrapT = THREE.RepeatWrapping;
      this.textures.oak.repeat.set(2, 3);

      // 2. Fine Linen / Cotton Weave (256x256)
      const linenCanvas = document.createElement('canvas');
      linenCanvas.width = 256;
      linenCanvas.height = 256;
      const lCtx = linenCanvas.getContext('2d');
      lCtx.fillStyle = '#FFFFFF';
      lCtx.fillRect(0, 0, 256, 256);
      lCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      lCtx.lineWidth = 1;
      for (let i = 0; i < 256; i += 3) {
        lCtx.beginPath();
        lCtx.moveTo(i, 0);
        lCtx.lineTo(i, 256);
        lCtx.stroke();
        lCtx.beginPath();
        lCtx.moveTo(0, i);
        lCtx.lineTo(256, i);
        lCtx.stroke();
      }
      this.textures.linen = new THREE.CanvasTexture(linenCanvas);
      this.textures.linen.wrapS = THREE.RepeatWrapping;
      this.textures.linen.wrapT = THREE.RepeatWrapping;
      this.textures.linen.repeat.set(6, 6);

      // 3. Ribbed Knitwear Texture (128x256)
      const ribCanvas = document.createElement('canvas');
      ribCanvas.width = 128;
      ribCanvas.height = 256;
      const rCtx = ribCanvas.getContext('2d');
      rCtx.fillStyle = '#FFFFFF';
      rCtx.fillRect(0, 0, 128, 256);
      for (let x = 0; x < 128; x += 4) {
        rCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        rCtx.fillRect(x, 0, 2, 256);
      }
      this.textures.ribbed = new THREE.CanvasTexture(ribCanvas);
      this.textures.ribbed.wrapS = THREE.RepeatWrapping;
      this.textures.ribbed.wrapT = THREE.RepeatWrapping;
      this.textures.ribbed.repeat.set(8, 4);

      // 4. Subtle Pinstripe Shirt Pattern (128x256)
      const stripeCanvas = document.createElement('canvas');
      stripeCanvas.width = 128;
      stripeCanvas.height = 256;
      const sCtx = stripeCanvas.getContext('2d');
      sCtx.fillStyle = '#FAF8F5';
      sCtx.fillRect(0, 0, 128, 256);
      sCtx.fillStyle = 'rgba(90, 105, 120, 0.35)';
      for (let x = 0; x < 128; x += 8) {
        sCtx.fillRect(x, 0, 1.5, 256);
      }
      this.textures.pinstripe = new THREE.CanvasTexture(stripeCanvas);
      this.textures.pinstripe.wrapS = THREE.RepeatWrapping;
      this.textures.pinstripe.wrapT = THREE.RepeatWrapping;
      this.textures.pinstripe.repeat.set(10, 4);
    }

    /**
     * Instantiates physically based materials with realistic roughness and metalness
     */
    initMaterials() {
      // Solid Natural Light Oak
      this.materials.oak = new THREE.MeshStandardMaterial({
        map: this.textures.oak,
        color: 0xCF9E6B,
        roughness: 0.44,
        metalness: 0.02
      });

      // Warm Brushed Champagne Brass
      this.materials.brass = new THREE.MeshStandardMaterial({
        color: 0xD6B477,
        metalness: 0.88,
        roughness: 0.22
      });

      // Warm White LED Linear Acrylic Diffuser (3000K Soft Glow)
      this.materials.ledDiffuser = new THREE.MeshBasicMaterial({
        color: 0xFFF0D4
      });

      // Luxury Matte Ceramic
      this.materials.ceramic = new THREE.MeshStandardMaterial({
        color: 0xECE7DC,
        roughness: 0.52,
        metalness: 0.03
      });

      // Luxury Structured Leather (Handbag & Footwear)
      this.materials.leatherWhite = new THREE.MeshStandardMaterial({
        color: 0xFAF7F2,
        roughness: 0.35,
        metalness: 0.02
      });
      this.materials.leatherBeige = new THREE.MeshStandardMaterial({
        color: 0xD8C4B0,
        roughness: 0.40,
        metalness: 0.02
      });
      this.materials.leatherLoafer = new THREE.MeshStandardMaterial({
        color: 0xF2ECE2,
        roughness: 0.38,
        metalness: 0.02
      });

      // Plant Foliage
      this.materials.leaf = new THREE.MeshStandardMaterial({
        color: 0x3E5E36,
        roughness: 0.55,
        metalness: 0.04
      });
      this.materials.leafDark = new THREE.MeshStandardMaterial({
        color: 0x2E4A28,
        roughness: 0.52,
        metalness: 0.04
      });

      // Garment Fabrics
      this.materials.poplinWhite = new THREE.MeshStandardMaterial({
        map: this.textures.linen,
        color: 0xFAF8F5,
        roughness: 0.72,
        metalness: 0.01
      });
      this.materials.silkCream = new THREE.MeshStandardMaterial({
        color: 0xF4ECE1,
        roughness: 0.46,
        metalness: 0.03
      });
      this.materials.linenBeige = new THREE.MeshStandardMaterial({
        map: this.textures.linen,
        color: 0xD4C5B2,
        roughness: 0.78,
        metalness: 0.01
      });
      this.materials.cardiganCamel = new THREE.MeshStandardMaterial({
        map: this.textures.ribbed,
        color: 0xC0A180,
        roughness: 0.84,
        metalness: 0.01
      });
      this.materials.shirtPinstripe = new THREE.MeshStandardMaterial({
        map: this.textures.pinstripe,
        roughness: 0.70,
        metalness: 0.01
      });
      this.materials.blazerGrey = new THREE.MeshStandardMaterial({
        color: 0x565961,
        roughness: 0.75,
        metalness: 0.02
      });
      this.materials.blazerCharcoal = new THREE.MeshStandardMaterial({
        color: 0x2A2C31,
        roughness: 0.78,
        metalness: 0.02
      });
      this.materials.knitCream = new THREE.MeshStandardMaterial({
        map: this.textures.ribbed,
        color: 0xF3EFE6,
        roughness: 0.88,
        metalness: 0.01
      });
      this.materials.knitBeige = new THREE.MeshStandardMaterial({
        map: this.textures.ribbed,
        color: 0xC6B8A5,
        roughness: 0.88,
        metalness: 0.01
      });
      this.materials.knitGrey = new THREE.MeshStandardMaterial({
        map: this.textures.ribbed,
        color: 0x8C8984,
        roughness: 0.88,
        metalness: 0.01
      });
    }

    /**
     * 1. Cupboard Architecture & Solid Oak Frame
     * Outer shell, interior backing, and solid horizontal shelves
     */
    buildStructure() {
      const { width, height, depth, panelThickness } = this;
      const t = panelThickness;
      const oak = this.materials.oak;

      const frameGroup = new THREE.Group();
      frameGroup.name = 'Cupboard_Frame';

      // Top Header Panel
      const topPanel = new THREE.Mesh(new THREE.BoxGeometry(width, t, depth), oak);
      topPanel.position.set(0, height - t / 2, 0);
      topPanel.castShadow = true;
      topPanel.receiveShadow = true;
      frameGroup.add(topPanel);

      // Solid Left Upright Panel
      const leftUpright = new THREE.Mesh(new THREE.BoxGeometry(t, height, depth), oak);
      leftUpright.position.set(-width / 2 + t / 2, height / 2, 0);
      leftUpright.castShadow = true;
      leftUpright.receiveShadow = true;
      frameGroup.add(leftUpright);

      // Solid Right Upright Panel
      const rightUpright = new THREE.Mesh(new THREE.BoxGeometry(t, height, depth), oak);
      rightUpright.position.set(width / 2 - t / 2, height / 2, 0);
      rightUpright.castShadow = true;
      rightUpright.receiveShadow = true;
      frameGroup.add(rightUpright);

      // Flush Interior Backing Panel
      const backPanel = new THREE.Mesh(
        new THREE.BoxGeometry(width - t * 2, height - t * 2, 0.022),
        oak
      );
      backPanel.position.set(0, height / 2, -depth / 2 + 0.011);
      backPanel.receiveShadow = true;
      frameGroup.add(backPanel);

      // Base Kickplate Plinth
      const plinthHeight = 0.12;
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(width, plinthHeight, depth - 0.03),
        oak
      );
      plinth.position.set(0, plinthHeight / 2, 0.015);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      frameGroup.add(plinth);

      // Horizontal Shelf Tiers
      // Shelf heights (y):
      // - 0.12: Bottom footwear shelf
      // - 0.52: Footwear top / Drawers bottom
      // - 0.88: Drawers top / Folded clothes shelf
      // - 1.28: Folded clothes top / Middle Handbag display shelf
      // - 2.40: Hanging rail top / Upper storage shelf
      this.shelfYCoords = [0.12, 0.52, 0.88, 1.28, 2.40];
      const shelfWidth = width - t * 2;
      const shelfDepth = depth - 0.02;

      this.shelfYCoords.forEach((shY) => {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(shelfWidth, t, shelfDepth),
          oak
        );
        shelf.position.set(0, shY, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        frameGroup.add(shelf);
      });

      this.group.add(frameGroup);
    }

    /**
     * 2. Upper Storage Compartment
     * White luxury storage box with gold ring pull, neutral box, and lush trailing ivy
     */
    buildUpperShelves() {
      const upperGroup = new THREE.Group();
      upperGroup.name = 'Upper_Storage';
      const baseY = 2.40 + this.panelThickness;

      // Box 1: White Luxury Structured Storage Box with Lid & Brass Drop-Ring
      const box1Group = new THREE.Group();
      box1Group.position.set(-0.55, baseY, 0.02);

      const b1Body = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.32, 0.44),
        this.materials.leatherWhite
      );
      b1Body.position.y = 0.16;
      b1Body.castShadow = true;
      box1Group.add(b1Body);

      // Beveled Box Lid
      const b1Lid = new THREE.Mesh(
        new THREE.BoxGeometry(0.57, 0.045, 0.46),
        this.materials.leatherWhite
      );
      b1Lid.position.y = 0.32 + 0.022;
      b1Lid.castShadow = true;
      box1Group.add(b1Lid);

      // Brass Circular Drop-Ring Pull
      const ringPull = new THREE.Mesh(
        new THREE.TorusGeometry(0.026, 0.004, 12, 24),
        this.materials.brass
      );
      ringPull.position.set(0, 0.16, 0.225);
      box1Group.add(ringPull);

      const ringMount = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.012, 12),
        this.materials.brass
      );
      ringMount.rotation.x = Math.PI / 2;
      ringMount.position.set(0, 0.185, 0.224);
      box1Group.add(ringMount);
      upperGroup.add(box1Group);

      // Box 2: Medium Neutral Storage Box
      const box2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.28, 0.40),
        new THREE.MeshStandardMaterial({ color: 0xE5DFD5, roughness: 0.60 })
      );
      box2.position.set(0.08, baseY + 0.14, 0.02);
      box2.castShadow = true;
      upperGroup.add(box2);

      // Box 2 Lid with pull tab
      const box2Lid = new THREE.Mesh(
        new THREE.BoxGeometry(0.40, 0.038, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xDCD5C9, roughness: 0.58 })
      );
      box2Lid.position.set(0.08, baseY + 0.28 + 0.019, 0.02);
      upperGroup.add(box2Lid);

      // 3. Trailing Green Potted Ivy Plant on Far Right
      const plantGroup = new THREE.Group();
      plantGroup.position.set(0.68, baseY, 0.08);

      // Matte Ceramic Planter Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.09, 0.22, 28),
        this.materials.ceramic
      );
      pot.position.y = 0.11;
      pot.castShadow = true;
      plantGroup.add(pot);

      // Organic soil bed
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.02, 24),
        new THREE.MeshStandardMaterial({ color: 0x251C14, roughness: 0.95 })
      );
      soil.position.y = 0.21;
      plantGroup.add(soil);

      // Top Leaf Canopy
      for (let p = 0; p < 18; p++) {
        const topLeaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.042, 8, 8),
          p % 2 === 0 ? this.materials.leaf : this.materials.leafDark
        );
        topLeaf.scale.set(1.5, 0.20, 0.95);
        topLeaf.rotation.set(-0.2 + Math.sin(p) * 0.3, p * 0.4, 0.2);
        topLeaf.position.set(
          Math.cos(p * 0.55) * 0.10,
          0.22 + Math.sin(p * 0.3) * 0.04,
          Math.sin(p * 0.55) * 0.10
        );
        plantGroup.add(topLeaf);
      }

      // Cascading Trailing Vines with detailed drooping leaves
      const vineConfigs = [
        { len: 0.65, angle: 0.2, x: 0.08, z: 0.06 },
        { len: 0.52, angle: -0.3, x: 0.04, z: 0.09 },
        { len: 0.78, angle: 0.5, x: 0.09, z: 0.02 },
        { len: 0.45, angle: -0.1, x: -0.02, z: 0.10 },
        { len: 0.85, angle: 0.8, x: 0.11, z: -0.02 } // Drapes over side upright
      ];

      vineConfigs.forEach((vc) => {
        const vine = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0035, 0.002, vc.len, 8),
          this.materials.leafDark
        );
        vine.position.set(vc.x, 0.10 - vc.len / 2, vc.z);
        vine.rotation.z = vc.angle * 0.15;
        plantGroup.add(vine);

        const leafCount = Math.floor(vc.len * 18);
        for (let l = 0; l < leafCount; l++) {
          const lY = 0.10 - (l / leafCount) * vc.len;
          const leaf = new THREE.Mesh(
            new THREE.SphereGeometry(0.026, 6, 6),
            l % 2 === 0 ? this.materials.leaf : this.materials.leafDark
          );
          leaf.scale.set(1.4, 0.16, 0.85);
          const sideOffset = (l % 2 === 0 ? 0.028 : -0.028);
          leaf.position.set(vc.x + sideOffset, lY, vc.z + 0.012);
          leaf.rotation.set(0.2, (l * 0.7), -sideOffset * 5);
          plantGroup.add(leaf);
        }
      });

      upperGroup.add(plantGroup);
      this.group.add(upperGroup);
    }

    /**
     * 3. Central Clothing Rail & Realistic 3D Garments
     * Brass rail with mounting sockets and 9 realistic garments on wooden hangers:
     * 3 white/ivory shirts, 2 beige garments, 2 neutral jackets, 1 striped shirt, 1 dark charcoal
     */
    buildClothingSection() {
      const railY = 2.32;
      const { width, depth, panelThickness } = this;
      const t = panelThickness;
      const railWidth = width - t * 2 - 0.04;

      // Solid Brushed Brass Rail
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, railWidth, 24),
        this.materials.brass
      );
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, railY, 0);
      rail.castShadow = true;
      this.group.add(rail);

      // Heavy Brass End Mount Flanges
      [-railWidth / 2, railWidth / 2].forEach((xPos) => {
        const flange = new THREE.Mesh(
          new THREE.CylinderGeometry(0.038, 0.038, 0.025, 24),
          this.materials.brass
        );
        flange.rotation.z = Math.PI / 2;
        flange.position.set(xPos, railY, 0);
        this.group.add(flange);
      });

      // 9 Volumetric Hanging Garments (Target contents strictly matching user requirements)
      const garmentSpecs = [
        // 1. Crisp White Button-down Shirt
        { x: -0.80, mat: this.materials.poplinWhite, len: 0.72, type: 'shirt', collar: 'spread' },
        // 2. Off-white Draped Silk Blouse
        { x: -0.60, mat: this.materials.silkCream, len: 0.68, type: 'blouse', collar: 'band' },
        // 3. Light Beige Linen Overshirt
        { x: -0.40, mat: this.materials.linenBeige, len: 0.74, type: 'shirt', collar: 'spread' },
        // 4. Subtle Pinstripe Shirt
        { x: -0.20, mat: this.materials.shirtPinstripe, len: 0.70, type: 'shirt', collar: 'spread' },
        // 5. Crisp White Poplin Dress Shirt
        { x: 0.00, mat: this.materials.poplinWhite, len: 0.73, type: 'shirt', collar: 'classic' },
        // 6. Beige Draped Fine-Knit Cardigan
        { x: 0.20, mat: this.materials.cardiganCamel, len: 0.76, type: 'cardigan', collar: 'shawl' },
        // 7. Neutral Sand/Camel Structured Blazer
        { x: 0.40, mat: this.materials.linenBeige, len: 0.80, type: 'blazer', collar: 'lapel' },
        // 8. Soft Heather Grey Tailored Jacket
        { x: 0.60, mat: this.materials.blazerGrey, len: 0.82, type: 'blazer', collar: 'lapel' },
        // 9. Dark Charcoal Tailored Garment
        { x: 0.80, mat: this.materials.blazerCharcoal, len: 0.84, type: 'blazer', collar: 'lapel' }
      ];

      garmentSpecs.forEach((spec, index) => {
        const hangerItem = this.createVolumetricGarment(spec, index);
        hangerItem.position.set(spec.x, railY, 0);
        this.garmentGroup.add(hangerItem);
      });

      this.group.add(this.garmentGroup);
    }

    /**
     * Creates a fully volumetric 3D garment with wooden hanger, collar, shoulders, sleeves, and drapery
     */
    createVolumetricGarment(spec, index) {
      const g = new THREE.Group();
      g.name = `Garment_${index}_${spec.type}`;

      // 1. Natural Oak Wishbone Hanger
      const hangerBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.42, 16),
        this.materials.oak
      );
      hangerBar.rotation.z = Math.PI / 2;
      hangerBar.position.y = -0.045;
      hangerBar.castShadow = true;
      g.add(hangerBar);

      // Swivel Brass Hook
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.028, 0.0035, 12, 24, Math.PI * 1.35),
        this.materials.brass
      );
      hook.position.set(0, 0.016, 0);
      g.add(hook);

      // 2. Volumetric Garment Body Mesh with natural fabric curves
      const garmentBody = new THREE.Group();
      garmentBody.position.y = -0.055;

      const bodyWidth = spec.type === 'blazer' ? 0.44 : 0.40;
      const bodyDepth = spec.type === 'blazer' ? 0.22 : 0.18;
      const bodyLen = spec.len;

      // Contoured torso with fabric thickness
      const torsoGeo = new THREE.CylinderGeometry(bodyWidth * 0.48, bodyWidth * 0.54, bodyLen, 24);
      torsoGeo.scale(1.0, 1.0, bodyDepth / bodyWidth);
      const torsoMesh = new THREE.Mesh(torsoGeo, spec.mat);
      torsoMesh.position.y = -bodyLen / 2;
      torsoMesh.castShadow = true;
      torsoMesh.receiveShadow = true;
      garmentBody.add(torsoMesh);

      // 3. Shaped Shoulders & Sleeves
      [-1, 1].forEach((side) => {
        const shoulder = new THREE.Mesh(
          new THREE.SphereGeometry(bodyDepth * 0.45, 12, 12),
          spec.mat
        );
        shoulder.scale.set(1.1, 0.75, 1.0);
        shoulder.position.set(side * (bodyWidth / 2 - 0.04), -0.04, 0);
        garmentBody.add(shoulder);

        // Hanging sleeve cylinder
        const sleeveLen = bodyLen * 0.88;
        const sleeveGeo = new THREE.CylinderGeometry(0.055, 0.045, sleeveLen, 16);
        sleeveGeo.scale(0.8, 1.0, 1.2);
        const sleeve = new THREE.Mesh(sleeveGeo, spec.mat);
        sleeve.position.set(side * (bodyWidth / 2 - 0.02), -0.04 - sleeveLen / 2, 0);
        sleeve.rotation.z = side * 0.04;
        sleeve.castShadow = true;
        garmentBody.add(sleeve);
      });

      // 4. Collar & Placket / Lapels according to type
      if (spec.collar === 'lapel') {
        // Notched Lapels
        const lapelGeo = new THREE.BoxGeometry(0.18, 0.28, 0.035);
        const lapel = new THREE.Mesh(lapelGeo, spec.mat);
        lapel.position.set(0, -0.14, bodyDepth / 2 + 0.005);
        garmentBody.add(lapel);
      } else if (spec.collar === 'spread' || spec.collar === 'classic') {
        // Structured Shirt Collar
        const collarRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.065, 0.016, 8, 24, Math.PI),
          spec.mat
        );
        collarRing.rotation.x = -Math.PI / 2;
        collarRing.position.set(0, -0.01, 0.02);
        garmentBody.add(collarRing);

        // Front button placket
        const placket = new THREE.Mesh(
          new THREE.BoxGeometry(0.030, bodyLen * 0.85, 0.010),
          spec.mat
        );
        placket.position.set(0, -bodyLen * 0.46, bodyDepth / 2 + 0.004);
        garmentBody.add(placket);
      } else {
        // Soft band collar / scooped neckline
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(0.075, 0.014, 8, 24, Math.PI * 0.9),
          spec.mat
        );
        band.rotation.x = -Math.PI / 2;
        band.position.set(0, -0.02, 0.02);
        garmentBody.add(band);
      }

      g.add(garmentBody);
      return g;
    }

    /**
     * 4. Middle Display Shelf (Handbag, Books, Accessories)
     */
    buildMiddleDisplay() {
      const displayGroup = new THREE.Group();
      displayGroup.name = 'Middle_Display_Shelf';
      const baseY = 1.28 + this.panelThickness;

      // 1. Premium Structured White Leather Handbag
      const bagGroup = new THREE.Group();
      bagGroup.position.set(-0.62, baseY, 0.05);

      // Trapezoid Body
      const bagGeo = new THREE.BoxGeometry(0.32, 0.26, 0.16);
      const bagBody = new THREE.Mesh(bagGeo, this.materials.leatherWhite);
      bagBody.position.y = 0.13;
      bagBody.castShadow = true;
      bagGroup.add(bagBody);

      // Gold Metallic Turn-Lock Clasp
      const lockFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.040, 0.024, 0.016),
        this.materials.brass
      );
      lockFace.position.set(0, 0.15, 0.088);
      bagGroup.add(lockFace);

      // Curved Rigid Leather Top Handle
      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.010, 12, 28, Math.PI),
        this.materials.leatherWhite
      );
      handle.position.set(0, 0.26, 0);
      bagGroup.add(handle);

      displayGroup.add(bagGroup);

      // 2. Stack of Fashion Monographs & Magazines
      const bookStack = new THREE.Group();
      bookStack.position.set(0.15, baseY, 0.05);

      const book1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.038, 0.42),
        new THREE.MeshStandardMaterial({ color: 0x38342E, roughness: 0.68 })
      );
      book1.position.y = 0.019;
      book1.castShadow = true;
      bookStack.add(book1);

      const book2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.032, 0.38),
        new THREE.MeshStandardMaterial({ color: 0xF5F0E6, roughness: 0.60 })
      );
      book2.position.set(0.02, 0.038 + 0.016, -0.01);
      book2.castShadow = true;
      bookStack.add(book2);

      const book3 = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.025, 0.34),
        new THREE.MeshStandardMaterial({ color: 0xB5A490, roughness: 0.65 })
      );
      book3.position.set(0.01, 0.070 + 0.0125, 0.01);
      book3.castShadow = true;
      bookStack.add(book3);

      displayGroup.add(bookStack);

      // 3. Accessory Display Tray with Designer Sunglasses
      const trayGroup = new THREE.Group();
      trayGroup.position.set(0.68, baseY, 0.05);

      const tray = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.020, 0.22),
        this.materials.ceramic
      );
      tray.position.y = 0.010;
      trayGroup.add(tray);

      // Tortoiseshell Sunglasses
      const glasses = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.035, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x2A1E14, roughness: 0.20, metalness: 0.1 })
      );
      glasses.position.set(0, 0.035, 0);
      glasses.rotation.y = 0.25;
      trayGroup.add(glasses);

      displayGroup.add(trayGroup);
      this.group.add(displayGroup);
    }

    /**
     * 5. Lower Shelves: Folded Knitwear Stacks
     * Neatly folded cream and beige knitwear garments with rounded organic edges
     */
    buildLowerShelves() {
      const foldedGroup = new THREE.Group();
      foldedGroup.name = 'Folded_Garments_Shelf';
      const baseY = 0.88 + this.panelThickness;

      // Left Stack: 3 Neatly Folded Cream & Grey Knit Sweaters
      for (let i = 0; i < 3; i++) {
        const mat = i === 1 ? this.materials.knitGrey : this.materials.knitCream;
        const sweater = this.createFoldedSweater(0.42, 0.075, 0.38, mat);
        sweater.position.set(-0.52, baseY + 0.038 + i * 0.076, 0.02);
        sweater.castShadow = true;
        foldedGroup.add(sweater);
      }

      // Center/Right Stack: 3 Folded Beige & Camel Fine Knits
      for (let i = 0; i < 3; i++) {
        const mat = i === 1 ? this.materials.knitCream : this.materials.knitBeige;
        const sweater = this.createFoldedSweater(0.40, 0.072, 0.36, mat);
        sweater.position.set(0.08, baseY + 0.036 + i * 0.074, 0.02);
        sweater.castShadow = true;
        foldedGroup.add(sweater);
      }

      // Far Right Stack: 2 Folded Linen Garments
      for (let i = 0; i < 2; i++) {
        const sweater = this.createFoldedSweater(0.38, 0.068, 0.35, this.materials.linenBeige);
        sweater.position.set(0.62, baseY + 0.034 + i * 0.070, 0.02);
        sweater.castShadow = true;
        foldedGroup.add(sweater);
      }

      this.group.add(foldedGroup);
    }

    /**
     * Creates a 3D folded sweater with organic rounded front roll fold
     */
    createFoldedSweater(width, height, depth, material) {
      const g = new THREE.Group();

      // Main folded slab
      const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth - 0.06), material);
      main.position.z = -0.03;
      g.add(main);

      // Rounded Front Roll Fold
      const roll = new THREE.Mesh(
        new THREE.CylinderGeometry(height / 2, height / 2, width, 18),
        material
      );
      roll.rotation.z = Math.PI / 2;
      roll.position.set(0, 0, depth / 2 - height / 2);
      g.add(roll);

      return g;
    }

    /**
     * 6. Lower Drawers Section
     * Two side-by-side solid oak drawer fronts with realistic reveal gaps and brass button pulls
     */
    buildDrawersSection() {
      const drawerGroup = new THREE.Group();
      drawerGroup.name = 'Drawers_Section';

      const baseY = 0.52 + this.panelThickness;
      const sectionHeight = 0.88 - 0.52 - this.panelThickness;
      const drawerWidth = (this.width - this.panelThickness * 3 - 0.02) / 2;
      const centerY = baseY + sectionHeight / 2;

      [-1, 1].forEach((side) => {
        const xPos = side * (drawerWidth / 2 + 0.008);

        // Solid Oak Drawer Front Face
        const drawerFront = new THREE.Mesh(
          new THREE.BoxGeometry(drawerWidth, sectionHeight - 0.008, 0.024),
          this.materials.oak
        );
        drawerFront.position.set(xPos, centerY, this.depth / 2 - 0.025);
        drawerFront.castShadow = true;
        drawerFront.receiveShadow = true;
        drawerGroup.add(drawerFront);

        // Delicate Brass Button Pull Knob
        const knob = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.022, 20),
          this.materials.brass
        );
        knob.rotation.x = Math.PI / 2;
        knob.position.set(xPos, centerY, this.depth / 2 - 0.005);
        drawerGroup.add(knob);
      });

      this.group.add(drawerGroup);
    }

    /**
     * 7. Bottom Footwear Display Shelves
     * 5 Realistic pairs of footwear: white sneakers, beige low heels, cream loafers, court trainers
     */
    buildFootwearDisplay() {
      const shoeGroup = new THREE.Group();
      shoeGroup.name = 'Footwear_Display';
      const baseY = 0.12 + this.panelThickness;

      const footwearConfigs = [
        { x: -0.75, type: 'sneaker', mat: this.materials.leatherWhite, name: 'Minimalist White Platform Sneakers' },
        { x: -0.38, type: 'heel', mat: this.materials.leatherBeige, name: 'Beige Low-Block Leather Heels' },
        { x: 0.00, type: 'loafer', mat: this.materials.leatherLoafer, name: 'Cream Tailored Loafers' },
        { x: 0.38, type: 'sneaker', mat: this.materials.leatherWhite, name: 'White Court Trainers' },
        { x: 0.75, type: 'heel', mat: this.materials.leatherBeige, name: 'Nude Leather Block Heels' }
      ];

      footwearConfigs.forEach((fc) => {
        const pair = this.createFootwearPair(fc);
        pair.position.set(fc.x, baseY, 0.06);
        shoeGroup.add(pair);
      });

      this.group.add(shoeGroup);
    }

    /**
     * Creates a detailed pair of 3D shoes
     */
    createFootwearPair(config) {
      const pair = new THREE.Group();
      pair.name = config.name;

      const shoeSpacing = 0.085;
      [-shoeSpacing / 2, shoeSpacing / 2].forEach((xOffset) => {
        const shoe = new THREE.Group();
        shoe.position.x = xOffset;

        if (config.type === 'sneaker') {
          // Chunky Platform Rubber Sole with Tread
          const sole = new THREE.Mesh(
            new THREE.BoxGeometry(0.074, 0.038, 0.25),
            new THREE.MeshStandardMaterial({ color: 0xFDFDFD, roughness: 0.45 })
          );
          sole.position.y = 0.019;
          sole.castShadow = true;
          shoe.add(sole);

          // Sculpted Leather Upper & Contoured Toe Box
          const upper = new THREE.Mesh(
            new THREE.SphereGeometry(0.038, 16, 16),
            config.mat
          );
          upper.scale.set(0.95, 0.85, 2.2);
          upper.position.set(0, 0.052, 0.02);
          upper.castShadow = true;
          shoe.add(upper);

          // Padded Tongue & Laces
          const tongue = new THREE.Mesh(
            new THREE.BoxGeometry(0.036, 0.040, 0.07),
            config.mat
          );
          tongue.position.set(0, 0.072, -0.01);
          tongue.rotation.x = -0.28;
          shoe.add(tongue);
        } else if (config.type === 'heel') {
          // Low Block Heel
          const heelBlock = new THREE.Mesh(
            new THREE.BoxGeometry(0.055, 0.045, 0.065),
            this.materials.oak
          );
          heelBlock.position.set(0, 0.0225, -0.08);
          heelBlock.castShadow = true;
          shoe.add(heelBlock);

          // Slender Sole
          const sole = new THREE.Mesh(
            new THREE.BoxGeometry(0.062, 0.010, 0.24),
            new THREE.MeshStandardMaterial({ color: 0xD0BC9E, roughness: 0.5 })
          );
          sole.position.y = 0.045;
          shoe.add(sole);

          // Pointed / Rounded Toe Upper
          const vamp = new THREE.Mesh(
            new THREE.SphereGeometry(0.032, 14, 14),
            config.mat
          );
          vamp.scale.set(0.95, 0.70, 2.0);
          vamp.position.set(0, 0.058, 0.04);
          vamp.castShadow = true;
          shoe.add(vamp);
        } else {
          // Tailored Loafer with Horsebit Detail
          const sole = new THREE.Mesh(
            new THREE.BoxGeometry(0.068, 0.018, 0.24),
            new THREE.MeshStandardMaterial({ color: 0x4A3A28, roughness: 0.4 })
          );
          sole.position.y = 0.009;
          shoe.add(sole);

          const loaferUpper = new THREE.Mesh(
            new THREE.SphereGeometry(0.034, 16, 16),
            config.mat
          );
          loaferUpper.scale.set(1.0, 0.75, 2.2);
          loaferUpper.position.set(0, 0.044, 0.02);
          loaferUpper.castShadow = true;
          shoe.add(loaferUpper);

          // Brass Horsebit bar
          const bit = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0025, 0.0025, 0.038, 8),
            this.materials.brass
          );
          bit.rotation.z = Math.PI / 2;
          bit.position.set(0, 0.068, 0.03);
          shoe.add(bit);
        }

        pair.add(shoe);
      });

      return pair;
    }

    /**
     * 8. Integrated Warm 3000K LED Lighting
     * Recessed linear acrylic diffusers under shelves with real warm point/spotlights
     */
    buildIntegratedLighting() {
      const lightGroup = new THREE.Group();
      lightGroup.name = 'Integrated_LED_Lighting';

      const { width, depth, panelThickness } = this;
      const t = panelThickness;
      const stripWidth = width - t * 2 - 0.06;

      // Shelf heights under which LED strips are mounted
      // Top panel (y = 2.95 - t), Upper shelf (y = 2.40), Middle shelf (y = 1.28), Footwear top (y = 0.52)
      const ledYPositions = [
        { y: this.height - t - 0.005, intensity: 0.90, desc: 'Top_Header_LED' },
        { y: 2.40 - 0.005, intensity: 1.25, desc: 'Hanging_Rail_LED' },
        { y: 1.28 - 0.005, intensity: 0.85, desc: 'Folded_Shelf_LED' },
        { y: 0.52 - 0.005, intensity: 0.80, desc: 'Footwear_Shelf_LED' }
      ];

      ledYPositions.forEach((pos) => {
        // Linear Acrylic Diffuser Mesh (Emissive soft appearance)
        const diffuser = new THREE.Mesh(
          new THREE.BoxGeometry(stripWidth, 0.010, 0.036),
          this.materials.ledDiffuser
        );
        diffuser.position.set(0, pos.y, 0.12);
        lightGroup.add(diffuser);
        this.ledStrips.push(diffuser);

        if (this.enableLights) {
          // Real warm ~3000K Scene Lights with gentle falloff and soft shadows
          // Distributed left, center, right for uniform realistic illumination
          [-0.55, 0, 0.55].forEach((xPos) => {
            const pLight = new THREE.PointLight(
              0xFFE6C4, // 3000K warm white
              pos.intensity * 0.55 * this.ledIntensity,
              1.8,
              1.6
            );
            pLight.position.set(xPos, pos.y - 0.04, 0.14);
            pLight.castShadow = true;
            pLight.shadow.bias = -0.0003;
            pLight.shadow.mapSize.width = 512;
            pLight.shadow.mapSize.height = 512;
            lightGroup.add(pLight);
            this.ledLights.push(pLight);
          });
        }
      });

      this.group.add(lightGroup);
    }

    /**
     * Controls LED Strip Lighting Intensity
     * @param {number} factor - Multiplier (0.0 = off, 1.0 = normal, 2.0 = bright)
     */
    setLEDIntensity(factor) {
      this.ledIntensity = factor;
      this.ledLights.forEach((light) => {
        light.intensity = factor;
      });
      this.materials.ledDiffuser.color.set(factor > 0 ? 0xFFF0D4 : 0x444444);
    }

    /**
     * Toggles LED strip visibility and illumination
     */
    toggleLEDs(state) {
      this.setLEDIntensity(state ? 1.0 : 0.0);
    }

    /**
     * Toggles hanging garments visibility for inspection
     */
    toggleGarments(state) {
      this.garmentGroup.visible = state;
    }

    /**
     * Returns total bounding box of the cupboard
     */
    getBounds() {
      const box = new THREE.Box3();
      box.setFromObject(this.group);
      return box;
    }
  }

  return Wardrobe3D;
}));
