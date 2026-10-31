import bpy
import os
import math

out_dir = r"s:\Fashion_App"
blend_path = os.path.join(out_dir, "seren_avatar.blend")
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene

# 1. Rotate all Avatar and Eye parts 180 degrees around Z axis at (0, 0, 0)
bpy.ops.object.select_all(action='DESELECT')
avatar_objs = [obj for obj in scene.objects if (obj.name.startswith("Avatar_") or obj.name.startswith("Eye_")) and obj.type == 'MESH']

for obj in avatar_objs:
    obj.select_set(True)

# Set 3D cursor to (0, 0, 0) and rotate around 3D cursor
scene.cursor.location = (0, 0, 0)
# Rotate 180 degrees around Z
for obj in avatar_objs:
    # Rotate position and rotation around origin
    # Invert X and Y for position
    obj.location.x = -obj.location.x
    obj.location.y = -obj.location.y
    obj.rotation_euler.z += math.pi

# Also adjust Hair_Rim_Kicker and Face_Beauty_Glow lights if needed
# Hair_Rim_Kicker is at Y = 1.6 (behind avatar, which now matches her hair at +Y!)
# Face_Beauty_Glow is at Y = -1.2 (in front of avatar, which now illuminates her face at -Y!)
# Sunbeam_Key_Light is at (2.2, -2.4, 3.2) - shining from front-right!
# Studio_Soft_Fill is at (-1.8, -2.0, 1.6) - filling from front-left!
# The lighting is ALREADY designed for a front-facing avatar at -Y!

# Fast render settings
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.resolution_x = 1080
scene.render.resolution_y = 1440

cameras = [
    ("Cam_Full_Body", "seren_avatar_front.png"),
    ("Cam_Portrait",  "seren_avatar_portrait.png"),
    ("Cam_Angle",     "seren_avatar_angle.png")
]

for cam_name, fname in cameras:
    cam_obj = scene.objects.get(cam_name)
    if cam_obj:
        scene.camera = cam_obj
        scene.render.filepath = os.path.join(out_dir, fname)
        print(f"Rendering {fname} with {cam_name}...")
        bpy.ops.render.render(write_still=True)
        print(f"Saved: {fname}")

# Save the updated blend file
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Saved blend file to: {blend_path}")

# Re-export GLB
glb_path = os.path.join(out_dir, "seren_avatar.glb")
bpy.ops.object.select_all(action='DESELECT')
for obj in avatar_objs:
    obj.select_set(True)

# Also include the rug in GLB if desired, or just avatar
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    use_selection=True,
    export_format='GLB',
    export_materials='EXPORT',
    export_apply=True,
    export_yup=True
)
print(f"Exported updated GLB to: {glb_path}")

# Write model summary
summary_path = os.path.join(out_dir, "avatar_model_summary.txt")
total_verts = sum(len(obj.data.vertices) for obj in avatar_objs)
total_polys = sum(len(obj.data.polygons) for obj in avatar_objs)

summary_text = f"""============================================================
SEREN STUDIO - 3D PERSONALIZED HUMAN AVATAR SUMMARY (STEP 4)
============================================================

Asset: Stylized Luxury Female Fashion Avatar (Front-Facing)
Height: 1.72 m (head to sole)
Stance: Centered on origin (0, 0, 0), standing upright facing front camera (-Y)
Aesthetic: Modern Korean/Disney/Pixar luxury high-fashion styling

TOTAL GEOMETRY STATS:
  Total Mesh Objects: {len(avatar_objs)}
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
  - seren_avatar_front.png    (Full body, 55mm lens, portrait framing)
  - seren_avatar_portrait.png (Waist-up beauty portrait, 85mm lens)
  - seren_avatar_angle.png    (3/4 fashion perspective, 65mm lens)

THREE.JS INTEGRATION:
  - Position avatar at (0, 0.018, 0) on top of seren_stage.glb
  - Faces camera directly (Z-up in Blender / Y-up in Three.js)
  - Smooth 360-degree Y-axis rotation for outfit try-on
  - Optimized GLB ({len(avatar_objs)} parts): suitable for 60 FPS web/mobile
"""

with open(summary_path, 'w', encoding='utf-8') as f:
    f.write(summary_text)

print(f"Summary updated: {summary_path}")
print("ALL DONE!")
