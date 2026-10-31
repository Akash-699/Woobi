# Sérén Studio — model report

## Geometry and hierarchy

Cabinet dimensions: 2.20 × 0.65 × 3.00 m (width × depth × height). Overall exported depth, including trailing foliage: approximately 0.817 m. Origin at cabinet base; Blender Z-up, GLB Y-up.

| Collection | Editable mesh objects | Evaluated triangles |
|---|---:|---:|
| Wardrobe_Structure | 36 | 5,840 |
| Hanging_Rail | 3 | 276 |
| Hangers | 21 | 4,004 |
| Hanging_Garments | 238 | 134,484 |
| Folded_Clothing | 160 | 8,320 |
| Shoes | 102 | 45,108 |
| Accessories | 21 | 5,440 |
| Plants | 212 | 31,160 |
| **Total** | **793** | **234,632** |

Counts include evaluated bevel and fabric-thickness modifiers. Faces are reported as triangles to match the renderer and glTF export. The Blender source retains editable quads and modifiers where constructed.

Additional requested collection: `Lighting`, containing five integrated warm shelf area lights. Additional presentation-only collection: `Studio_Inspection`, containing the ground, three neutral studio lights, and three preview cameras.

Garment assemblies: white button-down shirt; cream blouse; beige jacket; charcoal blazer; ivory knitwear; neutral trousers; striped shirt. Hangers and drawer assemblies have separate parents.

## GLB budget

- File size: 9.76 MB.
- 22 mesh assemblies; 46 nodes; 21 materials; 6 embedded texture images.
- 65 material primitives (approximately this many base-pass draw calls before shadow passes).
- No external texture URLs, cameras, punctual lights, inspection ground, or room geometry.
- Meshes consolidated by assembly; the entire wardrobe is not one mesh.

## Validation

Custom binary checks passed: valid GLB 2.0 header and byte length; triangle indices in range; finite position, normal and UV data; normals and UVs present on all primitives; embedded images; no exported cameras or punctual lights. The evaluated source and exported GLB both contain 234,632 triangles.

The actual Blender model was rendered from the front, at 45 degrees in plan, and close to the hanging garments. The front camera has a small downward pitch to reveal shelf and shoe depth. The reference comparison informed the oak cabinet, full-width rail, warm shelf strips, top storage and trailing plant, lower drawers and shoes. The model is an interpretation of the stylized reference at the requested 2.2 m width, not a pixel-exact reconstruction.

Inspection prompted actual geometry changes: fuller shoes, clearance at the outer garments, deeper fabric folds, and shaped shoulder caps to cover the previously open sleeve tops. Edge shading was corrected on beveled furniture and accessory meshes.

## Material and lighting behavior

Oak base colour and roughness, cloth/leather tangent-space normal maps, striped cotton colour, metallic brass and emissive diffuser materials are preserved in glTF. Fabric normal maps add weave; the principal garment silhouette and folds are geometry. Texture images are packed in Blender and embedded in the GLB.

Integrated shelf lights approximate 3000 K. Inspection lights are neutral. The GLB retains emissive diffuser meshes but does not contain Blender light objects. Runtime lighting/environment and shadows must be supplied separately in Three.js.

## Scope and practical limits

This is a detailed static prop, with modeled cloth rather than simulated or scanned garments. No rig, animation, avatar fitting, sewing patterns, collision meshes, mobile LOD, or baked lighting is included. Garment components remain editable, but are not guaranteed manifold sewing-ready clothing.

The 235k-triangle/65-primitive budget is intended as a detailed desktop starting point. Actual frame rate has not been profiled inside the user’s React Three Fiber application. For mobile or multiple copies, create LODs, simplify hidden surfaces, and atlas materials as needed.

All geometry and texture maps were created for this task; no external mesh/texture asset dependencies. See `ASSETS_AND_LICENSES.md`.
