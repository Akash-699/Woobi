/**
 * Woobi - 3D Studio Features
 * AnimationsContract.js - Poses, Motion Curves & Animation Interface Specifications
 */

export const STUDIO_POSES = {
  CASUAL: 'casual',
  CATWALK: 'catwalk',
  EDITORIAL: 'editorial',
  HANDS_ON_HIPS: 'hands_on_hips',
  CLOSEUP: 'closeup',
  RELAXED: 'relaxed'
};

export const ANIMATION_EVENTS = {
  POSE_START: 'pose:start',
  POSE_COMPLETE: 'pose:complete',
  POSE_RESET: 'pose:reset'
};

export const AnimationsContract = {
  name: 'PoseAnimations',
  version: '1.0.0',
  methods: [
    'triggerPose',
    'resetPose',
    'getCurrentPose',
    'getAvailablePoses',
    'setIdleEnabled',
    'update',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(ANIMATION_EVENTS)
};
