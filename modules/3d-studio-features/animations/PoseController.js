/**
 * Woobi - 3D Studio Features
 * PoseController.js - Smooth Fashion Poses, Keyframe Transitions & Rig Articulation
 */

import { STUDIO_POSES, ANIMATION_EVENTS } from './AnimationsContract.js';
import { IdleMotion } from './IdleMotion.js';

export const POSE_KEYFRAMES = {
  [STUDIO_POSES.RELAXED]: {
    name: 'Relaxed Natural',
    chest: { rotX: 0, rotY: 0, rotZ: 0 },
    head: { rotX: 0, rotY: 0, rotZ: 0 },
    leftArm: { rotX: 0, rotY: 0, rotZ: -0.05 },
    rightArm: { rotX: 0, rotY: 0, rotZ: 0.05 }
  },
  [STUDIO_POSES.CASUAL]: {
    name: 'Casual Stance',
    chest: { rotX: 0.02, rotY: -0.04, rotZ: 0.02 },
    head: { rotX: -0.02, rotY: 0.06, rotZ: -0.02 },
    leftArm: { rotX: 0.05, rotY: 0.02, rotZ: -0.12 },
    rightArm: { rotX: -0.04, rotY: 0, rotZ: 0.08 }
  },
  [STUDIO_POSES.CATWALK]: {
    name: 'Runway Catwalk',
    chest: { rotX: -0.04, rotY: 0.08, rotZ: -0.03 },
    head: { rotX: 0.03, rotY: -0.06, rotZ: 0.02 },
    leftArm: { rotX: 0.22, rotY: 0.04, rotZ: -0.18 },
    rightArm: { rotX: -0.20, rotY: -0.04, rotZ: 0.16 }
  },
  [STUDIO_POSES.EDITORIAL]: {
    name: 'High Fashion Editorial',
    chest: { rotX: 0.05, rotY: 0.12, rotZ: 0.04 },
    head: { rotX: -0.06, rotY: -0.14, rotZ: 0.05 },
    leftArm: { rotX: -0.15, rotY: 0.25, rotZ: -0.45 },
    rightArm: { rotX: 0.10, rotY: -0.12, rotZ: 0.20 }
  },
  [STUDIO_POSES.HANDS_ON_HIPS]: {
    name: 'Hands on Hips',
    chest: { rotX: -0.03, rotY: 0, rotZ: 0 },
    head: { rotX: 0.02, rotY: 0, rotZ: 0 },
    leftArm: { rotX: 0.12, rotY: 0.35, rotZ: -0.65 },
    rightArm: { rotX: 0.12, rotY: -0.35, rotZ: 0.65 }
  },
  [STUDIO_POSES.CLOSEUP]: {
    name: 'Portrait Closeup',
    chest: { rotX: 0, rotY: -0.06, rotZ: 0 },
    head: { rotX: 0.04, rotY: 0.08, rotZ: 0.03 },
    leftArm: { rotX: 0, rotY: 0, rotZ: -0.06 },
    rightArm: { rotX: 0, rotY: 0, rotZ: 0.06 }
  }
};

export class PoseController {
  constructor(avatarModel = null, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
    this.avatarModel = avatarModel;
    this.THREE = THREE;

    this.idleMotion = new IdleMotion();
    this.currentPose = STUDIO_POSES.RELAXED;
    this.targetPose = STUDIO_POSES.RELAXED;

    // Transition state
    this.isTransitioning = false;
    this.transitionDuration = 600; // ms
    this.transitionElapsed = 0; // ms

    this.startTransforms = null;
    this.targetTransforms = null;

    this.listeners = new Map();
  }

