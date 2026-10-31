# Sérén Studio — 3D Circular Elevated Stage by Astra

## Dimensions and Hierarchy

Nominal diameter **1.90 m**, radius **0.95 m**, height/thickness **0.080 m** (**8.0 cm** elevated dais platform). Bottom Z = 0; top standing surface Z = 0.080 m. Features an upholstered curved vertical side wall and a rounded bouclé border rim.

| Object | Mesh Type | Description |
|---|---|---|
| `Stage_Base` | Circle plinth | Bottom shadow caster at Z = 0 |
| `Rug_Surface` | Upholstered cylinder disc | 8.0 cm elevated platform with concentric micro-bump |
| `Rug_Edge` | Bullnose torus | Rounded plush bouclé edge trim at Z = 0.080 m |
| `Rug_Detail` | Cord rings (3x) | Concentric woven decorative cords on top surface |

## Materials and Textures

- **Ivory Woven Bouclé**: Procedural PBR fabric with micro-thread noise and weave bump.
- **Cream Edge Fabric**: Deeper tone for looped perimeter edging and decorative cord rings.

## Avatar Placement

Place avatar standing directly on the top surface at `Y = 0.080 m` (Three.js Y-up) or `Z = 0.080 m` (Blender Z-up).
