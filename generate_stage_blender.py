# pyrefly: ignore-all-errors
# type: ignore
try:
    import bpy  # type: ignore # pyrefly: ignore
    import bmesh  # type: ignore # pyrefly: ignore
    import mathutils  # type: ignore # pyrefly: ignore
except ImportError:
    bpy = None  # type: ignore
    bmesh = None  # type: ignore
    mathutils = None  # type: ignore
import math
import os
import random

print("=" * 60)
print("SÉRÉN STUDIO — 3D LUXURY CIRCULAR RUG STAGE (STEP 3)")
print("=" * 60)

# ---------------------------------------------------------------------------
# 1. INITIAL SCENE CLEANUP & SETUP
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
scene.unit_settings.length_unit = 'METERS'

scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 48
scene.cycles.use_denoising = True

# Filmic Color Management
if 'AgX' in [c.name for c in bpy.types.ColorManagedViewSettings.bl_rna.properties['view_transform'].enum_items]:
    scene.view_settings.view_transform = 'AgX'
else:
    scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'Medium Contrast'
scene.view_settings.exposure = 0.0

# Warm neutral world lighting
world = bpy.data.worlds.new("Seren_Stage_World")
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wn.clear()
wbg = wn.new('ShaderNodeBackground')
wbg.inputs['Color'].default_value = (0.93, 0.90, 0.85, 1.0)
wbg.inputs['Strength'].default_value = 0.55
wout = wn.new('ShaderNodeOutputWorld')
world.node_tree.links.new(wbg.outputs['Background'], wout.inputs['Surface'])

# ---------------------------------------------------------------------------
# 2. NAMED COLLECTIONS
# ---------------------------------------------------------------------------
col_names = ["Stage_Base", "Rug_Surface", "Rug_Edge", "Rug_Detail",
             "Studio_Environment", "Lighting", "Cameras"]
collections = {}
for name in col_names:
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    collections[name] = col

stage_col_names = ["Stage_Base", "Rug_Surface", "Rug_Edge", "Rug_Detail"]

def link_obj(obj, col_name):
    if col_name in collections:
        collections[col_name].objects.link(obj)
    else:
        scene.collection.objects.link(obj)

# ---------------------------------------------------------------------------
# 3. PBR MATERIALS
# ---------------------------------------------------------------------------
materials = {}

def set_bsdf(bsdf, **kwargs):
    for k, v in kwargs.items():
        candidates = [k]
        if k == 'base_color': candidates = ['Base Color']
        elif k == 'roughness': candidates = ['Roughness']
        elif k == 'metallic': candidates = ['Metallic']
        elif k == 'sheen': candidates = ['Sheen Weight', 'Sheen']
        elif k == 'subsurface': candidates = ['Subsurface Weight', 'Subsurface']
        elif k == 'emission_color': candidates = ['Emission Color', 'Emission']
        elif k == 'emission_strength': candidates = ['Emission Strength']
        for cand in candidates:
            if cand in bsdf.inputs:
                bsdf.inputs[cand].default_value = v
                break

