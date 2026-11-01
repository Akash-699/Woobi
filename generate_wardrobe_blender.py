import bpy
import bmesh
import math
import mathutils
import os

print("=" * 60)
print("SÉRÉN STUDIO — 3D LUXURY WARDROBE (EXACT REFERENCE 1:1)")
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

try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    try:
        scene.render.engine = 'BLENDER_EEVEE'
    except Exception:
        scene.render.engine = 'CYCLES'
        scene.cycles.device = 'CPU'
        scene.cycles.samples = 64

# Color Management (editorial soft studio look matching Sérén reference)
scene.view_settings.view_transform = 'AgX' if 'AgX' in [c.name for c in bpy.types.ColorManagedViewSettings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
scene.view_settings.look = 'Medium High Contrast'
scene.view_settings.exposure = 0.15

# ---------------------------------------------------------------------------
# 2. NAMED COLLECTIONS MANAGEMENT
# ---------------------------------------------------------------------------
collection_names = [
    "Wardrobe_Structure",
    "Hanging_Rail",
    "Hangers",
    "Hanging_Garments",
    "Folded_Clothing",
    "Shoes",
    "Accessories",
    "Plants",
    "Lighting",
    "Cameras"
]

collections = {}
for name in collection_names:
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
        elif k == 'coat':
            candidates = ['Coat Weight', 'Clearcoat']
        elif k == 'sheen':
            candidates = ['Sheen Weight', 'Sheen']
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

def create_wood_pbr(name, base_rgb=(0.83, 0.69, 0.51)):
    """Procedural natural light oak with delicate grain and soft sheen matching reference"""
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)
    
    mapping = nodes.new('ShaderNodeMapping')
    mapping.location = (-600, 0)
    mapping.inputs['Scale'].default_value = (1.5, 14.0, 1.5)
    mat.node_tree.links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])
    
    wave = nodes.new('ShaderNodeTexWave')
    wave.location = (-400, 100)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = 5.0
    wave.inputs['Distortion'].default_value = 2.0
    wave.inputs['Detail'].default_value = 3.0
    mat.node_tree.links.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-150, 100)
    ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[0].color = (base_rgb[0] * 0.90, base_rgb[1] * 0.89, base_rgb[2] * 0.86, 1.0)
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = (base_rgb[0] * 1.06, base_rgb[1] * 1.04, base_rgb[2] * 1.02, 1.0)
    mat.node_tree.links.new(wave.outputs['Color'], ramp.inputs['Fac'])
    
    bump = nodes.new('ShaderNodeBump')
    bump.location = (-150, -150)
    bump.inputs['Strength'].default_value = 0.035
    bump.inputs['Distance'].default_value = 0.05
    mat.node_tree.links.new(wave.outputs['Fac'], bump.inputs['Height'])
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (150, 0)
    set_bsdf(bsdf, roughness=0.36, metallic=0.01, specular=0.5)
    mat.node_tree.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (450, 0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

def create_striped_fabric_pbr(name):
    mat = bpy.data.materials.new(name=name)
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-600, 0)
    wave = nodes.new('ShaderNodeTexWave')
    wave.location = (-400, 0)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Y'
    wave.inputs['Scale'].default_value = 65.0
    mat.node_tree.links.new(tex_coord.outputs['Object'], wave.inputs['Vector'])
    
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-150, 0)
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[0].color = (0.28, 0.36, 0.46, 1.0)
    ramp.color_ramp.elements[1].position = 0.55
    ramp.color_ramp.elements[1].color = (0.95, 0.94, 0.92, 1.0)
    mat.node_tree.links.new(wave.outputs['Color'], ramp.inputs['Fac'])
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (150, 0)
    set_bsdf(bsdf, roughness=0.74, sheen=0.3)
    mat.node_tree.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (450, 0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    materials[name] = mat
    return mat

# Core Materials
mat_oak = create_wood_pbr("Mat_NaturalLightOak", base_rgb=(0.82, 0.69, 0.52))
mat_hanger_wood = create_wood_pbr("Mat_HangerWood", base_rgb=(0.77, 0.61, 0.43))
mat_brass = create_pbr_material("Mat_BrushedBrass", base_color=(0.86, 0.72, 0.38, 1.0), roughness=0.22, metallic=0.92)
mat_led = create_pbr_material("Mat_WarmLED_3000K", base_color=(1.0, 0.94, 0.84, 1.0), roughness=0.1, 
                              emission_color=(1.0, 0.92, 0.74, 1.0), emission_strength=18.0)

# Garment Materials (Matching the serene neutral palette in Reference)
mat_white_shirt = create_pbr_material("Mat_WhitePoplin", base_color=(0.95, 0.94, 0.92, 1.0), roughness=0.72, sheen=0.25)
mat_cream_blouse = create_pbr_material("Mat_CreamSilk", base_color=(0.94, 0.90, 0.83, 1.0), roughness=0.55, sheen=0.45, coat=0.1)
mat_beige_jacket = create_pbr_material("Mat_BeigeLinenJacket", base_color=(0.80, 0.73, 0.62, 1.0), roughness=0.75)
mat_charcoal_blazer = create_pbr_material("Mat_CharcoalWool", base_color=(0.19, 0.19, 0.20, 1.0), roughness=0.74, sheen=0.2)
mat_ivory_knit = create_pbr_material("Mat_IvoryCashmere", base_color=(0.92, 0.89, 0.83, 1.0), roughness=0.88, subsurface=0.08)
mat_neutral_trousers = create_pbr_material("Mat_NeutralTrousers", base_color=(0.69, 0.63, 0.54, 1.0), roughness=0.75)
mat_striped_shirt = create_striped_fabric_pbr("Mat_StripedPoplin")

# Accessories Materials
mat_folded_oatmeal = create_pbr_material("Mat_FoldedOatmeal", base_color=(0.85, 0.80, 0.73, 1.0), roughness=0.85)
mat_folded_grey = create_pbr_material("Mat_FoldedGrey", base_color=(0.58, 0.56, 0.54, 1.0), roughness=0.85)
mat_folded_ivory = create_pbr_material("Mat_FoldedIvory", base_color=(0.94, 0.92, 0.88, 1.0), roughness=0.88)
mat_bag_cream = create_pbr_material("Mat_CreamLeatherBag", base_color=(0.92, 0.89, 0.82, 1.0), roughness=0.30, coat=0.2)
mat_box_linen = create_pbr_material("Mat_BoxLinen", base_color=(0.93, 0.91, 0.87, 1.0), roughness=0.82)
mat_sneaker_white = create_pbr_material("Mat_SneakerWhiteLeather", base_color=(0.96, 0.96, 0.95, 1.0), roughness=0.40)
mat_sneaker_sole = create_pbr_material("Mat_SneakerSole", base_color=(0.86, 0.75, 0.62, 1.0), roughness=0.55)
mat_shoe_suede = create_pbr_material("Mat_TaupeSuede", base_color=(0.76, 0.68, 0.58, 1.0), roughness=0.90, sheen=0.5)
mat_ceramic_white = create_pbr_material("Mat_CeramicWhite", base_color=(0.96, 0.96, 0.95, 1.0), roughness=0.16, specular=0.6)
mat_plant_leaf = create_pbr_material("Mat_FoliageGreen", base_color=(0.20, 0.38, 0.15, 1.0), roughness=0.42, subsurface=0.15)
mat_plant_vine = create_pbr_material("Mat_VineWood", base_color=(0.35, 0.28, 0.18, 1.0), roughness=0.65)

# ---------------------------------------------------------------------------
# 4. GEOMETRY HELPERS
# ---------------------------------------------------------------------------
def create_box(name, size, location, material=None, col_name=None, bevel=0.0):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    if bevel > 0.0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2, profile=0.7)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = location
    if material:
        obj.data.materials.append(material)
    if col_name:
        link_obj(obj, col_name)
    return obj

