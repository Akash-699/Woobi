# Mirror & Vanity Submodule (`modules/3d-studio/mirror-vanity`)

## Responsibility
Responsible for the physical 3D grooming vanity, illuminated arched mirror, Calacatta Gold marble countertop, cosmetic accessories, ottoman stool, and real-time mirror reflection pipeline.

## Key Specifications
- **Studio Position**: `(0.92, 0, -0.05)` (positioned on right side, angled gracefully at `-0.32 rad`).
- **Table Dimensions**: `Width: 0.98 m`, `Height: 0.84 m`, `Depth: 0.46 m`.
- **Mirror Radius**: `0.48 m` (arched circular mirror with continuous 360° warm LED glow ring).
- **Ottoman Stool**: `Position: (0.12, 0, 0.42)`, `Radius: 0.25 m`, `Height: 0.40 m`.
- **Authentic Asset**: `woobi_vanity.glb` / `seren_vanity.glb` (4.2 MB glTF 2.0 binary, 45 meshes, 63,584 triangles, packed 1K UV maps for ivory marble & bouclé normal, KHR transmission/sheen/emission, with champagne brass, reflective silver mirror, perfume flacons, cosmetic cream jars, brushes, and floral vase arrangement).
- **Reflection Pipeline**: Offscreen WebGL render target (`512x512`) with automatic resource disposal and feedback loop prevention.

## Files
- `VanityModel.js`: Main 3D model builder, hierarchy, and lifecycle.
- `VanityMaterials.js`: Standardized PBR materials (Calacatta marble, champagne brass, mirror glass, amber glass, bouclé).
- `VanityAssets.js`: GLTF loader pipeline for `seren_vanity.glb` and fallback resolution.
- `MirrorReflection.js`: Dedicated WebGL render target and camera reflection pipeline.
- `VanityLighting.js`: Radiance point light controller with enable/disable support.
- `VanityModel.test.js`: Automated dimensions, materials, reflections, lighting, fallback, and disposal tests.
- `index.js`: Public submodule exports.
