# Studio Animations Module (`animations`)

The **Studio Animations Module** orchestrates fashion posing, multi-joint skeletal keyframing, smooth Hermite lerp transitions, and procedural breathing curves for the Woobi 3D Studio avatar.

## Architecture

- **`AnimationsContract.js`**: Supported pose identifiers (`casual`, `catwalk`, `editorial`, `hands_on_hips`, `closeup`, `relaxed`) and pose lifecycle events (`pose:start`, `pose:complete`, `pose:reset`).
- **`IdleMotion.js`**: Mathematical sinusoids for natural idle breathing and subtle organic shoulder drift.
- **`PoseController.js`**: Kinematic keyframe controller calculating blended rotations across chest, head, and left/right arm hierarchies over configurable durations.
- **`index.js`**: Public interface exporting classes, keyframe data, and `window.WoobiAnimations`.

## Usage

```javascript
import { createPoseController, STUDIO_POSES } from './modules/3d-studio-features/animations/index.js';

const poseController = createPoseController(avatarModel);

// Trigger high fashion editorial pose over 800ms
poseController.triggerPose(STUDIO_POSES.EDITORIAL, 800);

// Reset to relaxed stance
poseController.resetPose();

// Update every frame inside animation loop
function render(delta, time) {
  poseController.update(delta, time);
}
```
