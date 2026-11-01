"""
SEREN STUDIO — STEP 4 v3: PERSONALIZED HUMAN AVATAR
Fixed: face-forward orientation, correct camera angles, merged body silhouette,
proper face feature placement and head/hair layering.
"""
import bpy
import bmesh
import math
import os

print("=" * 60)
print("SEREN STUDIO — 3D AVATAR (STEP 4 v3) BUILDING...")
print("=" * 60)

# ─────────────────────────────────────────────────────────────
# 1. SCENE SETUP
# ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'METERS'

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 80
scene.cycles.use_denoising = True
scene.render.resolution_x = 1080
scene.render.resolution_y = 1440
scene.render.resolution_percentage = 100

if 'AgX' in [c.name for c in bpy.types.ColorManagedViewSettings.bl_rna.properties['view_transform'].enum_items]:
    scene.view_settings.view_transform = 'AgX'
else:
    scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'Medium Contrast'

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
wn.clear()
wbg = wn.new('ShaderNodeBackground')
wbg.inputs['Color'].default_value = (0.93, 0.91, 0.87, 1.0)
wbg.inputs['Strength'].default_value = 0.8
wout = wn.new('ShaderNodeOutputWorld')
world.node_tree.links.new(wbg.outputs['Background'], wout.inputs['Surface'])

# ─────────────────────────────────────────────────────────────
# 2. COLLECTIONS
# ─────────────────────────────────────────────────────────────
def make_col(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c

col_avatar = make_col("Avatar")
col_env    = make_col("Environment")
col_lights = make_col("Lighting")
col_cams   = make_col("Cameras")

# ─────────────────────────────────────────────────────────────
# 3. MATERIALS
# ─────────────────────────────────────────────────────────────
def mat(name, base, rough=0.5, metal=0.0, alpha=1.0, sss=0.0, cc=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes
    n.clear()
    b = n.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value = (*base[:3], 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    if sss > 0:
        for k in ('Subsurface Weight', 'Subsurface'):
            if k in b.inputs:
                b.inputs[k].default_value = sss
                break
    if cc > 0:
        for k in ('Coat Weight', 'Clearcoat'):
            if k in b.inputs:
                b.inputs[k].default_value = cc
                break
    o = n.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(b.outputs['BSDF'], o.inputs['Surface'])
    return m

# Core palette
M_skin     = mat("M_Skin",      (0.95, 0.83, 0.76), rough=0.36, sss=0.20)
M_blush    = mat("M_Blush",     (0.92, 0.62, 0.58), rough=0.55, alpha=0.45, sss=0.3)
M_lips     = mat("M_Lips",      (0.80, 0.38, 0.36), rough=0.20, cc=0.4)
M_sclera   = mat("M_Sclera",    (0.96, 0.95, 0.93), rough=0.06, cc=0.9)
M_iris     = mat("M_Iris",      (0.14, 0.07, 0.04), rough=0.14, cc=0.9)
M_pupil    = mat("M_Pupil",     (0.02, 0.01, 0.01), rough=0.05)
M_glint    = mat("M_Glint",     (1.00, 1.00, 1.00), rough=0.0)
M_lash     = mat("M_Lash",      (0.06, 0.03, 0.02), rough=0.7)
M_brow     = mat("M_Brow",      (0.12, 0.06, 0.03), rough=0.7)
M_hair     = mat("M_Hair",      (0.08, 0.04, 0.02), rough=0.26, metal=0.05)
M_top      = mat("M_Top",       (0.96, 0.94, 0.90), rough=0.62)
M_pants    = mat("M_Pants",     (0.78, 0.72, 0.63), rough=0.72)
M_shoe_up  = mat("M_ShoeUpper", (0.97, 0.97, 0.97), rough=0.32)
M_shoe_sol = mat("M_ShoeSole",  (0.90, 0.90, 0.90), rough=0.58)
M_gold     = mat("M_Gold",      (0.92, 0.74, 0.42), rough=0.16, metal=0.92)
M_rug      = mat("M_Rug",       (0.94, 0.91, 0.87), rough=0.84)
M_floor    = mat("M_Floor",     (0.93, 0.90, 0.86), rough=0.28)

# ─────────────────────────────────────────────────────────────
# 4. HELPERS
# ─────────────────────────────────────────────────────────────
def add_obj(name, mesh, collection, loc=(0,0,0), rot=(0,0,0), scale=(1,1,1)):
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = scale
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def assign(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)

def subsurf(obj, lv=1):
    m = obj.modifiers.new("Sub", 'SUBSURF')
    m.levels = lv
    m.render_levels = lv + 1

def sphere(name, r, us, vs, sx=1, sy=1, sz=1):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=us, v_segments=vs, radius=r)
    for v in bm.verts:
        v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return me

def cone(name, r1, r2, d, seg=24, sx=1, sy=1):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=d)
    for v in bm.verts:
        v.co.x *= sx; v.co.y *= sy
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return me

def disc(name, r, seg=48):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=0.018)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return me