def create_cylinder(name, radius, depth, location, rotation=(0,0,0), material=None, col_name=None, vertices=24):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=vertices,
                          radius1=radius, radius2=radius, depth=depth)
    bm.to_mesh(mesh)
    bm.free()
    obj.location = location
    obj.rotation_euler = rotation
    if material:
        obj.data.materials.append(material)
    if col_name:
        link_obj(obj, col_name)
    return obj

# ---------------------------------------------------------------------------
# 5. COLLECTION: WARDROBE STRUCTURE (Proportionally matching Reference Image)
# ---------------------------------------------------------------------------
# Dimensions: Height: 3.00m, Width: 1.34m, Depth: 0.65m (Luxury Built-in Open Wardrobe)
W_WIDTH = 1.34
W_HEIGHT = 3.00
W_DEPTH = 0.65
THICK = 0.038
PLINTH_H = 0.10

INT_W = W_WIDTH - 2 * THICK
INT_D = W_DEPTH - 0.03

# Outer Gable Panels (Left & Right)
create_box("Wardrobe_Side_Left", (THICK, W_DEPTH, W_HEIGHT), 
           (-W_WIDTH/2 + THICK/2, 0, W_HEIGHT/2), mat_oak, "Wardrobe_Structure", bevel=0.003)
create_box("Wardrobe_Side_Right", (THICK, W_DEPTH, W_HEIGHT), 
           (W_WIDTH/2 - THICK/2, 0, W_HEIGHT/2), mat_oak, "Wardrobe_Structure", bevel=0.003)

# Top Header Cap & Bottom Base Plinth
create_box("Wardrobe_Top_Cap", (W_WIDTH, W_DEPTH, THICK), 
           (0, 0, W_HEIGHT - THICK/2), mat_oak, "Wardrobe_Structure", bevel=0.003)
create_box("Wardrobe_Bottom_Plinth", (INT_W, W_DEPTH - 0.04, PLINTH_H), 
           (0, 0.015, PLINTH_H/2), mat_oak, "Wardrobe_Structure")
create_box("Wardrobe_Base_Shelf", (INT_W, INT_D, THICK), 
           (0, 0.005, PLINTH_H + THICK/2), mat_oak, "Wardrobe_Structure", bevel=0.002)

# Full Interior Natural Oak Backing Board
create_box("Wardrobe_Back_Board", (INT_W, 0.02, W_HEIGHT - THICK - PLINTH_H), 
           (0, -W_DEPTH/2 + 0.012, (W_HEIGHT + PLINTH_H)/2), mat_oak, "Wardrobe_Structure")

# 1. Top Storage Shelf (Z = 2.48m)
SHELF_TOP_Z = 2.48
create_box("Wardrobe_Shelf_Top", (INT_W, INT_D, THICK), 
           (0, 0.005, SHELF_TOP_Z), mat_oak, "Wardrobe_Structure", bevel=0.003)
create_box("LED_Strip_Top", (INT_W - 0.04, 0.025, 0.012), 
           (0, 0.06, SHELF_TOP_Z - THICK/2 - 0.006), mat_led, "Lighting")

