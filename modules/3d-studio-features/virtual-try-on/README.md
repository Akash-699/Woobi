# Virtual Try-On Module (`virtual-try-on`)

The **Virtual Try-On Module** manages real-time garment selection, category slot resolution, layering, and avatar material synchronization in the Woobi 3D Studio.

## Architecture

- **`GarmentCatalog.js`**: Canonical database of garments spanning tops, bottoms, shoes, and accessories with physically-based material properties (color, roughness, metalness) and mesh target configurations.
- **`TryOnContract.js`**: Public API contract, event specifications, and type validation rules.
- **`VirtualTryOn.js`**: State engine tracking active outfit combinations, orchestrating swapping events, and projecting material updates onto the avatar rig.
- **`index.js`**: Public entry point exporting classes, factories, and establishing `window.WoobiTryOn`.

## Public API

```javascript
import { createVirtualTryOn, GARMENT_CATALOG } from './modules/3d-studio-features/virtual-try-on/index.js';

const tryOn = createVirtualTryOn(avatarModel, {
  autoApplyToAvatar: true,
  initialOutfit: { top: 'tank', bottom: 'taupe_wide', shoes: 'sneakers' }
});

// Equip a garment
tryOn.equipGarment('top', 'blazer');

// Inspect equipped outfit
const currentOutfit = tryOn.getEquippedOutfit();

// Listen to garment equip events
tryOn.on('tryon:equip', (event) => {
  console.log('Equipped:', event.garment.name);
});
```