def flat_quad(name, size):
    bm = bmesh.new()
    s = size
    v0=bm.verts.new((-s,-s,0)); v1=bm.verts.new((s,-s,0))
    v2=bm.verts.new((s,s,0));   v3=bm.verts.new((-s,s,0))
    bm.faces.new([v0,v1,v2,v3])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return me

def make_torus(name, R, r, mseg=24, nseg=8):
    """Manual torus — bmesh.ops.create_torus removed in Blender 5.x"""
    bm = bmesh.new()
    verts = []
    for i in range(mseg):
        am = 2*math.pi*i/mseg
        row = []
        for j in range(nseg):
            an = 2*math.pi*j/nseg
            x = (R + r*math.cos(an))*math.cos(am)
            y = (R + r*math.cos(an))*math.sin(am)
            z = r*math.sin(an)
            row.append(bm.verts.new((x,y,z)))
        verts.append(row)
    bm.verts.ensure_lookup_table()
    for i in range(mseg):
        ni = (i+1)%mseg
        for j in range(nseg):
            nj = (j+1)%nseg
            bm.faces.new([verts[i][j], verts[i][nj], verts[ni][nj], verts[ni][j]])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    return me

# ─────────────────────────────────────────────────────────────
# 5.  AVATAR CONSTRUCTION
#     AXIS CONVENTION:
#       Z = up (height)
#       Y = forward (toward camera at -Y)
#       X = left/right
#     Face features sit at positive Y (front of head)
#     Hair/bun sits at negative Y (back of head)
# ─────────────────────────────────────────────────────────────

# ── 5a. HEAD (sculpted ellipsoid) ──────────────────────────
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=24, radius=0.094)
for v in bm.verts:
    v.co.x *= 0.86          # narrower face
    v.co.y *= 0.92          # slight depth reduction
    v.co.z *= 1.14          # taller skull
    # taper jaw / chin at bottom
    if v.co.z < -0.02:
        t = (v.co.z + 0.02) / -0.11
        t = max(0.0, min(1.0, t))
        v.co.x *= 1.0 - t*0.42
        v.co.y += t*0.010
me_head = bpy.data.meshes.new("Mesh_Head")
bm.to_mesh(me_head); bm.free()
o_head = add_obj("Head", me_head, col_avatar, loc=(0, 0, 1.540))
assign(o_head, M_skin); subsurf(o_head)

# ── 5b. FACE FEATURES (all at positive Y = toward camera) ───

# Cheek blush (left & right)
for sx, nm in [(-1,"L"),(1,"R")]:
    me = sphere(f"Blush_{nm}", 0.022, 12, 8, sx=1.3, sy=0.22, sz=0.60)
    o  = add_obj(f"Blush_{nm}", me, col_avatar, loc=(sx*0.046, 0.080, 1.527))
    assign(o, M_blush)

# Eyes — sclera, iris, pupil, glint, lash, brow
for sx, nm in [(-1,"L"),(1,"R")]:
    ex, ey, ez = sx*0.030, 0.086, 1.555

    me = sphere(f"Sclera_{nm}", 0.0118, 16, 12, sx=1.28, sy=0.60, sz=0.82)
    o  = add_obj(f"Sclera_{nm}", me, col_avatar, loc=(ex, ey, ez),
                 rot=(0, 0, sx*0.04)); assign(o, M_sclera)

    me = sphere(f"Iris_{nm}", 0.0068, 14, 10, sy=0.22)
    o  = add_obj(f"Iris_{nm}", me, col_avatar, loc=(ex, ey+0.007, ez))
    assign(o, M_iris)

    me = sphere(f"Pupil_{nm}", 0.0034, 10, 8, sy=0.18)
    o  = add_obj(f"Pupil_{nm}", me, col_avatar, loc=(ex, ey+0.0078, ez))
    assign(o, M_pupil)

    me = sphere(f"Glint_{nm}", 0.0014, 6, 6)
    o  = add_obj(f"Glint_{nm}", me, col_avatar,
                 loc=(ex+sx*0.002, ey+0.0088, ez+0.002)); assign(o, M_glint)

    # Upper lash — thin oval strip
    me = cone(f"Lash_{nm}", 0.0016, 0.0007, 0.025, seg=10)
    o  = add_obj(f"Lash_{nm}", me, col_avatar,
                 loc=(ex, ey+0.007, ez+0.009),
                 rot=(0.18, 0, -sx*1.52)); assign(o, M_lash)

    # Arched brow
    me = cone(f"Brow_{nm}", 0.0020, 0.0008, 0.032, seg=10)
    o  = add_obj(f"Brow_{nm}", me, col_avatar,
                 loc=(ex, ey+0.008, ez+0.020),
                 rot=(0.25, 0, -sx*1.42)); assign(o, M_brow)

