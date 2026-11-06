import bpy, math, random, os, json
import numpy as np
from mathutils import Vector
from math import sin,cos,pi
random.seed(22)
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for c in list(bpy.data.collections):
 if c.name!='Collection': bpy.data.collections.remove(c)
asset=bpy.data.collections.get('Collection'); asset.name='Vanity_Set'
stage=bpy.data.collections.new('Presentation_Only'); bpy.context.scene.collection.children.link(stage)
def group(name,parent=None):
 o=bpy.data.objects.new(name,None);asset.objects.link(o);o.parent=parent;return o
root=group('Vanity_Set');table=group('Vanity_Table',root);legs=group('Vanity_Legs',table);bench=group('Bench',root);acc=group('VanityAccessories',root)
def mat(name,color,metal=0,rough=.4,trans=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=1.46;return m
brass=mat('Champagne • satin brushed brass',(.62,.47,.28),.82,.28)
mirror=mat('Mirror • true reflective silver',(.95,.96,.97),1,.018)
ivory=mat('Ivory ceramic',(.82,.76,.64),0,.28)
dark=mat('Warm taupe packaging',(.17,.13,.095),.1,.31)
glass=mat('Clear perfume glass',(.94,.97,.95),0,.08,1)
liquid=mat('Pale amber fragrance',(.66,.42,.18),0,.17,.8)
stemmat=mat('Muted sage stems',(.24,.29,.12),0,.66)
petal=mat('Warm white petals',(.91,.86,.70),0,.57)
center=mat('Flower pollen',(.62,.46,.15),0,.6)
hair=mat('Soft natural brush bristles',(.37,.23,.12),0,.8)
led=mat('Warm diffused LED',(.98,.83,.59),0,.28);p=led.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.73,.39,1);p.inputs['Emission Strength'].default_value=3
fabric=mat('Cream boucle upholstery',(.81,.74,.62),0,.83);p=fabric.node_tree.nodes.get('Principled BSDF');p.inputs['Sheen Weight'].default_value=.25
# Packed UV maps survive glTF export.
def img(name,a):
 h,w=a.shape[:2];i=bpy.data.images.new(name,width=w,height=h);i.pixels.foreach_set(a.astype(np.float32).ravel());i.pack();return i
n=1024;y,x=np.mgrid[0:n,0:n]/n
warp=x*4+y*2+.17*np.sin(y*19+x*7)+.09*np.sin(x*39+y*21)+.025*np.sin(y*117-x*63)
v=np.exp(-np.abs(np.sin(warp*pi)) / .019);v2=np.exp(-np.abs(np.sin((warp*1.9+.23)*pi))/.012)
shade=v*.17+v2*.045
rgba=np.ones((n,n,4));rgba[:,:,:3]=np.array([.91,.885,.84])[None,None,:]-shade[:,:,None]*np.array([.8,.83,.8]);marbleimg=img('Ivory_Marble_BaseColor_1K',rgba)
marble=mat('Ivory marble • fine warm veining',(.9,.88,.83),0,.3)
nt=marble.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=marbleimg;nt.links.new(tex.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
# Fine fabric normal image, packed and shared with the GLB.
z=np.sin(x*2*pi*130+.9*np.sin(y*2*pi*78))*np.sin(y*2*pi*126+.8*np.sin(x*2*pi*91))
gy,gx=np.gradient(z);norm=np.stack([-gx*.55,-gy*.55,np.ones_like(z)],2);norm/=np.linalg.norm(norm,axis=2)[:,:,None];rgba[:,:,:3]=norm*.5+.5
normalimg=img('Boucle_MicroNormal_1K',rgba);normalimg.colorspace_settings.name='Non-Color'
nt=fabric.node_tree;t=nt.nodes.new('ShaderNodeTexImage');t.image=normalimg;nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.65;nt.links.new(t.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],nt.nodes.get('Principled BSDF').inputs['Normal'])
def finish(o,name,m,parent):
 o.name=name;o.data.materials.append(m);o.parent=parent
 for poly in o.data.polygons:poly.use_smooth=True
 return o
def bevel(o,w=.005,segs=3):
 mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=w;mod.segments=segs
 mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');return o