# 2. Mid Shelf (below hanging clothes, for Handbag & Accessories, Z = 1.44m)
SHELF_MID_Z = 1.44
create_box("Wardrobe_Shelf_Mid", (INT_W, INT_D, THICK), 
           (0, 0.005, SHELF_MID_Z), mat_oak, "Wardrobe_Structure", bevel=0.003)
create_box("LED_Strip_Mid", (INT_W - 0.04, 0.025, 0.012), 
           (0, 0.06, SHELF_MID_Z - THICK/2 - 0.006), mat_led, "Lighting")

# 3. Lower Display Shelf (for Folded Clothing, Z = 1.08m)
SHELF_LOW_Z = 1.08
create_box("Wardrobe_Shelf_Low", (INT_W, INT_D, THICK), 
           (0, 0.005, SHELF_LOW_Z), mat_oak, "Wardrobe_Structure", bevel=0.003)
create_box("LED_Strip_Low", (INT_W - 0.04, 0.025, 0.012), 
           (0, 0.06, SHELF_LOW_Z - THICK/2 - 0.006), mat_led, "Lighting")

# 4. Shelf Above Drawers (Z = 0.74m)
SHELF_DRAWER_TOP_Z = 0.74
create_box("Wardrobe_Shelf_Drawer_Top", (INT_W, INT_D, THICK), 
           (0, 0.005, SHELF_DRAWER_TOP_Z), mat_oak, "Wardrobe_Structure", bevel=0.003)

# 5. Side-by-Side Drawers (Left Drawer & Right Drawer, exactly like Reference Image)
drawer_w = (INT_W - 0.024) / 2
drawer_h = (SHELF_DRAWER_TOP_Z - THICK/2) - (0.42 + THICK/2)
drawer_center_z = (SHELF_DRAWER_TOP_Z + 0.42) / 2

# Drawer Shelf Separator (Z = 0.42m)
create_box("Wardrobe_Shelf_Above_Shoes", (INT_W, INT_D, THICK), 
           (0, 0.005, 0.42), mat_oak, "Wardrobe_Structure", bevel=0.003)
create_box("LED_Strip_Shoes", (INT_W - 0.04, 0.025, 0.012), 
           (0, 0.06, 0.42 - THICK/2 - 0.006), mat_led, "Lighting")

# Left Drawer
d_left_x = -INT_W/4 - 0.003
create_box("Drawer_Left_Front", (drawer_w, 0.026, drawer_h - 0.012), 
           (d_left_x, W_DEPTH/2 - 0.022, drawer_center_z), mat_oak, "Wardrobe_Structure", bevel=0.002)
create_cylinder("Drawer_Left_Handle", 0.0065, 0.22, 
                (d_left_x, W_DEPTH/2 - 0.002, drawer_center_z), rotation=(0, math.pi/2, 0), 
                material=mat_brass, col_name="Wardrobe_Structure")

# Right Drawer
d_right_x = INT_W/4 + 0.003
create_box("Drawer_Right_Front", (drawer_w, 0.026, drawer_h - 0.012), 
           (d_right_x, W_DEPTH/2 - 0.022, drawer_center_z), mat_oak, "Wardrobe_Structure", bevel=0.002)
create_cylinder("Drawer_Right_Handle", 0.0065, 0.22, 
                (d_right_x, W_DEPTH/2 - 0.002, drawer_center_z), rotation=(0, math.pi/2, 0), 
                material=mat_brass, col_name="Wardrobe_Structure")

# ---------------------------------------------------------------------------
# 6. COLLECTION: HANGING RAIL & MOUNTING BRACKETS
# ---------------------------------------------------------------------------
RAIL_Z = 2.38
RAIL_Y = 0.00
rail_len = INT_W - 0.008

create_cylinder("Brass_Hanging_Rail", 0.014, rail_len, 
                (0, RAIL_Y, RAIL_Z), rotation=(0, math.pi/2, 0), 
                material=mat_brass, col_name="Hanging_Rail", vertices=24)

create_cylinder("Rail_Flange_Left", 0.032, 0.014, 
                (-INT_W/2 + 0.007, RAIL_Y, RAIL_Z), rotation=(0, math.pi/2, 0), 
                material=mat_brass, col_name="Hanging_Rail", vertices=24)
create_cylinder("Rail_Flange_Right", 0.032, 0.014, 
                (INT_W/2 - 0.007, RAIL_Y, RAIL_Z), rotation=(0, math.pi/2, 0), 
                material=mat_brass, col_name="Hanging_Rail", vertices=24)