# Nose bridge + tip
me = cone("Nose", 0.0095, 0.0040, 0.030, seg=12, sy=1.25)
o  = add_obj("Nose", me, col_avatar,
             loc=(0, 0.094, 1.532), rot=(-0.32, 0, 0)); assign(o, M_skin)

# Lips
me = sphere("Upper_Lip", 0.011, 14, 10, sx=1.58, sy=0.42, sz=0.52)
o  = add_obj("Upper_Lip", me, col_avatar, loc=(0, 0.090, 1.490)); assign(o, M_lips)
me = sphere("Lower_Lip", 0.013, 14, 10, sx=1.38, sy=0.52, sz=0.62)
o  = add_obj("Lower_Lip", me, col_avatar, loc=(0, 0.088, 1.479)); assign(o, M_lips)

# Ears + gold hoops
for sx, nm in [(-1,"L"),(1,"R")]:
    me = sphere(f"Ear_{nm}", 0.018, 12, 10, sx=0.32, sy=0.68, sz=1.22)
    o  = add_obj(f"Ear_{nm}", me, col_avatar,
                 loc=(sx*0.082, -0.006, 1.542)); assign(o, M_skin)

    me = make_torus(f"Hoop_{nm}", R=0.011, r=0.0017, mseg=22, nseg=8)
    o  = add_obj(f"Hoop_{nm}", me, col_avatar,
                 loc=(sx*0.083, -0.006, 1.525),
                 rot=(0, math.pi/2, 0)); assign(o, M_gold)

# ── 5c. HAIR ────────────────────────────────────────────────
# Scalp — covers top and back of head (negative Y = back)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=18, radius=0.102)
for v in bm.verts:
    v.co.x *= 0.88
    v.co.z *= 1.12
    # Pull backward — stronger at top
    if v.co.y < 0:
        v.co.z += (-v.co.y) * 0.12
me_scalp = bpy.data.meshes.new("Scalp")
bm.to_mesh(me_scalp); bm.free()
o_scalp = add_obj("Scalp", me_scalp, col_avatar, loc=(0, -0.014, 1.565))
assign(o_scalp, M_hair)

# Bun (sits high and rear)
me = sphere("Bun", 0.050, 20, 16, sx=0.95, sy=0.90, sz=1.22)
o  = add_obj("Bun", me, col_avatar,
             loc=(0, -0.062, 1.700), rot=(0.24, 0, 0)); assign(o, M_hair)

# Bun wrap ring
me = make_torus("BunRing", R=0.044, r=0.011, mseg=22, nseg=8)
o  = add_obj("BunRing", me, col_avatar,
             loc=(0, -0.055, 1.668), rot=(0.24, 0, 0)); assign(o, M_hair)

# Face-framing tendrils (front-sides of face)
tendril_data = [
    (-0.060,  0.065, 1.545, 0.08, 0.08, -0.18),
    ( 0.060,  0.065, 1.545, 0.08, 0.08,  0.18),
    (-0.044,  0.082, 1.580, 0.055, 0.14, -0.26),
    ( 0.044,  0.082, 1.580, 0.055, 0.14,  0.26),
]
for i, (tx, ty, tz, tlen, rx, rz) in enumerate(tendril_data):
    me = cone(f"Tendril_{i}", 0.0032, 0.0009, tlen, seg=8)
    o  = add_obj(f"Tendril_{i}", me, col_avatar,
                 loc=(tx, ty, tz), rot=(rx, 0, rz)); assign(o, M_hair)

# ── 5d. NECK & BODY ─────────────────────────────────────────
me = cone("Neck", 0.032, 0.042, 0.115, seg=20)
o  = add_obj("Neck", me, col_avatar, loc=(0, 0.010, 1.408)); assign(o, M_skin)

