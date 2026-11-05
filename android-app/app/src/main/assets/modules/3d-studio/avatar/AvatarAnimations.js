/**
 * Woobi - 3D Studio Avatar Module
 * AvatarAnimations.js - Actions Controller (Catwalk, Pose, Spread, Turn, Idle), Breathing, and Rotation
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

    // Rigged Character Mixer & Action Registry
    this.mixer = null;
    this.animations = [];
    this.actions = {};
    this.activeAction = null;
    this.currentActionName = 'idle';
    this.actionTime = 0;
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

  setGLTFModel(gltfGroup, animations = []) {
    this.gltfAvatarGroup = gltfGroup;
    this.animations = animations || (gltfGroup && gltfGroup.animations) || [];

    if (this.THREE && this.THREE.AnimationMixer && gltfGroup) {
      if (this.mixer) {
        this.mixer.stopAllAction();
        this.mixer = null;
      }
      this.mixer = new this.THREE.AnimationMixer(gltfGroup);
      this.actions = {};

      if (this.animations && this.animations.length > 0) {
        this.animations.forEach((clip) => {
          const action = this.mixer.clipAction(clip);
          const rawName = (clip.name || '').toLowerCase();
          this.actions[rawName] = action;
          if (rawName.includes('walk')) this.actions['walk'] = action;
          if (rawName.includes('pose')) this.actions['pose'] = action;
          if (rawName.includes('spread')) this.actions['spread'] = action;
          if (rawName.includes('turn')) this.actions['turn'] = action;
          if (rawName.includes('idle')) this.actions['idle'] = action;
        });
      }

      this.playAction(this.currentActionName || 'idle', 0.4);
    }
  }

  playAction(actionName, crossFadeDuration = 0.4) {
    const key = (actionName || 'idle').toLowerCase();
    this.currentActionName = key;
    this.actionTime = 0;

    if (this.mixer && this.actions) {
      const nextAction = this.actions[key];
      if (nextAction) {
        if (this.activeAction && this.activeAction !== nextAction) {
          nextAction.reset();
          nextAction.enabled = true;
          nextAction.setEffectiveTimeScale(1);
          nextAction.setEffectiveWeight(1);
          nextAction.crossFadeFrom(this.activeAction, crossFadeDuration, true);
          nextAction.play();
        } else {
          nextAction.reset();
          nextAction.enabled = true;
          nextAction.setEffectiveWeight(1);
          nextAction.play();
        }
        this.activeAction = nextAction;
      }
    }
    return this.currentActionName;
  }

  getActionList() {
    return ['walk', 'pose', 'spread', 'turn', 'idle'];
  }

  update(delta, time) {
    this.actionTime += delta;

    // 1. Smooth Avatar Rotation Damping
    if (this.currentActionName === 'turn') {
      this.avatarRotationY += delta * 0.85;
      this.targetRotationY = this.avatarRotationY;
    } else {
      this.avatarRotationY += (this.targetRotationY - this.avatarRotationY) * this.rotationDamping;
    }

    if (this.avatarRoot) {
      this.avatarRoot.rotation.y = this.avatarRotationY;
    }

    // 2. Subtle Idle Breathing Motion & Waveform
    const breath = Math.sin(time * 1.6) * 0.003;
    const breathCycle = (time * this.breathingSpeed) % (Math.PI * 2);
    const breathNormalized = Math.sin(breathCycle - Math.sin(breathCycle) * 0.28);

    // Natural postural slow movement angles (biomechanically anchored from ankle pivot)
    const swayZ = Math.sin(time * this.swaySpeedCoronal) * this.swayAmplitudeCoronal;
    const swayX = Math.sin(time * this.swaySpeedSagittal + 0.45) * this.swayAmplitudeSagittal + Math.sin(time * this.swaySpeedSagittal * 2.0) * 0.0025;
    const swayY = Math.cos(time * this.microYawSpeed) * this.microYawAmplitude;

    // A. Procedural Sculpted Rig animations (fallback model)
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

    // B. Living Organic GLTF Mannequin Animations & Actions
    const gltfModel = this.gltfAvatarGroup || (this.avatarRoot && this.avatarRoot.children && this.avatarRoot.children.find(c => c.name === 'GLTFAvatarGroup' || (c.isGroup && c !== (this.rig && this.rig.group))));
    if (gltfModel) {
      const act = this.currentActionName;

      if (act === 'walk') {
        // High-fashion catwalk kinematics
        const walkFreq = 5.2;
        const wTime = time * walkFreq;
        const dip = -Math.abs(Math.sin(wTime)) * 0.018;
        gltfModel.position.y = dip;
        gltfModel.rotation.z = Math.sin(wTime) * 0.045; // Pelvic hip sway
        gltfModel.rotation.y = Math.cos(wTime) * 0.052; // Torso counter-yaw
        gltfModel.rotation.x = 0.025 + Math.sin(wTime * 2.0) * 0.012;
        gltfModel.scale.set(
          1.0 + breathNormalized * 0.015,
          1.0 + breathNormalized * 0.010,
          1.0 + breathNormalized * 0.025
        );
      } else if (act === 'pose') {
        // Runway fashion pose with asymmetric hip weight shift
        gltfModel.position.y = 0;
        gltfModel.rotation.z = 0.038 + swayZ * 0.3;
        gltfModel.rotation.x = -0.015 + swayX * 0.3;
        gltfModel.rotation.y = 0.045 + swayY * 0.3;
        gltfModel.scale.set(
          1.0 + breathNormalized * 0.018,
          1.0 + breathNormalized * 0.012,
          1.0 + breathNormalized * 0.034
        );
      } else if (act === 'spread') {
        // Open fitting stance with spread limbs & confident poise
        gltfModel.position.y = 0;
        gltfModel.rotation.z = swayZ * 0.3;
        gltfModel.rotation.x = swayX * 0.3;
        gltfModel.rotation.y = swayY * 0.3;
        gltfModel.scale.set(
          1.0 + breathNormalized * 0.020,
          1.0 + breathNormalized * 0.014,
          1.0 + breathNormalized * 0.036
        );
      } else if (act === 'turn') {
        // Continuous 360 showcase turn
        gltfModel.position.y = 0;
        gltfModel.rotation.z = swayZ * 0.2;
        gltfModel.rotation.x = swayX * 0.2;
        gltfModel.rotation.y = 0;
        gltfModel.scale.set(
          1.0 + breathNormalized * 0.018,
          1.0 + breathNormalized * 0.012,
          1.0 + breathNormalized * 0.034
        );
      } else {
        // Default: Natural living breathing & relaxed stabilometric micro-sway
        gltfModel.position.y = 0;
        gltfModel.scale.set(
          1.0 + breathNormalized * 0.018,
          1.0 + breathNormalized * 0.012,
          1.0 + breathNormalized * 0.034
        );
        gltfModel.rotation.x = swayX;
        gltfModel.rotation.z = swayZ;
        gltfModel.rotation.y = swayY;
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
        this.nextBlinkTime = 2.8 + Math.random() * 2.6;
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
    this.gltfAvatarGroup = null;
    this.actions = {};
    this.activeAction = null;
  }
}
