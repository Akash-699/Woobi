/**
 * Woobi 3D Studio - Vanity Model
 * Encapsulates the Calacatta Gold marble vanity table, champagne-brass framing,
 * illuminated arched mirror, cosmetics tray, floral vase, bouclé ottoman stool,
 * reflection pipeline, and raycast interaction targets.
 */

import { VanityMaterials } from './VanityMaterials.js';
import { VanityAssets } from './VanityAssets.js';
import { VanityLighting } from './VanityLighting.js';
import { MirrorReflection } from './MirrorReflection.js';

export const VANITY_CONFIG = {
  position: { x: 1.60, y: 0, z: -3.30 },
  rotationY: -0.32,
  tableHeight: 0.84,
  tableWidth: 0.98,
  tableDepth: 0.46,
  mirrorRadius: 0.48,
  stoolPosition: { x: 0.12, y: 0, z: 0.42 },
  stoolRadius: 0.25,
  stoolHeight: 0.40
};

export class VanityModel {
  constructor(options = {}) {
    this.config = Object.assign({}, VANITY_CONFIG, options);
    this.group = null;
    this.mirrorGlassMesh = null;
    this.mirrorGroup = null;
    this.interactiveObjects = [];
    this.disposables = [];
    this.lighting = new VanityLighting();
    this.reflection = new MirrorReflection();
    this.isGLBLoaded = false;
  }

  /**
   * Builds the complete vanity hierarchy and attaches it to the Three.js scene.
   */
  build(scene, textures = {}, THREEInstance = (typeof window !== 'undefined' ? window.THREE : null)) {
    const THREE = THREEInstance;
    if (!THREE || !scene) {
      throw new Error('[VanityModel] THREE or scene missing during vanity build.');
    }

    this.group = new THREE.Group();
    this.group.name = 'woobi_vanity_root';
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.y = this.config.rotationY;

    const { tableHeight, tableWidth, tableDepth, mirrorRadius } = this.config;

    // Raycastable Bounding Box for Touch / Click
    const hitGeo = new THREE.BoxGeometry(tableWidth + 0.2, 1.8, tableDepth + 0.5);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitGeo, hitMat);
    hitBox.position.set(0, 1.0, 0.1);
    hitBox.userData = { interactiveType: 'vanity', name: 'Arched Vanity & Grooming Mirror' };
    this.group.add(hitBox);
    this.interactiveObjects.push(hitBox);
    this.disposables.push(hitGeo, hitMat);

    // Procedural Vanity Group
    const proceduralGroup = new THREE.Group();
    proceduralGroup.name = 'procedural_vanity';

    const marbleMat = VanityMaterials.createMarbleMaterial(THREE, textures.champagneStone || textures.calacatta, textures.stoneBump);
    const legsMat = VanityMaterials.createLegsMaterial(THREE);
    const brassMat = VanityMaterials.createBrassMaterial(THREE);
    const ledGlowMat = VanityMaterials.createLedGlowMaterial(THREE);
    const glassMat = VanityMaterials.createGlassMaterial(THREE, false);
    const amberGlassMat = VanityMaterials.createGlassMaterial(THREE, true);
    const boucleMat = VanityMaterials.createBoucleMaterial(THREE, textures.wovenRug);
    this.disposables.push(marbleMat, legsMat, brassMat, ledGlowMat, glassMat, amberGlassMat, boucleMat);

    // 1. Polished Calacatta Gold Marble Countertop Table
    const topSlabGeo = new THREE.BoxGeometry(tableWidth, 0.065, tableDepth);
    const topSlab = new THREE.Mesh(topSlabGeo, marbleMat);
    topSlab.position.set(0, tableHeight, 0);
    topSlab.castShadow = true;
    topSlab.receiveShadow = true;
    proceduralGroup.add(topSlab);
    this.disposables.push(topSlabGeo);