def create_woven_fabric_material(name):
    """
    Realistic cream bouclé/woven fabric material using procedural nodes.
    Combines two noise scales for fine thread detail and a larger weave bump.
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    # --- Texture Coordinates ---
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-1200, 0)

    mapping = nodes.new('ShaderNodeMapping')
    mapping.location = (-1000, 0)
    mapping.inputs['Scale'].default_value = (28.0, 28.0, 28.0)
    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

    # --- Fine Thread Noise (Microdetail) ---
    noise_fine = nodes.new('ShaderNodeTexNoise')
    noise_fine.location = (-750, 180)
    noise_fine.inputs['Scale'].default_value = 80.0
    noise_fine.inputs['Detail'].default_value = 8.0
    noise_fine.inputs['Roughness'].default_value = 0.72
    noise_fine.inputs['Distortion'].default_value = 0.35
    links.new(mapping.outputs['Vector'], noise_fine.inputs['Vector'])

    # --- Coarser Woven Structure Noise ---
    noise_weave = nodes.new('ShaderNodeTexNoise')
    noise_weave.location = (-750, -80)
    noise_weave.inputs['Scale'].default_value = 18.0
    noise_weave.inputs['Detail'].default_value = 5.0
    noise_weave.inputs['Roughness'].default_value = 0.65
    noise_weave.inputs['Distortion'].default_value = 0.65
    links.new(mapping.outputs['Vector'], noise_weave.inputs['Vector'])

    # --- Mix both noises for combined woven pattern ---
    mix_noise = nodes.new('ShaderNodeMixRGB')
    mix_noise.location = (-500, 60)
    mix_noise.blend_type = 'OVERLAY'
    mix_noise.inputs['Fac'].default_value = 0.55
    links.new(noise_fine.outputs['Fac'], mix_noise.inputs['Color1'])
    links.new(noise_weave.outputs['Fac'], mix_noise.inputs['Color2'])

    # --- Color Ramp for warm ivory base color variation ---
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.location = (-250, 60)
    cr = color_ramp.color_ramp
    cr.interpolation = 'EASE'
    cr.elements[0].position = 0.28
    cr.elements[0].color = (0.82, 0.78, 0.72, 1.0)   # Slightly warm taupe shadow in weave
    cr.elements[1].position = 0.72
    cr.elements[1].color = (0.94, 0.91, 0.86, 1.0)   # Warm ivory highlights
    links.new(mix_noise.outputs['Color'], color_ramp.inputs['Fac'])

    # --- Subtle bump from woven pattern ---
    bump_node = nodes.new('ShaderNodeBump')
    bump_node.location = (-250, -200)
    bump_node.inputs['Strength'].default_value = 0.32
    bump_node.inputs['Distance'].default_value = 0.025
    links.new(mix_noise.outputs['Color'], bump_node.inputs['Height'])

    # --- Roughness slight variation from weave ---
    roughness_ramp = nodes.new('ShaderNodeValToRGB')
    roughness_ramp.location = (-250, -400)
    roughness_ramp.color_ramp.elements[0].position = 0.3
    roughness_ramp.color_ramp.elements[0].color = (0.82, 0.82, 0.82, 1.0) # slightly specular ridges
    roughness_ramp.color_ramp.elements[1].position = 0.7
    roughness_ramp.color_ramp.elements[1].color = (0.96, 0.96, 0.96, 1.0) # mostly rough face
    links.new(noise_weave.outputs['Fac'], roughness_ramp.inputs['Fac'])

    # --- Principled BSDF ---
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (100, 0)
    set_bsdf(bsdf, roughness=0.88, metallic=0.0, sheen=0.55, subsurface=0.02)
    links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(roughness_ramp.outputs['Color'], bsdf.inputs['Roughness'])

    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (400, 0)
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

def create_edge_fabric_material(name):
    """Slightly darker edge material — same weave tone but deeper for the looped border."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-900, 0)

    mapping = nodes.new('ShaderNodeMapping')
    mapping.location = (-700, 0)
    mapping.inputs['Scale'].default_value = (22.0, 22.0, 22.0)
    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-500, 0)
    noise.inputs['Scale'].default_value = 35.0
    noise.inputs['Detail'].default_value = 6.0
    noise.inputs['Roughness'].default_value = 0.68
    noise.inputs['Distortion'].default_value = 0.50
    links.new(mapping.outputs['Vector'], noise.inputs['Vector'])

    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-250, 0)
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (0.76, 0.72, 0.66, 1.0)
    ramp.color_ramp.elements[1].position = 0.70
    ramp.color_ramp.elements[1].color = (0.88, 0.84, 0.78, 1.0)
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])

    bump = nodes.new('ShaderNodeBump')
    bump.location = (-250, -200)
    bump.inputs['Strength'].default_value = 0.22
    bump.inputs['Distance'].default_value = 0.018
    links.new(noise.outputs['Fac'], bump.inputs['Height'])

    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (100, 0)
    set_bsdf(bsdf, roughness=0.92, metallic=0.0, sheen=0.4)
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (400, 0)
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

