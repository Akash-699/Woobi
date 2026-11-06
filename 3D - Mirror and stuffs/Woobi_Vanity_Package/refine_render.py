import bpy,os
from mathutils import Vector
P=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=P+'/woobi_vanity.blend')
s=bpy.context.scene
for p in bpy.data.objects['Mirror_Surface'].data.polygons:p.use_smooth=False
for o in bpy.data.objects:
 if o.type=='LIGHT':o.visible_glossy=False
s.world.node_tree.nodes['Background'].inputs[1].default_value=.65
s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.4
m=bpy.data.materials['Cream boucle upholstery'];m.node_tree.nodes.get('Normal Map').inputs['Strength'].default_value=1.2
cam=s.camera
views=[('front',(0,-6,1.48),(0,-.03,1.23),2.85),('angle',(2.9,-5,2.8),(0,-.03,1.23),2.95),('closeup',(1.3,-3.5,2.0),(0,0,1.13),1.62)]
for name,loc,target,scale in views:
 cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
 s.render.resolution_x=1200 if name!='closeup' else 1500;s.render.resolution_y=1400 if name!='closeup' else 1100
 if name=='angle':bpy.ops.wm.save_as_mainfile(filepath=P+'/woobi_vanity.blend')
 s.render.filepath=P+'/woobi_vanity_'+name+'.png';bpy.ops.render.render(write_still=True)
