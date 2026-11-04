import bpy
import bmesh
import math
import mathutils
import os

print("=" * 60)
print("SÉRÉN STUDIO — 3D LUXURY VANITY & MIRROR GENERATOR (STEP 2)")
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

# Set Cycles with CPU and Denoising for photorealistic glass, marble, and mirror illumination
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32
scene.cycles.use_denoising = True

# Editorial Color Management
if 'AgX' in [c.name for c in bpy.types.ColorManagedViewSettings.bl_rna.properties['view_transform'].enum_items]:
    scene.view_settings.view_transform = 'AgX'
else:
    scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'Medium High Contrast'
scene.view_settings.exposure = -0.15

# Soft warm ivory world lighting matching Sérén Studio
world = bpy.data.worlds.new("Seren_World")
scene.world = world
world.use_nodes = True
world_nodes = world.node_tree.nodes
world_nodes.clear()
world_bg = world_nodes.new('ShaderNodeBackground')
world_bg.inputs['Color'].default_value = (0.95, 0.92, 0.86, 1.0) # Warm serene daylight
world_bg.inputs['Strength'].default_value = 0.35
world_out = world_nodes.new('ShaderNodeOutputWorld')
world.node_tree.links.new(world_bg.outputs['Background'], world_out.inputs['Surface'])

# ---------------------------------------------------------------------------
# 2. NAMED COLLECTIONS MANAGEMENT
# ---------------------------------------------------------------------------
vanity_collection_names = [
    "Vanity_Table",
    "Mirror_Frame",
    "Mirror_Surface",
    "Mirror_LED",
    "Perfume_Bottles",
    "Skincare",
    "Makeup_Accessories",
    "Flower_Vase",
    "Vanity_Stool"
]

support_collection_names = [
    "Studio_Environment",
    "Lighting",
    "Cameras"
]

all_collection_names = vanity_collection_names + support_collection_names

collections = {}
for name in all_collection_names:
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    collections[name] = col

def link_obj(obj, col_name):
    if col_name in collections:
        collections[col_name].objects.link(obj)
    else:
        scene.collection.objects.link(obj)

# ---------------------------------------------------------------------------
# 3. PBR MATERIALS SYSTEM
# ---------------------------------------------------------------------------
materials = {}

def set_bsdf(bsdf, **kwargs):
    for k, v in kwargs.items():
        candidates = [k]
        if k == 'base_color':
            candidates = ['Base Color']
        elif k == 'roughness':
            candidates = ['Roughness']
        elif k == 'metallic':
            candidates = ['Metallic']
        elif k == 'specular':
            candidates = ['Specular IOR Level', 'Specular']
        elif k == 'transmission':
            candidates = ['Transmission Weight', 'Transmission']
        elif k == 'ior':
            candidates = ['IOR']
        elif k == 'coat':
            candidates = ['Coat Weight', 'Clearcoat']
        elif k == 'sheen':
            candidates = ['Sheen Weight', 'Sheen']
        elif k == 'sheen_tint':
            candidates = ['Sheen Tint']
        elif k == 'subsurface':
            candidates = ['Subsurface Weight', 'Subsurface']
        elif k == 'emission_color':
            candidates = ['Emission Color', 'Emission']
        elif k == 'emission_strength':
            candidates = ['Emission Strength']

        for cand in candidates:
            if cand in bsdf.inputs:
                bsdf.inputs[cand].default_value = v
                break

