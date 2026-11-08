/**
 * Woobi - 3D Studio Avatar Module
 * AvatarAssets.js - Asynchronous GLB Asset Loader & Fallback Manager
 */

export const FEMALE_AVATAR_PATHS = [
  'assets/models/avatar_female.glb',
  'female_mannequin.glb',
  'woobi_female_mannequin.glb',
  '3D - Mannequin By Astra/Woobi_Female_Mannequin.glb'
];

export const MALE_AVATAR_PATHS = [
  'assets/models/avatar_male.glb',
  'male_mannequin.glb',
  'woobi_male_mannequin.glb',
  '3D - Mannequin By Astra/Woobi_Male_Mannequin.glb'
];

export const AVATAR_ASSET_PATHS = [
  'seren_avatar.glb',
  'assets/models/avatar_female.glb',
  'assets/models/avatar_male.glb',
  'Woobi_Female_Mannequin_Fixed.glb',
  '3D - Mannequin By Astra/Woobi_Female_Mannequin.glb',
  'https://readyplayerme.github.io/visage/female.glb'
];

export const MANNEQUIN_ASSET_PATHS = {
  female: [
    'Woobi_Female_Mannequin_Fixed.glb',
    'woobi_female_mannequin.glb',
    '3D - Mannequin By Astra/Woobi_Female_Mannequin.glb',
    '3D - Mannequin By Astra/female/Woobi_Female_Mannequin.glb'
  ],
  male: [
    'woobi_male_mannequin.glb',
    '3D - Mannequin By Astra/Woobi_Male_Mannequin.glb',
    '3D - Mannequin By Astra/male/Woobi_Male_Mannequin.glb'
  ]
};

export class AvatarAssets {
  constructor(materials, THREE = window.THREE) {
    this.THREE = THREE;
    this.materials = materials;
    this.isLoading = false;
    this.isLoaded = false;
    this.activeModel = null;
    this.activeModelUrl = null;
    this.isDisposed = false;
  }