def create_plain_pbr(name, base_color, roughness=0.5, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    set_bsdf(bsdf, base_color=base_color, roughness=roughness, metallic=metallic)
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    materials[name] = mat
    return mat

# Create materials
mat_rug_main = create_woven_fabric_material("M_Rug_Cream_Woven")
mat_rug_edge = create_edge_fabric_material("M_Rug_Edge_Bouclé")
mat_floor = create_plain_pbr("M_Floor_Travertine", (0.86, 0.82, 0.75, 1.0), roughness=0.38)
mat_studio_wall = create_plain_pbr("M_Studio_Wall_Cream", (0.92, 0.89, 0.84, 1.0), roughness=0.80)

# ---------------------------------------------------------------------------
# 4. GEOMETRY: CIRCULAR RUG STAGE (ELEVATED LUXURY PODIUM)
#    Diameter: 1.9m, Thickness: 0.080m (8cm elevated dais), Bottom at Z=0, Top at Z=0.080m
# ---------------------------------------------------------------------------
RUG_RADIUS = 0.95        # 1.9m diameter
RUG_THICKNESS = 0.080    # 80mm (8cm) height - elevated styling dais/platform stage
SEGMENTS = 96            # Smooth perimeter, no visible angular edges

def create_rug_mesh():
    """
    Creates the elevated stage podium body as a subdivided cylinder with an upholstered side profile.
    Adds subtle Z-displacement per vertex to simulate woven weave bump on the top surface.
    """
    mesh = bpy.data.meshes.new("Rug_Surface")
    bm = bmesh.new()

    # Create a grid of vertices in polar coordinates for the disc surface
    RINGS = 24           # Radial rings from center to edge
    SEGS = 96            # Angular segments
    SIDE_STEPS = 5       # Vertical subdivisions for smooth upholstered side profile

    verts_top = []
    verts_side = []      # List of lists for side wall vertices

    for ring_idx in range(RINGS + 1):
        r = (ring_idx / RINGS) * RUG_RADIUS

        for seg_idx in range(SEGS):
            angle = (seg_idx / SEGS) * 2.0 * math.pi
            x = r * math.cos(angle)
            y = r * math.sin(angle)

            # Subtle woven micro-bump: concentric sine rings + slight noise
            concentric_wave = 0.0010 * math.sin(ring_idx * 1.8) * (1.0 - (ring_idx / (RINGS + 1)) ** 0.5)
            fiber_noise = 0.0005 * math.sin(seg_idx * 0.47 + ring_idx * 0.63)

            z_top = RUG_THICKNESS + concentric_wave + fiber_noise
            verts_top.append(bm.verts.new((x, y, z_top)))

    # Subdivided side wall vertices (from top edge to floor)
    for s in range(SIDE_STEPS + 1):
        frac = s / SIDE_STEPS  # 0 = top, 1 = bottom
        z = RUG_THICKNESS * (1.0 - frac)
        # Subtle upholstered outward bulge on side wall
        bulge = 0.006 * math.sin(frac * math.pi)
        r_side = RUG_RADIUS + bulge

        side_ring = []
        for seg_idx in range(SEGS):
            angle = (seg_idx / SEGS) * 2.0 * math.pi
            x = r_side * math.cos(angle)
            y = r_side * math.sin(angle)
            side_ring.append(bm.verts.new((x, y, z)))
        verts_side.append(side_ring)

    # Center vertex (top)
    center_top = bm.verts.new((0, 0, RUG_THICKNESS))
    center_bot = bm.verts.new((0, 0, 0.0))

    bm.verts.ensure_lookup_table()

    # Build top surface faces (quads between rings + tris at center)
    for ring_idx in range(RINGS):
        for seg_idx in range(SEGS):
            next_seg = (seg_idx + 1) % SEGS
            if ring_idx == 0:
                v_top_a = verts_top[ring_idx * SEGS + seg_idx]
                v_top_b = verts_top[ring_idx * SEGS + next_seg]
                try:
                    bm.faces.new([center_top, v_top_a, v_top_b])
                except:
                    pass
            else:
                v_ta = verts_top[(ring_idx - 1) * SEGS + seg_idx]
                v_tb = verts_top[(ring_idx - 1) * SEGS + next_seg]
                v_tc = verts_top[ring_idx * SEGS + next_seg]
                v_td = verts_top[ring_idx * SEGS + seg_idx]
                try:
                    bm.faces.new([v_ta, v_td, v_tc, v_tb])
                except:
                    pass

    # Connect top disc outer ring to top of side wall
    outer_ring = RINGS - 1
    for seg_idx in range(SEGS):
        next_seg = (seg_idx + 1) % SEGS
        v_disc_a = verts_top[outer_ring * SEGS + seg_idx]
        v_disc_b = verts_top[outer_ring * SEGS + next_seg]
        v_side_a = verts_side[0][seg_idx]
        v_side_b = verts_side[0][next_seg]
        try:
            bm.faces.new([v_disc_a, v_disc_b, v_side_b, v_side_a])
        except:
            pass

    # Build vertical side wall quads
    for s in range(SIDE_STEPS):
        for seg_idx in range(SEGS):
            next_seg = (seg_idx + 1) % SEGS
            v0 = verts_side[s][seg_idx]
            v1 = verts_side[s][next_seg]
            v2 = verts_side[s + 1][next_seg]
            v3 = verts_side[s + 1][seg_idx]
            try:
                bm.faces.new([v0, v1, v2, v3])
            except:
                pass

    # Build bottom face (flat underside)
    for seg_idx in range(SEGS):
        next_seg = (seg_idx + 1) % SEGS
        vb_a = verts_side[SIDE_STEPS][seg_idx]
        vb_b = verts_side[SIDE_STEPS][next_seg]
        try:
            bm.faces.new([center_bot, vb_b, vb_a])
        except:
            pass

    bm.to_mesh(mesh)
    bm.free()
    return mesh


def create_edge_torus(name, major_r, minor_r, major_segs=96, minor_segs=16, z_offset=0.0):
    """
    Creates a torus ring for the rug edge border.
    Low-profile, squashed slightly on Z to read as plush fabric edging.
    """
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()

    for maj_idx in range(major_segs):
        angle_maj = (maj_idx / major_segs) * 2.0 * math.pi
        cx = major_r * math.cos(angle_maj)
        cy = major_r * math.sin(angle_maj)

        for min_idx in range(minor_segs):
            angle_min = (min_idx / minor_segs) * 2.0 * math.pi
            lx = minor_r * math.cos(angle_min)
            lz = minor_r * 0.65 * math.sin(angle_min) + z_offset
            bm.verts.new((cx + lx * math.cos(angle_maj),
                          cy + lx * math.sin(angle_maj),
                          lz))

    bm.verts.ensure_lookup_table()

    for maj_idx in range(major_segs):
        for min_idx in range(minor_segs):
            next_maj = (maj_idx + 1) % major_segs
            next_min = (min_idx + 1) % minor_segs
            v0 = bm.verts[maj_idx * minor_segs + min_idx]
            v1 = bm.verts[maj_idx * minor_segs + next_min]
            v2 = bm.verts[next_maj * minor_segs + next_min]
            v3 = bm.verts[next_maj * minor_segs + min_idx]
            try:
                bm.faces.new([v0, v1, v2, v3])
            except:
                pass

    bm.to_mesh(mesh)
    bm.free()
    return mesh


# --- Stage Base (thin flat disc at Z=0, acts as shadow catcher base) ---
bm_base = bmesh.new()
bmesh.ops.create_circle(bm_base, cap_ends=True, cap_tris=False, segments=96,
                        radius=RUG_RADIUS + 0.008)
base_mesh = bpy.data.meshes.new("Stage_Base")
bm_base.to_mesh(base_mesh)
bm_base.free()
base_obj = bpy.data.objects.new("Stage_Base", base_mesh)
base_obj.location = (0, 0, 0.0005)
base_obj.data.materials.append(mat_rug_main)
link_obj(base_obj, "Stage_Base")

# --- Rug Surface Disc with elevated 8cm upholstered geometry ---
rug_mesh = create_rug_mesh()
rug_obj = bpy.data.objects.new("Rug_Surface", rug_mesh)
rug_obj.location = (0, 0, 0)
rug_obj.data.materials.append(mat_rug_main)
link_obj(rug_obj, "Rug_Surface")

# --- Rug Edge Torus (plush looped fabric border at top perimeter) ---
edge_mesh = create_edge_torus("Rug_Edge", major_r=RUG_RADIUS - 0.006, minor_r=0.024,
                               major_segs=96, minor_segs=16, z_offset=RUG_THICKNESS)
edge_obj = bpy.data.objects.new("Rug_Edge", edge_mesh)
edge_obj.location = (0, 0, 0)
edge_obj.data.materials.append(mat_rug_edge)
link_obj(edge_obj, "Rug_Edge")

# --- Rug Detail: Concentric decorative woven rings (3 tightened inner rings on top surface) ---
detail_ring_radii = [0.32, 0.55, 0.76]
for i, ring_r in enumerate(detail_ring_radii):
    rd_mesh = create_edge_torus(f"Rug_Detail_Ring_{i+1}", major_r=ring_r, minor_r=0.009,
                                 major_segs=64, minor_segs=12, z_offset=RUG_THICKNESS + 0.002)
    rd_obj = bpy.data.objects.new(f"Rug_Detail_Ring_{i+1}", rd_mesh)
    rd_obj.location = (0, 0, 0)
    rd_obj.data.materials.append(mat_rug_edge)
    link_obj(rd_obj, "Rug_Detail")

# ---------------------------------------------------------------------------
# 5. STUDIO ENVIRONMENT
# ---------------------------------------------------------------------------
# Studio Floor
floor_obj = bpy.data.objects.new("Stage_Studio_Floor",
    bpy.data.meshes.new("Stage_Studio_Floor"))
bm_fl = bmesh.new()
bmesh.ops.create_cube(bm_fl, size=1.0)
bmesh.ops.scale(bm_fl, vec=mathutils.Vector((8.0, 8.0, 0.02)), verts=bm_fl.verts)
bm_fl.to_mesh(floor_obj.data)
bm_fl.free()
floor_obj.location = (0, 0, -0.01)
floor_obj.data.materials.append(mat_floor)
link_obj(floor_obj, "Studio_Environment")

# Studio Back Wall
wall_obj = bpy.data.objects.new("Stage_Studio_Wall",
    bpy.data.meshes.new("Stage_Studio_Wall"))
bm_wl = bmesh.new()
bmesh.ops.create_cube(bm_wl, size=1.0)
bmesh.ops.scale(bm_wl, vec=mathutils.Vector((8.0, 0.04, 4.5)), verts=bm_wl.verts)
bm_wl.to_mesh(wall_obj.data)
bm_wl.free()
wall_obj.location = (0, 2.5, 2.25)
wall_obj.data.materials.append(mat_studio_wall)
link_obj(wall_obj, "Studio_Environment")

# ---------------------------------------------------------------------------
# 6. LIGHTING
# ---------------------------------------------------------------------------
def look_at(obj, target):
    direction = mathutils.Vector(target) - mathutils.Vector(obj.location)
    rot_quat = direction.to_track_quat('-Z', 'Y')
    obj.rotation_euler = rot_quat.to_euler()

# Key soft natural light from front-left
key_data = bpy.data.lights.new("Stage_Key_Light", type='AREA')
key_data.energy = 160.0
key_data.size = 3.0
key_data.size_y = 3.0
key_data.color = (1.0, 0.96, 0.90)
key_obj = bpy.data.objects.new("Stage_Key_Light", key_data)
key_obj.location = (-2.0, -3.0, 3.5)
look_at(key_obj, (0, 0, 0.040))
link_obj(key_obj, "Lighting")

# Warm ambient fill from right
fill_data = bpy.data.lights.new("Stage_Fill_Light", type='AREA')
fill_data.energy = 80.0
fill_data.size = 2.8
fill_data.color = (0.95, 0.94, 0.90)
fill_obj = bpy.data.objects.new("Stage_Fill_Light", fill_data)
fill_obj.location = (2.5, -2.0, 2.8)
look_at(fill_obj, (0, 0, 0.040))
link_obj(fill_obj, "Lighting")

# Overhead bounce for soft top-down shadow detail
overhead_data = bpy.data.lights.new("Stage_Overhead", type='AREA')
overhead_data.energy = 55.0
overhead_data.size = 3.5
overhead_data.color = (0.98, 0.96, 0.92)
overhead_obj = bpy.data.objects.new("Stage_Overhead", overhead_data)
overhead_obj.location = (0, 0, 4.0)
look_at(overhead_obj, (0, 0, 0.040))
link_obj(overhead_obj, "Lighting")

# ---------------------------------------------------------------------------
# 7. CAMERAS
# ---------------------------------------------------------------------------
cameras = {}

def create_camera(name, loc, target, focal_length=50):
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = focal_length
    cam_data.clip_start = 0.1
    cam_data.clip_end = 50.0
    cam_obj = bpy.data.objects.new(name, cam_data)
    cam_obj.location = loc
    look_at(cam_obj, target)
    link_obj(cam_obj, "Cameras")
    cameras[name] = cam_obj
    return cam_obj

# 1. Top-down view
cam_top = create_camera("Camera_Top", (0.0, -0.001, 3.8), (0.0, 0.0, 0.040), focal_length=28)

# 2. Three-quarter angle view
cam_angle = create_camera("Camera_Angle", (2.2, -2.4, 1.8), (0.0, 0.0, 0.040), focal_length=38)

# 3. Close-up woven material detail view
cam_detail = create_camera("Camera_Detail", (0.22, -0.70, 0.42), (0.0, 0.0, 0.080), focal_length=55)

# ---------------------------------------------------------------------------
# 8. RENDERING
# ---------------------------------------------------------------------------
render_dir = r"s:\Fashion_App"
astra_dir = r"s:\Fashion_App\3D - Stage by Astra"
os.makedirs(astra_dir, exist_ok=True)

renders = [
    ("Camera_Top",    "seren_stage_top.png"),
    ("Camera_Angle",  "seren_stage_angle.png"),
    ("Camera_Detail", "seren_stage_detail.png"),
]

for cam_name, filename in renders:
    scene.camera = cameras[cam_name]
    output_path = os.path.join(render_dir, filename)
    scene.render.filepath = output_path
    print(f"Rendering: {cam_name} -> {output_path}...")
    bpy.ops.render.render(write_still=True)
    print(f"Render complete: {output_path}")

    # Copy to Astra directory as well
    astra_render_path = os.path.join(astra_dir, filename)
    import shutil
    shutil.copy2(output_path, astra_render_path)

# ---------------------------------------------------------------------------
# 9. EXPORT
# ---------------------------------------------------------------------------
blend_path = os.path.join(render_dir, "seren_stage.blend")
glb_path   = os.path.join(render_dir, "seren_stage.glb")
astra_blend_path = os.path.join(astra_dir, "seren_stage.blend")
astra_glb_path   = os.path.join(astra_dir, "seren_stage.glb")

print(f"Saving editable Blender file: {blend_path}...")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
import shutil
shutil.copy2(blend_path, astra_blend_path)

# Select only stage objects for isolated GLB export
bpy.ops.object.select_all(action='DESELECT')
stage_objects = []
for c_name in ["Stage_Base", "Rug_Surface", "Rug_Edge", "Rug_Detail"]:
    col = collections.get(c_name)
    if col:
        for obj in col.objects:
            obj.select_set(True)
            stage_objects.append(obj)

print(f"Exporting real-time glTF 2.0 binary ({len(stage_objects)} objects): {glb_path}...")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
    export_lights=False,
    export_cameras=False
)
shutil.copy2(glb_path, astra_glb_path)

