/**
 * Woobi - 3D Studio Features
 * PoseController.test.js - Unit & Integration Test Suite for Studio Animations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  STUDIO_POSES,
  ANIMATION_EVENTS,
  AnimationsContract
} from './AnimationsContract.js';
import { IdleMotion } from './IdleMotion.js';
import {
  POSE_KEYFRAMES,
  PoseController,
  createPoseController
} from './PoseController.js';

function createMockRig() {
  const createRotNode = (name) => ({
    name,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 1.22, z: 0 }
  });

  const chestGroup = createRotNode('AvatarChestGroup');
  const headGroup = createRotNode('AvatarHeadGroup');
  const leftArm = createRotNode('AvatarArmGroup_Left');
  const rightArm = createRotNode('AvatarArmGroup_Right');

  return {
    materials: {},
    rig: {
      chestGroup,
      headGroup,
      sculptedAvatarGroup: {
        getObjectByName(name) {
          if (name === 'AvatarArmGroup_Left') return leftArm;
          if (name === 'AvatarArmGroup_Right') return rightArm;
          return null;
        }
      }
    }
  };
}

describe('Studio Animations Module - Specifications & Contracts', () => {
  it('1. should export standard fashion pose presets', () => {
    assert.strictEqual(STUDIO_POSES.CASUAL, 'casual');
    assert.strictEqual(STUDIO_POSES.CATWALK, 'catwalk');
    assert.strictEqual(STUDIO_POSES.EDITORIAL, 'editorial');
    assert.strictEqual(STUDIO_POSES.HANDS_ON_HIPS, 'hands_on_hips');
    assert.strictEqual(STUDIO_POSES.CLOSEUP, 'closeup');
    assert.strictEqual(STUDIO_POSES.RELAXED, 'relaxed');
  });

  it('2. should export animation event constants', () => {
    assert.strictEqual(ANIMATION_EVENTS.POSE_START, 'pose:start');
    assert.strictEqual(ANIMATION_EVENTS.POSE_COMPLETE, 'pose:complete');
    assert.strictEqual(ANIMATION_EVENTS.POSE_RESET, 'pose:reset');
  });

  it('3. should satisfy AnimationsContract API definition', () => {
    assert.strictEqual(AnimationsContract.name, 'PoseAnimations');
    assert.ok(Array.isArray(AnimationsContract.methods));
    assert.ok(AnimationsContract.methods.includes('triggerPose'));
    assert.ok(AnimationsContract.methods.includes('resetPose'));
    assert.ok(AnimationsContract.methods.includes('getCurrentPose'));
  });

  it('4. should define keyframe rotations for all studio poses', () => {
    Object.values(STUDIO_POSES).forEach((pose) => {
      assert.ok(POSE_KEYFRAMES[pose], `Missing keyframe for ${pose}`);
      assert.ok(POSE_KEYFRAMES[pose].chest);
      assert.ok(POSE_KEYFRAMES[pose].head);
      assert.ok(POSE_KEYFRAMES[pose].leftArm);
      assert.ok(POSE_KEYFRAMES[pose].rightArm);
    });
  });
});

describe('Studio Animations Module - Idle Motion Curves', () => {
  it('5. should calculate breathing displacement over time', () => {
    const idle = new IdleMotion();
    const b0 = idle.calculateBreath(0);
    const bHalf = idle.calculateBreath(Math.PI / 3.2);
    assert.strictEqual(b0, 0);
    assert.notStrictEqual(bHalf, 0);
  });

  it('6. should return 0 breath and sway when idle motion is disabled', () => {
    const idle = new IdleMotion({ enabled: false });
    assert.strictEqual(idle.calculateBreath(1.5), 0);
    assert.strictEqual(idle.calculateSway(1.5), 0);
  });

  it('7. should apply subtle breathing displacements to rig chest and head', () => {
    const idle = new IdleMotion();
    const mockAvatar = createMockRig();
    idle.apply(mockAvatar.rig, 1.0);

    assert.notStrictEqual(mockAvatar.rig.chestGroup.position.y, 1.22);
  });

  it('8. should allow dynamically toggling idle motion via setEnabled', () => {
    const idle = new IdleMotion();
    idle.setEnabled(false);
    assert.strictEqual(idle.calculateBreath(2.0), 0);
    idle.setEnabled(true);
    assert.notStrictEqual(idle.calculateBreath(2.0), 0);
  });
});

describe('Studio Animations Module - Pose Transitions & Kinematics', () => {
  it('9. should initialize in relaxed posture', () => {
    const controller = createPoseController();
    assert.strictEqual(controller.getCurrentPose(), STUDIO_POSES.RELAXED);
  });

  it('10. should return all available poses', () => {
    const controller = createPoseController();
    const poses = controller.getAvailablePoses();
    assert.strictEqual(poses.length, 6);
    assert.ok(poses.includes('editorial'));
  });

  it('11. should trigger editorial pose transition', () => {
    const mockAvatar = createMockRig();
    const controller = createPoseController(mockAvatar);

    const triggered = controller.triggerPose(STUDIO_POSES.EDITORIAL, 500);
    assert.strictEqual(triggered, true);
    assert.strictEqual(controller.isTransitioning, true);
    assert.strictEqual(controller.targetPose, STUDIO_POSES.EDITORIAL);
  });

  it('12. should reject invalid pose names', () => {
    const controller = createPoseController();
    const res = controller.triggerPose('invalid_pose_name');
    assert.strictEqual(res, false);
    assert.strictEqual(controller.isTransitioning, false);
  });

  it('13. should emit pose:start event on trigger', () => {
    const controller = createPoseController();
    let startData = null;
    controller.on(ANIMATION_EVENTS.POSE_START, (data) => {
      startData = data;
    });

    controller.triggerPose(STUDIO_POSES.CATWALK, 400);
    assert.ok(startData);
    assert.strictEqual(startData.toPose, STUDIO_POSES.CATWALK);
    assert.strictEqual(startData.durationMs, 400);
  });

  it('14. should interpolate rig transforms toward target keyframe over time', () => {
    const mockAvatar = createMockRig();
    const controller = createPoseController(mockAvatar);

    controller.triggerPose(STUDIO_POSES.HANDS_ON_HIPS, 500);

    // Advance 250ms (50% progress)
    controller.update(0.25, 0.25);
    const leftArm = mockAvatar.rig.sculptedAvatarGroup.getObjectByName('AvatarArmGroup_Left');
    assert.notStrictEqual(leftArm.rotation.z, 0);
    assert.strictEqual(controller.isTransitioning, true);
  });

  it('15. should complete pose transition and emit pose:complete event', () => {
    const mockAvatar = createMockRig();
    const controller = createPoseController(mockAvatar);

    let completeData = null;
    controller.on(ANIMATION_EVENTS.POSE_COMPLETE, (data) => {
      completeData = data;
    });

    controller.triggerPose(STUDIO_POSES.HANDS_ON_HIPS, 200);

    // Advance past 200ms
    controller.update(0.3, 0.3);
    assert.strictEqual(controller.isTransitioning, false);
    assert.strictEqual(controller.getCurrentPose(), STUDIO_POSES.HANDS_ON_HIPS);
    assert.ok(completeData);
    assert.strictEqual(completeData.pose, STUDIO_POSES.HANDS_ON_HIPS);
  });

  it('16. should reach target keyframe rotations at completion', () => {
    const mockAvatar = createMockRig();
    const controller = createPoseController(mockAvatar);

    controller.triggerPose(STUDIO_POSES.CLOSEUP, 100);
    controller.update(0.15, 0.15);

    const target = POSE_KEYFRAMES[STUDIO_POSES.CLOSEUP];
    assert.strictEqual(mockAvatar.rig.headGroup.rotation.y, target.head.rotY);
    assert.strictEqual(mockAvatar.rig.chestGroup.rotation.y, target.chest.rotY);
  });

  it('17. should trigger pose reset via resetPose()', () => {
    const mockAvatar = createMockRig();
    const controller = createPoseController(mockAvatar);

    controller.triggerPose(STUDIO_POSES.CATWALK, 100);
    controller.update(0.15, 0.15);
    assert.strictEqual(controller.getCurrentPose(), STUDIO_POSES.CATWALK);

    let resetEmitted = false;
    controller.on(ANIMATION_EVENTS.POSE_RESET, () => { resetEmitted = true; });

    controller.resetPose(100);
    assert.strictEqual(resetEmitted, true);

    controller.update(0.15, 0.15);
    assert.strictEqual(controller.getCurrentPose(), STUDIO_POSES.RELAXED);
  });

  it('18. should compute smooth S-curve easing', () => {
    const controller = createPoseController();
    assert.strictEqual(controller.easeInOut(0), 0);
    assert.strictEqual(controller.easeInOut(1), 1);
    assert.strictEqual(controller.easeInOut(0.5), 0.5);
  });

  it('19. should allow unsubscribing from animation events', () => {
    const controller = createPoseController();
    let count = 0;
    const unsub = controller.on(ANIMATION_EVENTS.POSE_START, () => { count++; });

    controller.triggerPose(STUDIO_POSES.CATWALK);
    assert.strictEqual(count, 1);

    unsub();
    controller.triggerPose(STUDIO_POSES.EDITORIAL);
    assert.strictEqual(count, 1);
  });

  it('20. should allow toggling idle motion via setIdleEnabled on controller', () => {
    const controller = createPoseController();
    controller.setIdleEnabled(false);
    assert.strictEqual(controller.idleMotion.options.enabled, false);
  });

  it('21. should handle multiple consecutive pose interruptions gracefully', () => {
    const mockAvatar = createMockRig();
    const controller = createPoseController(mockAvatar);

    controller.triggerPose(STUDIO_POSES.CATWALK, 1000);
    controller.update(0.2, 0.2); // Mid-transition

    // Interrupt with Editorial
    const res = controller.triggerPose(STUDIO_POSES.EDITORIAL, 500);
    assert.strictEqual(res, true);
    assert.strictEqual(controller.targetPose, STUDIO_POSES.EDITORIAL);
  });

  it('22. should clean up listeners and references on dispose', () => {
    const controller = createPoseController(createMockRig());
    controller.triggerPose(STUDIO_POSES.EDITORIAL);

    controller.dispose();
    assert.strictEqual(controller.avatarModel, null);
    assert.strictEqual(controller.isTransitioning, false);
  });

  it('23. should gracefully handle null rig nodes during transform application', () => {
    const controller = createPoseController({ rig: null });
    assert.doesNotThrow(() => {
      controller.applyTransforms({ chest: { x: 0, y: 0, z: 0 } });
    });
  });

  it('24. should correctly set new avatarModel via setAvatarModel', () => {
    const controller = createPoseController();
    const mockRig = createMockRig();
    controller.setAvatarModel(mockRig);
    assert.strictEqual(controller.avatarModel, mockRig);
  });

  it('25. should clamp minimum duration to 50ms for stability', () => {
    const controller = createPoseController();
    controller.triggerPose(STUDIO_POSES.CASUAL, 10);
    assert.strictEqual(controller.transitionDuration, 50);
  });
});