# ---------------------------------------------------------------------------
# 7. COLLECTION: HANGERS (Detailed Contoured Wooden Wishbone Hangers)
# ---------------------------------------------------------------------------
def build_hanger(name, loc_x, loc_y, loc_z, angle_z=math.radians(16)):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    hw = 0.20
    t = 0.016
    
    v1 = bm.verts.new((0.00, -hw, -0.075))
    v2 = bm.verts.new((0.00, 0.00, 0.00))
    v3 = bm.verts.new((0.00, hw, -0.075))
    v4 = bm.verts.new((t, hw, -0.062))
    v5 = bm.verts.new((t*1.2, 0.00, 0.018))
    v6 = bm.verts.new((t, -hw, -0.062))
    
    v1b = bm.verts.new((-t, -hw, -0.075))
    v2b = bm.verts.new((-t*1.2, 0.00, 0.00))
    v3b = bm.verts.new((-t, hw, -0.075))
    v4b = bm.verts.new((-t*0.8, hw, -0.062))
    v5b = bm.verts.new((-t*0.8, 0.00, 0.018))
    v6b = bm.verts.new((-t*0.8, -hw, -0.062))
    
    bm.faces.new([v1, v2, v5, v6])
    bm.faces.new([v2, v3, v4, v5])
    bm.faces.new([v1b, v6b, v5b, v2b])
    bm.faces.new([v2b, v5b, v4b, v3b])
    bm.faces.new([v1, v1b, v2b, v2])
    bm.faces.new([v2, v2b, v3b, v3])
    bm.faces.new([v5, v4, v4b, v5b])
    bm.faces.new([v6, v5, v5b, v6b])
    bm.faces.new([v1, v6, v6b, v1b])
    bm.faces.new([v3, v3b, v4b, v4])
    
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = (loc_x, loc_y, loc_z)
    obj.rotation_euler = (0, 0, angle_z)
    obj.data.materials.append(mat_hanger_wood)
    link_obj(obj, "Hangers")
    
    create_cylinder(f"{name}_Bar", 0.006, hw*2 - 0.02, 
                    (loc_x, loc_y, loc_z - 0.074), rotation=(math.pi/2, 0, angle_z), 
                    material=mat_hanger_wood, col_name="Hangers", vertices=16)
    create_cylinder(f"{name}_Hook_Stem", 0.0025, 0.065, 
                    (loc_x, loc_y, loc_z + 0.042), rotation=(0, 0, 0), 
                    material=mat_brass, col_name="Hangers", vertices=12)
    create_cylinder(f"{name}_Hook_Top", 0.0025, 0.038, 
                    (loc_x - 0.012, loc_y, loc_z + 0.076), rotation=(0, math.pi/3, 0), 
                    material=mat_brass, col_name="Hangers", vertices=12)
    return obj

# 7 Hanger Positions across the rail
num_hangers = 7
start_x = -INT_W/2 + 0.16
end_x = INT_W/2 - 0.16
step_x = (end_x - start_x) / (num_hangers - 1)
hanger_x_positions = [start_x + i * step_x for i in range(num_hangers)]
GARMENT_ANGLE = math.radians(16)

for idx, hx in enumerate(hanger_x_positions):
    build_hanger(f"Hanger_{idx+1}", hx, RAIL_Y, RAIL_Z - 0.08, angle_z=GARMENT_ANGLE)

