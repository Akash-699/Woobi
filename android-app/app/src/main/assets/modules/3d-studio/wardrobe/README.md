# Wardrobe Submodule (`modules/3d-studio/wardrobe`)

## Responsibility
Responsible for the physical 3D natural light-oak wardrobe furniture, Astra GLTF model integration, cabinet structure, shelves, LED strip lighting, clothing rail, and door animation states.

## Key Specifications
- **Scale Factor**: `2.40 / 3.00` (`0.80`).
- **Width**: `1.76 m` (`2.20 * scale`).
- **Height**: `2.40 m` (`3.00 * scale`).
- **Depth**: `0.52 m` (`0.65 * scale`).
- **Position**: `(-0.96, 0, -0.32)`.
- **Rotation Y**: `0.30 rad`.
- **Asset Paths**: `3D- Wardrobe by Astra/wardrobe.glb`, `wardrobe.glb`.
- **Integrated Lighting**: 3000K recessed LED strips and ambient internal shelf point lights.

## Module Structure
- `WardrobeModel.js`: Main 3D model builder, hierarchy, and lifecycle.
- `WardrobeMaterials.js`: PBR materials (honey oak, satin brass, LED glow, storage boxes).
- `WardrobeAnimations.js`: Door hinge rotation controllers and state management.
- `WardrobeAssets.js`: GLTF loader pipeline and Astra material integration.
- `WardrobeModel.test.js`: Automated dimensions, animations, fallback, and resource disposal tests.
- `index.js`: Public submodule exports.
