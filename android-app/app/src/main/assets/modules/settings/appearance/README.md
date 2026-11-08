# Appearance Settings Module (`modules/settings/appearance`)

The **Appearance Settings Module** coordinates light/dark application themes, font scaling, high-contrast accessibility modes, and real-time 3D Studio architectural themes and lighting presets.

## Architecture

- **`AppearanceContract.js`**: Supported application themes (`light`, `dark`, `system`), 3D studio architectural themes (`luxury-cream`, `nordic-minimal`, `warm-terracotta`), lighting setups, and event contracts.
- **`AppearanceManager.js`**: Applies CSS classes and variables to the DOM, persists selections across sessions in `localStorage`, and articulates with 3D Studio's `themeModel` and `lightingModel`.
- **`index.js`**: Public export interface and `window.WoobiAppearanceSettings` namespace binder.

## Usage

```javascript
import { createAppearanceManager, STUDIO_THEMES } from './modules/settings/appearance/index.js';

const appearance = createAppearanceManager(studio3dInstance);

// Set application light/dark theme
appearance.setAppTheme('dark');

// Visibly change 3D studio environment
appearance.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);

// Adjust lighting setup
appearance.setStudioLighting('editorial_soft');
```

