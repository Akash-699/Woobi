# Saved Looks Module (`saved-looks`)

The **Saved Looks Module** manages user-saved outfits, lookbook storage, metadata tagging, JSON export/import, and instant ensemble re-equipping in the Woobi 3D Studio.

## Architecture

- **`SavedLooksContract.js`**: Standard look schema definition, storage methods specification, and lifecycle events (`looks:saved`, `looks:deleted`, `looks:renamed`, `looks:loaded`).
- **`LookbookStorage.js`**: Fault-tolerant storage adapter synchronizing local memory cache with browser `localStorage` across versioned keys.
- **`SavedLooksManager.js`**: Core manager handling look creation, retrieval, deletion, renaming, export/import, and coordination with virtual try-on and avatar customization engines.
- **`index.js`**: Public export interface and `window.WoobiSavedLooks` namespace binding.

## Usage

```javascript
import { createSavedLooksManager } from './modules/3d-studio-features/saved-looks/index.js';

const looksManager = createSavedLooksManager();

// Save an outfit combination
const result = looksManager.saveLook(
  'Summer Linen Minimal',
  { top: 'tank', bottom: 'taupe_wide', shoes: 'sandals' },
  { skinTone: '#DEB192', hairStyle: 'bob' },
  ['summer', 'effortless']
);

// Re-equip the look onto 3D Studio
looksManager.reEquipLook(result.look.id, tryOnEngine, avatarCustomizer);

// Export lookbook to JSON
const exportedJson = looksManager.exportLooksJSON();
```
