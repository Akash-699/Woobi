# Avatar Customization Module (`avatar-customization`)

The **Avatar Customization Module** provides skin tone selection, hair styles, hair colors, body proportions, gender presentation, accessories toggling, undo/redo history, and persistence in the Woobi 3D Studio.

## Architecture

- **`CustomizerContract.js`**: Contract specification, customizer method declarations, and lifecycle event definitions.
- **`CustomizationPresets.js`**: Curated preset palettes for inclusive skin tones, realistic hair shades, hairstyles, and anatomical body proportions.
- **`AvatarCustomizer.js`**: State manager providing undo/redo stacks, dual-key localStorage persistence (`seren_avatar_prefs`, `woobi_avatar_prefs`), and avatar model synchronization.
- **`index.js`**: Public export interface and `window.WoobiAvatarCustomizer` global registration.

## Usage

```javascript
import { createAvatarCustomizer } from './modules/3d-studio-features/avatar-customization/index.js';

const customizer = createAvatarCustomizer(avatarModel);

// Set skin tone
customizer.setSkinTone('golden_beige');

// Change hairstyle and hair color
customizer.setHairstyle('bob');
customizer.setHairColor('chestnut');

// Undo last change
customizer.undo();
```