# Chest/clavicle base
me = sphere("Chest_Base", 0.072, 20, 14, sx=1.88, sy=0.72, sz=0.88)
o  = add_obj("Chest_Base", me, col_avatar, loc=(0, 0.006, 1.328)); assign(o, M_skin)

# Arms (left & right)
for sx, nm in [(-1,"L"),(1,"R")]:
    me = sphere(f"Shoulder_{nm}", 0.038, 16, 12, sy=0.85)
    o  = add_obj(f"Shoulder_{nm}", me, col_avatar,
                 loc=(sx*0.148, 0.006, 1.330)); assign(o, M_skin)

    me = cone(f"UpperArm_{nm}", 0.025, 0.032, 0.225, seg=16)
    o  = add_obj(f"UpperArm_{nm}", me, col_avatar,
                 loc=(sx*0.170, 0.005, 1.198),
                 rot=(0.05, -sx*0.08, 0)); assign(o, M_skin)

    me = cone(f"Forearm_{nm}", 0.019, 0.024, 0.220, seg=16)
    o  = add_obj(f"Forearm_{nm}", me, col_avatar,
                 loc=(sx*0.190, 0.014, 0.978),
                 rot=(0.10, -sx*0.06, 0)); assign(o, M_skin)

    me = sphere(f"Hand_{nm}", 0.027, 14, 10, sx=0.52, sy=0.85, sz=1.42)
    o  = add_obj(f"Hand_{nm}", me, col_avatar,
                 loc=(sx*0.200, 0.020, 0.832),
                 rot=(0.12, -sx*0.05, sx*0.14)); assign(o, M_skin)

# Midriff (bare strip between crop top & trousers)
me = cone("Midriff", 0.105, 0.098, 0.096, seg=24, sy=0.72)
o  = add_obj("Midriff", me, col_avatar, loc=(0, 0.004, 1.128)); assign(o, M_skin)

# ── 5e. OUTFIT ───────────────────────────────────────────────
# Ribbed crop top — high crew collar
me = cone("Top_Collar", 0.044, 0.044, 0.036, seg=24)
o  = add_obj("Top_Collar", me, col_avatar, loc=(0, 0.010, 1.368)); assign(o, M_top)

# Top body
me = cone("Top_Body", 0.102, 0.115, 0.200, seg=32, sy=0.76)
o  = add_obj("Top_Body", me, col_avatar, loc=(0, 0.006, 1.248)); assign(o, M_top); subsurf(o)

# Wide-leg trousers — waistband, hips, legs
me = cone("Pants_Waistband", 0.122, 0.122, 0.052, seg=32, sy=0.74)
o  = add_obj("Pants_Waistband", me, col_avatar, loc=(0, 0.004, 1.072)); assign(o, M_pants)

me = cone("Pants_Hips", 0.140, 0.124, 0.155, seg=32, sy=0.76)
o  = add_obj("Pants_Hips", me, col_avatar, loc=(0, 0.004, 0.978)); assign(o, M_pants)

for sx, nm in [(-1,"L"),(1,"R")]:
    me = cone(f"Leg_{nm}", 0.115, 0.085, 0.840, seg=28, sy=0.86)
    o  = add_obj(f"Leg_{nm}", me, col_avatar,
                 loc=(sx*0.090, 0.006, 0.488)); assign(o, M_pants); subsurf(o)

# ── 5f. CHUNKY WHITE PLATFORM SNEAKERS ───────────────────────
for sx, nm in [(-1,"L"),(1,"R")]:
    # Sole slab
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=24,
                          radius1=0.048, radius2=0.042, depth=0.042)
    for v in bm.verts:
        v.co.x *= 0.56; v.co.y *= 2.20
    me_sole = bpy.data.meshes.new(f"Sole_{nm}")
    bm.to_mesh(me_sole); bm.free()
    o = add_obj(f"Sole_{nm}", me_sole, col_avatar,
                loc=(sx*0.090, 0.018, 0.021)); assign(o, M_shoe_sol)

    # Upper
    me = sphere(f"Upper_{nm}", 0.046, 16, 12, sx=0.88, sy=1.78, sz=0.70)
    o  = add_obj(f"Upper_{nm}", me, col_avatar,
                 loc=(sx*0.090, 0.018, 0.052)); assign(o, M_shoe_up)

# ─────────────────────────────────────────────────────────────
# 6. ENVIRONMENT (woven rug + floor)
# ─────────────────────────────────────────────────────────────
me = disc("Rug", 0.88)
o  = add_obj("Rug", me, col_env, loc=(0, 0, 0.009)); assign(o, M_rug)

