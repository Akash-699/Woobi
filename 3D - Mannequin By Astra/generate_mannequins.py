"""Run: blender --background --python generate_mannequins.py -- --output ./assets/mannequins
Procedural mannequin foundation; requires Blender 4.2+ with glTF exporter.
No third-party Python dependencies. No existing scene or application is overwritten.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector


def arguments():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument('--output', default=str(Path(__file__).resolve().parent / 'assets/mannequins'))
    p.add_argument('--samples', type=int, default=48)
    p.add_argument('--resolution', type=int, default=1000)
    p.add_argument('--overwrite', action='store_true')
    return p.parse_args(args)


def activate(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def ellipsoid(name, center, radii):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=24, location=center)
    ob = bpy.context.object
    ob.name = name
    ob.scale = radii
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob


def loft(name, rows, sides=40):
    # Each row is (cx, cy, z, x-radius, y-radius). Closed cross-section loft.
    vertices = []
    for x, y, z, rx, ry in rows:
        vertices.extend((x + rx*math.cos(2*math.pi*i/sides),
                         y + ry*math.sin(2*math.pi*i/sides), z) for i in range(sides))
    faces = []
    for j in range(len(rows)-1):
        for i in range(sides):
            a=j*sides+i; b=j*sides+(i+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))), tuple((len(rows)-1)*sides+i for i in range(sides))])
    me=bpy.data.meshes.new(name+'_Mesh'); me.from_pydata(vertices, [], faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    activate(ob)
    sub=ob.modifiers.new("Construction_Smoothing","SUBSURF"); sub.levels=2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    return ob


def create_body(sex):
    female = sex == 'Female'
    parts=[]
    # Normalized stature; Z-up, forward -Y. Sculpted, understated adult proportions.
    torso = ([(.49,.092,.070),(.53,.111,.080),(.57,.110,.074),(.61,.086,.062),
              (.65,.079,.064),(.69,.089,.076),(.73,.103,.079),(.77,.103,.069),(.80,.096,.052)]
             if female else
             [(.49,.088,.071),(.53,.100,.079),(.57,.097,.071),(.61,.089,.066),
              (.65,.097,.074),(.69,.112,.083),(.73,.123,.087),(.77,.127,.076),(.80,.116,.055)])
    torso += [(.815,.080,.044),(.838,.039,.034)]
    parts.append(loft('Torso',[(0,0,z,rx,ry) for z,rx,ry in torso]))
    parts.append(ellipsoid('Pelvis',(0,.006,.514),(.108 if female else .098,.077,.072)))
    parts.append(loft('Neck',[(0,.004,.78,.049,.042),(0,.006,.825,.035,.033),
                              (0,.002,.865,.034,.033),(0,0,.885,.039,.039)]))
    parts.append(loft('Featureless_Head',[(0,-.007,.852,.018,.025),(0,-.009,.865,.030,.036),
        (0,-.008,.891,.043,.046),(0,-.003,.925,.049,.052),(0,.002,.956,.046,.049),
        (0,.004,.979,.035,.038),(0,.004,.994,.017,.019),(0,.004,1,.001,.001)]))
    for sign, side in [(-1,'R'),(1,'L')]:
        hip=.060 if female else .055
        leg=[(.035,.023,.028),(.065,.029,.032),(.12,.030,.032),(.18,.037,.042),(.25,.046,.050),
             (.30,.044,.045),(.33,.037,.040),(.36,.042,.045),(.42,.056,.061),
             (.48,.065 if female else .059,.069),(.53,.060,.064),(.56,.038,.043),(.575,.010,.015)]
        parts.append(loft('Leg_'+side,[(sign*(hip+.012*(1-z/.53)),.004,z,rx,ry) for z,rx,ry in leg]))
        parts.append(ellipsoid('Heel_'+side,(sign*(hip+.010),.008,.045),(.033,.041,.040)))
        parts.append(ellipsoid('Foot_'+side,(sign*(hip+.010),-.040,.031),(.035,.080,.031)))
        shoulder=.103 if female else .121
        # Shoulder is blended into the upper-arm loft, without a separate joint bulge.
        # Quiet A-pose; hands clear the hips. Soft changes around elbow and wrist.
        arm=[(.823,shoulder-.030,.010,.014),(.804,shoulder-.010,.033,.036),(.778,shoulder,.044,.044),(.745,shoulder+.025,.041,.042),
             (.700,shoulder+.041,.034,.036),(.656,shoulder+.055,.028,.030),
             (.625,shoulder+.064,.025,.026),(.595,shoulder+.075,.029,.029),
             (.556,shoulder+.087,.025,.025),(.515,shoulder+.097,.018,.020),
             (.496,shoulder+.101,.017,.018)]
        parts.append(loft('Arm_'+side,[(sign*x,0,z,rx,ry) for z,x,rx,ry in reversed(arm)]))
        palmx=shoulder+.106
        parts.append(ellipsoid('Palm_'+side,(sign*palmx,-.002,.473),(.024,.014,.034)))
        # Distinct tapered fingers, no nails or skin details. Thumb points inward.
        for i, length in enumerate([.036,.044,.047,.040]):
            x=palmx+(i-1.5)*.012
            top=.456
            r=.0060 if i in (0,3) else .0067
            parts.append(loft('Finger_%s_%s'%(side,i),[
                (sign*(x+.003),-.002,top-length,.0018,.002),
                (sign*(x+.002),-.003,top-length+.006,r*.85,r*.85),
                (sign*x,-.003,top-.010,r,r),
                (sign*x,-.002,top+.011,r*1.12,r*1.12)],16))
        parts.append(loft('Thumb_'+side,[
            (sign*(palmx-.039),-.007,.450,.003,.004),
            (sign*(palmx-.036),-.008,.460,.007,.007),
            (sign*(palmx-.028),-.007,.477,.010,.010),
            (sign*(palmx-.014),-.003,.486,.013,.012)],20))
    # Preserve editable construction shapes in a hidden collection; exported body is separate.
    source=bpy.data.collections.new('Construction_Source_NOT_EXPORTED')
    bpy.context.scene.collection.children.link(source)
    for ob in parts:
        copy=ob.copy(); copy.data=ob.data.copy(); source.objects.link(copy)
    source.hide_render=True; source.hide_viewport=True
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts: ob.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    bpy.ops.object.join(); body=bpy.context.object
    body.name='Woobi_'+sex+'_Mannequin_Body'
    bpy.context.scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    mod=body.modifiers.new('Union_Sculpt','REMESH'); mod.mode='VOXEL'; mod.voxel_size=.0024
    mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    smooth=body.modifiers.new('Surface_Relax','SMOOTH'); smooth.factor=.65; smooth.iterations=15
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    # A single joined manifold surface. Decimation is intentionally documented as triangle topology.
    body.data.calc_loop_triangles(); count=len(body.data.loop_triangles)
    if count>26000:
        dec=body.modifiers.new('Realtime_Budget','DECIMATE'); dec.ratio=26000/count
        bpy.ops.object.modifier_apply(modifier=dec.name)
    bm=bmesh.new(); bm.from_mesh(body.data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(body.data); bm.free()
    height=1.70 if female else 1.80
    low=min(v.co.z for v in body.data.vertices); high=max(v.co.z for v in body.data.vertices)
    factor=height/(high-low)
    for v in body.data.vertices:
        v.co.x*=factor; v.co.y*=factor; v.co.z=(v.co.z-low)*factor
    # Keep construction sources in the same meter coordinate frame.
    for ob in source.objects:
        ob.location*=factor; ob.location.z-=low*factor
        ob.scale*=factor
    for p in body.data.polygons: p.use_smooth=True
    activate(body); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    mat=bpy.data.materials.new('Woobi_Warm_Ivory'); mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(.80,.745,.645,1)
    bs.inputs['Roughness'].default_value=.74; bs.inputs['Metallic'].default_value=0
    body.data.materials.append(mat)
    body['forward_blender']='-Y'; body['forward_gltf']='+Z'; body['height_m']=height
    body['status']='Procedural foundation; artist approval required; unrigged'
    return body,height


def stats(ob):
    ob.data.calc_loop_triangles()
    bm=bmesh.new(); bm.from_mesh(ob.data)
    result={'vertices':len(bm.verts),'faces':len(bm.faces),'triangles':len(ob.data.loop_triangles),
            'non_manifold_edges':sum(not e.is_manifold for e in bm.edges),
            'loose_vertices':sum(not v.link_faces for v in bm.verts),
            'uv_layers':len(ob.data.uv_layers)}
    unseen=set(bm.verts); components=0
    while unseen:
        stack=[unseen.pop()]; components+=1
        while stack:
            v=stack.pop()
            for e in v.link_edges:
                other=e.other_vert(v)
                if other in unseen: unseen.remove(other); stack.append(other)
    result['connected_components']=components
    result['signed_volume_m3']=bm.calc_volume(signed=True); bm.free()
    return result


def aim(ob,target):
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()


def preview_setup(height,args):
    scene=bpy.context.scene
    scene.render.engine='CYCLES'; scene.cycles.samples=args.samples
    scene.cycles.use_denoising=False
    scene.render.resolution_x=args.resolution; scene.render.resolution_y=args.resolution
    scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Neutral_World')
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.32,.32,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    for name,loc,power,size in [('Key',(-2,-3,3.5),420,3),('Fill',(2,-1,2),180,2),('Rim',(0,2,3),300,2)]:
        data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.shape='DISK'; data.size=size
        ob=bpy.data.objects.new(name,data); scene.collection.objects.link(ob); ob.location=loc; aim(ob,(0,0,.9))
    data=bpy.data.cameras.new('Preview_Camera'); cam=bpy.data.objects.new('Preview_Camera',data)
    scene.collection.objects.link(cam); scene.camera=cam; data.type='ORTHO'; data.ortho_scale=height*1.17
    return cam


def build(sex,args,root):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
    body,height=create_body(sex)
    record=stats(body)
    bounds=[body.matrix_world @ Vector(corner) for corner in body.bound_box]
    record['height_m']=max(v.z for v in bounds)-min(v.z for v in bounds)
    record['ground_z']=min(v.z for v in bounds)
    assert abs(record['height_m']-height)<1e-5,record
    assert record['non_manifold_edges']==0,record
    assert record['connected_components']==1,record
    assert record['signed_volume_m3']>0,record
    directory=root/sex.lower(); directory.mkdir(parents=True,exist_ok=True)
    base=directory/('Woobi_'+sex+'_Mannequin')
    activate(body)
    bpy.ops.export_scene.gltf(filepath=str(base.with_suffix('.glb')),export_format='GLB',
        use_selection=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=False)
    # Reimport in a separate scene so the saved source never contains the test duplicate.
    original=scene
    test=bpy.data.scenes.new('GLB_Verification'); bpy.context.window.scene=test
    bpy.ops.import_scene.gltf(filepath=str(base.with_suffix('.glb')))
    meshes=[o for o in test.objects if o.type=='MESH']; assert len(meshes)==1
    imported=meshes[0]; imported_stats=stats(imported)
    corners=[imported.matrix_world@Vector(c) for c in imported.bound_box]
    restored_height=max(v.z for v in corners)-min(v.z for v in corners)
    assert abs(restored_height-height)<1e-4
    assert imported_stats['triangles']==record['triangles']
    assert len(imported.data.materials)==1
    # Imported seams split vertices; manifold checks are meaningful on source mesh only.
    record['glb_roundtrip']={'passed':True,'height_m':restored_height,
        'triangles':imported_stats['triangles'],'materials':len(imported.data.materials)}
    test_objects=list(test.objects)
    bpy.context.window.scene=original
    bpy.data.scenes.remove(test)
    for ob in test_objects:
        if ob.users==0: bpy.data.objects.remove(ob)
    cam=preview_setup(height,args)
    previews=root/'previews'; previews.mkdir(exist_ok=True)
    for label,loc in [('front',(0,-4,height/2)),('side',(4,0,height/2)),('three_quarter',(3,-4,height/2))]:
        cam.location=loc; aim(cam,(0,0,height/2))
        scene.render.filepath=str(previews/(sex.lower()+'_'+label+'.png'))
        bpy.ops.render.render(write_still=True)
    wire=body.copy(); wire.data=body.data.copy(); scene.collection.objects.link(wire)
    wire.name='Temporary_Wire_Overlay'
    dark=bpy.data.materials.new('Wire_Dark'); dark.diffuse_color=(.025,.02,.015,1)
    wire.data.materials.clear(); wire.data.materials.append(dark)
    mod=wire.modifiers.new('Wire','WIREFRAME'); mod.thickness=.00065; mod.offset=1
    scene.render.filepath=str(previews/(sex.lower()+'_wireframe.png'))
    bpy.ops.render.render(write_still=True); bpy.data.objects.remove(wire,do_unlink=True)
    activate(body)
    bpy.ops.wm.save_as_mainfile(filepath=str(base.with_suffix('.blend')))
    record['files']={ext:{'name':base.with_suffix(ext).name,'bytes':base.with_suffix(ext).stat().st_size} for ext in ['.blend','.glb']}
    record['rig']='not implemented'; record['shape_keys']='not implemented'; record['lod']='not implemented'
    record['threejs_runtime']='not tested'; record['visual_approval']='requires human inspection'
    (directory/'validation.json').write_text(json.dumps(record,indent=2))
    print('WOOBI_VALIDATED',sex,json.dumps(record))
    return record


def main():
    args=arguments(); root=Path(args.output).resolve(); root.mkdir(parents=True,exist_ok=True)
    if not args.overwrite:
        for sex in ['Male','Female']:
            for ext in ['blend','glb']:
                if (root/sex.lower()/('Woobi_'+sex+'_Mannequin.'+ext)).exists():
                    raise RuntimeError('Output exists. Choose a new folder or explicitly pass --overwrite.')
    results={}
    # Failure in male validation prevents silently proceeding to female.
    for sex in ['Male','Female']: results[sex]=build(sex,args,root)
    (root/'validation_summary.json').write_text(json.dumps(results,indent=2))

if __name__=='__main__': main()