# ---------------------------------------------------------------------------
# 8. COLLECTION: HANGING GARMENTS (Every Garment with Recognizable 3D Geometry)
# ---------------------------------------------------------------------------
def build_garment_mesh(name, mat, loc, shoulder_span=0.42, chest_thick=0.12, height=0.74, 
                       collar_type='shirt', drape_curl=0.025, angle_z=GARMENT_ANGLE):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bm = bmesh.new()
    
    levels = 9
    torso_verts = []
    for l in range(levels):
        t = l / (levels - 1)
        z = -t * height
        if t < 0.15:
            ys = shoulder_span * (0.85 + t * 1.0)
            xt = chest_thick * 0.70
        elif t < 0.45:
            ys = shoulder_span * (1.0 - (t - 0.15) * 0.35)
            xt = chest_thick * 0.90
        elif t < 0.80:
            ys = shoulder_span * (0.88 + (t - 0.45) * 0.25)
            xt = chest_thick * 0.85
        else:
            ys = shoulder_span * (0.96 + (t - 0.80) * 0.4)
            xt = chest_thick * 0.80
            
        ripple = math.sin(t * math.pi * 3.0) * drape_curl
        
        p0 = bm.verts.new((-xt/2, -ys/2, z))
        p1 = bm.verts.new((-xt/2 - drape_curl, 0.0, z))
        p2 = bm.verts.new((-xt/2, ys/2, z))
        p3 = bm.verts.new((0.0, ys/2 + ripple, z))
        p4 = bm.verts.new((xt/2, ys/2, z))
        p5 = bm.verts.new((xt/2 + drape_curl, 0.0, z))
        p6 = bm.verts.new((xt/2, -ys/2, z))
        p7 = bm.verts.new((0.0, -ys/2 - ripple, z))
        torso_verts.append([p0, p1, p2, p3, p4, p5, p6, p7])
        
    for l in range(levels - 1):
        r1 = torso_verts[l]
        r2 = torso_verts[l+1]
        for i in range(8):
            next_i = (i + 1) % 8
            bm.faces.new([r1[i], r2[i], r2[next_i], r1[next_i]])
            
    bm.faces.new(torso_verts[0])
    bm.faces.new(list(reversed(torso_verts[-1])))
    
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = loc
    obj.rotation_euler = (0, 0, angle_z)
    obj.data.materials.append(mat)
    link_obj(obj, "Hanging_Garments")
    
    cos_a = math.cos(angle_z)
    sin_a = math.sin(angle_z)
    
    if collar_type == 'shirt':
        create_cylinder(f"{name}_Collar", 0.072, 0.042, 
                        (loc[0], loc[1], loc[2] + 0.015), 
                        rotation=(0, 0, angle_z), material=mat, 
                        col_name="Hanging_Garments", vertices=16)
        placket_dx = (chest_thick/2 + 0.005) * cos_a
        placket_dy = (chest_thick/2 + 0.005) * sin_a
        placket = create_box(f"{name}_Placket", (0.012, 0.030, height * 0.72), 
                             (loc[0] + placket_dx, loc[1] + placket_dy, loc[2] - height * 0.38), 
                             mat, "Hanging_Garments")
        placket.rotation_euler = (0, 0, angle_z)
        for b in range(5):
            bz = loc[2] - 0.08 - b * 0.11
            btn_dx = (chest_thick/2 + 0.012) * cos_a
            btn_dy = (chest_thick/2 + 0.012) * sin_a
            create_cylinder(f"{name}_Btn_{b+1}", 0.004, 0.004, 
                            (loc[0] + btn_dx, loc[1] + btn_dy, bz), 
                            rotation=(0, math.pi/2, angle_z), 
                            material=mat_ceramic_white, col_name="Hanging_Garments", vertices=12)
            
    elif collar_type == 'jacket_lapel':
        lapel_dx = (chest_thick/2 + 0.006) * cos_a
        lapel_dy = (chest_thick/2 + 0.006) * sin_a
        lapel_l = create_box(f"{name}_Lapel_L", (0.014, 0.072, 0.30), 
                             (loc[0] + lapel_dx - 0.038*sin_a, loc[1] + lapel_dy + 0.038*cos_a, loc[2] - 0.14), 
                             mat, "Hanging_Garments", bevel=0.002)
        lapel_l.rotation_euler = (0, 0, angle_z - math.pi/18)
        lapel_r = create_box(f"{name}_Lapel_R", (0.014, 0.072, 0.30), 
                             (loc[0] + lapel_dx + 0.038*sin_a, loc[1] + lapel_dy - 0.038*cos_a, loc[2] - 0.14), 
                             mat, "Hanging_Garments", bevel=0.002)
        lapel_r.rotation_euler = (0, 0, angle_z + math.pi/18)
        
    elif collar_type == 'blouse_vneck':
        create_cylinder(f"{name}_VNeck", 0.070, 0.030, 
                        (loc[0], loc[1], loc[2] + 0.01), 
                        rotation=(math.pi/12, 0, angle_z), material=mat, 
                        col_name="Hanging_Garments", vertices=16)

    elif collar_type == 'knit_crew':
        create_cylinder(f"{name}_CrewRib", 0.078, 0.034, 
                        (loc[0], loc[1], loc[2] + 0.015), 
                        rotation=(0, 0, angle_z), material=mat, 
                        col_name="Hanging_Garments", vertices=20)
    
    s_len = height * 0.70
    s_rad = 0.044
    s_front_x = loc[0] + (shoulder_span/2 + 0.02) * sin_a
    s_front_y = loc[1] + (shoulder_span/2 + 0.02) * cos_a
    create_cylinder(f"{name}_Sleeve_Front", s_rad, s_len, 
                    (s_front_x, s_front_y, loc[2] - s_len/2 - 0.04), 
                    rotation=(math.pi/32, 0, angle_z), material=mat, col_name="Hanging_Garments", vertices=16)
    create_cylinder(f"{name}_Cuff_Front", s_rad + 0.004, 0.030, 
                    (s_front_x, s_front_y, loc[2] - s_len - 0.03), 
                    rotation=(math.pi/32, 0, angle_z), material=mat, col_name="Hanging_Garments", vertices=16)
    
    s_back_x = loc[0] - (shoulder_span/2 + 0.02) * sin_a
    s_back_y = loc[1] - (shoulder_span/2 + 0.02) * cos_a
    create_cylinder(f"{name}_Sleeve_Back", s_rad, s_len, 
                    (s_back_x, s_back_y, loc[2] - s_len/2 - 0.04), 
                    rotation=(-math.pi/32, 0, angle_z), material=mat, col_name="Hanging_Garments", vertices=16)

    return obj

# 1. White Button-Down Shirt (Left)
build_garment_mesh("Garment_1_White_Shirt", mat_white_shirt, 
                   (hanger_x_positions[0], RAIL_Y, RAIL_Z - 0.15), 
                   shoulder_span=0.42, chest_thick=0.11, height=0.74, collar_type='shirt')

# 2. Cream Blouse
build_garment_mesh("Garment_2_Cream_Blouse", mat_cream_blouse, 
                   (hanger_x_positions[1], RAIL_Y, RAIL_Z - 0.15), 
                   shoulder_span=0.40, chest_thick=0.10, height=0.70, collar_type='blouse_vneck', drape_curl=0.035)

# 3. Beige Jacket
build_garment_mesh("Garment_3_Beige_Jacket", mat_beige_jacket, 
                   (hanger_x_positions[2], RAIL_Y, RAIL_Z - 0.15), 
                   shoulder_span=0.44, chest_thick=0.14, height=0.76, collar_type='jacket_lapel')

# 4. Charcoal Blazer
build_garment_mesh("Garment_4_Charcoal_Blazer", mat_charcoal_blazer, 
                   (hanger_x_positions[3], RAIL_Y, RAIL_Z - 0.15), 
                   shoulder_span=0.45, chest_thick=0.15, height=0.78, collar_type='jacket_lapel')

# 5. Ivory Knitwear
build_garment_mesh("Garment_5_Ivory_Knitwear", mat_ivory_knit, 
                   (hanger_x_positions[4], RAIL_Y, RAIL_Z - 0.15), 
                   shoulder_span=0.43, chest_thick=0.13, height=0.72, collar_type='knit_crew', drape_curl=0.04)

# 6. Neutral Trousers (Draped over hanger crossbar)
tr_x = hanger_x_positions[5]
tr_loc = (tr_x, RAIL_Y, RAIL_Z - 0.15)
create_cylinder("Trousers_Fold_Top", 0.022, 0.38, 
                tr_loc, rotation=(math.pi/2, 0, GARMENT_ANGLE), material=mat_neutral_trousers, 
                col_name="Hanging_Garments", vertices=16)