def box(name,loc,size,m,parent,w=.004):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,name,m,parent);bevel(o,w);return o
def lathe(name,loc,profile,m,parent,segments=64):
 verts=[];faces=[]
 for r,z in profile:
  for j in range(segments):a=j*2*pi/segments;verts.append((r*cos(a),r*sin(a),z))
 for i in range(len(profile)-1):
  for j in range(segments):k=i*segments+j;l=i*segments+(j+1)%segments;faces.append((k,l,l+segments,k+segments))
 faces.append(tuple(reversed(range(segments))));faces.append(tuple((len(profile)-1)*segments+j for j in range(segments)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);asset.objects.link(o);o.location=loc;finish(o,name,m,parent)
 uv=mesh.uv_layers.new(name='UVMap')
 for poly in mesh.polygons:
  for li in poly.loop_indices:
   vi=mesh.loops[li].vertex_index;u=(vi%segments)/segments;v=(vi//segments)/(len(profile)-1);uv.data[li].uv=(u,v)
 return o
def sphere(name,loc,scale,m,parent):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m,parent)
def tube(name,points,r,m,parent,closed=False):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=r;c.bevel_resolution=3;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*co,1)
 s.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);asset.objects.link(o);o.data.materials.append(m);o.parent=parent;return o
# Mirror is a 1.02 x 1.68 m arch with a genuinely flat, reflective front.
def outline(r,bottom,spring):return [(-r,bottom),(r,bottom),(r,spring)]+[(r*cos(a),spring+r*sin(a)) for a in np.linspace(0,pi,81)[1:]]
outer=outline(.51,.79,1.96);inner=outline(.492,.808,1.96)
def rim(name,out,inside,y,depth,m):
 verts=[]
 for yy,loop in [(y,out),(y,inside),(y+depth,out),(y+depth,inside)]:verts.extend([(x,yy,z) for x,z in loop])
 n=len(out);f=[]
 for j in range(n):k=(j+1)%n;f.extend([(j,k,n+k,n+j),(2*n+j,3*n+j,3*n+k,2*n+k),(j,2*n+j,2*n+k,k),(n+j,n+k,3*n+k,3*n+j)])
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],f);me.update();o=bpy.data.objects.new(name,me);asset.objects.link(o);finish(o,name,m,root);bevel(o,.002,3);return o
rim('Mirror_Frame',outer,inner,.207,.035,brass)
loop=outline(.491,.809,1.96);me=bpy.data.meshes.new('Mirror_Surface');me.from_pydata([(x,.212,z) for x,z in loop],[],[tuple(range(len(loop)))]);me.update();o=bpy.data.objects.new('Mirror_Surface',me);asset.objects.link(o);finish(o,'Mirror_Surface',mirror,root);mod=o.modifiers.new('Glass substrate','SOLIDIFY');mod.thickness=.004
loop=outline(.484,.816,1.96);tube('Mirror_Illuminated_Edge',[(x,.204,z) for x,z in loop],.003,led,root,True)
# Thin rectangular loop legs echo the reference, with a discreet rear support.
box('Vanity_Top',(0,-.015,.751),(1.4,.46,.058),marble,table,.008)
for side in [-1,1]:
 for yy in [-.175,.15]:box('Leg_%s_%s'%(side,yy),(side*.60,yy,.365),(.025,.028,.73),brass,legs,.003)
 box('Foot_Bridge_'+str(side),(side*.6,-.0125,.016),(.025,.353,.032),brass,legs,.003)
