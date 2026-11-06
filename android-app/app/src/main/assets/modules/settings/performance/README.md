# Performance Settings Module (`modules/settings/performance`)

The **Performance Settings Module** governs Three.js WebGL graphics quality presets (High, Medium, Low, Battery Saver, Auto), shadow map resolution toggles, vanity mirror reflection pass controls, and secondary idle motion dynamics.

## Architecture

- **`PerformanceContract.js`**: Supported presets (`high`, `medium`, `low`, `battery_saver`, `auto`), shadow options (`soft`, `basic`, `off`), mirror options (`full`, `half`, `off`), and event constants.
- **`PerformanceManager.js`**: Connects directly to Three.js `renderer.setPixelRatio`, `shadowMap.enabled`, `vanityModel.reflection`, and `features.animations` while maintaining uninterrupted wardrobe interactions, avatar customization, and camera controls.
- **`index.js`**: Public export interface and `window.WoobiPerformanceSettings` namespace binder.

## Usage

```javascript
import { createPerformanceManager, PERFORMANCE_PRESETS } from './modules/settings/performance/index.js';

const performance = createPerformanceManager(studio3dInstance);

// Set quality preset
performance.setPreset(PERFORMANCE_PRESETS.MEDIUM);

// Toggle battery saver mode
performance.setPreset(PERFORMANCE_PRESETS.BATTERY_SAVER);

// Toggle mirror reflections
performance.setReflectionQuality('off');
```

