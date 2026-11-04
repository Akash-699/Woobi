import bpy
import os
import math
from mathutils import Vector

blend_path = r"s:\Fashion_App\seren_avatar.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

scene = bpy.context.scene
print("Scene loaded successfully. Objects in scene:")
for obj in scene.objects:
    print(f" - {obj.name} (type: {obj.type}, loc: {obj.location})")