box('Rear_Support',(0,.15,.706),(1.22,.018,.024),brass,legs,.003)
box('Vanity_Underside_Light',(0,.10,.719),(1.2,.009,.005),led,table,.002)
# Rounded upholstered stool with rolled cushion and fine piping.
bx,by=.23,-.62
lathe('Bench_Base',(bx,by,0),[(.19,.008),(.211,.008),(.219,.016),(.219,.057),(.216,.066),(.20,.07)],brass,bench)
lathe('Bench_Seat',(bx,by,0),[(.204,.058),(.222,.068),(.234,.092),(.239,.14),(.24,.34),(.237,.398),(.227,.43),(.205,.447),(.15,.456),(.07,.46),(.001,.46)],fabric,bench,96)
tube('Bench_Upper_Piping',[(bx+.232*cos(a),by+.232*sin(a),.421) for a in np.linspace(0,2*pi,129)[:-1]],.0022,fabric,bench,True)
# Organized, individually editable accessory groups.
perf=group('Perfume_Set',acc);cosm=group('Cosmetic_Set',acc);brush=group('Brush_Set',acc);flower=group('Flower_Vase',acc)
# Marble tray with raised rim.
box('Accessories_Tray',(.37,-.035,.789),(.44,.26,.016),ivory,acc,.012)
for xx in [.155,.585]:box('Tray_Rim', (xx,-.035,.801),(.008,.25,.014),brass,acc,.003)
for yy in [-.158,.088]:box('Tray_Rim',(.37,yy,.801),(.43,.008,.014),brass,acc,.003)
for i,(xx,yy,sz) in enumerate([(.28,-.04,1),(.43,.022,.78)]):
 h=.105*sz;z=.805
 box('Perfume_Glass_'+str(i),(xx,yy,z+h/2),(.068*sz,.047*sz,h),glass,perf,.011*sz)
 box('Perfume_Liquid_'+str(i),(xx,yy,z+h*.4),(.052*sz,.033*sz,h*.65),liquid,perf,.007)
 lathe('Perfume_Collar_'+str(i),(xx,yy,z+h),[(.014,0),(.014,.016)],brass,perf,32)
 box('Perfume_Cap_'+str(i),(xx,yy,z+h+.03),(.032,.027,.028),dark,perf,.004)
 box('Perfume_Label_'+str(i),(xx,yy-.024*sz-.001,z+h*.5),(.04*sz,.001,.035*sz),ivory,perf,.001)
for i,(xx,yy,rad,h) in enumerate([(.53,-.09,.024,.085),(.49,.061,.022,.14),(.19,-.095,.023,.045)]):
 lathe('Skincare_Container_'+str(i),(xx,yy,.805),[(rad*.85,0),(rad,.004),(rad,h-.009),(rad*.85,h)],ivory,cosm,40)
 lathe('Skincare_Lid_'+str(i),(xx,yy,.805+h),[(rad*.88,0),(rad*.95,.003),(rad*.95,.014),(rad*.85,.017)],brass,cosm,40)
 if i==1:
  lathe('Pump_Stem',(xx,yy,.805+h+.017),[(.005,0),(.005,.014)],dark,cosm,24);box('Pump_Nozzle',(xx+.007,yy,.805+h+.033),(.025,.009,.007),dark,cosm,.002)
# Hollow fluted brush cup, with tapered handles, metal ferrules, and bristle heads.
lathe('Brush_Cup',(.035,.035,.782),[(.038,0),(.042,.006),(.042,.103),(.04,.108),(.035,.108),(.035,.01)],dark,brush)
for j in range(28):
 a=j*2*pi/28;tube('Cup_Fluting_%02d'%j,[(.035+.042*cos(a),.035+.042*sin(a),.792),(.035+.042*cos(a),.035+.042*sin(a),.88)],.00065,brass,brush)
for i in range(5):
 a=i*2.4;start=Vector((.035+.014*cos(a),.035+.014*sin(a),.8));end=Vector((.035+.055*cos(a),.035+.045*sin(a),1.005+(.02 if i%2 else 0)));vec=end-start
 handle=lathe('Brush_Handle_'+str(i),start,[(.003,0),(.004,.12),(.0045,vec.length-.025)],dark,brush,24);handle.rotation_euler=vec.to_track_quat('Z','Y').to_euler()
 ferr=lathe('Brush_Ferrule_'+str(i),end-vec.normalized()*.027,[(.005,0),(.006,.022),(.007,.029)],brass,brush,24);ferr.rotation_euler=vec.to_track_quat('Z','Y').to_euler()
 head=sphere('Brush_Bristles_'+str(i),end+vec.normalized()*.014,(.012,.010,.024),hair,brush);head.rotation_euler=vec.to_track_quat('Z','Y').to_euler()