def create_pbr_material(name, base_color=(0.8, 0.8, 0.8, 1.0), roughness=0.5, metallic=0.0, **kwargs):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    set_bsdf(bsdf, base_color=base_color, roughness=roughness, metallic=metallic, **kwargs)
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (300, 0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

def create_marble_pbr(name):
    """Calacatta Gold / White Carrara Marble with delicate grey and warm veins"""
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)
    
    mapping = nodes.new('ShaderNodeMapping')
    mapping.location = (-600, 0)
    mapping.inputs['Scale'].default_value = (3.5, 3.5, 3.5)
    mat.node_tree.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    
    noise1 = nodes.new('ShaderNodeTexNoise')
    noise1.location = (-400, 100)
    noise1.inputs['Scale'].default_value = 2.4
    noise1.inputs['Detail'].default_value = 4.0
    noise1.inputs['Roughness'].default_value = 0.55
    noise1.inputs['Distortion'].default_value = 1.8
    mat.node_tree.links.new(mapping.outputs['Vector'], noise1.inputs['Vector'])
    
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-150, 100)
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (0.76, 0.72, 0.68, 1.0) # subtle warm grey vein
    ramp.color_ramp.elements[1].position = 0.62
    ramp.color_ramp.elements[1].color = (0.97, 0.97, 0.96, 1.0) # crisp white marble base
    mat.node_tree.links.new(noise1.outputs['Fac'], ramp.inputs['Fac'])
    
    bump = nodes.new('ShaderNodeBump')
    bump.location = (-150, -150)
    bump.inputs['Strength'].default_value = 0.012
    bump.inputs['Distance'].default_value = 0.02
    mat.node_tree.links.new(noise1.outputs['Fac'], bump.inputs['Height'])
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (150, 0)
    set_bsdf(bsdf, roughness=0.18, metallic=0.0, specular=0.6, coat=0.35)
    mat.node_tree.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (450, 0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

def create_fabric_pbr(name):
    """Soft cream bouclé textured linen fabric for the upholstered stool"""
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)
    
    mapping = nodes.new('ShaderNodeMapping')
    mapping.location = (-600, 0)
    mapping.inputs['Scale'].default_value = (40.0, 40.0, 40.0)
    mat.node_tree.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 0)
    noise.inputs['Scale'].default_value = 28.0
    noise.inputs['Detail'].default_value = 6.0
    noise.inputs['Roughness'].default_value = 0.8
    mat.node_tree.links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    
    bump = nodes.new('ShaderNodeBump')
    bump.location = (-150, -150)
    bump.inputs['Strength'].default_value = 0.035
    bump.inputs['Distance'].default_value = 0.015
    mat.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (150, 0)
    set_bsdf(bsdf, base_color=(0.88, 0.84, 0.78, 1.0), roughness=0.88, sheen=0.7)
    mat.node_tree.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (450, 0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

# Instantiate Core Materials with rich warm champagne brass and 3000K LED
mat_marble = create_marble_pbr("M_White_Marble_Calacatta")
mat_champagne_brass = create_pbr_material("M_Champagne_Brass", base_color=(0.85, 0.70, 0.45, 1.0), roughness=0.22, metallic=0.95)
mat_mirror_chrome = create_pbr_material("M_Mirror_Chrome", base_color=(0.98, 0.98, 0.98, 1.0), roughness=0.005, metallic=1.0)
mat_mirror_led = create_pbr_material("M_Mirror_LED_3000K", base_color=(1.0, 0.86, 0.65, 1.0), roughness=0.2, 
                                     emission_color=(1.0, 0.80, 0.50, 1.0), emission_strength=28.0)

mat_clear_glass = create_pbr_material("M_Glass_Clear", base_color=(0.98, 0.98, 0.98, 1.0), roughness=0.02, transmission=1.0, ior=1.50)
mat_frosted_glass = create_pbr_material("M_Glass_Frosted", base_color=(0.95, 0.95, 0.95, 1.0), roughness=0.22, transmission=0.92, ior=1.48)
mat_perfume_amber = create_pbr_material("M_Perfume_Liquid_Amber", base_color=(0.88, 0.55, 0.18, 1.0), roughness=0.05, transmission=0.85, ior=1.35)
mat_perfume_rose = create_pbr_material("M_Perfume_Liquid_Rose", base_color=(0.90, 0.60, 0.65, 1.0), roughness=0.05, transmission=0.85, ior=1.35)
mat_ceramic_white = create_pbr_material("M_Ceramic_Ivory", base_color=(0.94, 0.92, 0.89, 1.0), roughness=0.22, coat=0.4)
mat_wood_reed = create_pbr_material("M_Natural_Wood_Reed", base_color=(0.76, 0.68, 0.55, 1.0), roughness=0.65)
mat_foliage_green = create_pbr_material("M_Foliage_Green", base_color=(0.28, 0.42, 0.22, 1.0), roughness=0.45)
mat_flower_petal = create_pbr_material("M_Flower_Petal_White", base_color=(0.96, 0.96, 0.94, 1.0), roughness=0.35, subsurface=0.15)
mat_stool_fabric = create_fabric_pbr("M_Stool_Cream_Boucle")
mat_studio_floor = create_pbr_material("M_Studio_Floor_Travertine", base_color=(0.86, 0.81, 0.74, 1.0), roughness=0.35)
mat_studio_wall = create_pbr_material("M_Studio_Wall_Cream", base_color=(0.91, 0.88, 0.83, 1.0), roughness=0.80)

# ---------------------------------------------------------------------------
# 4. GEOMETRY HELPER FUNCTIONS
# ---------------------------------------------------------------------------
def create_box(name, size, location, material=None, col_name=None):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=mathutils.Vector(size), verts=bm.verts)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    if material:
        obj.data.materials.append(material)
    if col_name:
        link_obj(obj, col_name)
    return obj

def create_cylinder(name, radius, depth, location, rotation=(0,0,0), material=None, col_name=None, vertices=32):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=vertices, 
                          radius1=radius, radius2=radius, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    if material:
        obj.data.materials.append(material)
    if col_name:
        link_obj(obj, col_name)
    return obj

