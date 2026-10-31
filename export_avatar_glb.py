"""
Minimal GLB export script for seren_avatar.blend
Re-uses the already-rendered blend file — no re-render needed.
"""
import bpy
import os

out_dir = r"s:\Fashion_App"
blend_path = os.path.join(out_dir, "seren_avatar.blend")
glb_path   = os.path.join(out_dir, "seren_avatar.glb")

# Open the saved avatar blend file
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene

# Select all mesh objects for export (deselect lights, cameras, empties)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type == 'MESH':
        obj.select_set(True)

print(f"Exporting GLB to: {glb_path}")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    use_selection=True,
    export_format='GLB',
    export_materials='EXPORT',
    export_apply=True,
    export_yup=True
)
print(f"GLB export complete: {glb_path}")

# Also write model summary
summary_path = os.path.join(out_dir, "avatar_model_summary.txt")
mesh_objects = [obj for obj in scene.objects if obj.type == 'MESH']
total_verts = sum(len(obj.data.vertices) for obj in mesh_objects)
total_polys = sum(len(obj.data.polygons) for obj in mesh_objects)

summary_text = f"""============================================================
SEREN STUDIO - 3D PERSONALIZED HUMAN AVATAR SUMMARY (STEP 4)
============================================================

Asset: Stylized Luxury Female Fashion Avatar
Height: 1.72 m (head to sole)
Stance: Centered on origin (0, 0, 0), standing upright on stage
Aesthetic: Modern Korean/Disney/Pixar luxury high-fashion styling

TOTAL GEOMETRY STATS:
  Total Mesh Objects: {len(mesh_objects)}
  Total Vertices:     {total_verts:,}
  Total Polygons:     {total_polys:,}

COLLECTION BREAKDOWN:
  [Avatar_Body]: Slender neck, anatomical clavicles, shoulders, arms, hands, midriff
  [Avatar_Face]: Sculpted cranium, tapered chin, blush cheeks, almond eyes (sclera, iris, pupil, glint),
                 winged lashes, arched brows, contoured nose, satin rosy lips, ears
  [Avatar_Hair]: Base scalp volume, chic top knot bun, braided twist ring, face-framing tendrils/wisps
  [Avatar_Clothing]:
    - Halter Top: Sleeveless high crew-neck crop top in off-white ribbed knit fabric
    - Trousers: High-waisted fluid wide-leg tailored trousers in light sand/oatmeal
  [Avatar_Footwear]: Minimalist chunky white platform sneakers with rubber soles
  [Avatar_Accessories]: Brushed gold hoop earrings

PBR MATERIALS:
  - M_Avatar_Skin        (Warm ivory, Principled BSDF + SSS)
  - M_Avatar_Hair        (Warm espresso brunette, anisotropic sheen)
  - M_Avatar_Lips        (Satin rosy coral, clearcoat)
  - M_Avatar_Top_Ribbed  (Off-white procedural ribbed knit + sheen)
  - M_Avatar_Trousers_Sand (Sand/oatmeal linen, noise bump + drape)
  - M_Sneaker_White_Upper / M_Sneaker_White_Sole
  - M_Earring_Gold       (92% metallic brass/gold)

RENDER PREVIEWS:
  - seren_avatar_front.png    (Full body, 55mm lens, portrait)
  - seren_avatar_portrait.png (Waist-up beauty, 85mm lens)
  - seren_avatar_angle.png    (3/4 fashion perspective, 65mm lens)

THREE.JS INTEGRATION:
  - Position avatar at (0, 0.018, 0) on top of seren_stage.glb
  - Smooth 360-degree Y-axis rotation for outfit try-on
  - Optimized GLB: suitable for 60 FPS web/mobile
"""

with open(summary_path, 'w', encoding='utf-8') as f:
    f.write(summary_text)

print(f"Summary written: {summary_path}")
print("=" * 60)
print("SEREN STUDIO AVATAR EXPORT COMPLETE")
print("=" * 60)