# Thin-walled glass vase, branching stems, small leaves and ivory five-petal blossoms.
vx,vy=-.43,.005
lathe('Vase_Glass',(vx,vy,.782),[(.046,0),(.054,.008),(.053,.035),(.041,.12),(.025,.156),(.027,.17),(.023,.174),(.021,.168),(.021,.156),(.037,.12),(.049,.035),(.049,.009)],glass,flower)
for i in range(9):
 a=i*2.399;end=Vector((vx+random.uniform(.09,.19)*cos(a),vy+random.uniform(.07,.12)*sin(a),1.13+random.uniform(.04,.15)));start=Vector((vx+random.uniform(-.02,.02),vy,.79));mid=start.lerp(end,.63);mid.x+=.012
 tube('Flower_Stem_%02d'%i,[start,mid,end],.0012,stemmat,flower)
 for j in range(3):
  base=start.lerp(end,.55+j*.16);tip=base+Vector((random.uniform(-.06,.06),random.uniform(-.045,.045),.06));tube('Flower_Branch',[base,tip],.0007,stemmat,flower)
  for pos in [tip,end] if j==2 else [tip]:
   sphere('Blossom_Center',pos,(.003,.003,.003),center,flower)
   for k in range(5):
    aa=2*pi*k/5;ob=sphere('Ivory_Petal',pos+Vector((.005*cos(aa),.005*sin(aa),.001)),(.0045,.0028,.0018),petal,flower);ob.rotation_euler[2]=aa
  leaf=sphere('Sage_Leaf',base+Vector((.007,0,.008)),(.004,.002,.014),stemmat,flower);leaf.rotation_euler[1]=.6
# Curves become true mesh objects, preserve named hierarchy. Modifiers remain editable in blend.
for o in list(asset.objects):
 if o.type=='CURVE':
  bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
root['dimensions']='Mirror 1.02 x 1.68 m; table 1.40 x 0.46 x 0.78 m; stool diameter 0.48 m x 0.46 m'
root['front_axis']='-Y; up +Z; floor Z=0'
root['mirror_runtime']='GLB includes silver metallic mirror; use a planar reflection / renderer probe for live reflections.'
# Export only the vanity, no staging geometry/cameras/lights.
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'woobi_vanity.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
# Neutral seamless presentation surface (not a room, excluded from GLB).
def tostage(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 stage.objects.link(o)
floor=box('Presentation_Ground',(0,0,-.035),(200,200,.06),mat('Backdrop warm ivory',(.74,.70,.63),0,.65),None,.01);tostage(floor)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.74,.67,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
# Broad lights make physically reflected highlights in the mirror.
def area(name,loc,power,size,color,target):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color;o=bpy.data.objects.new(name,data);stage.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Key softbox',(-3,-4,5),480,4,(1,.88,.74),(0,0,1))
area('Fill softbox',(3,-2,3),330,3,(.83,.9,1),(0,0,1))
area('Top softbox',(0,1.6,4.2),380,2.5,(1,.89,.72),(0,0,1))
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True;scene.cycles.max_bounces=8;scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
data=bpy.data.cameras.new('Vanity_Presentation_Camera');cam=bpy.data.objects.new('Vanity_Presentation_Camera',data);stage.objects.link(cam);scene.camera=cam;data.type='ORTHO'
def view(loc,target,scale):cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=scale
view((2.8,-5,3.0),(0,-.05,1.22),2.95)
# Open on a clean asset selection.
bpy.ops.object.select_all(action='DESELECT');root.select_set(True);bpy.context.view_layer.objects.active=root
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.region_3d.view_distance=3.7;a.spaces.active.region_3d.view_location=(0,0,1.2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'woobi_vanity.blend'))
for name,loc,target,scale in [('front',(0,-6,2.7),(0,-.04,1.23),2.9),('angle',(2.9,-5,3),(0,-.03,1.23),2.95),('closeup',(1.65,-3.5,2.2),(0,.0,1.08),1.65)]:
 view(loc,target,scale)
 if name=='closeup':scene.render.resolution_x=1500;scene.render.resolution_y=1100
 scene.render.filepath=os.path.join(OUT,'woobi_vanity_'+name+'.png');bpy.ops.render.render(write_still=True)
# Evaluated triangle count and bounds.
dg=bpy.context.evaluated_depsgraph_get();tri=0;meshes=0
for o in asset.objects:
 if o.type=='MESH':
  m=o.evaluated_get(dg).to_mesh();m.calc_loop_triangles();tri+=len(m.loop_triangles);meshes+=1;o.evaluated_get(dg).to_mesh_clear()
json.dump({'mesh_objects':meshes,'evaluated_triangles':tri,'blender_version':bpy.app.version_string},open(os.path.join(OUT,'validation.json'),'w'),indent=2)
print('VANITY_COMPLETE',tri,meshes)
