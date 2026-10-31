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

    // Base warm honey-oak gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.00, '#C98B52');
    grad.addColorStop(0.25, '#BD7F46');
    grad.addColorStop(0.50, '#D4965C');
    grad.addColorStop(0.75, '#B87A42');
    grad.addColorStop(1.00, '#C98B52');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Oak grain vertical growth rings and fiber striations
    for (let i = 0; i < 450; i++) {
      const x = Math.random() * 1024;
      const alpha = 0.05 + Math.random() * 0.09;
      ctx.strokeStyle = Math.random() > 0.45 
        ? `rgba(145, 90, 42, ${alpha})` 
        : `rgba(235, 180, 125, ${alpha * 0.85})`;
      ctx.lineWidth = 0.6 + Math.random() * 2.8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 22, 340,
        x + (Math.random() - 0.5) * 22, 680,
        x + (Math.random() - 0.5) * 12, 1024
      );
      ctx.stroke();
    }

    // Subtle white oak medullary flecks & pores
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 9;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + noise * 0.88));
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + noise * 0.70));
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
        bumpScale: 0.002,
        color: 0xC88B52, // Warm natural honey light oak matching front.png
        roughness: 0.44,
        metalness: 0.02
      }),
      oakBackboard: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.0015,
        color: 0xD4965C, // Warm amber oak backboard
        roughness: 0.48,
        metalness: 0.02
      }),
      oakDrawers: new THREE.MeshStandardMaterial({
        map: woodTex,
        bumpMap: woodBumpTex,
        bumpScale: 0.002,
        color: 0xC4864D, // Honey oak drawer faces
        roughness: 0.42,
        metalness: 0.02
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xDDB65A, // Satin brushed brass
        roughness: 0.20,
        metalness: 0.94
      }),
      hangerWood: new THREE.MeshStandardMaterial({
        color: 0xB57E4B, // Warm beech wood
        roughness: 0.40,
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
        color: 0xFFE2B0,
        emissive: 0xFFE2B0,
        emissiveIntensity: 3.0,
        roughness: 0.20
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

    // Attach authentic warm 3000K internal shelf illumination
    addShelfLights(model);
  }

  function addShelfLights(model) {
    if (!model || typeof THREE === 'undefined') return [];
    if (model.userData && model.userData.hasShelfLights) return [];
    model.userData = model.userData || {};
    model.userData.hasShelfLights = true;

    const lights = [];
    // Local coordinates inside wardrobe.glb (where front opening is -Z in local space)
    const shelf1 = new THREE.PointLight(0xFFE2B0, 1.25, 2.5);
    shelf1.position.set(0, 2.45, -0.15);
    shelf1.castShadow = false;
    model.add(shelf1);
    lights.push(shelf1);

    const shelf2 = new THREE.PointLight(0xFFE2B0, 1.25, 2.5);
    shelf2.position.set(0, 1.42, -0.15);
    shelf2.castShadow = false;
    model.add(shelf2);
    lights.push(shelf2);

    const shelf3 = new THREE.PointLight(0xFFE2B0, 1.05, 2.2);
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