# ---------------------------------------------------------------------------
# 5. COLLECTION: VANITY TABLE
# ---------------------------------------------------------------------------
# Dimensions: Width: 1.35m, Depth: 0.48m, Height: 0.78m
T_WIDTH = 1.35
T_DEPTH = 0.48
T_HEIGHT = 0.78
TOP_THICK = 0.065
LEG_THICK = 0.035
LEG_Z = T_HEIGHT - TOP_THICK

# 1. White Marble Countertop Slab with subtle beveled apron
marble_top = create_box("Vanity_Marble_Top", (T_WIDTH, T_DEPTH, TOP_THICK), 
                        (0.0, 0.0, T_HEIGHT - TOP_THICK/2), 
                        material=mat_marble, col_name="Vanity_Table")

# 2. Subtle Front Drawer Seam / Recess
create_box("Vanity_Drawer_Seam", (T_WIDTH - 0.16, 0.003, 0.002), 
           (0.0, -T_DEPTH/2 - 0.001, T_HEIGHT - TOP_THICK/2), 
           material=mat_champagne_brass, col_name="Vanity_Table")

# 3. Slim Architectural Champagne-Brass Legs
leg_x_inset = T_WIDTH/2 - LEG_THICK/2 - 0.04
leg_y_inset = T_DEPTH/2 - LEG_THICK/2 - 0.03
leg_h = LEG_Z