  setAvatarModel(avatarModel) {
    this.avatarModel = avatarModel;
  }

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`PoseController error [${event}]:`, e);
        }
      });
    }
  }

  getAvailablePoses() {
    return Object.values(STUDIO_POSES);
  }

  getCurrentPose() {
    return this.currentPose;
  }

  setIdleEnabled(enabled) {
    this.idleMotion.setEnabled(enabled);
  }

  getRigNodes() {
    if (!this.avatarModel || !this.avatarModel.rig) return null;
    const rig = this.avatarModel.rig;

    const leftArm = rig.sculptedAvatarGroup ?
      rig.sculptedAvatarGroup.getObjectByName('AvatarArmGroup_Left') : null;
    const rightArm = rig.sculptedAvatarGroup ?
      rig.sculptedAvatarGroup.getObjectByName('AvatarArmGroup_Right') : null;

    return {
      chest: rig.chestGroup,
      head: rig.headGroup,
      leftArm,
      rightArm
    };
  }

  captureCurrentTransforms() {
    const nodes = this.getRigNodes();
    const captureRot = (node) => {
      if (node && node.rotation) {
        return { x: node.rotation.x, y: node.rotation.y, z: node.rotation.z };
      }
      return { x: 0, y: 0, z: 0 };
    };

    return {
      chest: captureRot(nodes ? nodes.chest : null),
      head: captureRot(nodes ? nodes.head : null),
      leftArm: captureRot(nodes ? nodes.leftArm : null),
      rightArm: captureRot(nodes ? nodes.rightArm : null)
    };
  }

  triggerPose(poseName, durationMs = 600) {
    const targetKeyframe = POSE_KEYFRAMES[poseName];
    if (!targetKeyframe) {
      console.warn(`PoseController: Unknown pose name '${poseName}'`);
      return false;
    }

    this.startTransforms = this.captureCurrentTransforms();
    this.targetTransforms = targetKeyframe;
    this.targetPose = poseName;
    this.transitionDuration = Math.max(50, durationMs);
    this.transitionElapsed = 0;
    this.isTransitioning = true;

    this.emit(ANIMATION_EVENTS.POSE_START, {
      fromPose: this.currentPose,
      toPose: poseName,
      durationMs: this.transitionDuration
    });

    return true;
  }

  resetPose(durationMs = 600) {
    const res = this.triggerPose(STUDIO_POSES.RELAXED, durationMs);
    if (res) {
      this.emit(ANIMATION_EVENTS.POSE_RESET, { pose: STUDIO_POSES.RELAXED });
    }
    return res;
  }

  // Smooth Hermite / S-Curve Ease In-Out
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  applyTransforms(transforms) {
    const nodes = this.getRigNodes();
    if (!nodes) return;

    if (nodes.chest && nodes.chest.rotation && transforms.chest) {
      nodes.chest.rotation.x = transforms.chest.x !== undefined ? transforms.chest.x : transforms.chest.rotX;
      nodes.chest.rotation.y = transforms.chest.y !== undefined ? transforms.chest.y : transforms.chest.rotY;
      nodes.chest.rotation.z = transforms.chest.z !== undefined ? transforms.chest.z : transforms.chest.rotZ;
    }

    if (nodes.head && nodes.head.rotation && transforms.head) {
      nodes.head.rotation.x = transforms.head.x !== undefined ? transforms.head.x : transforms.head.rotX;
      nodes.head.rotation.y = transforms.head.y !== undefined ? transforms.head.y : transforms.head.rotY;
      nodes.head.rotation.z = transforms.head.z !== undefined ? transforms.head.z : transforms.head.rotZ;
    }

    if (nodes.leftArm && nodes.leftArm.rotation && transforms.leftArm) {
      nodes.leftArm.rotation.x = transforms.leftArm.x !== undefined ? transforms.leftArm.x : transforms.leftArm.rotX;
      nodes.leftArm.rotation.y = transforms.leftArm.y !== undefined ? transforms.leftArm.y : transforms.leftArm.rotY;
      nodes.leftArm.rotation.z = transforms.leftArm.z !== undefined ? transforms.leftArm.z : transforms.leftArm.rotZ;
    }

    if (nodes.rightArm && nodes.rightArm.rotation && transforms.rightArm) {
      nodes.rightArm.rotation.x = transforms.rightArm.x !== undefined ? transforms.rightArm.x : transforms.rightArm.rotX;
      nodes.rightArm.rotation.y = transforms.rightArm.y !== undefined ? transforms.rightArm.y : transforms.rightArm.rotY;
      nodes.rightArm.rotation.z = transforms.rightArm.z !== undefined ? transforms.rightArm.z : transforms.rightArm.rotZ;
    }
  }

  update(delta, time) {
    // 1. Process Pose Transition Lerp
    if (this.isTransitioning && this.startTransforms && this.targetTransforms) {
      this.transitionElapsed += (delta * 1000);
      const progress = Math.min(1.0, this.transitionElapsed / this.transitionDuration);
      const easeT = this.easeInOut(progress);

      const blended = {
        chest: {
          x: this.lerp(this.startTransforms.chest.x, this.targetTransforms.chest.rotX, easeT),
          y: this.lerp(this.startTransforms.chest.y, this.targetTransforms.chest.rotY, easeT),
          z: this.lerp(this.startTransforms.chest.z, this.targetTransforms.chest.rotZ, easeT)
        },
        head: {
          x: this.lerp(this.startTransforms.head.x, this.targetTransforms.head.rotX, easeT),
          y: this.lerp(this.startTransforms.head.y, this.targetTransforms.head.rotY, easeT),
          z: this.lerp(this.startTransforms.head.z, this.targetTransforms.head.rotZ, easeT)
        },
        leftArm: {
          x: this.lerp(this.startTransforms.leftArm.x, this.targetTransforms.leftArm.rotX, easeT),
          y: this.lerp(this.startTransforms.leftArm.y, this.targetTransforms.leftArm.rotY, easeT),
          z: this.lerp(this.startTransforms.leftArm.z, this.targetTransforms.leftArm.rotZ, easeT)
        },
        rightArm: {
          x: this.lerp(this.startTransforms.rightArm.x, this.targetTransforms.rightArm.rotX, easeT),
          y: this.lerp(this.startTransforms.rightArm.y, this.targetTransforms.rightArm.rotY, easeT),
          z: this.lerp(this.startTransforms.rightArm.z, this.targetTransforms.rightArm.rotZ, easeT)
        }
      };

      this.applyTransforms(blended);

      if (progress >= 1.0) {
        this.isTransitioning = false;
        this.currentPose = this.targetPose;
        this.emit(ANIMATION_EVENTS.POSE_COMPLETE, { pose: this.currentPose });
      }
    }

    // 2. Process Procedural Idle Motion (Secondary Breathing)
    if (this.avatarModel && this.avatarModel.rig) {
      this.idleMotion.apply(this.avatarModel.rig, time);
    }
  }

  dispose() {
    this.listeners.clear();
    this.avatarModel = null;
    this.isTransitioning = false;
    this.startTransforms = null;
    this.targetTransforms = null;
  }
}

export function createPoseController(avatarModel = null, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
  return new PoseController(avatarModel, THREE);
}
