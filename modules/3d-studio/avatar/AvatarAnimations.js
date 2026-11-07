/**
 * Woobi - 3D Studio Avatar Module
 * AvatarAnimations.js - Idle Breathing, Natural Eyelid Blinking, and Damped Rotation Controller
 */

export class AvatarAnimations {
  constructor(avatarRoot, rig = null, THREE = window.THREE) {
    this.THREE = THREE;
    this.avatarRoot = avatarRoot;
    this.rig = rig;
    this.gltfAvatarGroup = null;

    // Rotation Damping
    this.avatarRotationY = 0;
    this.targetRotationY = 0;
    this.rotationDamping = 0.12;

    // Breathing Dynamics (Natural relaxed respiration: ~13 breaths per minute, 4.6s cycle)
    this.baseChestY = 1.22;
    this.baseHeadY = 1.54;
    this.breathingSpeed = 1.365;
    this.breathingAmplitude = 0.0035;

    // Natural Postural Slow Movements & Sway Dynamics (Living human stabilometry)
    this.swaySpeedCoronal = 0.95; // Graceful lateral weight shift (6.6s cycle)
    this.swayAmplitudeCoronal = 0.016; // ~0.92 degrees sway (~2.9cm at head)
    this.swaySpeedSagittal = 1.365; // Forward/back respiratory posture lean (4.6s cycle)
    this.swayAmplitudeSagittal = 0.011; // ~0.63 degrees lean (~2.0cm at head)
    this.microYawSpeed = 0.74; // Natural idle presence drift (8.5s cycle)
    this.microYawAmplitude = 0.012; // ~0.69 degrees turn

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

  setGLTFModel(gltfGroup) {
    this.gltfAvatarGroup = gltfGroup;
  }

  update(delta, time) {
    // 1. Smooth Avatar Rotation Damping
    this.avatarRotationY += (this.targetRotationY - this.avatarRotationY) * this.rotationDamping;
    if (this.avatarRoot) {
      this.avatarRoot.rotation.y = this.avatarRotationY;
    }

    // 2. Subtle Idle Breathing Motion & Waveform
    if (!this.mixer) {
      const breath = Math.sin(time * this.breathingSpeed) * this.breathingAmplitude;
      const breathCycle = (time * this.breathingSpeed) % (Math.PI * 2);
      const breathNormalized = Math.sin(breathCycle - Math.sin(breathCycle) * 0.28);

      const swayZ = Math.sin(time * (this.swaySpeedCoronal || 1.1)) * (this.swayAmplitudeCoronal || 0.003);
      const swayX = Math.sin(time * (this.swaySpeedSagittal || 0.9) + 0.45) * (this.swayAmplitudeSagittal || 0.004);

      if (this.rig) {
        if (this.rig.chestGroup) {
          this.rig.chestGroup.position.y = this.baseChestY + breath;
          this.rig.chestGroup.scale.x = 1.0 + breathNormalized * 0.015;
          this.rig.chestGroup.scale.z = 1.0 + breathNormalized * 0.025;
        }
        if (this.rig.headGroup) {
          this.rig.headGroup.position.y = this.baseHeadY + breath * 0.6;
          this.rig.headGroup.rotation.z = swayZ * 0.50;
          this.rig.headGroup.rotation.x = swayX * 0.50;
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
    this.gltfAvatarGroup = null;
  }
}
