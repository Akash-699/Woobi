# Woobi — 3D Studio Camera Module

## Overview
The `camera` module manages the Three.js camera system, viewpoint presets, transitions, zoom clamping, and user interaction handlers for the **Woobi 3D Dressing Room Studio**. It ensures seamless, silky-smooth viewpoint transitions between studio overview, wardrobe closeup, avatar full body/detail, and vanity/mirror perspectives while optimizing fields of view for mobile portrait and desktop landscape aspects.

## Architecture & Submodule Tree

```text
modules/3d-studio/camera/
├── README.md               # Architecture documentation, presets, and interaction specifications
├── index.js                # Public API entry point, factory, and browser window bridge (WoobiCamera)
├── CameraPresets.js        # Viewpoint presets, positions, targets, portrait/landscape FOV configs
├── StudioCamera.js         # Three.js PerspectiveCamera lifecycle, resizing, near/far/aspect bounds
├── CameraTransitions.js    # Lerp smoothing, zoom damping, FOV interpolation, focus target management
├── CameraInteractions.js   # Pointer drag, touch drag, pinch-to-zoom, mouse wheel, and cleanup
├── CameraController.js     # Unified orchestrator coordinating camera, transitions, raycasting, interactions
└── StudioCamera.test.js    # 25+ automated unit, preset, transition, boundary, and disposal tests
```

## Viewpoint Presets

| Preset Name | Camera Position (X, Y, Z) | LookAt Target (X, Y, Z) | Landscape FOV | Portrait FOV | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`STUDIO_OVERVIEW`** | `(0.00, 1.22, 3.10)` | `(-0.08, 1.08, 0.00)` | 42° | 56° | Default master view of studio, avatar, wardrobe, and vanity |
| **`WARDROBE_CLOSEUP`**| `(-0.96, 1.20, 2.50)` | `(-0.96, 1.20, -0.32)`| 38° | 54° | Direct frontal focus into open wardrobe cabinet & racks |
| **`AVATAR_FULL_BODY`** | `(0.00, 1.10, 2.10)` | `(0.00, 1.00, 0.00)`  | 36° | 44° | Complete head-to-toe styling review on stage |
| **`AVATAR_DETAIL`**    | `(0.00, 1.44, 1.10)` | `(0.00, 1.38, 0.00)`  | 30° | 36° | Closeup portrait framing for face, jewelry & accessories |
| **`VANITY_VIEW`**      | `(0.65, 1.25, 1.55)` | `(0.85, 1.20, -0.10)` | 38° | 46° | Angled focus on vanity console and cosmetics tabletop |
| **`MIRROR_VIEW`**      | `(0.65, 1.25, 1.55)` | `(0.85, 1.20, -0.10)` | 38° | 46° | Mirror interaction framing aligned with vanity table |

## Dynamic Field of View & Aspect Handling
- **Portrait Threshold**: Aspect ratio `< 0.75` (width / height).
- **Portrait Optimization**: Broader FOVs compensate for narrow screen widths on mobile smartphones, ensuring characters and furniture remain uncropped.
- **Landscape Optimization**: Narrower FOVs prevent wide-angle lens distortion on desktop displays.
- **Clamping**: FOV is strictly clamped between `[26.0°, 66.0°]`.
- **Zoom Factor**: Zoom factor is clamped between `[0.70, 1.40]`.

## Smooth Transitions & Damping
- **Position Lerp Speed**: `0.075` per frame
- **LookAt Target Lerp Speed**: `0.075` per frame
- **FOV Zoom Damping Speed**: `0.10` per frame

## Non-Interference & Lifecycle Guarantees
- **Clean Event Teardown**: `CameraInteractions` detaches all mouse, touch, wheel, and resize event listeners on `dispose()` to prevent memory leaks.
- **Shared Object Safety**: Camera raycasting checks `interactiveObjects` without mutating external geometries or scene graphs.
- **Safe Repeated Calls**: `dispose()` is idempotent and safe to call multiple times.

## Public Usage

```javascript
import { createStudioCamera, CameraContract } from './modules/3d-studio/camera/index.js';

// Initialize Camera Controller with Canvas
const cameraController = createStudioCamera(canvasElement, {
  width: window.innerWidth,
  height: window.innerHeight,
  initialPreset: 'STUDIO_OVERVIEW',
  onRotate: (delta) => avatar.rotate(delta),
  onClick: (x, y) => cameraController.raycastClick(x, y, canvas, interactiveObjects, handleSelect)
}, THREE);

// Switch viewpoint presets
cameraController.setCameraPreset('WARDROBE_CLOSEUP');

// Resize on window changes
cameraController.resize(newWidth, newHeight);

// In render loop
cameraController.update(delta);

// Full clean disposal
cameraController.dispose();
```
