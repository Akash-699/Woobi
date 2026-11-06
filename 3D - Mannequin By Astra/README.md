# Woobi — separate male and female mannequins
Troyz Solutions | Created 3 November 2026 using Blender 4.0.2

## Actual delivered assets
male/Woobi_Male_Mannequin.blend and .glb
female/Woobi_Female_Mannequin.blend and .glb

These are real, editable static meshes, not image substitutes. Each GLB contains
only its own body mesh and material. Each Blender file also preserves hidden
construction geometry and includes preview lights and a camera.

## Verified results
Both primary bodies have 26,000 triangles, one connected component, zero
non-manifold edges, no loose vertices, UVs, and outward-oriented surface normals.
Male stature is 1.80 m; female stature is 1.70 m. Ground minimum is zero.
Both GLBs were independently exported and reimported into Blender: mesh count,
triangle count, stature and material count passed. Preview renders were inspected
and shoulder/hip/ankle transitions refined. Machine-readable statistics are in
validation_summary.json and the individual validation.json files.

## Import
Open the .blend directly in Blender, or import the .glb using glTF 2.0 import.
The hidden Construction_Source_NOT_EXPORTED collection is retained for editing.
Keep it hidden during rendering because it overlaps the finished body.

Blender coordinates: meters, Z up, forward -Y. Exported glTF coordinates: Y up,
forward +Z. Origin is at the ground beneath the body's center. Use unit scale.
In Three.js, load each GLB separately using GLTFLoader. Place its scene root at
the stage top and adjust yaw only after checking the actual studio conventions.
Switch visibility independently using each root's visible property. Rotation
is around Y in glTF/Three.js coordinates. Do not rotate again to convert Z up.

## Scope and remaining work
These are procedural static base mannequins, not fully production-approved
characters. The topology is primarily triangulated, not deformation-ready quad
retopology. UVs are automatically packed. There are no rigs, weight maps, shape
keys, LODs, clothing assets, cloth physics or virtual try-on implementation.
The pose is a shallow A-pose with hands clear of the hips. Additional artistic
refinement, garment fitting and target-device performance tests remain.

Three.js runtime loading and interaction were NOT tested in this environment.
The Woobi application and its actual coordinate conventions were not inspected
or changed. No repository branches or application files were modified.

The previews folder contains front, side, three-quarter and wireframe renders
for both models. The generation script is included for reproducibility.