tr_leg_dx = 0.025 * math.cos(GARMENT_ANGLE)
tr_leg_dy = 0.025 * math.sin(GARMENT_ANGLE)
leg_f = create_box("Trousers_Leg_Front", (0.040, 0.22, 0.72), 
                   (tr_x + tr_leg_dx, RAIL_Y + tr_leg_dy, tr_loc[2] - 0.36), 
                   mat_neutral_trousers, "Hanging_Garments", bevel=0.002)
leg_f.rotation_euler = (0, 0, GARMENT_ANGLE)
leg_b = create_box("Trousers_Leg_Back", (0.040, 0.22, 0.72), 
                   (tr_x - tr_leg_dx, RAIL_Y - tr_leg_dy, tr_loc[2] - 0.36), 
                   mat_neutral_trousers, "Hanging_Garments", bevel=0.002)
leg_b.rotation_euler = (0, 0, GARMENT_ANGLE)

# 7. Striped Shirt (Right)
build_garment_mesh("Garment_7_Striped_Shirt", mat_striped_shirt, 
                   (hanger_x_positions[6], RAIL_Y, RAIL_Z - 0.15), 
                   shoulder_span=0.42, chest_thick=0.11, height=0.74, collar_type='shirt')

# ---------------------------------------------------------------------------
# 9. COLLECTION: ACCESSORIES (Upper Box, Handbag, Accessories Tray)
# ---------------------------------------------------------------------------
# Upper Shelf (Z = 2.48m):
# Left: Crisp White Storage Box with Brass Ring Pull (Exactly as in Reference)
box_w = 0.38
box_d = 0.46
box_h = 0.24
box_z = SHELF_TOP_Z + THICK/2 + box_h/2
create_box("Storage_Box_Top_Left", (box_w, box_d, box_h), (-INT_W/4 - 0.04, 0.02, box_z), 
           mat_box_linen, "Accessories", bevel=0.008)
create_cylinder("Box_Brass_Ring", 0.016, 0.008, (-INT_W/4 - 0.04, W_DEPTH/2 - 0.05, box_z - 0.02), 
                rotation=(math.pi/2, 0, 0), material=mat_brass, col_name="Accessories")

# Middle Shelf (Z = 1.44m):
# Left: Cream Structured Luxury Handbag with Gold Clasp (Exactly as in Reference)
bag_loc = (-INT_W/4 - 0.06, 0.02, SHELF_MID_Z + THICK/2 + 0.12)
create_box("Leather_Handbag_Body", (0.28, 0.14, 0.20), bag_loc, mat_bag_cream, "Accessories", bevel=0.012)
create_box("Handbag_Flap", (0.282, 0.014, 0.12), (bag_loc[0], bag_loc[1] + 0.072, bag_loc[2] + 0.02), 
           mat_bag_cream, "Accessories", bevel=0.004)
create_cylinder("Handbag_Gold_Lock", 0.012, 0.014, (bag_loc[0], bag_loc[1] + 0.080, bag_loc[2] - 0.01), 
                rotation=(math.pi/2, 0, 0), material=mat_brass, col_name="Accessories")
create_cylinder("Handbag_Handle_Arc", 0.008, 0.20, (bag_loc[0], bag_loc[1], bag_loc[2] + 0.15), 
                rotation=(0, math.pi/2, 0), material=mat_bag_cream, col_name="Accessories")

# Middle Shelf Right: Folded Silk Accessories & Tray
tray_loc = (INT_W/4 + 0.06, 0.02, SHELF_MID_Z + THICK/2 + 0.025)
create_box("Accessories_Tray", (0.34, 0.26, 0.02), tray_loc, mat_oak, "Accessories", bevel=0.003)
create_box("Folded_Silk_Scarf", (0.28, 0.22, 0.025), (tray_loc[0], tray_loc[1], tray_loc[2] + 0.025), 
           mat_cream_blouse, "Accessories", bevel=0.005)

# ---------------------------------------------------------------------------
# 10. COLLECTION: FOLDED CLOTHING (Lower Shelf Z = 1.08m)
# ---------------------------------------------------------------------------
# Left: Folded Light Linen Stack (Matching Reference)
f_left_x = -INT_W/4 - 0.04
f_y = 0.03
create_box("Folded_Linen_Stack", (0.32, 0.28, 0.055), (f_left_x, f_y, SHELF_LOW_Z + THICK/2 + 0.028), 
           mat_folded_ivory, "Folded_Clothing", bevel=0.014)

# Right: Stack of 3 Folded Knitwear Sweaters (Grey / Oatmeal / Camel, Exactly as in Reference)
f_right_x = INT_W/4 + 0.04
sw_h = 0.048
sw_w = 0.34
sw_d = 0.28
create_box("Folded_Sweater_1_Grey", (sw_w, sw_d, sw_h), (f_right_x, f_y, SHELF_LOW_Z + THICK/2 + sw_h*0.5), 
           mat_folded_grey, "Folded_Clothing", bevel=0.014)
create_box("Folded_Sweater_2_Oatmeal", (sw_w - 0.01, sw_d - 0.01, sw_h), (f_right_x, f_y, SHELF_LOW_Z + THICK/2 + sw_h*1.5), 
           mat_folded_oatmeal, "Folded_Clothing", bevel=0.014)
