# Module 2: 3D Studio Features (`modules/3d-studio-features`)

## Responsibility
The **3D Studio Features** module encapsulates all high-level business logic, interaction layers, styling algorithms, posing kinematics, and state persistence that build upon the physical Three.js scene rendered by `modules/3d-studio`.

## Architectural Submodules

1. **`virtual-try-on/`**
   - Real-time garment equipping, slot resolution (tops, bottoms, footwear, accessories), material synchronization, and catalog management.
   - Core API: `VirtualTryOn`, `createVirtualTryOn`, `GARMENT_CATALOG`, `GARMENT_CATEGORIES`, `DEFAULT_OUTFIT`, `getGarmentRecord`.

2. **`garment-interactions/`**
   - 3D NDC pointer tracking, raycaster intersection with garments on avatar and wardrobe rails, and non-destructive emissive feedback highlights.
   - Core API: `GarmentInteractions`, `createGarmentInteractions`, `SelectionFeedback`, `INTERACTION_STATES`, `INTERACTION_EVENTS`.

3. **`outfit-recommendations/`**
   - Color harmony scoring, occasion styling profiles (Casual, Business, Evening, Minimalist, Summer), formality verification, and partial outfit completion.
   - Core API: `RecommendationEngine`, `createRecommendationEngine`, `OCCASIONS`, `STYLE_AESTHETICS`, `CURATED_LOOKS`, `GARMENT_METRICS`.

4. **`avatar-customization/`**
   - Inclusive skin tone palettes, realistic hair colors, multiple hairstyles, anatomical body scaling, undo/redo history stacks, and dual-key localStorage persistence.
   - Core API: `AvatarCustomizer`, `createAvatarCustomizer`, `SKIN_TONE_PRESETS`, `HAIR_COLOR_PRESETS`, `HAIR_STYLES`, `BODY_PROPORTIONS`.

5. **`animations/`**
   - Multi-joint kinematic keyframe controller, S-curve Hermite interpolation, fashion poses (`casual`, `catwalk`, `editorial`, `hands_on_hips`, `closeup`, `relaxed`), and secondary breathing dynamics.
   - Core API: `PoseController`, `createPoseController`, `IdleMotion`, `STUDIO_POSES`, `POSE_KEYFRAMES`.

6. **`saved-looks/`**
   - Personal lookbook manager, JSON import/export, quota-safe storage driver, and automated one-click outfit re-equipping.
   - Core API: `SavedLooksManager`, `createSavedLooksManager`, `LookbookStorage`, `LOOKS_EVENTS`.

## Public Interface Contract
The module exposes its public API through `index.js`, which exports all submodules and a top-level `createStudioFeatures(studio3d, options)` orchestrator, as well as `window.WoobiStudioFeatures` for browser applications.
