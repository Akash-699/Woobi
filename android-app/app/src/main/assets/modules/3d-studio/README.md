# Module 1: 3D Studio (`modules/3d-studio`)

## Responsibility
Responsible for 3D models, physical studio environment, materials, positioning, rendering configurations, and component-specific visual assets.

## Submodules
1. `wardrobe/`: 3D wardrobe closet structure, animated doors, garment rails, PBR wood and velvet materials.
2. `stage/`: Elevated circular styling dais (8.0 cm dais, 1.90m diameter, upholstered bouclé profile, contact shadow disc).
3. `mirror-vanity/`: Luxury vanity table, mirror frame, reflective surface shaders, grooming accessories.
4. `theme/`: Environmental backdrops, travertine floor materials, day/evening lighting ambience.
5. `avatar/`: Humanoid male and female avatar models, bone hierarchy, standing plane positioning (`Y = 0.080m`).
6. `lighting/`: Directional key lights, warm ambient fill, rim lights, soft shadow generation.
7. `camera/`: OrbitControls, camera angle transitions, framing presets (`STUDIO_OVERVIEW`, `AVATAR_FULL_BODY`, `AVATAR_DETAIL`).

## Public Interface Contract
The module exposes its public API through `index.js`. External modules must access 3D scene elements only via these exported methods and events.
