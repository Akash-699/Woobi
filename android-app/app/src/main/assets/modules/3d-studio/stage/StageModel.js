/**
 * Woobi 3D Studio - Stage Model
 * Encapsulates the 8.0 cm elevated circular stage podium, contact shadows,
 * Astra GLB model loading, rotation guide arcs, and avatar grounding contracts.
 */

import { StageMaterials } from './StageMaterials.js';

export const STAGE_CONFIG = {
  daisElevation: 0.080,         // Exact 8.0 cm elevated fashion dais
  radius: 0.95,                 // Primary circular podium radius (m)
  thickness: 0.080,             // Dais height (m)
  shadowRadius: 1.18,           // Deep contact shadow radius (m)
  shadowOpacity: 0.30,          // Ground shadow opacity
  rimRadiusOffset: 0.004,       // Stitched trim radial offset
  rimThickness: 0.012,          // Stitched trim tube thickness
  rotationArcRadius: 0.72,      // 360-degree rotation guide arc radius
  rotationArcOpacity: 0.60,     // Guide arc opacity
  accentRugPosition: { x: 0, y: 0.004, z: 0 },
  accentRugRadius: 1.12,
  shagRugRadius: 1.50,          // Large plush circular white/cream wool shag rug
  shagRugThickness: 0.012,      // 1.2 cm plush pile depth
  glbPaths: ['3D - Stage by Astra/seren_stage.glb', 'seren_stage.glb']
};

export class StageModel {
  constructor(options = {}) {
    this.config = Object.assign({}, STAGE_CONFIG, options);
    this.group = null;
    this.disposables = [];
    this.glbLoaded = false;
  }

