# Stage Submodule (`modules/3d-studio/stage`)

## Responsibility
Responsible for the physical 3D ground stage, circular woven dais platform, contact shadow disc, stitched edge trim, 360-degree rotation guide arcs, and avatar grounding contracts.

## Key Specifications
- **Dais Elevation**: `0.080 m` (8.0 cm elevated dais stage).
- **Radius**: `0.95 m` (1.90 m diameter).
- **Thickness**: `0.080 m`.
- **Contact Shadow Radius**: `1.18 m` (soft 30% opacity shadow disc).
- **Stitched Trim**: Torus geometry `(radius + 0.004, 0.012, 16, 64)`.
- **Avatar Grounding Contract**: Avatars and mannequins must be positioned at `Y = 0.080 m`.

## Files
- `StageModel.js`: Main 3D model builder and lifecycle manager.
- `StageMaterials.js`: Standardized Three.js material configurations.
- `StageModel.test.js`: Automated dimensions, dais height, and grounding tests.
- `index.js`: Public submodule exports.