create_box("Folded_Sweater_3_White", (sw_w - 0.02, sw_d - 0.02, sw_h), (f_right_x, f_y, SHELF_LOW_Z + THICK/2 + sw_h*2.5), 
           mat_white_shirt, "Folded_Clothing", bevel=0.014)

# ---------------------------------------------------------------------------
# 11. COLLECTION: SHOES (4 Pairs Lined Up on Bottom Shelf, Exactly like Reference)
# ---------------------------------------------------------------------------
shoe_z = PLINTH_H + THICK/2 + 0.01
shoe_positions_x = [
    -INT_W/2 + 0.16, # Pair 1: White Sneakers
    -INT_W/2 + 0.44, # Pair 2: Light Taupe Loafers / Heels
    INT_W/2 - 0.44,  # Pair 3: Neutral Suede Shoes
    INT_W/2 - 0.16   # Pair 4: White Minimalist Trainers
]

def build_sneaker(name, loc):
    create_box(f"{name}_Sole", (0.095, 0.26, 0.028), (loc[0], loc[1], loc[2] + 0.014), 
               mat_sneaker_sole, "Shoes", bevel=0.005)
    create_box(f"{name}_Upper", (0.088, 0.24, 0.065), (loc[0], loc[1] - 0.005, loc[2] + 0.05), 
               mat_sneaker_white, "Shoes", bevel=0.012)

def build_loafer(name, loc):
    create_box(f"{name}_Sole", (0.09, 0.25, 0.020), (loc[0], loc[1], loc[2] + 0.010), 
               mat_oak, "Shoes", bevel=0.003)
    create_box(f"{name}_Upper", (0.082, 0.23, 0.058), (loc[0], loc[1], loc[2] + 0.042), 
               mat_shoe_suede, "Shoes", bevel=0.014)

# Pair 1: White Leather Sneakers
build_sneaker("Shoe_Pair1_L", (shoe_positions_x[0] - 0.052, 0.02, shoe_z))
build_sneaker("Shoe_Pair1_R", (shoe_positions_x[0] + 0.052, 0.02, shoe_z))

# Pair 2: Light Taupe Loafers
build_loafer("Shoe_Pair2_L", (shoe_positions_x[1] - 0.050, 0.02, shoe_z))
build_loafer("Shoe_Pair2_R", (shoe_positions_x[1] + 0.050, 0.02, shoe_z))

# Pair 3: Neutral Suede Shoes
build_loafer("Shoe_Pair3_L", (shoe_positions_x[2] - 0.050, 0.02, shoe_z))
build_loafer("Shoe_Pair3_R", (shoe_positions_x[2] + 0.050, 0.02, shoe_z))

# Pair 4: White Trainers
build_sneaker("Shoe_Pair4_L", (shoe_positions_x[3] - 0.052, 0.02, shoe_z))
build_sneaker("Shoe_Pair4_R", (shoe_positions_x[3] + 0.052, 0.02, shoe_z))

# ---------------------------------------------------------------------------
# 12. COLLECTION: PLANTS (Ceramic Pot on Top Shelf with Cascading Foliage on Right)
# ---------------------------------------------------------------------------
pot_x = INT_W/2 - 0.22
pot_y = 0.06
pot_z = SHELF_TOP_Z + THICK/2 + 0.09

create_cylinder("Plant_Pot", 0.085, 0.16, (pot_x, pot_y, pot_z), 
                rotation=(0, 0, 0), material=mat_ceramic_white, col_name="Plants", vertices=24)
create_cylinder("Plant_Soil", 0.080, 0.015, (pot_x, pot_y, pot_z + 0.075), 
                rotation=(0, 0, 0), material=mat_charcoal_blazer, col_name="Plants", vertices=16)

# Multiple vines draping down over the front-right shelf edge (Matching Reference)
vine_data = [
    ((0.00, 0.06, 0.08), 0.78, 0.04, 0.06),
    ((-0.05, 0.05, 0.08), 0.96, -0.02, 0.05),
    ((0.04, 0.06, 0.08), 0.58, 0.06, 0.07),
    ((-0.02, 0.07, 0.08), 1.18, 0.02, 0.05),
    ((0.02, 0.04, 0.08), 0.45, 0.05, 0.06),
]

for v_idx, (v_start, v_len, cv_x, cv_y) in enumerate(vine_data):
    create_cylinder(f"Ivy_Stem_{v_idx+1}", 0.0035, v_len, 
                    (pot_x + v_start[0] + cv_x/2, pot_y + v_start[1] + cv_y/2, pot_z + v_start[2] - v_len/2), 
                    rotation=(math.pi/24, -math.pi/28, 0), material=mat_plant_vine, col_name="Plants", vertices=8)
    
    num_leaves = int(v_len / 0.075)
    for l_idx in range(num_leaves):
        t = (l_idx + 1) / (num_leaves + 1)
        lz = pot_z + v_start[2] - t * v_len
        lx = pot_x + v_start[0] + t * cv_x + math.sin(t * 8) * 0.030
        ly = pot_y + v_start[1] + t * cv_y + math.cos(t * 8) * 0.022
        leaf = create_box(f"Ivy_Leaf_{v_idx+1}_{l_idx+1}", (0.045, 0.045, 0.003), 
                          (lx, ly, lz), mat_plant_leaf, "Plants")
        leaf.rotation_euler = (math.pi/6 + t*0.5, math.pi/4, t * math.pi * 2)

