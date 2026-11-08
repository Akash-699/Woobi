# Woobi — 3D Studio Avatar Module

## Overview
The `avatar` module encapsulates the physical 3D humanoid character for **Woobi**. It provides anatomical modeling, PBR material pipelines, dynamic skin/hair customization, body proportion scaling, gender presentation switching, natural idle animations (breathing and eyelid blinking), genuine GLTF/GLB asset loading, and strict dais grounding enforcement.

## Module Structure

```text
modules/3d-studio/avatar/
├── README.md               # Module architecture, hierarchy & contract documentation
├── index.js                # Public API contract, factory, and browser window bridge (WoobiAvatar)
├── AvatarModel.js          # Central model orchestrator, lifecycle, GLB fallback, grounding
├── AvatarMaterials.js      # PBR skin, hair, facial features, and wearable garment finishes
├── AvatarRig.js            # Anatomical hierarchy (head, chest, limbs, hands, sneakers)
├── AvatarAssets.js         # Genuine GLTF/GLB asset loading (seren_avatar.glb) & fallbacks
├── AvatarMorphs.js         # Proportion presets (regular, petite, tall, athletic, curvy)
├── AvatarAnimations.js     # Idle breathing, periodic eyelid blinking, rotation damping
├── AvatarController.js     # Customization API, state, and localStorage persistence
└── AvatarModel.test.js     # Automated test suite (30+ unit, regression & disposal tests)
```

## Critical Dais Grounding Contract
- **Elevation**: `AVATAR_CONFIG.daisElevation = 0.080m` (8 cm).
- The avatar root group is anchored at `(0, 0.080, 0)`.
- All vertical scaling transformations (e.g. `petite`, `tall`, `athletic`) preserve the contact plane of the footwear at the top surface of the elevated stage platform.

## Body Proportion Presets
- `regular`: scale `(1.00, 1.00, 1.00)`
- `petite`: scale `(0.94, 0.94, 0.94)`
- `tall`: scale `(0.98, 1.06, 0.98)`
- `athletic`: scale `(1.05, 1.02, 1.05)` (Default for masculine presentation)
- `curvy`: scale `(1.08, 1.00, 1.08)`

## 3D Asset Resolution Order
1. `seren_avatar.glb` (Authentic 347 KB Blender character model in repository root)
2. `assets/models/avatar_female.glb` (Local fallback asset)
3. `https://readyplayerme.github.io/visage/female.glb` (Remote Ready Player Me fallback)
4. Procedural Stylized Humanoid (Instant, high-definition fallback that renders immediately without network or file dependencies)

## Public API

```javascript
import { createAvatar, AvatarContract } from './modules/3d-studio/avatar/index.js';

// Initialize and mount avatar
const avatar = createAvatar(scene, textures, THREE);
const controller = AvatarContract.createController(avatar);

// Customization
controller.setSkinTone('#F3D5C6');
controller.setHairColor('#1E120A');
controller.setBodyProportions('athletic');
controller.setGenderPresentation('masculine');

// Per-frame animation loop
avatar.update(delta, time);

// Safe resource cleanup
avatar.dispose(scene);
```

## Resource Ownership & Disposal
- **Owned Resources**: All internal geometries (cranium, chin, eyes, torso, limbs, footwear), internal materials, and asset loader models are disposed when `avatar.dispose(scene)` is called.
- **Shared Resources**: External textures passed in (e.g. `textures.ribbedKnit`, `textures.linenWeave`) belong to the studio and are **never** disposed by the avatar module.
