/**
 * Sérén Studio — Astra 3D Luxury Wardrobe Material & Styling Pipeline
 * Ensures 100% visual consistency between:
 * - wardrobe-preview.html
 * - studio-assets.html (Step 1 & Full Studio Scene)
 * - studio3d.js (Live Virtual Dressing Room in index.html)
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('three'));
  } else {
    root.AstraWardrobeStyling = factory(root.THREE);
  }
}(typeof self !== 'undefined' ? self : this, function(THREE) {
  'use strict';

  // Cached shared textures
  let cachedWoodTex = null;
  let cachedWoodBumpTex = null;
  let cachedStripedTex = null;

  function createWoodTexture() {
    if (cachedWoodTex) return cachedWoodTex;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base European natural oak gradient (Warm Mediterranean Luxury Honey Oak: #A87B4C)
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.00, '#A87B4C');
    grad.addColorStop(0.25, '#9A6D3E');
    grad.addColorStop(0.50, '#B68854');
    grad.addColorStop(0.75, '#8C6033');
    grad.addColorStop(1.00, '#A87B4C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Natural European oak vertical growth rings, grain pores and fiber striations
    for (let i = 0; i < 520; i++) {
      const x = Math.random() * 1024;
      const alpha = 0.08 + Math.random() * 0.14;
      ctx.strokeStyle = Math.random() > 0.40 
        ? `rgba(60, 38, 16, ${alpha})` 
        : `rgba(190, 150, 110, ${alpha * 0.75})`;
      ctx.lineWidth = 0.6 + Math.random() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 18, 340,
        x + (Math.random() - 0.5) * 18, 680,
        x + (Math.random() - 0.5) * 10, 1024
      );
      ctx.stroke();
    }

    // Realistic medullary ray flecks & oak pores
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + noise * 0.82));
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + noise * 0.62));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 3.5);
    cachedWoodTex = tex;
    return tex;
  }

  function createWoodBumpTexture() {
    if (cachedWoodBumpTex) return cachedWoodBumpTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(215, 215, 215, 0.12)' : 'rgba(45, 45, 45, 0.12)';
      ctx.lineWidth = 0.5 + Math.random() * 2.0;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, 512);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    cachedWoodBumpTex = tex;
    return tex;
  }

  function createStripedShirtTexture() {
    if (cachedStripedTex) return cachedStripedTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F8F7F4';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#2B394A'; // Navy stripes
    for (let y = 14; y < 512; y += 28) {
      ctx.fillRect(0, y, 512, 5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    cachedStripedTex = tex;
    return tex;
  }

  function createMaterials() {
    const woodTex = createWoodTexture();
    const woodBumpTex = createWoodBumpTexture();
    const stripedTex = createStripedShirtTexture();

    return {
      oakFrame: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.006,
        color: 0xA27443, // Natural European honey oak with rich organic grain (#A27443)
        roughness: 0.46,
        metalness: 0.02
      }),
      oakBackboard: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.005,
        color: 0x946536, // Deeper honey oak backboard
        roughness: 0.52,
        metalness: 0.02
      }),
      oakDrawers: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.006,
        color: 0xA27443, // European oak drawer faces
        roughness: 0.44,
        metalness: 0.02
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0x74583D, // Antique bronze (#74583D)
        roughness: 0.35,
        metalness: 0.75
      }),
      hangerWood: new THREE.MeshStandardMaterial({
        color: 0xA87B4C, // European honey oak hanger wood
        roughness: 0.48,
        metalness: 0.02
      }),
      boxLinen: new THREE.MeshStandardMaterial({
        color: 0xF3EFE8, // Off-white linen
        roughness: 0.68,
        metalness: 0.01
      }),
      foliage: new THREE.MeshStandardMaterial({
        color: 0x547A36, // Olive leaf green
        roughness: 0.35,
        metalness: 0.02
      }),
      vineWood: new THREE.MeshStandardMaterial({
        color: 0x5C442A,
        roughness: 0.65,
        metalness: 0.01
      }),
      creamLeather: new THREE.MeshStandardMaterial({
        color: 0xEEE6DA,
        roughness: 0.46,
        metalness: 0.02
      }),
      whiteLeatherSneaker: new THREE.MeshStandardMaterial({
        color: 0xF8F7F4,
        roughness: 0.36,
        metalness: 0.02
      }),
      shoeSole: new THREE.MeshStandardMaterial({
        color: 0xDCC7B0, // Caramel/taupe gum sole
        roughness: 0.62,
        metalness: 0.02
      }),
      taupeSuede: new THREE.MeshStandardMaterial({
        color: 0xC2B29E,
        roughness: 0.68,
        metalness: 0.02
      }),
      leatherLoaferSole: new THREE.MeshStandardMaterial({
        color: 0xB5824C,
        roughness: 0.45,
        metalness: 0.02
      }),
      ledGlow: new THREE.MeshStandardMaterial({
        color: 0xFFF2DE,
        emissive: 0xFFF2DE,
        emissiveIntensity: 0.60,
        roughness: 0.30
      }),
      whitePoplin: new THREE.MeshStandardMaterial({ color: 0xF7F5F0, roughness: 0.65 }),
      creamSilk: new THREE.MeshStandardMaterial({ color: 0xEFE5D0, roughness: 0.38 }),
      beigeJacket: new THREE.MeshStandardMaterial({ color: 0xC4AE90, roughness: 0.70 }),
      charcoalWool: new THREE.MeshStandardMaterial({ color: 0x2E2E32, roughness: 0.75 }),
      ivoryKnit: new THREE.MeshStandardMaterial({ color: 0xEDE6D8, roughness: 0.72 }),
      neutralTrousers: new THREE.MeshStandardMaterial({ color: 0xA89C8A, roughness: 0.68 }),
      stripedShirt: new THREE.MeshStandardMaterial({ map: stripedTex, roughness: 0.60 }),
      ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xF7F6F3, roughness: 0.25 }),
      soil: new THREE.MeshStandardMaterial({ color: 0x382A1E, roughness: 0.85 }),
      foldedGrey: new THREE.MeshStandardMaterial({ color: 0x6E6D69, roughness: 0.75 }),
      foldedOatmeal: new THREE.MeshStandardMaterial({ color: 0xD4C9B8, roughness: 0.72 }),
      foldedIvory: new THREE.MeshStandardMaterial({ color: 0xF4F0E6, roughness: 0.70 })
    };
  }

  /**
   * Traverse model meshes and apply the full luxury Astra palette
   */
  function applyMaterials(model) {
    if (!model) return;
    const mats = createMaterials();

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const name = child.name || '';
        const matName = child.material ? (child.material.name || '') : '';

        // 1. Oak Wood Structure
        if (name.includes('Back_Board')) {
          child.material = mats.oakBackboard;
        } else if (name.startsWith('Drawer_Left_Front') || name.startsWith('Drawer_Right_Front') || name.startsWith('Drawer_Front') || name.startsWith('Drawer_Body')) {
          child.material = mats.oakDrawers;
        } else if (name.startsWith('Wardrobe_') || name.startsWith('Drawer_') || matName === 'Mat_NaturalLightOak') {
          child.material = mats.oakFrame;
        } 
        // 2. Brass Hardware
        else if (name.startsWith('Brass_') || name.startsWith('Rail_') || name.startsWith('Drawer_Left_Handle') || name.startsWith('Drawer_Right_Handle') || name.includes('Lock') || name.includes('Ring') || matName === 'Mat_BrushedBrass') {
          child.material = mats.brass;
        } 
        // 3. Wooden Hangers
        else if (name.startsWith('Hanger_') || matName === 'Mat_HangerWood') {
          child.material = mats.hangerWood;
        } 
        // 4. Storage Boxes
        else if (name.startsWith('Storage_Box') || matName === 'Mat_BoxLinen') {
          child.material = mats.boxLinen;
        } 
        // 5. Planter Ceramic & Soil
        else if (name.startsWith('Plant_Pot') || name.includes('Btn_') || matName === 'Mat_CeramicWhite') {
          child.material = mats.ceramicWhite;
        } else if (name.startsWith('Plant_Soil')) {
          child.material = mats.soil;
        } 
        // 6. Ivy Plant
        else if (name.startsWith('Ivy_Leaf') || matName === 'Mat_FoliageGreen') {
          child.material = mats.foliage;
        } else if (name.startsWith('Ivy_Stem') || matName === 'Mat_VineWood') {
          child.material = mats.vineWood;
        } 
        // 7. Leather Handbag
        else if (name.startsWith('Leather_Handbag') || name.startsWith('Handbag_') || matName === 'Mat_CreamLeatherBag') {
          child.material = mats.creamLeather;
        } 
        // 8. Hanging Garments
        else if (name.startsWith('Garment_1_White_Shirt') || matName === 'Mat_WhitePoplin') {
          child.material = mats.whitePoplin;
        } else if (name.startsWith('Garment_2_Cream_Blouse') || matName === 'Mat_CreamSilk') {
          child.material = mats.creamSilk;
        } else if (name.startsWith('Garment_3_Beige_Jacket') || matName === 'Mat_BeigeLinenJacket') {
          child.material = mats.beigeJacket;
        } else if (name.startsWith('Garment_4_Charcoal_Blazer') || matName === 'Mat_CharcoalWool') {
          child.material = mats.charcoalWool;
        } else if (name.startsWith('Garment_5_Ivory_Knitwear') || matName === 'Mat_IvoryCashmere') {
          child.material = mats.ivoryKnit;
        } else if (name.startsWith('Trousers_') || matName === 'Mat_NeutralTrousers') {
          child.material = mats.neutralTrousers;
        } else if (name.startsWith('Garment_7_Striped_Shirt') || matName === 'Mat_StripedPoplin') {
          child.material = mats.stripedShirt;
        } 
        // 9. Folded Knitwear
        else if (name.startsWith('Folded_Sweater_1_Grey') || matName === 'Mat_FoldedGrey') {
          child.material = mats.foldedGrey;
        } else if (name.startsWith('Folded_Sweater_2_Oatmeal') || matName === 'Mat_FoldedOatmeal') {
          child.material = mats.foldedOatmeal;
        } else if (name.startsWith('Folded_Linen_Stack') || name.startsWith('Folded_Silk_Scarf') || matName === 'Mat_FoldedIvory') {
          child.material = mats.foldedIvory;
        }
        // 10. Footwear
        else if (name.includes('Shoe_Pair2') || name.includes('Shoe_Pair3')) {
          if (name.includes('Sole')) child.material = mats.leatherLoaferSole;
          else child.material = mats.taupeSuede;
        } else if (name.includes('Sole') || matName === 'Mat_SneakerSole') {
          child.material = mats.shoeSole;
        } else if (name.startsWith('Shoe_') || matName.startsWith('Mat_Sneaker')) {
          child.material = mats.whiteLeatherSneaker;
        } 
        // 11. LED Strips
        else if (name.includes('LED_Strip') || matName === 'Mat_WarmLED_3000K') {
          child.material = mats.ledGlow;
        }
      }
    });

    // Reorganize wardrobe structure to balance shirts, hanging trousers, and footwear
    reorganizeWardrobe(model, mats, THREE);

    // Attach authentic warm 3000K internal shelf illumination
    addShelfLights(model);
  }

  /**
   * Restructures wardrobe model:
   * 1. Moves shirts section slightly upwards, moderately sized on hangers (not dominant)
   * 2. Introduces horizontal brass hanging rod directly below shirts
   * 3. Hangs trousers vertically from clip hangers on this rod (replaces folded clothes)
   * 4. Creates dedicated footwear area below trousers with shoes, sneakers, and sandals
   * 5. Maintains balanced spacing without cramped overlapping
   */
  function reorganizeWardrobe(model, mats, THREE) {
    if (!model || typeof THREE === 'undefined') return;
    if (model.userData && model.userData.hasReorganized) return;
    model.userData = model.userData || {};
    model.userData.hasReorganized = true;

    // 1. Slightly move shirts section upwards and moderate vertical scale
    const shirtDeltaY = 0.08;
    model.traverse((child) => {
      const name = child.name || '';
      // Upper hanging rail & mounting flanges
      if (name.startsWith('Brass_Hanging_Rail') || name.startsWith('Rail_Flange')) {
        child.position.y += shirtDeltaY;
      }
      // Upper hangers (Hanger 6 was the draped trouser hanger)
      if (name.startsWith('Hanger_') && !name.startsWith('Hanger_6')) {
        child.position.y += shirtDeltaY;
      }
      // Shirts, blouses, jackets on upper rail
      if (name.startsWith('Garment_1_') || name.startsWith('Garment_2_') || 
          name.startsWith('Garment_3_') || name.startsWith('Garment_4_') || 
          name.startsWith('Garment_5_') || name.startsWith('Garment_7_')) {
        child.position.y += shirtDeltaY;
        if (child.isMesh && (name.includes('Shirt') || name.includes('Blouse') || name.includes('Jacket') || name.includes('Blazer') || name.includes('Knitwear'))) {
          child.scale.y *= 0.88; // Balanced length so shirts section is not dominant
        }
      }
      // Hide old folded items and old draped trousers
      if (name.startsWith('Folded_') || name.startsWith('Trousers_Fold_Top') || 
          name.startsWith('Trousers_Leg_') || name.startsWith('Hanger_6')) {
        child.visible = false;
      }
      // Hide cluttering mid shelves / drawers that block vertical trouser hanging
      if (name === 'Wardrobe_Shelf_Mid' || name === 'Wardrobe_Shelf_Low' || 
          name === 'Wardrobe_Shelf_Drawer_Top' || name.startsWith('Drawer_') ||
          name === 'LED_Strip_Mid' || name === 'LED_Strip_Low') {
        child.visible = false;
      }
    });

    // 2. Introduce horizontal hanging rod directly below shirts section
    const trouserRailY = 1.54;
    const railWidth = 1.74; // Matches interior width
    const trouserRailGroup = new THREE.Group();
    trouserRailGroup.name = 'Trouser_Hanging_Section';

    // Solid Brushed Brass Rod
    const rodGeo = new THREE.CylinderGeometry(0.013, 0.013, railWidth, 24);
    const rod = new THREE.Mesh(rodGeo, mats.brass);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, trouserRailY, 0);
    rod.castShadow = true;
    trouserRailGroup.add(rod);

    // Left and Right Flanges
    [-railWidth / 2, railWidth / 2].forEach((fx) => {
      const flange = new THREE.Mesh(
        new THREE.CylinderGeometry(0.030, 0.030, 0.014, 24),
        mats.brass
      );
      flange.rotation.z = Math.PI / 2;
      flange.position.set(fx, trouserRailY, 0);
      trouserRailGroup.add(flange);
    });

    // 3. Display trousers hanging vertically from hangers on this rod
    const trouserConfigs = [
      { x: -0.62, color: 0x1E2A3A, name: 'Navy Tailored Trousers', len: 0.50 },
      { x: -0.31, color: 0x3A3A3C, name: 'Charcoal Wool Trousers', len: 0.52 },
      { x: 0.00,  color: 0xC4AA78, name: 'Khaki Chinos', len: 0.48 },
      { x: 0.31,  color: 0x5C6B4A, name: 'Olive Slim Trousers', len: 0.49 },
      { x: 0.62,  color: 0xD4B896, name: 'Tan Linen Trousers', len: 0.48 }
    ];

    trouserConfigs.forEach((tc, idx) => {
      const trGroup = new THREE.Group();
      trGroup.name = `Vertical_Trouser_${idx}`;
      trGroup.position.set(tc.x, trouserRailY, 0);

      // Wooden Clip Hanger Bar
      const hBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.32, 16),
        mats.hangerWood
      );
      hBar.rotation.z = Math.PI / 2;
      hBar.position.y = -0.040;
      hBar.castShadow = true;
      trGroup.add(hBar);

      // Brass Hook
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.022, 0.003, 8, 16, Math.PI * 1.35),
        mats.brass
      );
      hook.position.set(0, 0.012, 0);
      trGroup.add(hook);

      // Brass Clips
      [-0.12, 0.12].forEach((cx) => {
        const clip = new THREE.Mesh(
          new THREE.BoxGeometry(0.016, 0.020, 0.012),
          mats.brass
        );
        clip.position.set(cx, -0.050, 0);
        trGroup.add(clip);
      });

      const trMat = new THREE.MeshStandardMaterial({
        color: tc.color,
        roughness: 0.72,
        metalness: 0.01
      });

      // Waistband
      const waistband = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.032, 0.065),
        trMat
      );
      waistband.position.set(0, -0.062, 0);
      waistband.castShadow = true;
      trGroup.add(waistband);

      // Two Vertical Hanging Trouser Legs
      const legLen = tc.len;
      [-0.056, 0.056].forEach((lx) => {
        const legGeo = new THREE.CylinderGeometry(0.044, 0.034, legLen, 16);
        legGeo.scale(0.65, 1.0, 1.0);
        const leg = new THREE.Mesh(legGeo, trMat);
        leg.position.set(lx, -0.078 - legLen / 2, 0);
        leg.castShadow = true;
        trGroup.add(leg);

        // Front Crease Line
        const crease = new THREE.Mesh(
          new THREE.BoxGeometry(0.003, legLen * 0.90, 0.002),
          new THREE.MeshStandardMaterial({ color: tc.color, roughness: 0.55 })
        );
        crease.position.set(lx, -0.078 - legLen * 0.45, 0.026);
        trGroup.add(crease);
      });

      trouserRailGroup.add(trGroup);
    });

    model.add(trouserRailGroup);

    // 4. Dedicated Footwear Area below trousers
    // Add stylish leather sandals to complete the shoes, sneakers, and sandals collection!
    const footwearGroup = new THREE.Group();
    footwearGroup.name = 'Dedicated_Footwear_Area';
    const shoeY = 0.14; // Matches footwear shelf height

    // Reposition existing shoes across the shelf with neat, balanced spacing
    const shoeXMapping = {
      'Shoe_Pair1': -0.66, // Sneakers
      'Shoe_Pair2': -0.38, // Loafers / Shoes
      'Shoe_Pair3': 0.38,  // Neutral Shoes
      'Shoe_Pair4': 0.66   // Sneakers
    };

    model.traverse((child) => {
      for (const [prefix, targetX] of Object.entries(shoeXMapping)) {
        if (child.name && child.name.startsWith(prefix)) {
          const isRight = child.name.includes('_R_');
          const isLeft = child.name.includes('_L_');
          if (isRight) {
            child.position.x = targetX + 0.048;
          } else if (isLeft) {
            child.position.x = targetX - 0.048;
          }
          child.position.y = shoeY;
        }
      }
    });

    // Add 2 pairs of neatly crafted sandals in the center slots (X = -0.12 and X = +0.12)
    const sandalConfigs = [
      { x: -0.12, color: 0xC49E6C, name: 'Tan Leather Slide Sandals' },
      { x: 0.12,  color: 0x4A3A28, name: 'Dark Leather Strap Sandals' }
    ];

    sandalConfigs.forEach((sc) => {
      const sandalPair = new THREE.Group();
      sandalPair.name = sc.name;

      const footbedMat = new THREE.MeshStandardMaterial({ color: 0xBA986E, roughness: 0.60 });
      const strapMat = new THREE.MeshStandardMaterial({ color: sc.color, roughness: 0.45, metalness: 0.02 });

      [-0.044, 0.044].forEach((sx) => {
        const sandal = new THREE.Group();
        sandal.position.set(sc.x + sx, shoeY, 0.01);

        // Contoured Footbed Sole
        const sole = new THREE.Mesh(
          new THREE.BoxGeometry(0.062, 0.015, 0.22),
          footbedMat
        );
        sole.position.y = 0.007;
        sole.castShadow = true;
        sandal.add(sole);

        // Front Strap
        const fStrap = new THREE.Mesh(
          new THREE.BoxGeometry(0.064, 0.020, 0.044),
          strapMat
        );
        fStrap.position.set(0, 0.020, 0.040);
        fStrap.castShadow = true;
        sandal.add(fStrap);

        // Instep Arch Strap
        const aStrap = new THREE.Mesh(
          new THREE.BoxGeometry(0.064, 0.026, 0.038),
          strapMat
        );
        aStrap.position.set(0, 0.024, -0.025);
        aStrap.castShadow = true;
        sandal.add(aStrap);

        // Miniature Brass Buckle
        const buckle = new THREE.Mesh(
          new THREE.BoxGeometry(0.010, 0.014, 0.005),
          mats.brass
        );
        buckle.position.set(0.033, 0.024, -0.025);
        sandal.add(buckle);

        sandalPair.add(sandal);
      });

      footwearGroup.add(sandalPair);
    });

    model.add(footwearGroup);
  }

  function addShelfLights(model) {
    if (!model || typeof THREE === 'undefined') return [];
    if (model.userData && model.userData.hasShelfLights) return [];
    model.userData = model.userData || {};
    model.userData.hasShelfLights = true;

    const lights = [];
    // Local coordinates inside wardrobe.glb with calibrated warm-white soft illumination
    const shelf1 = new THREE.PointLight(0xFFF5E6, 0.35, 2.2);
    shelf1.position.set(0, 2.45, -0.15);
    shelf1.castShadow = false;
    model.add(shelf1);
    lights.push(shelf1);

    const shelf2 = new THREE.PointLight(0xFFF5E6, 0.35, 2.2);
    shelf2.position.set(0, 1.42, -0.15);
    shelf2.castShadow = false;
    model.add(shelf2);
    lights.push(shelf2);

    const shelf3 = new THREE.PointLight(0xFFF5E6, 0.30, 2.0);
    shelf3.position.set(0, 0.40, -0.15);
    shelf3.castShadow = false;
    model.add(shelf3);
    lights.push(shelf3);

    return lights;
  }

  return {
    applyMaterials: applyMaterials,
    createMaterials: createMaterials,
    createWoodTexture: createWoodTexture,
    addShelfLights: addShelfLights
  };
}));