me = flat_quad("Floor", 8.0)
o  = add_obj("Floor", me, col_env, loc=(0, 0, 0)); assign(o, M_floor)

# ─────────────────────────────────────────────────────────────
# 7. LIGHTING RIG
# ─────────────────────────────────────────────────────────────
# Key — warm diagonal sunbeam from top-right
kd = bpy.data.lights.new("Key", 'SUN')
kd.energy = 4.0; kd.color = (1.0, 0.94, 0.86); kd.angle = math.radians(3.5)
ko = bpy.data.objects.new("Key", kd); col_lights.objects.link(ko)
ko.location = (2.2, -3.0, 4.0)
ko.rotation_euler = (math.radians(48), math.radians(18), math.radians(-38))

# Fill — large soft area from front-left
fd = bpy.data.lights.new("Fill", 'AREA')
fd.energy = 95.0; fd.color = (0.96, 0.95, 0.99); fd.size = 1.8
fo = bpy.data.objects.new("Fill", fd); col_lights.objects.link(fo)
fo.location = (-2.0, -2.2, 1.8)
fo.rotation_euler = (math.radians(62), math.radians(-12), math.radians(40))

# Rim — warm hair kicker from rear
rd = bpy.data.lights.new("Rim", 'SPOT')
rd.energy = 180.0; rd.color = (1.0, 0.90, 0.78)
rd.spot_size = math.radians(55); rd.spot_blend = 0.35
ro = bpy.data.objects.new("Rim", rd); col_lights.objects.link(ro)
ro.location = (0.4, 1.8, 2.6)
ro.rotation_euler = (math.radians(-145), math.radians(8), 0)

# Face beauty light (small point in front)
bd = bpy.data.lights.new("Beauty", 'POINT')
bd.energy = 22.0; bd.color = (1.0, 0.96, 0.92); bd.shadow_soft_size = 0.2
bo = bpy.data.objects.new("Beauty", bd); col_lights.objects.link(bo)
bo.location = (0, -1.4, 1.60)

# ─────────────────────────────────────────────────────────────
# 8. CAMERAS
#    All cameras look from NEGATIVE Y toward +Y (face direction)
# ─────────────────────────────────────────────────────────────
def add_cam(name, lens, loc, rot_deg):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    co = bpy.data.objects.new(name, cd)
    col_cams.objects.link(co)
    co.location = loc
    co.rotation_euler = tuple(math.radians(d) for d in rot_deg)
    return co

# Full body — front-facing, slightly below eye level
cam_front  = add_cam("Cam_Front",   55,  (0, -3.10, 1.00), (90, 0, 0))
# Portrait — face close-up
cam_face   = add_cam("Cam_Face",    85,  (0, -1.80, 1.54), (90, 0, 0))
# 3/4 angle fashion shot
cam_angle  = add_cam("Cam_Angle",   65, (-1.35, -2.60, 1.20), (85, 0, -27))

# ─────────────────────────────────────────────────────────────
# 9. RENDER
# ─────────────────────────────────────────────────────────────
out_dir = r"s:\Fashion_App"
for cam, fname in [
    (cam_front, "seren_avatar_front.png"),
    (cam_face,  "seren_avatar_portrait.png"),
    (cam_angle, "seren_avatar_angle.png"),
]:
    scene.camera = cam
    scene.render.filepath = os.path.join(out_dir, fname)
    print(f"Rendering {fname} ...")
    bpy.ops.render.render(write_still=True)
    print(f"Saved: {fname}")

# ─────────────────────────────────────────────────────────────
# 10. SAVE & EXPORT
# ─────────────────────────────────────────────────────────────
blend_path = os.path.join(out_dir, "seren_avatar.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print(f"Blend saved: {blend_path}")

bpy.ops.object.select_all(action='DESELECT')
for obj in col_avatar.objects:
    obj.select_set(True)
# also select rug
for obj in col_env.objects:
    obj.select_set(True)

glb_path = os.path.join(out_dir, "seren_avatar.glb")
bpy.ops.export_scene.gltf(
    filepath=glb_path,
    use_selection=True,
    export_format='GLB',
    export_materials='EXPORT',
    export_apply=True,
    export_yup=True
)
print(f"GLB exported: {glb_path}")
print("=" * 60)
print("SEREN STUDIO AVATAR STEP 4 — COMPLETE")
print("=" * 60)
