# Woobi — 3D Studio Theme & Environment Module

## Overview
The `theme` module encapsulates the physical architectural environment and visual atmosphere for the **Woobi 3D Dressing Room Studio**. It provides the 16x16m cream marble tile floor, the 6.6m radius curved plaster wall, projected window mullion shadow geometry, overhead studio softbox fixture, cinematic foreground framing foliage, atmospheric fog, and curated design tokens.

## Architecture & Submodule Tree

```text
modules/3d-studio/theme/
├── README.md               # Architecture, dimensions & contract documentation
├── index.js                # Public API entry point, factory, and browser window bridge (WoobiTheme)
├── StudioTheme.js          # Central architecture orchestrator (floor, back wall, softbox, shadows)
├── ThemeMaterials.js       # PBR materials for architectural plaster, marble floor, softbox, foliage
├── ThemePresets.js         # Curated atmospheric presets (luxury-cream, nordic-minimal, warm-terracotta)
└── StudioTheme.test.js     # 25+ automated unit, preset, geometry, and disposal tests
```

## Architectural Component Dimensions

| Component | Geometry | Dimensions / Radius | Position | Material Finish |
| :--- | :--- | :--- | :--- | :--- |
| **Marble Floor** | PlaneGeometry | 16m x 16m | `(0, 0, 0)`, rot `-90°` | Polished cream marble tile (`roughness: 0.28`) |
| **Curved Back Wall**| CylinderGeometry | Radius 6.6m, Height 6.8m | `(0, 3.4, 0)` | Serene cream plaster (`0xF7F2EA`, `roughness: 0.88`, BackSide) |
| **Window Shadow** | Group (4 Planes) | 0.38m x 0.58m per pane | `(0.8, 1.8, -1.2)` | Transparent diagonal sunlight shadow (`opacity: 0.075`) |
| **Overhead Softbox**| Box & Diffuser | 0.34m x 0.48m x 0.22m | `(-1.12, 2.65, 0.88)` | Matte black housing, white diffuser, local point light glow |
| **Framing Foliage** | 4 Spheres | Scale `(1.6, 0.18, 0.85)` | `(-0.95, 0.15, 1.85)` | Deep photographic green (`0x2A4526`) for depth-of-field effect |

## Separation of Concerns
- **Physical Environment**: The `modules/3d-studio/theme/` module manages Three.js geometries, scene fog, backgrounds, and architectural PBR materials.
- **User Settings**: High-level user preferences and theme toggles are persisted in `modules/settings/appearance/` and applied cleanly through `theme.applyTheme(presetName, scene)`.

## Public Usage

```javascript
import { createStudioTheme, ThemeContract } from './modules/3d-studio/theme/index.js';

// Initialize and mount
const theme = createStudioTheme(scene, textures, 'luxury-cream', THREE);

// Switch atmospheric environment
theme.applyTheme('nordic-minimal', scene);

// Inspect state
const state = theme.getThemeState();

// Safe disposal
theme.dispose(scene);
```