# ---------------------------------------------------------------------------
# 13. COLLECTION: LIGHTING (Warm Integrated + Neutral Studio 3-Point)
# ---------------------------------------------------------------------------
def look_at(obj, target_loc):
    direction = mathutils.Vector(target_loc) - mathutils.Vector(obj.location)
    rot_quat = direction.to_track_quat('-Z', 'Y')
    obj.rotation_euler = rot_quat.to_euler()

# Key Light
key_light_data = bpy.data.lights.new(name="Studio_Key_Light", type='AREA')
key_light_data.energy = 380.0
key_light_data.size = 2.4
key_light_data.size_y = 3.2
key_light_data.color = (1.0, 0.96, 0.90)
key_light_obj = bpy.data.objects.new(name="Studio_Key_Light", object_data=key_light_data)
key_light_obj.location = (1.6, 3.4, 2.2)
look_at(key_light_obj, (0.0, 0.0, 1.5))
link_obj(key_light_obj, "Lighting")

# Fill Light
fill_light_data = bpy.data.lights.new(name="Studio_Fill_Light", type='AREA')
fill_light_data.energy = 180.0
fill_light_data.size = 2.0
fill_light_data.size_y = 3.0
fill_light_data.color = (0.95, 0.96, 1.0)
fill_light_obj = bpy.data.objects.new(name="Studio_Fill_Light", object_data=fill_light_data)
fill_light_obj.location = (-1.8, 3.2, 2.0)
look_at(fill_light_obj, (0.0, 0.0, 1.5))
link_obj(fill_light_obj, "Lighting")

# Top Ambient Bounce Light
top_light_data = bpy.data.lights.new(name="Studio_Top_Bounce", type='AREA')
top_light_data.energy = 140.0
top_light_data.size = 2.8
top_light_obj = bpy.data.objects.new(name="Studio_Top_Bounce", object_data=top_light_data)
top_light_obj.location = (0.0, 1.2, 3.8)
look_at(top_light_obj, (0.0, 0.0, 1.5))
link_obj(top_light_obj, "Lighting")

# ---------------------------------------------------------------------------
# 14. CAMERAS SETUP
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

# 1. Front View (Orthogonal framing for full 3-meter tall wardrobe)
cam_front = create_camera("Camera_Front", (0.0, 5.20, 1.50), (0.0, 0.0, 1.50), focal_length=42)

# 2. Three-Quarter Perspective (45-degree angle showing depth and interior)
cam_persp = create_camera("Camera_Perspective", (2.60, 3.60, 1.85), (0.00, 0.0, 1.45), focal_length=44)

# 3. Close-Up of Hanging Garments
cam_close = create_camera("Camera_Closeup", (0.0, 2.20, 1.95), (0.0, 0.0, 1.95), focal_length=54)

# ---------------------------------------------------------------------------
# 15. RENDERING OUTPUTS
# ---------------------------------------------------------------------------
render_dir = r"s:\Fashion_App"
renders = [
    ("Camera_Front", os.path.join(render_dir, "render_front.png")),
    ("Camera_Perspective", os.path.join(render_dir, "render_perspective.png")),
    ("Camera_Closeup", os.path.join(render_dir, "render_closeup_garments.png"))
]

for cam_name, output_path in renders:
    scene.camera = cameras[cam_name]
    scene.render.filepath = output_path
    print(f"Rendering: {cam_name} -> {output_path}...")
    bpy.ops.render.render(write_still=True)
    print(f"Render complete: {output_path}")

# ---------------------------------------------------------------------------
# 16. EXPORT WARDROBE.BLEND & WARDROBE.GLB
# ---------------------------------------------------------------------------
blend_path = os.path.join(render_dir, "wardrobe.blend")
glb_path = os.path.join(render_dir, "wardrobe.glb")

print(f"Saving editable Blender file: {blend_path}...")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

print(f"Exporting standard glTF 2.0 binary: {glb_path}...")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_materials='EXPORT',
    export_lights=True,
    export_cameras=True
)

# ---------------------------------------------------------------------------
# 17. HIERARCHY & POLYGON COUNT AUDIT SUMMARY
# ---------------------------------------------------------------------------
total_verts = sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH')
total_polys = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')

summary_path = os.path.join(render_dir, "model_summary.txt")
with open(summary_path, "w", encoding="utf-8") as f:
    f.write("=" * 60 + "\n")
    f.write("SÉRÉN STUDIO — 3D LUXURY WARDROBE MODEL SUMMARY (1:1 REFERENCE)\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Total Mesh Objects: {len([o for o in bpy.data.objects if o.type == 'MESH'])}\n")
    f.write(f"Total Vertices: {total_verts:,}\n")
    f.write(f"Total Polygons/Faces: {total_polys:,}\n\n")
    f.write("COLLECTION HIERARCHY & OBJECT COUNTS:\n")
    for c_name in collection_names:
        c = collections.get(c_name)
        if c:
            f.write(f"\n[{c_name}] ({len(c.objects)} objects):\n")
            for o in sorted(c.objects, key=lambda x: x.name):
                poly_info = f" ({len(o.data.polygons)} polys)" if o.type == 'MESH' else ""
                f.write(f"  • {o.name} [{o.type}]{poly_info}\n")
    f.write("\nMATERIALS INCLUDED:\n")
    for m in sorted(materials.keys()):
        f.write(f"  • {m}\n")

print("\n" + "=" * 60)
print(f"SUCCESS! Total Vertices: {total_verts:,} | Total Polygons: {total_polys:,}")
print(f"Saved: {blend_path}")
print(f"Exported: {glb_path}")
print("=" * 60)