# ---------------------------------------------------------------------------
# 10. SUMMARY REPORT
# ---------------------------------------------------------------------------
stage_mesh_objs = [o for o in stage_objects if o.type == 'MESH']
total_verts = sum(len(o.data.vertices) for o in stage_mesh_objs)
total_polys = sum(len(o.data.polygons) for o in stage_mesh_objs)

summary_path = os.path.join(render_dir, "stage_model_summary.txt")
astra_report_path = os.path.join(astra_dir, "seren_stage_report.md")

with open(summary_path, "w", encoding="utf-8") as f:
    f.write("=" * 60 + "\n")
    f.write("SÉRÉN STUDIO — 3D CIRCULAR ELEVATED STAGE SUMMARY (STEP 3)\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Asset: Luxury Cream Woven Circular Elevated Dais / Avatar Stage\n")
    f.write(f"Origin: Floor-Level Center (0, 0, 0) | Up: +Z\n")
    f.write(f"Diameter: 1.90 m | Height / Thickness: 0.080 m (8.0 cm) | Radius: 0.95 m\n")
    f.write(f"Total Mesh Objects: {len(stage_mesh_objs)}\n")
    f.write(f"Total Vertices:     {total_verts:,}\n")
    f.write(f"Total Polygons:     {total_polys:,}\n\n")
    f.write("COLLECTION HIERARCHY:\n")
    for c_name in ["Stage_Base", "Rug_Surface", "Rug_Edge", "Rug_Detail"]:
        c = collections.get(c_name)
        if c:
            f.write(f"\n[{c_name}] ({len(c.objects)} objects):\n")
            for o in sorted(c.objects, key=lambda x: x.name):
                if o.type == 'MESH':
                    f.write(f"  • {o.name} [{o.type}] "
                            f"({len(o.data.polygons)} polys, {len(o.data.vertices)} verts)\n")
    f.write("\nMATERIALS:\n")
    for m in sorted(materials.keys()):
        f.write(f"  • {m}\n")
    f.write("\nTHREE.JS INTEGRATION NOTES:\n")
    f.write("  • Elevated stage has a proud 8.0 cm height with upholstered side profile.\n")
    f.write("  • Rug_Surface mesh uses woven cream fabric material.\n")
    f.write("  • Rug_Edge + Rug_Detail use slightly deeper edge fabric.\n")
    f.write("  • Base is at Z=0; avatar is positioned at Z=0.080m (top surface of stage).\n")

