# Woobi — Vanity Setup

Standalone modeled furniture asset based on the supplied studio reference. The mirror is completed as a tall arch per the written brief; the reference is cropped and does not show its full outline. This is a reference-guided reconstruction, not a measured replica.

## Deliverables
- woobi_vanity.blend — Blender 4.5 source, individual editable accessory meshes, bevel modifiers, materials and packed textures.
- woobi_vanity.glb — self-contained glTF 2.0 binary with the furniture only. Small floral and brush parts are consolidated by material to reduce draw calls.
- woobi_vanity_front.png, woobi_vanity_angle.png, woobi_vanity_closeup.png — Cycles product renders.

## Scale and placement
Meters, Blender Z up, front faces -Y. Root Vanity_Set at world origin; floor contact Z=0. GLB uses standard glTF Y-up conversion.
- Mirror: 1.02 m wide, 1.68 m tall, approximately 0.035 m frame depth. Bottom at 0.79 m, top at 2.47 m.
- Table: 1.40 m wide, 0.46 m deep, 0.78 m high.
- Stool: 0.48 m diameter, 0.46 m high.
- Assembled footprint includes stool in front: approximately 1.40 x 1.10 m.

## Structure
Vanity_Set contains Mirror_Frame, Mirror_Surface, Mirror_Illuminated_Edge, Vanity_Table, Bench, and VanityAccessories. Table, legs, stool seat/base, perfume, cosmetics, brush set and vase groups are individually named.

## Materials and app integration
Marble base color and fabric normal maps are 1024 px, packed in Blender and embedded in GLB. Mirror has a separate low-roughness metallic silver material; it contains no photographed or baked reflection. Live mirror reflections require a planar reflection implementation (such as a Three.js Reflector) or renderer reflection probes. A standard GLB material alone does not render the current scene as a mirror. The Blender renders use path-traced reflections.

Transparent bottles use KHR_materials_transmission; upholstery uses KHR_materials_sheen; LED uses KHR_materials_emissive_strength. Use a loader supporting these extensions. Emission does not automatically create light or bloom in a realtime engine. Enable lighting/bloom as needed. Glass transparency and mirror reflections should be tested in the destination app.

Presentation_Only contains a neutral seamless ground, camera and studio lights in the blend file. It is excluded from GLB; no room, wardrobe or avatar is included. Hide that collection for asset-only editing.

## Validation
GLB was imported into a clean Blender scene. Required named groups, textures, world bounds and absence of presentation lights/cameras were checked. See glb_validation.json for measured triangle and mesh counts. Device-specific Woobi performance was not tested.

## Rebuilding
With Blender 4.5, run build_vanity.py, then refine_render.py, then optimize_validate.py. The first script creates geometry and initial renders; the second corrects flat mirror shading and creates the final presentation; the third exports the optimized GLB and validates it. The Blender source retains separate accessory parts.