    // Slim Golden Brass Metallic Legs
    const legGeo = new THREE.BoxGeometry(0.030, tableHeight - 0.03, 0.030);
    const legPositions = [
      [-tableWidth / 2 + 0.035, -tableDepth / 2 + 0.035],
      [tableWidth / 2 - 0.035, -tableDepth / 2 + 0.035],
      [-tableWidth / 2 + 0.035, tableDepth / 2 - 0.035],
      [tableWidth / 2 - 0.035, tableDepth / 2 - 0.035]
    ];
    legPositions.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legsMat);
      leg.position.set(lx, (tableHeight - 0.03) / 2, lz);
      leg.castShadow = true;
      proceduralGroup.add(leg);
    });
    this.disposables.push(legGeo);

    // 2. LARGE ARCHED / CIRCULAR MIRROR WITH CONTINUOUS WARM LED GLOW RING
    this.mirrorGroup = new THREE.Group();
    this.mirrorGroup.position.set(0, tableHeight + 0.62, -tableDepth / 2 + 0.03);

    // Glowing Neon Ring Halo (Continuous 360° LED Rim Light)
    const ledGlowGeo = new THREE.TorusGeometry(mirrorRadius + 0.012, 0.014, 16, 64);
    const glowRing = new THREE.Mesh(ledGlowGeo, ledGlowMat);
    this.mirrorGroup.add(glowRing);
    this.disposables.push(ledGlowGeo);

    // Brushed Brass Frame Border
    const frameRingGeo = new THREE.TorusGeometry(mirrorRadius + 0.025, 0.010, 16, 64);
    const frameRing = new THREE.Mesh(frameRingGeo, brassMat);
    this.mirrorGroup.add(frameRing);
    this.disposables.push(frameRingGeo);

    // Backing Panel
    const mirrorBackGeo = new THREE.CircleGeometry(mirrorRadius + 0.01, 64);
    const mirrorBackMat = VanityMaterials.createMirrorBackMaterial(THREE);
    const mirrorBack = new THREE.Mesh(mirrorBackGeo, mirrorBackMat);
    mirrorBack.position.z = -0.015;
    this.mirrorGroup.add(mirrorBack);
    this.disposables.push(mirrorBackGeo, mirrorBackMat);

    // Mirror Glass Surface
    const mirrorGlassGeo = new THREE.CircleGeometry(mirrorRadius, 64);
    const mirrorMat = VanityMaterials.createMirrorMaterial(THREE);
    this.mirrorGlassMesh = new THREE.Mesh(mirrorGlassGeo, mirrorMat);
    this.mirrorGlassMesh.position.z = 0.002;
    this.mirrorGroup.add(this.mirrorGlassMesh);
    this.disposables.push(mirrorGlassGeo, mirrorMat);

    // Initialize Vanity Radiance Lighting
    this.lighting.init(THREE, this.mirrorGroup);

    // Initialize Mirror Reflection Pipeline
    this.reflection.init(THREE, scene, this.mirrorGlassMesh);

    proceduralGroup.add(this.mirrorGroup);

    // 3. TABLETOP LUXURY COSMETICS & FLORAL ARRANGEMENT
    const perfumeGroup = new THREE.Group();
    perfumeGroup.position.set(0.24, tableHeight + 0.035, 0.05);

    // Perfume 1: Tall Faceted Flacon
    const p1Geo = new THREE.BoxGeometry(0.044, 0.080, 0.044);
    const p1 = new THREE.Mesh(p1Geo, glassMat);
    p1.position.set(0, 0.040, 0);
    perfumeGroup.add(p1);
    const p1CapGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.024, 16);
    const p1Cap = new THREE.Mesh(p1CapGeo, brassMat);
    p1Cap.position.set(0, 0.092, 0);
    perfumeGroup.add(p1Cap);
    this.disposables.push(p1Geo, p1CapGeo);

    // Perfume 2: Round Amber Bottle
    const p2Geo = new THREE.CylinderGeometry(0.024, 0.024, 0.065, 16);
    const p2 = new THREE.Mesh(p2Geo, amberGlassMat);
    p2.position.set(0.065, 0.032, 0.02);
    perfumeGroup.add(p2);
    const p2CapGeo = new THREE.SphereGeometry(0.012, 12, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1A1816 });
    const p2Cap = new THREE.Mesh(p2CapGeo, capMat);
    p2Cap.position.set(0.065, 0.070, 0.02);
    perfumeGroup.add(p2Cap);
    this.disposables.push(p2Geo, p2CapGeo, capMat);

    proceduralGroup.add(perfumeGroup);

    // Ceramic Makeup Brush Holder & Brushes
    const brushHolderGeo = new THREE.CylinderGeometry(0.028, 0.024, 0.075, 16);
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x2A2622, roughness: 0.40 });
    const brushHolder = new THREE.Mesh(brushHolderGeo, ceramicMat);
    brushHolder.position.set(0.12, tableHeight + 0.070, 0.08);
    proceduralGroup.add(brushHolder);
    this.disposables.push(brushHolderGeo, ceramicMat);

    const brushGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.11, 8);
    for (let b = 0; b < 4; b++) {
      const brush = new THREE.Mesh(brushGeo, brassMat);
      brush.rotation.set(0.12 * Math.sin(b * 1.5), 0, 0.12 * Math.cos(b * 1.5));
      brush.position.set(0.12 + Math.sin(b) * 0.008, tableHeight + 0.11, 0.08 + Math.cos(b) * 0.008);
      proceduralGroup.add(brush);
    }
    this.disposables.push(brushGeo);

    // Clear Glass Vase with Delicate White Baby's Breath Flowers
    const vaseGroup = new THREE.Group();
    vaseGroup.position.set(-0.28, tableHeight + 0.035, 0.04);
    const vaseGeo = new THREE.CylinderGeometry(0.038, 0.028, 0.15, 20);
    const vase = new THREE.Mesh(vaseGeo, glassMat);
    vase.position.y = 0.075;
    vaseGroup.add(vase);
    this.disposables.push(vaseGeo);

    const stemGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.24, 8);
    const blossomGeo = new THREE.SphereGeometry(0.008, 6, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x485840, roughness: 0.65 });
    const bloomMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85 });
    this.disposables.push(stemGeo, blossomGeo, stemMat, bloomMat);

    for (let s = 0; s < 6; s++) {
      const stem = new THREE.Mesh(stemGeo, stemMat);
      const ang = s * 1.05;
      stem.rotation.set(0.18 * Math.cos(ang), 0, 0.18 * Math.sin(ang));
      stem.position.set(Math.cos(ang) * 0.015, 0.16, Math.sin(ang) * 0.015);
      vaseGroup.add(stem);

      for (let fl = 0; fl < 4; fl++) {
        const blossom = new THREE.Mesh(blossomGeo, bloomMat);
        blossom.position.set(
          Math.cos(ang) * 0.04 + (fl - 2) * 0.015,
          0.26 + fl * 0.018,
          Math.sin(ang) * 0.04 + (fl % 2 === 0 ? 0.01 : -0.01)
        );
        vaseGroup.add(blossom);
      }
    }
    proceduralGroup.add(vaseGroup);

    // 4. ROUND CREAM BOUCLÉ UPHOLSTERED OTTOMAN STOOL WITH BRASS BASE
    const stoolGroup = new THREE.Group();
    stoolGroup.position.set(this.config.stoolPosition.x, this.config.stoolPosition.y, this.config.stoolPosition.z);

    const stoolPlinthGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 36);
    const stoolPlinth = new THREE.Mesh(stoolPlinthGeo, brassMat);
    stoolPlinth.position.y = 0.025;
    stoolPlinth.castShadow = true;
    stoolGroup.add(stoolPlinth);
    this.disposables.push(stoolPlinthGeo);

    const stoolBodyGeo = new THREE.CylinderGeometry(0.245, 0.238, 0.33, 36);
    const stoolBody = new THREE.Mesh(stoolBodyGeo, boucleMat);
    stoolBody.position.y = 0.215;
    stoolBody.castShadow = true;
    stoolGroup.add(stoolBody);
    this.disposables.push(stoolBodyGeo);

    const stoolCushionGeo = new THREE.CylinderGeometry(this.config.stoolRadius, 0.245, 0.07, 36);
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0xF8F4EE,
      roughness: 0.82,
      metalness: 0.02
    });
    const stoolCushion = new THREE.Mesh(stoolCushionGeo, cushionMat);
    stoolCushion.position.y = 0.415;
    stoolCushion.castShadow = true;
    stoolGroup.add(stoolCushion);
    this.disposables.push(stoolCushionGeo, cushionMat);

    proceduralGroup.add(stoolGroup);

    this.group.add(proceduralGroup);

    // 5. Attempt authentic GLB model loading (woobi_vanity.glb)
    VanityAssets.loadVanityGLB(
      THREE,
      (model) => {
        model.name = 'woobi_vanity_glb';
        model.traverse((child) => {
          if (child.isMesh && (child.name === 'Mirror_Surface' || child.name.toLowerCase().includes('mirror_surface'))) {
            this.mirrorGlassMesh = child;
          }
        });
        this.group.add(model);
        this.isGLBLoaded = true;
        proceduralGroup.visible = false;

        // Traverse GLB and bind mirror reflection & LED glow
        model.traverse((child) => {
          if (child.isMesh) {
            if (child.name === 'Mirror_Surface' || child.name.includes('Mirror_Surface')) {
              this.mirrorGlassMesh = child;
              if (this.reflection) {
                this.reflection.bindMirrorMesh(child, THREE);
              }
            } else if (child.name === 'Mirror_LED_Strip') {
              child.material = VanityMaterials.createLedGlowMaterial(THREE);
            } else if (child.name === 'Mirror_Frame') {
              child.material = VanityMaterials.createBrassMaterial(THREE);
            } else if (child.name === 'Vanity_Marble_Top' || child.name === 'Vanity_Cosmetic_Tray_Base' || child.name.includes('Marble')) {
              // Generate planar UVs for horizontal tabletop geometry if missing (seren_vanity.glb has no UV attributes)
              if (child.geometry && !child.geometry.attributes?.uv && child.geometry.attributes?.position && typeof THREE.BufferAttribute !== 'undefined') {
                const pos = child.geometry.attributes.position;
                if (typeof child.geometry.computeBoundingBox === 'function') {
                  child.geometry.computeBoundingBox();
                }
                const bb = child.geometry.boundingBox;
                const minX = bb ? bb.min.x : -0.675;
                const maxX = bb ? bb.max.x : 0.675;
                const minZ = bb ? bb.min.z : -0.240;
                const maxZ = bb ? bb.max.z : 0.240;
                const spanX = (maxX - minX) || 1.35;
                const spanZ = (maxZ - minZ) || 0.48;

                const uvs = new Float32Array(pos.count * 2);
                for (let i = 0; i < pos.count; i++) {
                  const x = pos.getX(i);
                  const z = pos.getZ(i);
                  uvs[i * 2] = (x - minX) / spanX;
                  uvs[i * 2 + 1] = (z - minZ) / spanZ;
                }
                child.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
              }
              child.material = VanityMaterials.createMarbleMaterial(THREE, textures.champagneStone || textures.calacatta, textures.stoneBump);
            } else if (child.name.includes('Vanity_Leg') || child.name.includes('Vanity_Top_Rail') || child.name.includes('Vanity_Tray_Rim') || child.name.includes('Vanity_Drawer_Seam')) {
              child.material = VanityMaterials.createLegsMaterial(THREE);
            } else if (child.name === 'Stool_Brass_Base_Ring' || child.name.includes('Stool_Brass') || child.name.includes('Stool_Base')) {
              child.material = VanityMaterials.createBrassMaterial(THREE);
            } else if (child.name === 'Stool_Top_Padded_Cushion') {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xF8F4EE,
                roughness: 0.80,
                metalness: 0.02
              });
              this.disposables.push(child.material);
            } else if (child.name === 'Stool_Upholstered_Body') {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xEEE6DC,
                roughness: 0.85,
                metalness: 0.02
              });
              this.disposables.push(child.material);
            }
          }
        });
      },
      () => {
        this.isGLBLoaded = false;
      }
    );

    scene.add(this.group);
    return this.group;
  }

  setVanityLightsEnabled(enabled) {
    this.lighting.setEnabled(enabled);
  }

  getVanityState() {
    return {
      isGLBLoaded: this.isGLBLoaded,
      isLightsEnabled: this.lighting.isEnabled,
      hasMirrorReflection: !!this.reflection.renderTarget
    };
  }

  dispose(scene) {
    if (this.group && scene) {
      scene.remove(this.group);
    }
    this.lighting.dispose(this.mirrorGroup);
    this.reflection.dispose();

    this.disposables.forEach(d => {
      if (d && typeof d.dispose === 'function') {
        d.dispose();
      }
    });
    this.disposables = [];
    this.interactiveObjects = [];
    this.mirrorGlassMesh = null;
    this.mirrorGroup = null;
    this.group = null;
  }
}

export default VanityModel;
