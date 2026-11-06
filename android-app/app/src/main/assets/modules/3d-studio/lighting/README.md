# Woobi — 3D Studio Lighting Module

## Overview
The `lighting` module manages the shared atmospheric illumination for the **Woobi 3D Dressing Room Studio**. It simulates warm morning sunlight streaming through studio windows, gentle ambient fill, golden rim separation, and focused accents for the wardrobe and vanity dressing console.

## Architecture & Submodule Tree

```text
modules/3d-studio/lighting/
├── README.md               # Module architecture, light parameters & contract documentation
├── index.js                # Public API entry point, factory, and browser window bridge (WoobiLighting)
├── StudioLighting.js       # Central lighting orchestrator, light attachment, shadow cascade
├── LightingPresets.js      # Curated atmospheric presets (luxury-warm, editorial-neutral, soft-evening)
├── LightingController.js   # Controller for preset transitions, exposure, and accent toggles
└── StudioLighting.test.js  # 25+ automated unit, preset, shadow, and disposal tests
```

## Shared Fixture Specifications

| Fixture | Type | Color | Intensity | Position | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ambient** | AmbientLight | `0xFFF6EC` | 0.68 | N/A | Serene foundation fill |
| **Key Sunlight** | DirectionalLight | `0xFFF7E6` | 1.25 | `(2.8, 4.8, 3.0)` | Diagonal morning sunlight with PCF soft shadows |
| **Fill Light** | DirectionalLight | `0xFDF1E2` | 0.42 | `(-2.6, 3.2, 1.6)` | Softens deep shadows on avatar & wardrobe |
| **Rim Light** | DirectionalLight | `0xFFE5BE` | 0.85 | `(0.0, 3.8, -2.4)` | Golden separation rim along shoulders and hair |
| **Wardrobe Spot** | SpotLight | `0xFFE5BF` | 0.50 | `(-0.96, 3.2, 0.8)` | Interior wardrobe oak grain illumination |
| **Vanity Spot** | SpotLight | `0xFFE5BF` | 0.80 | `(0.95, 3.4, 0.4)` | Calacatta marble countertop accent |

## Shadow Map Configuration
- **Type**: `PCFSoftShadowMap`
- **Resolution**: `1024 x 1024`
- **Near / Far**: `0.5m / 10.0m`
- **Bias**: `-0.0002` (prevents acne without peter-panning)
- **Frustum Bounds**: `[-2.4, 2.4]` in X and Y

## Non-Interference Guarantee
The `lighting` module owns **shared studio illumination only**. It does not own or modify component-level lights:
- `Wardrobe_LED` remains owned and animated by `modules/3d-studio/wardrobe/`
- `Vanity_MirrorHaloLight` remains owned and toggled by `modules/3d-studio/mirror-vanity/`

## Public Usage

```javascript
import { createStudioLighting, LightingContract } from './modules/3d-studio/lighting/index.js';

// Initialize and mount
const lighting = createStudioLighting(scene, 'luxury-warm', THREE);
const controller = LightingContract.createController(lighting);

// Switch atmospheric moods
controller.applyPreset('editorial-neutral');

// Adjust intensity or toggle shadows
controller.setIntensityMultiplier(1.1);
controller.setShadowsEnabled(true);

// Safe disposal
lighting.dispose(scene);
```