# Left Leg Assembly
create_box("Vanity_Leg_Left_Front", (LEG_THICK, LEG_THICK, leg_h), 
           (-leg_x_inset, -leg_y_inset, leg_h/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Leg_Left_Back", (LEG_THICK, LEG_THICK, leg_h), 
           (-leg_x_inset, leg_y_inset, leg_h/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Leg_Left_Bottom", (LEG_THICK, T_DEPTH - 0.06, LEG_THICK), 
           (-leg_x_inset, 0.0, LEG_THICK/2), material=mat_champagne_brass, col_name="Vanity_Table")

# Right Leg Assembly
create_box("Vanity_Leg_Right_Front", (LEG_THICK, LEG_THICK, leg_h), 
           (leg_x_inset, -leg_y_inset, leg_h/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Leg_Right_Back", (LEG_THICK, LEG_THICK, leg_h), 
           (leg_x_inset, leg_y_inset, leg_h/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Leg_Right_Bottom", (LEG_THICK, T_DEPTH - 0.06, LEG_THICK), 
           (leg_x_inset, 0.0, LEG_THICK/2), material=mat_champagne_brass, col_name="Vanity_Table")

# Upper Structural Brass Rails
create_box("Vanity_Top_Rail_Front", (T_WIDTH - 0.12, LEG_THICK, LEG_THICK), 
           (0.0, -leg_y_inset, leg_h - LEG_THICK/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Top_Rail_Back", (T_WIDTH - 0.12, LEG_THICK, LEG_THICK), 
           (0.0, leg_y_inset, leg_h - LEG_THICK/2), material=mat_champagne_brass, col_name="Vanity_Table")

# ---------------------------------------------------------------------------
# 6. COLLECTIONS: MIRROR FRAME, MIRROR SURFACE, MIRROR LED
# ---------------------------------------------------------------------------
# Mirror Dimensions: Height: 1.65m, Width: 1.05m, Thickness: 0.045m
M_WIDTH = 1.05
M_HEIGHT = 1.65
M_THICK = 0.045
MIRROR_BASE_Z = T_HEIGHT # Sits on/behind the vanity table
MIRROR_Y = T_DEPTH/2 - 0.04 # Slightly recessed near the back of the tabletop

def build_arched_mesh(name, width, height, thickness, segments=48):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    
    radius = width / 2.0
    straight_h = height - radius
    
    front_verts = []
    back_verts = []
    
    # 1. Straight lower left
    front_verts.append((-radius, -thickness/2, 0.0))
    back_verts.append((-radius, thickness/2, 0.0))
    
    # 2. Semi-circular rounded arch at the top
    for i in range(segments + 1):
        angle = math.pi - (i / segments) * math.pi
        vx = radius * math.cos(angle)
        vz = straight_h + radius * math.sin(angle)
        front_verts.append((vx, -thickness/2, vz))
        back_verts.append((vx, thickness/2, vz))
        
    # 3. Straight lower right
    front_verts.append((radius, -thickness/2, 0.0))
    back_verts.append((radius, thickness/2, 0.0))
    
    bm_front = [bm.verts.new(v) for v in front_verts]
    bm_back = [bm.verts.new(v) for v in back_verts]
    
    # Front face
    bm.faces.new(bm_front)
    # Back face
    bm.faces.new(reversed(bm_back))
    
    # Side quad faces bridging front & back
    num_pts = len(bm_front)
    for i in range(num_pts - 1):
        bm.faces.new([bm_front[i], bm_front[i+1], bm_back[i+1], bm_back[i]])
    # Bottom closing face
    bm.faces.new([bm_front[num_pts-1], bm_front[0], bm_back[0], bm_back[num_pts-1]])
    
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    return obj

# 1. Mirror Outer Champagne Brass Frame
mirror_frame = build_arched_mesh("Mirror_Frame", M_WIDTH, M_HEIGHT, M_THICK, segments=48)
mirror_frame.location = (0.0, MIRROR_Y, MIRROR_BASE_Z)
mirror_frame.data.materials.append(mat_champagne_brass)
link_obj(mirror_frame, "Mirror_Frame")

# 2. Mirror Reflective Surface (Distinct named mesh for Three.js real-time reflection swap)
mirror_surface = build_arched_mesh("Mirror_Surface", M_WIDTH - 0.040, M_HEIGHT - 0.025, 0.004, segments=48)
mirror_surface.location = (0.0, MIRROR_Y - M_THICK/2 + 0.004, MIRROR_BASE_Z)
mirror_surface.data.materials.append(mat_mirror_chrome)
link_obj(mirror_surface, "Mirror_Surface")

# 3. Mirror Warm 3000K LED Perimeter Strip
led_strip = build_arched_mesh("Mirror_LED_Strip", M_WIDTH + 0.012, M_HEIGHT + 0.006, 0.016, segments=48)
led_strip.location = (0.0, MIRROR_Y + 0.005, MIRROR_BASE_Z)
led_strip.data.materials.append(mat_mirror_led)
link_obj(led_strip, "Mirror_LED")

# ---------------------------------------------------------------------------
# 7. COLLECTION: UPHOLSTERED STOOL (Diameter: 0.48m, Height: 0.45m)
# ---------------------------------------------------------------------------
# Placed slightly in front and to the right/center of the vanity (matching reference)
STOOL_X = 0.28
STOOL_Y = -0.38 # Nicely tucked in front of the vanity table
STOOL_H = 0.45
STOOL_RAD = 0.24
BASE_RING_H = 0.055

# Champagne Brass Base Ring
create_cylinder("Stool_Brass_Base_Ring", STOOL_RAD, BASE_RING_H, 
                (STOOL_X, STOOL_Y, BASE_RING_H/2), rotation=(0, 0, 0), 
                material=mat_champagne_brass, col_name="Vanity_Stool", vertices=36)

# Main Upholstered Soft Cylindrical Body (Bouclé cream fabric)
cushion_h = STOOL_H - BASE_RING_H
create_cylinder("Stool_Upholstered_Body", STOOL_RAD - 0.004, cushion_h, 
                (STOOL_X, STOOL_Y, BASE_RING_H + cushion_h/2), rotation=(0, 0, 0), 
                material=mat_stool_fabric, col_name="Vanity_Stool", vertices=36)

# Padded Rounded Cushion Top (soft beveled buttoned puff)
create_cylinder("Stool_Top_Padded_Cushion", STOOL_RAD - 0.002, 0.050, 
                (STOOL_X, STOOL_Y, STOOL_H - 0.01), rotation=(0, 0, 0), 
                material=mat_stool_fabric, col_name="Vanity_Stool", vertices=36)

# ---------------------------------------------------------------------------
# 8. COLLECTION: FLOWER VASE & DELICATE WHITE BLOSSOMS
# ---------------------------------------------------------------------------
VASE_X = -0.44
VASE_Y = -0.04
VASE_Z = T_HEIGHT

# Clear Glass Cylinder Vase with Water Disk
create_cylinder("Vase_Glass_Body", 0.055, 0.18, 
                (VASE_X, VASE_Y, VASE_Z + 0.09), rotation=(0, 0, 0), 
                material=mat_clear_glass, col_name="Flower_Vase", vertices=24)
create_cylinder("Vase_Water_Level", 0.050, 0.12, 
                (VASE_X, VASE_Y, VASE_Z + 0.06), rotation=(0, 0, 0), 
                material=mat_clear_glass, col_name="Flower_Vase", vertices=20)

# Delicate floral stems branching outwards with green foliage and white blossoms
stem_configs = [
    ((-0.01, 0.00), 0.28, math.radians(-12), math.radians(6)),
    ((0.02, 0.01), 0.32, math.radians(14), math.radians(8)),
    ((-0.02, -0.01), 0.30, math.radians(-8), math.radians(-14)),
    ((0.01, -0.02), 0.34, math.radians(6), math.radians(-10)),
    ((0.00, 0.02), 0.36, math.radians(4), math.radians(12))
]

for s_idx, (offset, s_len, rot_x, rot_y) in enumerate(stem_configs):
    create_cylinder(f"Flower_Stem_{s_idx+1}", 0.0025, s_len, 
                    (VASE_X + offset[0], VASE_Y + offset[1], VASE_Z + 0.08 + s_len/2), 
                    rotation=(rot_x, rot_y, 0), material=mat_foliage_green, col_name="Flower_Vase", vertices=8)
    
    tip_z = VASE_Z + 0.08 + s_len
    tip_x = VASE_X + offset[0] + math.sin(rot_y) * (s_len/2)
    tip_y = VASE_Y + offset[1] - math.sin(rot_x) * (s_len/2)
    create_cylinder(f"Blossom_Bud_{s_idx+1}", 0.016, 0.022, 
                    (tip_x, tip_y, tip_z), rotation=(rot_x, rot_y, 0), 
                    material=mat_flower_petal, col_name="Flower_Vase", vertices=12)

# ---------------------------------------------------------------------------
# 9. COLLECTION: MAKEUP ACCESSORIES & BRUSH HOLDER
# ---------------------------------------------------------------------------
HOLDER_X = -0.24
HOLDER_Y = 0.06
HOLDER_Z = T_HEIGHT

# Glazed Fluted Ceramic Brush Holder Cup
create_cylinder("Makeup_Brush_Cup", 0.042, 0.11, 
                (HOLDER_X, HOLDER_Y, HOLDER_Z + 0.055), rotation=(0, 0, 0), 
                material=mat_ceramic_white, col_name="Makeup_Accessories", vertices=24)

# 5 Makeup Brushes resting inside cup at natural angles
brush_data = [
    ((-0.012, 0.00), 0.18, math.radians(16), math.radians(-10), 0.014), # Large Powder Brush
    ((0.014, 0.010), 0.17, math.radians(-14), math.radians(12), 0.012), # Blush Brush
    ((-0.008, -0.012), 0.16, math.radians(12), math.radians(14), 0.008),# Foundation Brush
    ((0.008, -0.014), 0.15, math.radians(-10), math.radians(-16), 0.006),# Eyeshadow Blending
    ((0.00, 0.014), 0.155, math.radians(18), math.radians(6), 0.005)    # Detail Crease Brush
]

for b_idx, (b_off, b_len, b_rx, b_ry, bristle_rad) in enumerate(brush_data):
    create_cylinder(f"Brush_Handle_{b_idx+1}", 0.004, b_len, 
                    (HOLDER_X + b_off[0], HOLDER_Y + b_off[1], HOLDER_Z + 0.04 + b_len/2), 
                    rotation=(b_rx, b_ry, 0), material=mat_champagne_brass, col_name="Makeup_Accessories", vertices=8)
    
    b_tip_x = HOLDER_X + b_off[0] + math.sin(b_ry) * (b_len/2)
    b_tip_y = HOLDER_Y + b_off[1] - math.sin(b_rx) * (b_len/2)
    b_tip_z = HOLDER_Z + 0.04 + b_len
    create_cylinder(f"Brush_Bristles_{b_idx+1}", bristle_rad, 0.035, 
                    (b_tip_x, b_tip_y, b_tip_z + 0.012), 
                    rotation=(b_rx, b_ry, 0), material=mat_stool_fabric, col_name="Makeup_Accessories", vertices=12)

# ---------------------------------------------------------------------------
# 10. COLLECTIONS: PERFUME BOTTLES & SKINCARE (Curated Vanity Tray)
# ---------------------------------------------------------------------------
TRAY_X = 0.18
TRAY_Y = -0.02
TRAY_Z = T_HEIGHT
TRAY_W = 0.38
TRAY_D = 0.24
TRAY_H = 0.018

# Rectangular Calacatta Marble Tray with Champagne-Brass Rim
create_box("Vanity_Cosmetic_Tray_Base", (TRAY_W, TRAY_D, 0.008), 
           (TRAY_X, TRAY_Y, TRAY_Z + 0.004), material=mat_marble, col_name="Vanity_Table")
rim_t = 0.006
create_box("Vanity_Tray_Rim_Front", (TRAY_W, rim_t, TRAY_H), 
           (TRAY_X, TRAY_Y - TRAY_D/2 + rim_t/2, TRAY_Z + TRAY_H/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Tray_Rim_Back", (TRAY_W, rim_t, TRAY_H), 
           (TRAY_X, TRAY_Y + TRAY_D/2 - rim_t/2, TRAY_Z + TRAY_H/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Tray_Rim_Left", (rim_t, TRAY_D - rim_t*2, TRAY_H), 
           (TRAY_X - TRAY_W/2 + rim_t/2, TRAY_Y, TRAY_Z + TRAY_H/2), material=mat_champagne_brass, col_name="Vanity_Table")
create_box("Vanity_Tray_Rim_Right", (rim_t, TRAY_D - rim_t*2, TRAY_H), 
           (TRAY_X + TRAY_W/2 - rim_t/2, TRAY_Y, TRAY_Z + TRAY_H/2), material=mat_champagne_brass, col_name="Vanity_Table")

ITEM_Z = TRAY_Z + 0.008

# Perfume Bottle 1: Faceted Tall Rectangular Luxury Flacon with Gold Cap & Amber Liquid
p1_x, p1_y = TRAY_X - 0.10, TRAY_Y + 0.04
create_box("Perfume_1_Glass_Body", (0.052, 0.040, 0.11), (p1_x, p1_y, ITEM_Z + 0.055), material=mat_clear_glass, col_name="Perfume_Bottles")
create_box("Perfume_1_Liquid_Amber", (0.042, 0.030, 0.075), (p1_x, p1_y, ITEM_Z + 0.040), material=mat_perfume_amber, col_name="Perfume_Bottles")
create_cylinder("Perfume_1_Gold_Neck", 0.010, 0.014, (p1_x, p1_y, ITEM_Z + 0.11 + 0.007), material=mat_champagne_brass, col_name="Perfume_Bottles", vertices=16)
create_box("Perfume_1_Gold_Cap", (0.028, 0.024, 0.024), (p1_x, p1_y, ITEM_Z + 0.124 + 0.012), material=mat_champagne_brass, col_name="Perfume_Bottles")

# Perfume Bottle 2: Cylindrical Fluted Bottle with Rose Liquid & Gold Cap
p2_x, p2_y = TRAY_X - 0.03, TRAY_Y - 0.04
create_cylinder("Perfume_2_Glass_Body", 0.025, 0.095, (p2_x, p2_y, ITEM_Z + 0.0475), material=mat_clear_glass, col_name="Perfume_Bottles", vertices=24)
create_cylinder("Perfume_2_Liquid_Rose", 0.020, 0.065, (p2_x, p2_y, ITEM_Z + 0.035), material=mat_perfume_rose, col_name="Perfume_Bottles", vertices=20)
create_cylinder("Perfume_2_Gold_Cap", 0.018, 0.028, (p2_x, p2_y, ITEM_Z + 0.095 + 0.014), material=mat_champagne_brass, col_name="Perfume_Bottles", vertices=24)

# Perfume Bottle 3: Wide Rectangular Minimalist Cologne
p3_x, p3_y = TRAY_X - 0.08, TRAY_Y - 0.04
create_box("Perfume_3_Glass_Body", (0.060, 0.028, 0.080), (p3_x, p3_y, ITEM_Z + 0.040), material=mat_clear_glass, col_name="Perfume_Bottles")
create_cylinder("Perfume_3_Cap", 0.012, 0.022, (p3_x, p3_y, ITEM_Z + 0.080 + 0.011), material=mat_champagne_brass, col_name="Perfume_Bottles", vertices=16)

# Skincare Bottle: Frosted Glass Dropper Bottle
sk1_x, sk1_y = TRAY_X + 0.04, TRAY_Y + 0.03
create_cylinder("Skincare_1_Frosted_Bottle", 0.024, 0.085, (sk1_x, sk1_y, ITEM_Z + 0.0425), material=mat_frosted_glass, col_name="Skincare", vertices=24)
create_cylinder("Skincare_1_Dropper_Ring", 0.015, 0.018, (sk1_x, sk1_y, ITEM_Z + 0.085 + 0.009), material=mat_champagne_brass, col_name="Skincare", vertices=20)
create_cylinder("Skincare_1_Dropper_Bulb", 0.011, 0.018, (sk1_x, sk1_y, ITEM_Z + 0.103 + 0.009), material=mat_ceramic_white, col_name="Skincare", vertices=16)

# Skincare Jar: Frosted Cream Jar with Champagne-Brass Lid
sk2_x, sk2_y = TRAY_X + 0.04, TRAY_Y - 0.04
create_cylinder("Cosmetic_Cream_Jar_Base", 0.032, 0.034, (sk2_x, sk2_y, ITEM_Z + 0.017), material=mat_frosted_glass, col_name="Skincare", vertices=24)
create_cylinder("Cosmetic_Cream_Gold_Lid", 0.033, 0.012, (sk2_x, sk2_y, ITEM_Z + 0.034 + 0.006), material=mat_champagne_brass, col_name="Skincare", vertices=24)

# Decorative Reed Diffuser with 5 Natural Wooden Reeds
rd_x, rd_y = TRAY_X + 0.11, TRAY_Y - 0.01
rd_z = ITEM_Z
create_cylinder("Diffuser_Glass_Vessel", 0.028, 0.065, (rd_x, rd_y, rd_z + 0.0325), material=mat_clear_glass, col_name="Skincare", vertices=20)
create_cylinder("Diffuser_Brass_Collar", 0.018, 0.014, (rd_x, rd_y, rd_z + 0.065 + 0.007), material=mat_champagne_brass, col_name="Skincare", vertices=16)

reeds_data = [
    ((-0.004, -0.004), math.radians(10), math.radians(-8)),
    ((0.004, 0.004), math.radians(-12), math.radians(9)),
    ((-0.003, 0.005), math.radians(-8), math.radians(-11)),
    ((0.005, -0.003), math.radians(11), math.radians(10)),
    ((0.000, 0.000), math.radians(2), math.radians(-2))
]
for r_idx, (r_off, rot_x, rot_y) in enumerate(reeds_data):
    create_cylinder(f"Diffuser_Reed_{r_idx+1}", 0.002, 0.22, 
                    (rd_x + r_off[0], rd_y + r_off[1], rd_z + 0.08 + 0.10), 
                    rotation=(rot_x, rot_y, 0), material=mat_wood_reed, col_name="Skincare", vertices=8)

# ---------------------------------------------------------------------------
# 11. STUDIO ENVIRONMENT (Floor & Curved Cyclorama for Inspection Renders)
# ---------------------------------------------------------------------------
# Studio Floor (Travertine / Warm Light Stone)
studio_floor = create_box("Studio_Inspection_Floor", (6.0, 6.0, 0.02), (0.0, 0.0, -0.01), 
                          material=mat_studio_floor, col_name="Studio_Environment")

# Studio Back Wall (Cream studio cyclorama wall behind vanity)
studio_wall = create_box("Studio_Inspection_Backdrop", (6.0, 0.04, 3.6), (0.0, 0.95, 1.8), 
                         material=mat_studio_wall, col_name="Studio_Environment")

# ---------------------------------------------------------------------------
# 12. COLLECTION: LIGHTING (Warm Mirror Halo + Studio Inspection 3-Point)
# ---------------------------------------------------------------------------
def look_at(obj, target_loc):
    direction = mathutils.Vector(target_loc) - mathutils.Vector(obj.location)
    rot_quat = direction.to_track_quat('-Z', 'Y')
    obj.rotation_euler = rot_quat.to_euler()

# Key Light (Warm soft directional sunlight from front-left)
key_light_data = bpy.data.lights.new(name="Vanity_Key_Light", type='AREA')
key_light_data.energy = 180.0
key_light_data.size = 2.2
key_light_data.size_y = 2.6
key_light_data.color = (1.0, 0.94, 0.85)
key_light_obj = bpy.data.objects.new(name="Vanity_Key_Light", object_data=key_light_data)
key_light_obj.location = (-2.2, -3.0, 2.5)
look_at(key_light_obj, (0.0, 0.0, 1.15))
link_obj(key_light_obj, "Lighting")

# Fill Light (Gentle neutral Area Light from front-right)
fill_light_data = bpy.data.lights.new(name="Vanity_Fill_Light", type='AREA')
fill_light_data.energy = 70.0
fill_light_data.size = 2.0
fill_light_data.size_y = 2.4
fill_light_data.color = (0.92, 0.94, 0.98)
fill_light_obj = bpy.data.objects.new(name="Vanity_Fill_Light", object_data=fill_light_data)
fill_light_obj.location = (2.0, -2.8, 1.6)
look_at(fill_light_obj, (0.0, 0.0, 1.15))
link_obj(fill_light_obj, "Lighting")

# Overhead Ambient Daylight Bounce
top_light_data = bpy.data.lights.new(name="Vanity_Top_Bounce", type='AREA')
top_light_data.energy = 60.0
top_light_data.size = 2.6
top_light_obj = bpy.data.objects.new(name="Vanity_Top_Bounce", object_data=top_light_data)
top_light_obj.location = (0.0, -1.2, 3.2)
look_at(top_light_obj, (0.0, 0.0, 1.15))
link_obj(top_light_obj, "Lighting")

# ---------------------------------------------------------------------------
# 13. CAMERAS SETUP (Front, Perspective 45°, Close-Up of Table & Cosmetics)
# ---------------------------------------------------------------------------
cameras = {}

def create_camera(name, loc, target, focal_length=50):
    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = focal_length
    cam_data.clip_start = 0.1
    cam_data.clip_end = 100.0
    cam_obj = bpy.data.objects.new(name, cam_data)
    cam_obj.location = loc
    look_at(cam_obj, target)
    link_obj(cam_obj, "Cameras")
    cameras[name] = cam_obj
    return cam_obj

# 1. Front View: Centered straight-on framing table, arched mirror, stool, and accessories
cam_front = create_camera("Camera_Front", (0.0, -3.20, 1.20), (0.0, 0.0, 1.15), focal_length=36)

# 2. Three-Quarter Perspective: 45° angle showing marble depth, brass legs, arched mirror halo, and stool
cam_persp = create_camera("Camera_Perspective", (2.30, -2.60, 1.45), (0.0, 0.0, 1.10), focal_length=38)

# 3. Close-Up: Macro view focused on the vanity countertop, perfume flacons, flowers, and mirror reflection
cam_close = create_camera("Camera_Closeup", (0.06, -1.05, 1.00), (0.02, 0.05, 0.89), focal_length=46)

# ---------------------------------------------------------------------------
# 14. RENDERING OUTPUTS
# ---------------------------------------------------------------------------
render_dir = r"s:\Fashion_App"
renders = [
    ("Camera_Front", os.path.join(render_dir, "seren_vanity_front.png")),
    ("Camera_Perspective", os.path.join(render_dir, "seren_vanity_angle.png")),
    ("Camera_Closeup", os.path.join(render_dir, "seren_vanity_closeup.png"))
]

for cam_name, output_path in renders:
    scene.camera = cameras[cam_name]
    scene.render.filepath = output_path
    print(f"Rendering: {cam_name} -> {output_path}...")
    bpy.ops.render.render(write_still=True)
    print(f"Render complete: {output_path}")

# ---------------------------------------------------------------------------
# 15. EXPORT SEREN_VANITY.BLEND & SEREN_VANITY.GLB
# ---------------------------------------------------------------------------
blend_path = os.path.join(render_dir, "seren_vanity.blend")
glb_path = os.path.join(render_dir, "seren_vanity.glb")

print(f"Saving editable Blender file: {blend_path}...")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

# Select ONLY objects in the 9 vanity collections for real-time GLB export
bpy.ops.object.select_all(action='DESELECT')
vanity_objects = []
for c_name in vanity_collection_names:
    col = collections.get(c_name)
    if col:
        for obj in col.objects:
            obj.select_set(True)
            vanity_objects.append(obj)

print(f"Exporting isolated real-time glTF 2.0 binary ({len(vanity_objects)} objects): {glb_path}...")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
    export_lights=False,
    export_cameras=False
)

# ---------------------------------------------------------------------------
# 16. HIERARCHY & POLYGON COUNT AUDIT SUMMARY
# ---------------------------------------------------------------------------
vanity_mesh_objects = [o for o in vanity_objects if o.type == 'MESH']
total_verts = sum(len(o.data.vertices) for o in vanity_mesh_objects)
total_polys = sum(len(o.data.polygons) for o in vanity_mesh_objects)

summary_path = os.path.join(render_dir, "vanity_model_summary.txt")
with open(summary_path, "w", encoding="utf-8") as f:
    f.write("=" * 60 + "\n")
    f.write("SÉRÉN STUDIO — 3D LUXURY VANITY & MIRROR MODEL SUMMARY (STEP 2)\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Asset Name: Seren Luxury Vanity & Arched Illuminated Mirror\n")
    f.write(f"Origin: Floor-Level Center (0, 0, 0) | Forward: -Y | Up: +Z\n")
    f.write(f"Total Mesh Objects: {len(vanity_mesh_objects)}\n")
    f.write(f"Total Vertices: {total_verts:,}\n")
    f.write(f"Total Polygons/Faces: {total_polys:,}\n\n")
    f.write("COLLECTION HIERARCHY & OBJECT BREAKDOWN:\n")
    for c_name in vanity_collection_names:
        c = collections.get(c_name)
        if c:
            f.write(f"\n[{c_name}] ({len(c.objects)} objects):\n")
            for o in sorted(c.objects, key=lambda x: x.name):
                poly_info = f" ({len(o.data.polygons)} polys, {len(o.data.vertices)} verts)" if o.type == 'MESH' else ""
                f.write(f"  • {o.name} [{o.type}]{poly_info}\n")
    f.write("\nPBR MATERIALS INCLUDED:\n")
    for m in sorted(materials.keys()):
        f.write(f"  • {m}\n")
    f.write("\nTHREE.JS INTEGRATION GUIDANCE:\n")
    f.write("  • Mirror_Surface mesh is isolated with a flat normal facing -Y for easy replacement with\n")
    f.write("    MeshReflectorMaterial or WebGLRenderTarget planar reflection.\n")
    f.write("  • Mirror_LED_Strip has emissive 3000K material for blooming or spot/rect-light pairing.\n")
    f.write("  • Exported GLB is self-contained with embedded geometry and PBR materials at origin (0, 0, 0).\n")

print("\n" + "=" * 60)
print(f"SUCCESS! Vanity Vertices: {total_verts:,} | Vanity Polygons: {total_polys:,}")
print(f"Saved: {blend_path}")
print(f"Exported: {glb_path}")
print(f"Summary: {summary_path}")
print("=" * 60)
