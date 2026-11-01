/**
 * Woobi - 3D Studio Features
 * animations/index.js - Public Interface & Factory
 */

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

export {
  STUDIO_POSES,
  ANIMATION_EVENTS,
  AnimationsContract,
  IdleMotion,
  POSE_KEYFRAMES,
  PoseController,
  createPoseController
};

if (typeof window !== 'undefined') {
  window.WoobiAnimations = {
    STUDIO_POSES,
    ANIMATION_EVENTS,
    AnimationsContract,
    IdleMotion,
    POSE_KEYFRAMES,
    PoseController,
    createPoseController
  };
}
