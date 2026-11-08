# Garment Interactions Module (`garment-interactions`)

The **Garment Interactions Module** provides 3D raycasting, pointer hover detection, and direct interactive garment selection in the Woobi 3D Studio.

## Architecture

- **`InteractionsContract.js`**: Defines the public API contract, standard interaction states (`idle`, `hovered`, `selected`), and pointer event topics.
- **`SelectionFeedback.js`**: Manages non-destructive visual highlight effects, including emissive pulses and state restoration.
- **`GarmentInteractions.js`**: Core interaction controller that converts 2D pointer coordinates into normalized device coordinates (NDC), executes raycasting against registered meshes, and emits lifecycle events.
- **`index.js`**: Public module export and global `window.WoobiGarmentInteractions` namespace binder.

## Usage

```javascript
import { createGarmentInteractions } from './modules/3d-studio-features/garment-interactions/index.js';

const interactions = createGarmentInteractions({
  camera: studioCamera,
  domElement: renderer.domElement
});

// Register garment mesh
interactions.registerInteractiveMesh(tankTopMesh, {
  garmentId: 'tank',
  category: 'top'
});

// Listen to selections
interactions.on('garment:select', (data) => {
  console.log('Selected garment in 3D scene:', data.garmentId);
});
```
