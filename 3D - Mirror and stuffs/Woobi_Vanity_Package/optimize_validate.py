import bpy,os,json
from mathutils import Vector
P=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=P+'/woobi_vanity.blend')
# Retain fully separated editable Blender source; consolidate tiny parts only in GLB.
for parentname in ['Flower_Vase','Brush_Set']:
 parent=bpy.data.objects[parentname];groups={}
 for o in list(parent.children):
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for key,objects in groups.items():
  if len(objects)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=parentname+'_'+key.split(' ')[0]
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.collections['Vanity_Set'].objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=P+'/woobi_vanity.glb',export_format='GLB',use_selection=True,export_apply=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=P+'/woobi_vanity.glb')
required=['Vanity_Set','Mirror_Frame','Mirror_Surface','Vanity_Table','Vanity_Top','Vanity_Legs','Bench','Bench_Seat','Bench_Base','VanityAccessories','Perfume_Set','Brush_Set','Cosmetic_Set','Flower_Vase']
assert all(n in bpy.data.objects for n in required)
assert not any(o.type in {'LIGHT','CAMERA'} for o in bpy.data.objects)
points=[];tris=0;meshcount=0
for o in bpy.data.objects:
 if o.type=='MESH':
  meshcount+=1;o.data.calc_loop_triangles();tris+=len(o.data.loop_triangles);points.extend([o.matrix_world@Vector(v) for v in o.bound_box])
report={'glb_import':'PASS','required_hierarchy':'PASS','staging_excluded':'PASS','mesh_objects':meshcount,'triangles':tris,'bounds_min_m':[min(v[i] for v in points) for i in range(3)],'bounds_max_m':[max(v[i] for v in points) for i in range(3)],'images':[i.name for i in bpy.data.images]}
json.dump(report,open(P+'/glb_validation.json','w'),indent=2);print(report)
