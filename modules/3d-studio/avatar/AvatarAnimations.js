/**
 * Woobi - 3D Studio Avatar Module
 * AvatarAnimations.js - Idle Breathing, Natural Eyelid Blinking, and Damped Rotation Controller
 */

export class AvatarAnimations {
  constructor(avatarRoot, rig = null, THREE = window.THREE) {
    this.THREE = THREE;
    this.avatarRoot = avatarRoot;
    this.rig = rig;

    // Rotation Damping
    this.avatarRotationY = 0;
    this.targetRotationY = 0;
    this.rotationDamping = 0.12;

    // Breathing Dynamics
    this.baseChestY = 1.22;
    this.baseHeadY = 1.54;
    this.breathingSpeed = 1.6;
    this.breathingAmplitude = 0.003;

    // Blinking Dynamics
    this.blinkTimer = 0;
    this.nextBlinkTime = 3.2;
    this.isBlinking = false;
    this.blinkProgress = 0;
    this.blinkSpeed = 12.0;

    // Rigged Character Mixer
    this.mixer = null;
  }

  setTargetRotation(targetY) {
    this.targetRotationY = targetY;
  }

  addRotation(deltaY) {
    this.targetRotationY += deltaY;
  }

  setMixer(mixer) {
    this.mixer = mixer;
  }

  update(delta, time) {
    // 1. Smooth Avatar Rotation Damping
    this.avatarRotationY += (this.targetRotationY - this.avatarRotationY) * this.rotationDamping;
    if (this.avatarRoot) {
      this.avatarRoot.rotation.y = this.avatarRotationY;
    }

    // 2. Subtle Idle Breathing Motion
    const breath = Math.sin(time * this.breathingSpeed) * this.breathingAmplitude;
    if (this.rig) {
      if (this.rig.chestGroup) {
        this.rig.chestGroup.position.y = this.baseChestY + breath;
      }
      if (this.rig.headGroup) {
        this.rig.headGroup.position.y = this.baseHeadY + breath * 0.6;
      }
    }

    // 3. Natural Periodic Eyelid Blinking
    this.blinkTimer += delta;
    if (this.blinkTimer > this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress += delta * this.blinkSpeed;
      if (this.blinkProgress >= Math.PI) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.blinkTimer = 0;
        this.nextBlinkTime = 2.8 + Math.random() * 2.6; // Random interval between 2.8s and 5.4s
      }
    }

    if (this.rig && this.rig.eyelids && this.rig.eyelids.length > 0) {
      const lidScaleY = this.isBlinking ? Math.sin(this.blinkProgress) * 0.72 : 0.02;
      this.rig.eyelids.forEach((lid) => {
        if (lid && lid.scale) {
          lid.scale.y = Math.max(0.02, lidScaleY);
        }
      });
    }

    // 4. Update AnimationMixer if rigged GLTF is active
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.avatarRoot = null;
    this.rig = null;
  }
}