with open(astra_report_path, "w", encoding="utf-8") as f:
    f.write("# Sérén Studio — 3D Circular Elevated Stage by Astra\n\n")
    f.write("## Dimensions and Hierarchy\n\n")
    f.write("Nominal diameter **1.90 m**, radius **0.95 m**, height/thickness **0.080 m** (**8.0 cm** elevated dais platform). ")
    f.write("Bottom Z = 0; top standing surface Z = 0.080 m. Features an upholstered curved vertical side wall and a rounded bouclé border rim.\n\n")
    f.write("| Object | Mesh Type | Description |\n")
    f.write("|---|---|---|\n")
    f.write("| `Stage_Base` | Circle plinth | Bottom shadow caster at Z = 0 |\n")
    f.write("| `Rug_Surface` | Upholstered cylinder disc | 8.0 cm elevated platform with concentric micro-bump |\n")
    f.write("| `Rug_Edge` | Bullnose torus | Rounded plush bouclé edge trim at Z = 0.080 m |\n")
    f.write("| `Rug_Detail` | Cord rings (3x) | Concentric woven decorative cords on top surface |\n\n")
    f.write("## Materials and Textures\n\n")
    f.write("- **Ivory Woven Bouclé**: Procedural PBR fabric with micro-thread noise and weave bump.\n")
    f.write("- **Cream Edge Fabric**: Deeper tone for looped perimeter edging and decorative cord rings.\n\n")
    f.write("## Avatar Placement\n\n")
    f.write("Place avatar standing directly on the top surface at `Y = 0.080 m` (Three.js Y-up) or `Z = 0.080 m` (Blender Z-up).\n")

print("\n" + "=" * 60)
print(f"SUCCESS! Verts: {total_verts:,} | Polys: {total_polys:,}")
print(f"Saved:    {blend_path} and {astra_blend_path}")
print(f"Exported: {glb_path} and {astra_glb_path}")
print(f"Summary:  {summary_path}")
print(f"Report:   {astra_report_path}")
print("=" * 60)

