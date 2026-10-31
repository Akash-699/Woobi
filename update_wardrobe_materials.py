import bpy
import math

blend_path = r"s:\Fashion_App\3D- Wardrobe by Astra\wardrobe.blend"
glb_astra = r"s:\Fashion_App\3D- Wardrobe by Astra\wardrobe.glb"
glb_root = r"s:\Fashion_App\wardrobe.glb"

print("Loading blend file:", blend_path)
bpy.ops.wm.open_mainfile(filepath=blend_path)

# Warm natural light oak linear colors
# sRGB approx: #D4A373 -> linear approx: (0.65, 0.38, 0.18, 1.0)
oak_base = (0.66, 0.43, 0.22, 1.0)
hanger_base = (0.58, 0.36, 0.17, 1.0)
brass_base = (0.88, 0.72, 0.36, 1.0)

for mat in bpy.data.materials:
    if not mat.node_tree:
        continue
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if not bsdf:
        continue
        
    name = mat.name
    print("Processing material:", name)
    
    if name == 'Mat_NaturalLightOak':
        if 'Base Color' in bsdf.inputs:
            bsdf.inputs['Base Color'].default_value = oak_base
        if 'Roughness' in bsdf.inputs:
            bsdf.inputs['Roughness'].default_value = 0.42
        if 'Specular IOR Level' in bsdf.inputs:
            bsdf.inputs['Specular IOR Level'].default_value = 0.5
        elif 'Specular' in bsdf.inputs:
            bsdf.inputs['Specular'].default_value = 0.5
            
    elif name == 'Mat_HangerWood':
        if 'Base Color' in bsdf.inputs:
            bsdf.inputs['Base Color'].default_value = hanger_base
        if 'Roughness' in bsdf.inputs:
            bsdf.inputs['Roughness'].default_value = 0.40
            
    elif name == 'Mat_BrushedBrass':
        if 'Base Color' in bsdf.inputs:
            bsdf.inputs['Base Color'].default_value = brass_base
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = 0.92
        if 'Roughness' in bsdf.inputs:
            bsdf.inputs['Roughness'].default_value = 0.22
            
    elif name == 'Mat_WarmLED_3000K':
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (1.0, 0.88, 0.68, 1.0)
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = (1.0, 0.88, 0.68, 1.0)
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = 5.0
            
    elif name == 'Mat_StripedPoplin':
        if 'Base Color' in bsdf.inputs:
            bsdf.inputs['Base Color'].default_value = (0.92, 0.93, 0.94, 1.0)

# Save the blend file
bpy.ops.wm.save_mainfile(filepath=blend_path)
print("Saved blend file successfully.")

# Export glTF
print("Exporting GLB to:", glb_astra)
bpy.ops.export_scene.gltf(
    filepath=glb_astra,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_yup=True
)

# Also copy/export to root
print("Exporting GLB to:", glb_root)
bpy.ops.export_scene.gltf(
    filepath=glb_root,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_yup=True
)

print("Export completed successfully!")
