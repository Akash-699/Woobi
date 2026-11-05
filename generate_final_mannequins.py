import bpy
import bmesh
import mathutils
import math
from pathlib import Path

def generate_mannequins_with_underwear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.open_mainfile(filepath=r"C:\Users\suriy\Downloads\Untitled.blend")

    # Clean up cameras and lights
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            bpy.data.objects.remove(o, do_unlink=True)

    female_body = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    female_body.name = "Woobi_Female_Mannequin_Body"
    female_body.data.name = "Torso_Mesh"

    for poly in female_body.data.polygons:
        poly.use_smooth = True

    # 1. Normalize female body to 1.75m runway height, centered at X=0, Y=0, grounded at Z=0
    matrix = female_body.matrix_world
    verts = [matrix @ v.co for v in female_body.data.vertices]
    min_x, max_x = min(v.x for v in verts), max(v.x for v in verts)
    min_y, max_y = min(v.y for v in verts), max(v.y for v in verts)
    min_z, max_z = min(v.z for v in verts), max(v.z for v in verts)

    scale_factor = 1.75 / (max_z - min_z)
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0

    for v in female_body.data.vertices:
        co = matrix @ v.co
        v.co.x = (co.x - center_x) * scale_factor
        v.co.y = (co.y - center_y) * scale_factor
        v.co.z = (co.z - min_z) * scale_factor

    female_body.matrix_world = mathutils.Matrix.Identity(4)
    female_body.data.update()

    # Materials
    skin_mat = bpy.data.materials.new(name="Woobi_Warm_Ivory")
    skin_mat.use_nodes = True
    skin_bsdf = skin_mat.node_tree.nodes.get("Principled BSDF")
    skin_bsdf.inputs['Base Color'].default_value = (0.92, 0.89, 0.85, 1.0)
    skin_bsdf.inputs['Roughness'].default_value = 0.38
    skin_bsdf.inputs['Metallic'].default_value = 0.0

    female_body.data.materials.clear()
    female_body.data.materials.append(skin_mat)

    # Refined neutral dark charcoal fabric material
    fabric_mat = bpy.data.materials.new(name="Woobi_Underwear_Fabric")
    fabric_mat.use_nodes = True
    bsdf = fabric_mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs['Base Color'].default_value = (0.13, 0.135, 0.145, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.78
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.35
    elif 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = 0.35

    # =========================================================================
    # FEMALE UNDERWEAR
    # =========================================================================
    # 1. Full-Coverage Briefs
    bm_b = bmesh.new()
    bm_b.from_mesh(female_body.data)

    # Waistband cut at Z = 1.025 with slight back tilt
    bmesh.ops.bisect_plane(
        bm_b,
        geom=bm_b.verts[:] + bm_b.edges[:] + bm_b.faces[:],
        plane_co=(0, 0, 1.022),
        plane_no=(0, -0.06, 0.99),
        clear_outer=True
    )

    # Front leg cutouts (y <= 0.015)
    front_g1 = [v for v in bm_b.verts if v.co.y <= 0.015] + \
               [e for e in bm_b.edges if all(v.co.y <= 0.015 for v in e.verts)] + \
               [f for f in bm_b.faces if all(v.co.y <= 0.015 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm_b,
        geom=front_g1,
        plane_co=(0.040, -0.04, 0.765),
        plane_no=(-0.60, -0.15, -0.78),
        clear_outer=True
    )
    front_g2 = [v for v in bm_b.verts if v.co.y <= 0.015] + \
               [e for e in bm_b.edges if all(v.co.y <= 0.015 for v in e.verts)] + \
               [f for f in bm_b.faces if all(v.co.y <= 0.015 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm_b,
        geom=front_g2,
        plane_co=(-0.040, -0.04, 0.765),
        plane_no=(0.60, -0.15, -0.78),
        clear_outer=True
    )

    # Back gluteal cheek cutouts (y >= -0.005)
    back_g1 = [v for v in bm_b.verts if v.co.y >= -0.005] + \
              [e for e in bm_b.edges if all(v.co.y >= -0.005 for v in e.verts)] + \
              [f for f in bm_b.faces if all(v.co.y >= -0.005 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm_b,
        geom=back_g1,
        plane_co=(0.060, 0.06, 0.775),
        plane_no=(-0.45, 0.25, -0.86),
        clear_outer=True
    )
    back_g2 = [v for v in bm_b.verts if v.co.y >= -0.005] + \
              [e for e in bm_b.edges if all(v.co.y >= -0.005 for v in e.verts)] + \
              [f for f in bm_b.faces if all(v.co.y >= -0.005 for v in f.verts)]
    bmesh.ops.bisect_plane(
        bm_b,
        geom=back_g2,
        plane_co=(-0.060, 0.06, 0.775),
        plane_no=(0.45, 0.25, -0.86),
        clear_outer=True
    )

    # Clean hip/wrist boundary (|x| > 0.158 across briefs height)
    del_hand = [v for v in bm_b.verts if abs(v.co.x) > 0.158]
    bmesh.ops.delete(bm_b, geom=del_hand, context='VERTS')

    # Connected component from pelvis seed
    pelvis_verts = [v for v in bm_b.verts if abs(v.co.x) < 0.02 and v.co.y < -0.05 and 0.90 < v.co.z < 1.00]
    seed = pelvis_verts[0]
    conn = set([seed])
    q = [seed]
    while q:
        curr = q.pop(0)
        for edge in curr.link_edges:
            other = edge.other_vert(curr)
            if other not in conn:
                conn.add(other)
                q.append(other)
    unconn = [v for v in bm_b.verts if v not in conn]
    bmesh.ops.delete(bm_b, geom=unconn, context='VERTS')

    # Smooth boundary edge loops for natural fabric hem
    b_verts = [v for v in bm_b.verts if v.is_boundary]
    for _ in range(6):
        bmesh.ops.smooth_vert(bm_b, verts=b_verts, factor=0.5)

    briefs_mesh = bpy.data.meshes.new("Woobi_Female_Briefs_Mesh")
    bm_b.to_mesh(briefs_mesh)
    bm_b.free()

    female_briefs = bpy.data.objects.new("Woobi_Female_Briefs", briefs_mesh)
    bpy.context.scene.collection.objects.link(female_briefs)
    female_briefs.data.materials.append(fabric_mat)
    for p in female_briefs.data.polygons:
        p.use_smooth = True

    mod_fb = female_briefs.modifiers.new(name="Fabric_Thickness", type='SOLIDIFY')
    mod_fb.thickness = 0.0020
    mod_fb.offset = 1.0
    mod_fb.use_rim = True
    mod_fb.use_quality_normals = True

    # 2. Matching Bra
    bm_bra = bmesh.new()
    bm_bra.from_mesh(female_body.data)

    # Underbust cut at Z = 1.135
    bmesh.ops.bisect_plane(
        bm_bra,
        geom=bm_bra.verts[:] + bm_bra.edges[:] + bm_bra.faces[:],
        plane_co=(0, 0, 1.135),
        plane_no=(0, 0, -1),
        clear_outer=True
    )
    # Shoulder apex cut at Z = 1.455
    bmesh.ops.bisect_plane(
        bm_bra,
        geom=bm_bra.verts[:] + bm_bra.edges[:] + bm_bra.faces[:],
        plane_co=(0, 0, 1.455),
        plane_no=(0, 0, 1),
        clear_outer=True
    )

    # Back band cut (z > 1.235 in back, except straps)
    del_back = [v for v in bm_bra.verts if v.co.y >= -0.005 and v.co.z > 1.235 and not (0.070 <= abs(v.co.x) <= 0.106)]
    bmesh.ops.delete(bm_bra, geom=del_back, context='VERTS')

    # Front neckline:
    del_front = []
    for v in bm_bra.verts:
        if v.co.y < -0.005:
            x = abs(v.co.x)
            z = v.co.z
            # Cleavage bridge dip
            if x < 0.045:
                neck_h = 1.220 + 0.080 * (x / 0.045) ** 1.8
                if z > neck_h:
                    del_front.append(v)
            # Above full cups
            elif x < 0.070:
                if z > 1.300:
                    del_front.append(v)
            # Outer underarm slope
            elif x > 0.106:
                outer_h = 1.295 - 0.075 * min(1.0, (x - 0.106) / 0.035)
                if z > outer_h:
                    del_front.append(v)
            # Above straps
            if z > 1.305 and not (0.070 <= x <= 0.106):
                del_front.append(v)

    bmesh.ops.delete(bm_bra, geom=list(set(del_front)), context='VERTS')

    # Clean ribcage underarm boundary (|x| > 0.136 at z < 1.30)
    del_arm = [v for v in bm_bra.verts if abs(v.co.x) > 0.136 and v.co.z < 1.30]
    bmesh.ops.delete(bm_bra, geom=del_arm, context='VERTS')

    # Connected component from sternum bridge
    bridge_verts = [v for v in bm_bra.verts if abs(v.co.x) < 0.015 and v.co.y < -0.05 and 1.14 < v.co.z < 1.20]
    seed = bridge_verts[0]
    conn = set([seed])
    q = [seed]
    while q:
        curr = q.pop(0)
        for edge in curr.link_edges:
            other = edge.other_vert(curr)
            if other not in conn:
                conn.add(other)
                q.append(other)
    unconn = [v for v in bm_bra.verts if v not in conn]
    bmesh.ops.delete(bm_bra, geom=unconn, context='VERTS')

    # Smooth neckline and strap boundaries
    bra_b_verts = [v for v in bm_bra.verts if v.is_boundary and v.co.z > 1.140]
    for _ in range(8):
        bmesh.ops.smooth_vert(bm_bra, verts=bra_b_verts, factor=0.55)

    bra_mesh = bpy.data.meshes.new("Woobi_Female_Bra_Mesh")
    bm_bra.to_mesh(bra_mesh)
    bm_bra.free()

    female_bra = bpy.data.objects.new("Woobi_Female_Brassiere", bra_mesh)
    bpy.context.scene.collection.objects.link(female_bra)
    female_bra.data.materials.append(fabric_mat)
    for p in female_bra.data.polygons:
        p.use_smooth = True

    # Subsurf level 1 on bra for silk-smooth cloth boundary
    mod_sub = female_bra.modifiers.new(name="Cloth_Subsurf", type='SUBSURF')
    mod_sub.levels = 1
    mod_sub.render_levels = 1

    mod_fbra = female_bra.modifiers.new(name="Fabric_Thickness", type='SOLIDIFY')
    mod_fbra.thickness = 0.0020
    mod_fbra.offset = 1.0
    mod_fbra.use_rim = True
    mod_fbra.use_quality_normals = True

    # Parent female underwear to female body
    female_briefs.parent = female_body
    female_bra.parent = female_body

    print("Female mannequin and underwear successfully built!")

    # =========================================================================
    # MALE MANNEQUIN & BOXER BRIEFS
    # =========================================================================
    male_body = female_body.copy()
    male_body.data = female_body.data.copy()
    bpy.context.scene.collection.objects.link(male_body)
    male_body.name = "Woobi_Male_Mannequin_Body"
    male_body.data.name = "Torso_Mesh"

    male_scale_z = 1.82 / 1.75
    for v in male_body.data.vertices:
        z = v.co.z * male_scale_z
        v.co.z = z
        # Athletic male shoulders & chest taper
        if 1.10 <= z <= 1.55:
            shoulder_factor = 1.0 + 0.08 * ((z - 1.10) / 0.45)
            v.co.x *= shoulder_factor
            if 1.12 <= z <= 1.40 and v.co.y < 0.0:
                if v.co.y < -0.045:
                    excess = v.co.y - (-0.045)
                    v.co.y = -0.045 + excess * 0.22
        # Straight athletic hips
        elif 0.70 <= z <= 1.05:
            hip_factor = 1.0 - 0.06 * (1.0 - abs(z - 0.88) / 0.22)
            v.co.x *= hip_factor

    male_body.data.update()
    min_z_male = min(v.co.z for v in male_body.data.vertices)
    for v in male_body.data.vertices:
        v.co.z -= min_z_male
    male_body.data.update()

    # Build Male Boxer Briefs
    bm_mb = bmesh.new()
    bm_mb.from_mesh(male_body.data)

    # Waistband cut at Z = 1.050 with subtle back tilt for full sacrum coverage
    bmesh.ops.bisect_plane(
        bm_mb,
        geom=bm_mb.verts[:] + bm_mb.edges[:] + bm_mb.faces[:],
        plane_co=(0, 0, 1.050),
        plane_no=(0, -0.06, 0.99),
        clear_outer=True
    )
    # Leg hem cut at mid-thigh Z = 0.725
    bmesh.ops.bisect_plane(
        bm_mb,
        geom=bm_mb.verts[:] + bm_mb.edges[:] + bm_mb.faces[:],
        plane_co=(0, 0, 0.725),
        plane_no=(0, 0, -1),
        clear_outer=True
    )

    # Delete any vertices on hands/wrists (|x| > 0.165 across this height)
    del_male_hands = [v for v in bm_mb.verts if abs(v.co.x) > 0.165]
    bmesh.ops.delete(bm_mb, geom=del_male_hands, context='VERTS')

    # Connected component from pelvis
    pelvis_m = [v for v in bm_mb.verts if abs(v.co.x) < 0.02 and v.co.y < -0.05 and 0.90 < v.co.z < 1.00]
    seed_m = pelvis_m[0]
    conn_m = set([seed_m])
    q_m = [seed_m]
    while q_m:
        curr = q_m.pop(0)
        for edge in curr.link_edges:
            other = edge.other_vert(curr)
            if other not in conn_m:
                conn_m.add(other)
                q_m.append(other)
    unconn_m = [v for v in bm_mb.verts if v not in conn_m]
    bmesh.ops.delete(bm_mb, geom=unconn_m, context='VERTS')

    boxer_mesh = bpy.data.meshes.new("Woobi_Male_BoxerBriefs_Mesh")
    bm_mb.to_mesh(boxer_mesh)
    bm_mb.free()

    male_boxers = bpy.data.objects.new("Woobi_Male_Underwear", boxer_mesh)
    bpy.context.scene.collection.objects.link(male_boxers)
    male_boxers.data.materials.append(fabric_mat)
    for p in male_boxers.data.polygons:
        p.use_smooth = True

    mod_mb = male_boxers.modifiers.new(name="Fabric_Thickness", type='SOLIDIFY')
    mod_mb.thickness = 0.0022
    mod_mb.offset = 1.0
    mod_mb.use_rim = True
    mod_mb.use_quality_normals = True

    male_boxers.parent = male_body

    print("Male mannequin and boxer briefs successfully built!")

    # =========================================================================
    # EXPORT GLB FILES
    # =========================================================================
    # Female export: select female_body, female_briefs, female_bra
    bpy.ops.object.select_all(action='DESELECT')
    female_body.select_set(True)
    female_briefs.select_set(True)
    female_bra.select_set(True)
    bpy.context.view_layer.objects.active = female_body

    female_export_paths = [
        r"s:\Fashion_App\Woobi_Female_Mannequin_Fixed.glb",
        r"s:\Fashion_App\woobi_female_mannequin.glb",
        r"s:\Fashion_App\seren_avatar.glb",
        r"s:\Fashion_App\3D - Mannequin By Astra\Woobi_Female_Mannequin.glb",
        r"s:\Fashion_App\3D - Mannequin By Astra\female\Woobi_Female_Mannequin.glb",
    ]

    for p in female_export_paths:
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=p,
            export_format='GLB',
            use_selection=True,
            export_apply=True,
            export_yup=True
        )
        print(f"Exported Female GLB to {p}")

    # Male export: select male_body, male_boxers
    bpy.ops.object.select_all(action='DESELECT')
    male_body.select_set(True)
    male_boxers.select_set(True)
    bpy.context.view_layer.objects.active = male_body

    male_export_paths = [
        r"s:\Fashion_App\woobi_male_mannequin.glb",
        r"s:\Fashion_App\3D - Mannequin By Astra\Woobi_Male_Mannequin.glb",
        r"s:\Fashion_App\3D - Mannequin By Astra\male\Woobi_Male_Mannequin.glb",
    ]

    for p in male_export_paths:
        Path(p).parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=p,
            export_format='GLB',
            use_selection=True,
            export_apply=True,
            export_yup=True
        )
        print(f"Exported Male GLB to {p}")

    # =========================================================================
    # RENDER PORTFOLIO PREVIEW IMAGES
    # =========================================================================
    light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
    light_data.energy = 4.0
    light_obj = bpy.data.objects.new(name="KeyLight", object_data=light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), math.radians(25), math.radians(45))

    fill_data = bpy.data.lights.new(name="FillLight", type='SUN')
    fill_data.energy = 2.0
    fill_obj = bpy.data.objects.new(name="FillLight", object_data=fill_data)
    bpy.context.scene.collection.objects.link(fill_obj)
    fill_obj.rotation_euler = (math.radians(30), math.radians(-30), math.radians(-135))

    cam_data = bpy.data.cameras.new(name="Cam")
    cam_data.lens = 65
    cam_obj = bpy.data.objects.new(name="Cam", object_data=cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    bpy.context.scene.render.resolution_x = 800
    bpy.context.scene.render.resolution_y = 1000

    # 1. Female Front
    male_body.hide_render = True
    male_boxers.hide_render = True
    female_body.hide_render = False
    female_briefs.hide_render = False
    female_bra.hide_render = False

    cam_obj.location = (0, -2.8, 1.05)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.render.filepath = r"s:\Fashion_App\3D - Mannequin By Astra\previews\female_front.png"
    bpy.ops.render.render(write_still=True)

    # 2. Female 3/4 Perspective
    cam_obj.location = (-1.8, -2.2, 1.15)
    cam_obj.rotation_euler = (math.radians(82), 0, math.radians(-40))
    bpy.context.scene.render.filepath = r"s:\Fashion_App\3D - Mannequin By Astra\previews\female_three_quarter.png"
    bpy.ops.render.render(write_still=True)

    # 3. Female Back
    cam_obj.location = (0, 2.8, 1.05)
    cam_obj.rotation_euler = (math.radians(90), 0, math.radians(180))
    bpy.context.scene.render.filepath = r"s:\Fashion_App\3D - Mannequin By Astra\previews\female_side.png"
    bpy.ops.render.render(write_still=True)

    # 4. Male Front
    female_body.hide_render = True
    female_briefs.hide_render = True
    female_bra.hide_render = True
    male_body.hide_render = False
    male_boxers.hide_render = False

    cam_obj.location = (0, -2.8, 1.05)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.render.filepath = r"s:\Fashion_App\3D - Mannequin By Astra\previews\male_front.png"
    bpy.ops.render.render(write_still=True)

    # 5. Male 3/4 Perspective
    cam_obj.location = (-1.8, -2.2, 1.15)
    cam_obj.rotation_euler = (math.radians(82), 0, math.radians(-40))
    bpy.context.scene.render.filepath = r"s:\Fashion_App\3D - Mannequin By Astra\previews\male_three_quarter.png"
    bpy.ops.render.render(write_still=True)

    # 6. Male Back
    cam_obj.location = (0, 2.8, 1.05)
    cam_obj.rotation_euler = (math.radians(90), 0, math.radians(180))
    bpy.context.scene.render.filepath = r"s:\Fashion_App\3D - Mannequin By Astra\previews\male_side.png"
    bpy.ops.render.render(write_still=True)

    print("ALL MANNEQUINS, UNDERWEAR GARMENTS, GLBS, AND PREVIEWS SUCCESSFULLY GENERATED!")

generate_mannequins_with_underwear()