  loadRiggedModel(onSuccess, onError, assetPaths = AVATAR_ASSET_PATHS) {
    const THREE = this.THREE;
    if (!THREE || typeof THREE.GLTFLoader === 'undefined') {
      if (onError) onError(new Error('GLTFLoader not available'));
      return;
    }

    this.isLoading = true;
    const loader = new THREE.GLTFLoader();
    if (typeof MeshoptDecoder !== 'undefined') {
      loader.setMeshoptDecoder(MeshoptDecoder);
    } else if (typeof window !== 'undefined' && window.MeshoptDecoder) {
      loader.setMeshoptDecoder(window.MeshoptDecoder);
    }
    const urls = Array.isArray(assetPaths) ? assetPaths : [assetPaths];

    const tryLoad = (index) => {
      if (this.isDisposed) return;
      if (index >= urls.length) {
        this.isLoading = false;
        if (onError) onError(new Error('All avatar GLB asset paths failed to load.'));
        return;
      }

      const url = urls[index];
      loader.load(
        url,
        (gltf) => {
          if (this.isDisposed) {
            // Clean up to prevent orphaned resources
            if (gltf.scene) {
              gltf.scene.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                  if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
                  else c.material.dispose();
                }
              });
            }
            return;
          }

          const model = gltf.scene;
          model.name = 'GLTFAvatarGroup';
          if (gltf.animations && gltf.animations.length > 0) {
            model.userData.animations = gltf.animations;
          }

          // Strictly preserve 8cm dais elevation grounding contract (avatarRoot is positioned at y = 0.080)
          model.scale.set(0.96, 0.96, 0.96);
          model.position.set(0, 0, 0);

          // Helper to generate cylindrical UV coordinates for meshes without UVs so tactile textures map properly
          const ensureUVs = (geo) => {
            if (!geo || geo.attributes?.uv || !geo.attributes?.position || typeof THREE.BufferAttribute === 'undefined') return;
            const pos = geo.attributes.position;
            if (typeof geo.computeBoundingBox === 'function') geo.computeBoundingBox();
            const bb = geo.boundingBox;
            const minY = bb ? bb.min.y : 0;
            const maxY = bb ? bb.max.y : 1;
            const spanY = (maxY - minY) || 1;
            const uvs = new Float32Array(pos.count * 2);
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i);
              const y = pos.getY(i);
              const z = pos.getZ(i);
              const angle = Math.atan2(x, z);
              uvs[i * 2] = (angle / (Math.PI * 2)) + 0.5;
              uvs[i * 2 + 1] = (y - minY) / spanY;
            }
            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
          };

          // Apply luxury reference styling, tactile textile weaves, and relaxed fashion stance
          model.traverse((child) => {
            // Apply relaxed natural fashion stance with subtle outward toe flare
            if (child.name.includes('_L') && (child.name.includes('Sneaker') || child.name.includes('Pants_Leg'))) {
              child.rotation.y = Math.PI - 0.10;
            } else if (child.name.includes('_R') && (child.name.includes('Sneaker') || child.name.includes('Pants_Leg'))) {
              child.rotation.y = Math.PI + 0.10;
            }

            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material) {
                // Eliminate oily/glossy shine across all meshes:
                // Remove specular roughness maps that induce oily glare
                child.material.roughnessMap = null;
                child.material.metalnessMap = null;
                if ('clearcoat' in child.material) child.material.clearcoat = 0;
                if ('clearcoatRoughness' in child.material) child.material.clearcoatRoughness = 1;
              }

              // Check if model has pre-baked texture maps (such as female_mannequin or male_mannequin)
              if (child.material && child.material.map) {
                child.material.color = new THREE.Color(0xFFFFFF);
                if (child.name.includes('Hair') || child.name.includes('Eyeleashes') || child.name.includes('Eyelashes')) {
                  child.material.roughness = 0.78;
                  child.material.metalness = 0.02;
                  if (this.materials) this.materials.registerHairMaterial(child.material);
                } else {
                  // Natural soft matte finish for skin and clothing
                  child.material.roughness = 0.85;
                  child.material.metalness = 0.0;
                  if (this.materials && (child.name.includes('Body') || child.name.includes('Head'))) {
                    this.materials.registerSkinMaterial(child.material);
                  }
                }
                child.material.needsUpdate = true;
              } else if (child.name.includes('Top') || child.name.includes('Shirt')) {
                ensureUVs(child.geometry);
                if (child.material) {
                  child.material.color = new THREE.Color(0xF7F5F0);
                  if (this.materials?.tankMat?.map) child.material.map = this.materials.tankMat.map;
                  if (this.materials?.tankMat?.bumpMap) {
                    child.material.bumpMap = this.materials.tankMat.bumpMap;
                    child.material.bumpScale = 0.0035;
                  }
                  child.material.roughness = 0.85;
                  child.material.metalness = 0.01;
                  child.material.needsUpdate = true;
                }
              } else if (child.name.includes('Bottom') || child.name.includes('Pants')) {
                ensureUVs(child.geometry);
                if (child.material) {
                  child.material.color = new THREE.Color(0xD6C7B2);
                  if (this.materials?.trouserMat?.map) child.material.map = this.materials.trouserMat.map;
                  if (this.materials?.trouserMat?.bumpMap) {
                    child.material.bumpMap = this.materials.trouserMat.bumpMap;
                    child.material.bumpScale = 0.0030;
                  }
                  child.material.roughness = 0.88;
                  child.material.metalness = 0.01;
                  child.material.needsUpdate = true;
                }
              } else if (child.name.includes('Sneaker') || child.name.includes('Footwear') || child.name.includes('Shoes')) {
                if (child.material) {
                  if (child.name.includes('Sole')) {
                    child.material.color = new THREE.Color(0xEDE8DF);
                    child.material.roughness = 0.78;
                    child.material.metalness = 0.00;
                  } else {
                    child.material.color = new THREE.Color(0xFCFCFC);
                    child.material.roughness = 0.72;
                    child.material.metalness = 0.01;
                  }
                  child.material.needsUpdate = true;
                }
              } else if (child.name.includes('Hair')) {
                if (this.materials) {
                  child.material.color = new THREE.Color(0x1E120A);
                  child.material.roughness = 0.75;
                  child.material.metalness = 0.02;
                  this.materials.registerHairMaterial(child.material);
                }
              } else if (child.name.includes('Lip')) {
                if (child.material) {
                  child.material.color = new THREE.Color(0xCE6F66);
                  child.material.roughness = 0.60;
                  child.material.metalness = 0.0;
                }
              } else if (child.name.includes('Blush')) {
                if (child.material) {
                  child.material.color = new THREE.Color(0xDE8B80);
                  child.material.roughness = 0.70;
                  child.material.transparent = true;
                  child.material.opacity = 0.35;
                }
              } else if (child.name.includes('Earring') || child.name.includes('Hoop')) {
                if (child.material) {
                  child.material.color = new THREE.Color(0xD4AF37);
                  child.material.metalness = 0.85;
                  child.material.roughness = 0.25;
                }
              } else if (child.name.includes('Head') || child.name.includes('Body') || child.name.includes('Chin') || child.name.includes('Neck') || child.name.includes('Midriff') || child.name.includes('Hand') || child.name.includes('Shoulder') || child.name.includes('Arm') || child.name.includes('Forearm')) {
                if (child.material) {
                  child.material.color = new THREE.Color(0xF3D5C6);
                  child.material.roughness = 0.82;
                  child.material.metalness = 0.0;
                }
                if (this.materials) {
                  this.materials.registerSkinMaterial(child.material);
                }
              }
            }
          });

          this.activeModel = model;
          this.activeModelUrl = url;
          this.isLoaded = true;
          this.isLoading = false;

          if (onSuccess) onSuccess(model, url);
        },
        undefined,
        (err) => {
          if (this.isDisposed) return;
          console.warn(`AvatarAssets: Model ${url} unavailable, trying next candidate...`);
          tryLoad(index + 1);
        }
      );
    };

    tryLoad(0);
  }

  loadMannequinModel(gender = 'female', onSuccess, onError) {
    const paths = MANNEQUIN_ASSET_PATHS[gender] || MANNEQUIN_ASSET_PATHS.female;
    return this.loadRiggedModel(onSuccess, onError, paths);
  }

  cancelLoading() {
    this.isDisposed = true;
    this.isLoading = false;
  }

  dispose() {
    this.isDisposed = true;
    this.isLoading = false;
    if (this.activeModel) {
      this.activeModel.traverse((c) => {
        if (c.geometry && typeof c.geometry.dispose === 'function') {
          c.geometry.dispose();
        }
        if (c.material) {
          if (Array.isArray(c.material)) {
            c.material.forEach((m) => m.dispose && m.dispose());
          } else if (typeof c.material.dispose === 'function') {
            c.material.dispose();
          }
        }
      });
      this.activeModel = null;
    }
  }
}