  /**
   * Builds the stage hierarchy and attaches it to the Three.js scene.
   * @param {THREE.Scene} scene 
   * @param {Object} textures Optional texture map containing { wovenRug }
   * @param {Object} THREEInstance Three.js global instance
   */
  build(scene, textures = {}, THREEInstance = (typeof window !== 'undefined' ? window.THREE : null)) {
    const THREE = THREEInstance;
    if (!THREE || !scene) {
      throw new Error('[StageModel] THREE or scene missing during stage build.');
    }

    this.group = new THREE.Group();
    this.group.name = 'woobi_stage_root';
    this.group.position.set(0, 0, 0);
    // Proportionally scale horizontal footprint (X/Z) by ~12% to prevent visual dominance while strictly preserving 8cm elevation (Y=1)
    if (this.group.scale && typeof this.group.scale.set === 'function') {
      this.group.scale.set(0.88, 1.0, 0.88);
    }

    const { radius, thickness, shadowRadius, shadowOpacity, daisElevation } = this.config;

    // 1. Deep ground contact shadow disc
    const shadowGeo = new THREE.CircleGeometry(shadowRadius, 64);
    const shadowMat = StageMaterials.createShadowMaterial(THREE);
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.002;
    this.group.add(shadowDisc);
    this.disposables.push(shadowGeo, shadowMat);

    // 1.5. Large Plush White Shaggy Bouclé Circular Rug (Ground level beneath dais)
    const shagRadius = this.config.shagRugRadius || 1.50;
    const shagThickness = this.config.shagRugThickness || 0.012;
    const shagGeo = new THREE.CylinderGeometry(shagRadius, shagRadius + 0.015, shagThickness, 64);
    const shagMat = StageMaterials.createShagRugMaterial(THREE, textures.shagRug, textures.shagRugBump || textures.stoneBump);
    this.shagRugMesh = new THREE.Mesh(shagGeo, shagMat);
    this.shagRugMesh.position.y = shagThickness / 2;
    this.shagRugMesh.receiveShadow = true;
    this.group.add(this.shagRugMesh);
    this.disposables.push(shagGeo, shagMat);

    // 2. Procedural Woven Elevated Stage Platform
    const rugGeo = new THREE.CylinderGeometry(radius, radius + 0.012, thickness, 64);
    const rugMat = StageMaterials.createDaisMaterial(THREE, textures.champagneStone || textures.wovenRug, textures.stoneBump);
    const rugMesh = new THREE.Mesh(rugGeo, rugMat);
    rugMesh.position.y = thickness / 2;
    rugMesh.receiveShadow = true;
    rugMesh.castShadow = true;
    this.group.add(rugMesh);
    this.disposables.push(rugGeo, rugMat);

    // 3. Stitched Rounded Top Edge Trim
    const trimGeo = new THREE.TorusGeometry(radius + this.config.rimRadiusOffset, this.config.rimThickness, 16, 64);
    const trimMat = StageMaterials.createTrimMaterial(THREE);
    const rimTrim = new THREE.Mesh(trimGeo, trimMat);
    rimTrim.rotation.x = Math.PI / 2;
    rimTrim.position.y = thickness;
    this.group.add(rimTrim);
    this.disposables.push(trimGeo, trimMat);

    // 4. Subtle 360-degree rotation guide arcs on dais surface
    const arcMat = StageMaterials.createRotationArcMaterial(THREE);
    this.disposables.push(arcMat);
    [-1, 1].forEach((dir) => {
      const arcGeo = new THREE.TorusGeometry(this.config.rotationArcRadius, 0.005, 8, 32, Math.PI * 0.45);
      const arc = new THREE.Mesh(arcGeo, arcMat);
      arc.rotation.x = Math.PI / 2;
      arc.rotation.z = (dir === 1 ? Math.PI * 0.28 : -Math.PI * 0.72);
      arc.position.y = thickness + 0.003;
      this.group.add(arc);
      this.disposables.push(arcGeo);
    });

    // 5. Complete concentric architectural base circle beneath dais
    const accentGeo = new THREE.CylinderGeometry(this.config.accentRugRadius, this.config.accentRugRadius + 0.012, 0.008, 64);
    const accentRug = new THREE.Mesh(accentGeo, rugMat);
    accentRug.position.set(this.config.accentRugPosition.x, this.config.accentRugPosition.y, this.config.accentRugPosition.z);
    accentRug.receiveShadow = true;
    this.group.add(accentRug);
    this.disposables.push(accentGeo);

    // 6. Attempt authentic Astra 3D GLB stage load if GLTFLoader is present
    if (typeof THREE.GLTFLoader !== 'undefined') {
      const gltfLoader = new THREE.GLTFLoader();
      const loadStageGLB = (idx) => {
        if (idx >= this.config.glbPaths.length) return;
        gltfLoader.load(
          this.config.glbPaths[idx],
          (gltf) => {
            const stageModel = gltf.scene;
            stageModel.position.set(0, 0, 0);
            stageModel.traverse((child) => {
              if (child.isMesh && child.material) {
                // Generate planar UVs for horizontal stage geometry if missing (seren_stage.glb has no UV attributes)
                if (child.geometry && !child.geometry.attributes?.uv && child.geometry.attributes?.position && typeof THREE.BufferAttribute !== 'undefined') {
                  const pos = child.geometry.attributes.position;
                  if (typeof child.geometry.computeBoundingBox === 'function') {
                    child.geometry.computeBoundingBox();
                  }
                  const bb = child.geometry.boundingBox;
                  const minX = bb ? bb.min.x : -0.956;
                  const maxX = bb ? bb.max.x : 0.956;
                  const minZ = bb ? bb.min.z : -0.956;
                  const maxZ = bb ? bb.max.z : 0.956;
                  const spanX = (maxX - minX) || 1.912;
                  const spanZ = (maxZ - minZ) || 1.912;

                  const uvs = new Float32Array(pos.count * 2);
                  for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const z = pos.getZ(i);
                    uvs[i * 2] = (x - minX) / spanX;
                    uvs[i * 2 + 1] = (z - minZ) / spanZ;
                  }
                  child.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                }

                if (child.name.includes('Rug_Surface') || child.name.includes('Stage_Base') || child.name.includes('Ring')) {
                  if (child.material.color && typeof child.material.color.setHex === 'function') {
                    child.material.color.setHex(0xD2BEA0); // Champagne stone
                  }
                  if (textures && (textures.champagneStone || textures.wovenRug)) {
                    child.material.map = textures.champagneStone || textures.wovenRug;
                  }
                  if (textures && textures.stoneBump) {
                    child.material.bumpMap = textures.stoneBump;
                    child.material.bumpScale = 0.012;
                  }
                  child.material.roughness = 0.70;
                  if (typeof child.material.sheen !== 'undefined') {
                    child.material.sheen = 0;
                  }
                  child.material.needsUpdate = true;
                } else if (child.name.includes('Rug_Edge')) {
                  if (child.material.color && typeof child.material.color.setHex === 'function') {
                    child.material.color.setHex(0xCBB18D); // Warm beige trim
                  }
                  if (textures && textures.stoneBump) {
                    child.material.bumpMap = textures.stoneBump;
                    child.material.bumpScale = 0.008;
                  }
                  child.material.roughness = 0.75;
                  if (typeof child.material.sheen !== 'undefined') {
                    child.material.sheen = 0;
                  }
                  child.material.needsUpdate = true;
                }
              }
            });
            this.group.add(stageModel);
            this.glbLoaded = true;
            rugMesh.visible = false;
            rimTrim.visible = false;
          },
          undefined,
          () => loadStageGLB(idx + 1)
        );
      };
      loadStageGLB(0);
    }

    scene.add(this.group);
    return this.group;
  }

  /**
   * Returns exact elevation at which models/avatars should be grounded.
   * @returns {number} Elevation in meters (0.080)
   */
  getElevation() {
    return this.config.daisElevation;
  }

  /**
   * Safely frees all geometries and materials allocated by the stage.
   */
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
    this.group = null;
  }
}

export default StageModel;
