/**
 * SÉRÉN 3D VIRTUAL FASHION STUDIO ENGINE — PRODUCTION GRADE V4
 * True-to-Reference Visual Architecture, Serene Atmosphere, PBR Materials & High-Fidelity Avatar
 * Faithfully matches Sérén Target Visual Reference (seren_main_screen.jpg)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Studio3D = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Camera Presets configured specifically for Portrait Mobile & Desktop Framing
  const CAMERA_STATES = {
    STUDIO_OVERVIEW: {
      position: new THREE.Vector3(0, 1.22, 3.10),
      target: new THREE.Vector3(-0.08, 1.08, 0),
      fovLandscape: 42,
      fovPortrait: 56
    },
    WARDROBE_CLOSEUP: {
      position: new THREE.Vector3(-0.96, 1.20, 2.50),
      target: new THREE.Vector3(-0.96, 1.20, -0.32),
      fovLandscape: 38,
      fovPortrait: 54
    },
    AVATAR_FULL_BODY: {
      position: new THREE.Vector3(0, 1.10, 2.10),
      target: new THREE.Vector3(0, 1.00, 0),
      fovLandscape: 36,
      fovPortrait: 44
    },
    AVATAR_DETAIL: {
      position: new THREE.Vector3(0, 1.44, 1.10),
      target: new THREE.Vector3(0, 1.38, 0),
      fovLandscape: 30,
      fovPortrait: 36
    },
    VANITY_VIEW: {
      position: new THREE.Vector3(0.65, 1.25, 1.55),
      target: new THREE.Vector3(0.85, 1.20, -0.10),
      fovLandscape: 38,
      fovPortrait: 46
    },
    MIRROR_VIEW: {
      position: new THREE.Vector3(0.65, 1.25, 1.55),
      target: new THREE.Vector3(0.85, 1.20, -0.10),
      fovLandscape: 38,
      fovPortrait: 46
    }
  };

  // Color Tokens matching Sérén Design System
  const COLOR_PALETTE = {
    bgScene: 0xF7F3ED,
    ivorySurface: 0xFFFCF8,
    warmBeige: 0xEAE0D3,
    lightWood: 0xD8B992,
    softTaupe: 0xA58F7A,
    primaryText: 0x51463E,
    trousersSand: 0xC8BAA7, // Elegant sand/beige fluid tailored linen trousers
    cropTankIvory: 0xFAF6EF, // Ribbed knit cream high-neck crop tank
    honeyOak: 0xC69967,
    warmBrass: 0xD8B478,
    sneakersWhite: 0xFFFFFF
  };

  class Studio3DEngine {
    constructor() {
      this.isInitialized = false;
      this.container = null;
      this.canvas = null;
      this.scene = null;
      this.camera = null;
      this.cameraController = null;
      this.renderer = null;

      // Real-time Mirror Render Pipeline
      this.mirrorRenderTarget = null;
      this.mirrorCamera = null;
      this.mirrorGlassMesh = null;

      // Camera Animation State
      this.currentCameraState = 'STUDIO_OVERVIEW';
      this.targetCameraPos = CAMERA_STATES.STUDIO_OVERVIEW.position.clone();
      this.targetCameraLookAt = CAMERA_STATES.STUDIO_OVERVIEW.target.clone();
      this.currentCameraLookAt = CAMERA_STATES.STUDIO_OVERVIEW.target.clone();

      // Zoom & Distance clamping
      this.cameraZoomFactor = 1.0;
      this.minFov = 26;
      this.maxFov = 66;

      // Interactive 3D Objects for Raycasting
      this.interactiveObjects = [];
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();

      // Avatar & Wearable Garment System
      this.avatarRoot = null;
      this.sculptedAvatarGroup = null;
      this.gltfAvatarGroup = null;
      this.activeAvatarType = 'sculpted'; // 'sculpted' or 'glb'
      this.chestGroup = null;
      this.headGroup = null;
      this.eyelids = [];
      this.hairStyles = {};
      this.activeHairStyle = 'bun';
      this.accessories = {};
      this.skinMaterials = [];
      this.hairMaterials = [];

      this.garmentMeshes = {
        top: {},
        bottom: {},
        shoes: {}
      };
      this.activeGarments = {
        top: 'tank',
        bottom: 'wide_linen',
        shoes: 'sneakers'
      };

      // Customizable Avatar Configuration (Persisted)
      this.avatarConfig = {
        gender: 'female',
        skinTone: '#F3D5C6',
        hairStyle: 'bun',
        hairColor: '#1E120A',
        proportions: 'regular',
        top: 'tank',
        bottom: 'wide_linen',
        shoes: 'sneakers',
        accessories: {
          watch: true,
          earrings: true,
          necklace: false
        }
      };

      // Pointer / Drag State
      this.isPointerDown = false;
      this.pointerStartX = 0;
      this.pointerStartY = 0;
      this.lastPointerX = 0;
      this.lastPointerY = 0;
      this.avatarRotationY = 0;
      this.targetRotationY = 0;
      this.hasDragged = false;
      this.pinchStartDist = 0;

      // Animation Loop & Morphing
      this.clock = new THREE.Clock();
      this.animationFrameId = null;
      this.blinkTimer = 0;
      this.nextBlinkTime = 3.2;
      this.isBlinking = false;
      this.blinkProgress = 0;

      // Procedural Textures
      this.textures = {};

      // Callbacks
      this.onObjectClick = null;
    }

    /**
     * Initializes the 3D scene on container and canvas
     */
    init(containerId, canvasId) {
      if (this.isInitialized) {
        this.onResize();
        return;
      }

      this.container = document.getElementById(containerId);
      this.canvas = document.getElementById(canvasId);
      if (!this.container || !this.canvas) {
        console.warn('Studio3D: Container or Canvas element not found', containerId, canvasId);
        return;
      }

      if (typeof THREE === 'undefined') {
        console.error('Studio3D: THREE.js library is not loaded');
        return;
      }

      // Load saved preferences from localStorage if available
      this.loadSavedPreferences();

      const rect = this.container.getBoundingClientRect();
      const width = rect.width || this.container.clientWidth || 390;
      const height = rect.height || this.container.clientHeight || 750;

      // 1. Scene with Serene Atmosphere (Warm cream architectural tone)
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLOR_PALETTE.bgScene);
      this.scene.fog = new THREE.Fog(COLOR_PALETTE.bgScene, 9, 24);

      // 2. Camera with Portrait/Landscape Optimized Field of View
      const aspect = width / height;
      if (typeof window !== 'undefined' && window.WoobiCamera && typeof window.WoobiCamera.createStudioCamera === 'function') {
        this.cameraController = window.WoobiCamera.createStudioCamera(this.canvas, {
          width,
          height,
          initialPreset: 'STUDIO_OVERVIEW',
          onRotate: (delta) => {
            this.targetRotationY += delta;
          },
          onClick: (clientX, clientY) => {
            this.handleCanvasClick(clientX, clientY);
          },
          onResize: () => {
            this.onResize();
          }
        }, THREE);
        this.camera = this.cameraController.camera;
        this.targetCameraPos = this.cameraController.transitions.targetCameraPos;
        this.targetCameraLookAt = this.cameraController.transitions.targetCameraLookAt;
        this.currentCameraLookAt = this.cameraController.transitions.currentCameraLookAt;
      } else {
        const isPortrait = aspect < 0.75;
        const initialFov = isPortrait ? CAMERA_STATES.STUDIO_OVERVIEW.fovPortrait : CAMERA_STATES.STUDIO_OVERVIEW.fovLandscape;
        this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 40);
        this.camera.position.copy(CAMERA_STATES.STUDIO_OVERVIEW.position);
        this.currentCameraLookAt.copy(CAMERA_STATES.STUDIO_OVERVIEW.target);
        this.camera.lookAt(this.currentCameraLookAt);
      }

      // 3. WebGL Renderer with Tone Mapping and Soft Shadows
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.08;
      }
      if (THREE.sRGBEncoding) {
        this.renderer.outputEncoding = THREE.sRGBEncoding;
      }

      // 4. Build Procedural PBR Textures & Architectural 3D Scene
      this.initProceduralTextures();
      this.setupLighting();
      this.buildRoomArchitecture();
      this.buildWovenRug();
      this.buildWardrobeFurniture();
      this.buildDressingVanity();
      this.buildHumanoidAvatar();
      this.loadRiggedAvatarGLB(); // Asynchronously attempt Ready Player Me / external model
      this.setupMirrorRenderPipeline();

      // 5. Setup Touch, Mouse & Zoom Handlers
      this.setupInteractionHandlers();

      // Apply initial saved preferences
      this.applyAvatarConfig(this.avatarConfig);

      // 5.5 Initialize 3D Studio Features (Try-On, Interactions, Recommendations, Customizer, Animations, Saved Looks)
      this.initStudioFeatures();

      // 6. Start Render Loop
      this.isInitialized = true;
      this.animate = this.animate.bind(this);
      this.animate();

      console.log('Studio3D: Sérén Studio Production V4 Initialized with Stylized Avatar & Atmospheric Dressing Room.');
    }

    /**
     * Creates high-resolution procedural PBR textures for realistic materials
     */
    initProceduralTextures() {
      // 1. Polished Cream Marble Tile Floor (512x512)
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = 512;
      floorCanvas.height = 512;
      const fCtx = floorCanvas.getContext('2d');
      fCtx.fillStyle = '#F5EFE6';
      fCtx.fillRect(0, 0, 512, 512);

      // Delicate warm gold and subtle grey marble veining
      const drawVein = (ctx, points, color, width) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      };
      drawVein(fCtx, [{x: 0, y: 120}, {x: 160, y: 220}, {x: 320, y: 190}, {x: 512, y: 380}], 'rgba(216, 195, 168, 0.28)', 16);
      drawVein(fCtx, [{x: 40, y: 0}, {x: 200, y: 240}, {x: 390, y: 440}, {x: 512, y: 512}], 'rgba(180, 160, 140, 0.20)', 6);
      drawVein(fCtx, [{x: 180, y: 0}, {x: 310, y: 150}, {x: 480, y: 290}], 'rgba(235, 222, 202, 0.40)', 10);

      // Subtle marble tile seam lines
      fCtx.strokeStyle = 'rgba(200, 185, 165, 0.35)';
      fCtx.lineWidth = 2;
      fCtx.strokeRect(0, 0, 512, 512);

      this.textures.creamMarble = new THREE.CanvasTexture(floorCanvas);
      this.textures.creamMarble.wrapS = THREE.RepeatWrapping;
      this.textures.creamMarble.wrapT = THREE.RepeatWrapping;
      this.textures.creamMarble.repeat.set(4, 4);

      // 2. Woven Circular Bouclé Wool Rug (512x512)
      const rugCanvas = document.createElement('canvas');
      rugCanvas.width = 512;
      rugCanvas.height = 512;
      const rCtx = rugCanvas.getContext('2d');
      rCtx.fillStyle = '#EBE3D7';
      rCtx.fillRect(0, 0, 512, 512);

      // Concentric braided spiral stitches
      rCtx.lineWidth = 4;
      for (let radius = 10; radius < 256; radius += 9) {
        rCtx.strokeStyle = radius % 18 === 0 ? 'rgba(210, 198, 182, 0.6)' : 'rgba(245, 239, 230, 0.7)';
        rCtx.beginPath();
        rCtx.arc(256, 256, radius, 0, Math.PI * 2);
        rCtx.stroke();
      }
      // Wool fiber flecks
      for (let i = 0; i < 1800; i++) {
        rCtx.fillStyle = Math.random() > 0.5 ? 'rgba(205, 192, 175, 0.45)' : 'rgba(255, 252, 246, 0.65)';
        rCtx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 2 + 1, Math.random() * 2 + 1);
      }
      this.textures.wovenRug = new THREE.CanvasTexture(rugCanvas);

      // 3. Natural Honey Oak Grain (256x512)
      const oakCanvas = document.createElement('canvas');
      oakCanvas.width = 256;
      oakCanvas.height = 512;
      const oCtx = oakCanvas.getContext('2d');
      oCtx.fillStyle = '#C89C6A';
      oCtx.fillRect(0, 0, 256, 512);

      oCtx.strokeStyle = 'rgba(150, 95, 45, 0.16)';
      oCtx.lineWidth = 1.8;
      for (let y = 0; y < 512; y += 4) {
        oCtx.beginPath();
        oCtx.moveTo(0, y);
        oCtx.bezierCurveTo(
          64, y + Math.sin(y * 0.05) * 8,
          192, y - Math.sin(y * 0.03) * 6,
          256, y
        );
        oCtx.stroke();
      }
      this.textures.oak = new THREE.CanvasTexture(oakCanvas);
      this.textures.oak.wrapS = THREE.RepeatWrapping;
      this.textures.oak.wrapT = THREE.RepeatWrapping;
      this.textures.oak.repeat.set(1.5, 2.0);

      // 4. Calacatta Gold Marble for Vanity Countertop
      const mCanvas = document.createElement('canvas');
      mCanvas.width = 512;
      mCanvas.height = 512;
      const mCtx = mCanvas.getContext('2d');
      mCtx.fillStyle = '#FCFAF6';
      mCtx.fillRect(0, 0, 512, 512);
      drawVein(mCtx, [{x: 0, y: 90}, {x: 180, y: 170}, {x: 340, y: 150}, {x: 512, y: 340}], 'rgba(215, 185, 140, 0.30)', 18);
      drawVein(mCtx, [{x: 60, y: 0}, {x: 230, y: 230}, {x: 430, y: 470}, {x: 512, y: 512}], 'rgba(165, 140, 115, 0.24)', 5);
      this.textures.calacatta = new THREE.CanvasTexture(mCanvas);

      // 5. Ribbed Knit Vertical Texture for Crop Tank
      const ribCanvas = document.createElement('canvas');
      ribCanvas.width = 128;
      ribCanvas.height = 128;
      const ribCtx = ribCanvas.getContext('2d');
      ribCtx.fillStyle = '#FAF7F2';
      ribCtx.fillRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 4) {
        ribCtx.fillStyle = 'rgba(215, 205, 190, 0.38)';
        ribCtx.fillRect(x, 0, 2, 128);
      }
      this.textures.ribbedKnit = new THREE.CanvasTexture(ribCanvas);
      this.textures.ribbedKnit.wrapS = THREE.RepeatWrapping;
      this.textures.ribbedKnit.wrapT = THREE.RepeatWrapping;
      this.textures.ribbedKnit.repeat.set(8, 8);

      // 6. Sand Linen Weave for Wide-Leg Trousers
      const linenCanvas = document.createElement('canvas');
      linenCanvas.width = 128;
      linenCanvas.height = 128;
      const lCtx = linenCanvas.getContext('2d');
      lCtx.fillStyle = '#C8BAA7';
      lCtx.fillRect(0, 0, 128, 128);
      lCtx.strokeStyle = 'rgba(175, 158, 138, 0.28)';
      lCtx.lineWidth = 1;
      for (let i = 0; i < 128; i += 3) {
        lCtx.beginPath();
        lCtx.moveTo(i, 0);
        lCtx.lineTo(i, 128);
        lCtx.stroke();
        lCtx.beginPath();
        lCtx.moveTo(0, i);
        lCtx.lineTo(128, i);
        lCtx.stroke();
      }
      this.textures.linenWeave = new THREE.CanvasTexture(linenCanvas);
      this.textures.linenWeave.wrapS = THREE.RepeatWrapping;
      this.textures.linenWeave.wrapT = THREE.RepeatWrapping;
      this.textures.linenWeave.repeat.set(6, 12);
    }

    /**
     * Atmospheric Studio Lighting matching Target Reference:
     * Warm diagonal morning sunlight through window panes, warm fill,
     * delicate rim lighting, and soft ground contact shadows
     */
    setupLighting() {
      // Delegate to modular 3D Studio Lighting submodule if available
      if (typeof window !== 'undefined' && window.WoobiLighting && typeof window.WoobiLighting.createStudioLighting === 'function') {
        this.lightingModel = window.WoobiLighting.createStudioLighting(this.scene, 'luxury-warm', THREE);
        this.lightingController = new window.WoobiLighting.LightingController(this.lightingModel);
        return;
      }

      // Warm, serene ambient illumination
      const ambientLight = new THREE.AmbientLight(0xFFF6EC, 0.68);
      this.scene.add(ambientLight);

      // Primary Key Sunlight (Diagonal morning sunlight streaming from upper right)
      const keySunlight = new THREE.DirectionalLight(0xFFF7E6, 1.25);
      keySunlight.position.set(2.8, 4.8, 3.0);
      keySunlight.castShadow = true;
      keySunlight.shadow.mapSize.width = 1024;
      keySunlight.shadow.mapSize.height = 1024;
      keySunlight.shadow.camera.near = 0.5;
      keySunlight.shadow.camera.far = 10;
      keySunlight.shadow.bias = -0.0002;
      const d = 2.4;
      keySunlight.shadow.camera.left = -d;
      keySunlight.shadow.camera.right = d;
      keySunlight.shadow.camera.top = d;
      keySunlight.shadow.camera.bottom = -d;
      this.scene.add(keySunlight);

      // Soft Fill Light from left to soften shadows on wardrobe and body
      const fillLight = new THREE.DirectionalLight(0xFDF1E2, 0.42);
      fillLight.position.set(-2.6, 3.2, 1.6);
      this.scene.add(fillLight);

      // Warm Golden Rim Light for hair and shoulder separation from background
      const rimLight = new THREE.DirectionalLight(0xFFE5BE, 0.85);
      rimLight.position.set(0, 3.8, -2.4);
      this.scene.add(rimLight);

      // Soft Warm Interior Fill for Wardrobe (Toned down so oak wood does not blow out)
      const wardrobeSpot = new THREE.SpotLight(0xFFE5BF, 0.50, 4.8, Math.PI / 4, 0.45, 1.2);
      wardrobeSpot.position.set(-0.96, 3.2, 0.8);
      wardrobeSpot.target.position.set(-0.96, 1.22, -0.32);
      this.scene.add(wardrobeSpot);
      this.scene.add(wardrobeSpot.target);

      const vanitySpot = new THREE.SpotLight(0xFFE5BF, 0.80, 4.8, Math.PI / 4, 0.45, 1.2);
      vanitySpot.position.set(0.95, 3.4, 0.4);
      vanitySpot.target.position.set(0.90, 1.2, -0.10);
      this.scene.add(vanitySpot);
      this.scene.add(vanitySpot.target);
    }

    /**
     * Architecture: Warm Cream Walls, Cream Polished Marble Floor,
     * Overhead Studio Softbox, Window Mullion Shadows, and Foreground Framing Foliage
     */
    buildRoomArchitecture() {
      // Delegate to modular 3D Studio Theme & Environment submodule if available
      if (typeof window !== 'undefined' && window.WoobiTheme && typeof window.WoobiTheme.createStudioTheme === 'function') {
        this.themeModel = window.WoobiTheme.createStudioTheme(this.scene, this.textures, 'luxury-cream', THREE);
        return;
      }

      // 1. Polished Cream Marble Tile Flooring
      const floorGeo = new THREE.PlaneGeometry(16, 16);
      const floorMat = new THREE.MeshStandardMaterial({
        map: this.textures.creamMarble,
        roughness: 0.28,
        metalness: 0.04,
        color: 0xFFFFFF
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      this.scene.add(floor);

      // 2. Smooth Warm Cream Architectural Wall
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xF7F2EA, // Serene cream plaster
        roughness: 0.88,
        metalness: 0.01,
        side: THREE.BackSide
      });
      const wallGeo = new THREE.CylinderGeometry(6.6, 6.6, 6.8, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
      const backWall = new THREE.Mesh(wallGeo, wallMat);
      backWall.position.set(0, 3.4, 0);
      backWall.receiveShadow = true;
      this.scene.add(backWall);

      // 3. Diagonal Window Mullion Sunlight Shadow Projected on Wall/Floor
      const windowShadowGroup = new THREE.Group();
      windowShadowGroup.position.set(0.8, 1.8, -1.2);
      windowShadowGroup.rotation.set(-0.25, 0.45, -0.2);

      const shadowBarMat = new THREE.MeshBasicMaterial({
        color: 0x4A3A2A,
        transparent: true,
        opacity: 0.075
      });
      // Window frame panes
      for (let w = 0; w < 4; w++) {
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.58), shadowBarMat);
        pane.position.set((w % 2 === 0 ? -0.22 : 0.22), (w < 2 ? 0.32 : -0.32), 0);
        windowShadowGroup.add(pane);
      }
      this.scene.add(windowShadowGroup);

      // 4. Overhead Studio Softbox Light Fixture on Arm (Top Left matching reference)
      const studioLightGroup = new THREE.Group();
      studioLightGroup.position.set(-1.12, 2.65, 0.88);
      studioLightGroup.rotation.set(0.38, 0.46, -0.24);

      const softboxHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.48, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x1A1816, roughness: 0.55 })
      );
      studioLightGroup.add(softboxHousing);

      const diffuser = new THREE.Mesh(
        new THREE.PlaneGeometry(0.31, 0.45),
        new THREE.MeshBasicMaterial({ color: 0xFFFDF8 })
      );
      diffuser.position.set(0, 0, 0.112);
      studioLightGroup.add(diffuser);

      const softboxGlow = new THREE.PointLight(0xFFF9EE, 0.90, 3.8);
      softboxGlow.position.set(0, 0, 0.36);
      studioLightGroup.add(softboxGlow);

      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.38, 12),
        new THREE.MeshStandardMaterial({ color: 0x2A2724, metalness: 0.6, roughness: 0.4 })
      );
      arm.rotation.x = Math.PI / 2;
      arm.position.set(0, 0.12, -0.24);
      studioLightGroup.add(arm);

      this.scene.add(studioLightGroup);

      // 5. Cinematic Foreground Framing Foliage (Bottom Left Camera View)
      // Creates the photographic depth-of-field effect seen in the reference image
      const fgFoliageGroup = new THREE.Group();
      fgFoliageGroup.position.set(-0.95, 0.15, 1.85);

      const fgLeafMat = new THREE.MeshStandardMaterial({
        color: 0x2A4526,
        roughness: 0.48,
        metalness: 0.05
      });
      for (let l = 0; l < 4; l++) {
        const fgLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), fgLeafMat);
        fgLeaf.scale.set(1.6, 0.18, 0.85);
        fgLeaf.rotation.set(-0.3 + l * 0.2, 0.5 + l * 0.3, -0.4);
        fgLeaf.position.set(l * 0.08, l * 0.12, -l * 0.06);
        fgFoliageGroup.add(fgLeaf);
      }
      this.scene.add(fgFoliageGroup);
    }

    /**
     * Circular Woven Bouclé Wool Rug directly beneath Avatar
     * Powered by extracted Stage module: modules/3d-studio/stage/StageModel.js
     */
    buildWovenRug() {
      if (typeof window !== 'undefined' && window.WoobiStage && typeof window.WoobiStage.createStage === 'function') {
        this.stageModel = window.WoobiStage.createStage(this.scene, this.textures, THREE);
        this.stageGroup = this.stageModel.group;
        return;
      }

      // Procedural fallback if module has not loaded
      const rugGroup = new THREE.Group();
      rugGroup.position.set(0, 0, 0);

      const shadowGeo = new THREE.CircleGeometry(1.18, 64);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x22180F, transparent: true, opacity: 0.30 });
      const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.002;
      rugGroup.add(shadowDisc);

      const rugRadius = 0.95;
      const rugThickness = 0.080;
      const rugGeo = new THREE.CylinderGeometry(rugRadius, rugRadius + 0.012, rugThickness, 64);
      const rugMat = new THREE.MeshStandardMaterial({
        map: this.textures.wovenRug,
        roughness: 0.82,
        metalness: 0.01,
        color: 0xF2ECE2
      });
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.position.y = rugThickness / 2;
      rug.receiveShadow = true;
      rug.castShadow = true;
      rugGroup.add(rug);

      const trimGeo = new THREE.TorusGeometry(rugRadius + 0.004, 0.012, 16, 64);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xDFD6C8, roughness: 0.85 });
      const rimTrim = new THREE.Mesh(trimGeo, trimMat);
      rimTrim.rotation.x = Math.PI / 2;
      rimTrim.position.y = rugThickness;
      rugGroup.add(rimTrim);

      this.scene.add(rugGroup);
      this.stageGroup = rugGroup;
    }

    /**
     * LEFT-SIDE LUXURY BUILT-IN NATURAL OAK WARDROBE
     * Powered by extracted Wardrobe module: modules/3d-studio/wardrobe/WardrobeModel.js
     */
    buildWardrobeFurniture() {
      if (typeof window !== 'undefined' && window.WoobiWardrobe && typeof window.WoobiWardrobe.createWardrobe === 'function') {
        this.wardrobeModel = window.WoobiWardrobe.createWardrobe(this.scene, this.textures, THREE);
        this.wardrobeGroup = this.wardrobeModel.group;
        if (Array.isArray(this.wardrobeModel.interactiveObjects)) {
          this.wardrobeModel.interactiveObjects.forEach(obj => this.interactiveObjects.push(obj));
        }
        return;
      }

      const wardrobeGroup = new THREE.Group();
      // Position naturally on left wall with angled perspective matching Reference D
      wardrobeGroup.position.set(-0.96, 0, -0.32);
      wardrobeGroup.rotation.y = 0.30;

      const scale = 2.40 / 3.00;
      const width = 2.20 * scale;
      const height = 3.00 * scale;
      const depth = 0.65 * scale;

      if (typeof THREE.GLTFLoader !== 'undefined') {
        const gltfLoader = new THREE.GLTFLoader();
        const astraPath = '3D- Wardrobe by Astra/wardrobe.glb';
        const fallbackPath = 'wardrobe.glb';

        const onWardrobeLoad = (gltf) => {
          const model = gltf.scene;
          model.scale.set(scale, scale, scale);
          model.position.set(0, 0, 0);
          model.rotation.y = Math.PI;

          // Apply authentic 100% matched Astra materials & internal shelf lights pipeline
          if (typeof AstraWardrobeStyling !== 'undefined') {
            AstraWardrobeStyling.applyMaterials(model);
          } else if (typeof window !== 'undefined' && window.AstraWardrobeStyling) {
            window.AstraWardrobeStyling.applyMaterials(model);
          }

          wardrobeGroup.add(model);
        };

        gltfLoader.load(
          astraPath,
          onWardrobeLoad,
          undefined,
          () => gltfLoader.load(fallbackPath, onWardrobeLoad)
        );

        // Raycastable Bounding Box for Touch / Click
        const hitBox = new THREE.Mesh(
          new THREE.BoxGeometry(width + 0.2, height, depth + 0.3),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitBox.position.set(0, height / 2, 0);
        hitBox.userData = { interactiveType: 'wardrobe', name: 'Built-in Oak Wardrobe' };
        wardrobeGroup.add(hitBox);
        this.interactiveObjects.push(hitBox);

        this.scene.add(wardrobeGroup);
        return;
      }

      const oakMat = new THREE.MeshStandardMaterial({
        map: this.textures.oak,
        color: 0xC89C6A, // Honey oak
        roughness: 0.42,
        metalness: 0.02
      });
      const brassMat = new THREE.MeshStandardMaterial({
        color: COLOR_PALETTE.warmBrass,
        metalness: 0.88,
        roughness: 0.24
      });
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xFFF2D0 });

      // Outer Frame: Uprights, Top & Bottom Plinth
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(width, 0.040, depth), oakMat);
      topCap.position.set(0, height - 0.020, 0);
      topCap.castShadow = true;
      wardrobeGroup.add(topCap);

      const sideGeo = new THREE.BoxGeometry(0.040, height, depth);
      const leftSide = new THREE.Mesh(sideGeo, oakMat);
      leftSide.position.set(-width / 2 + 0.020, height / 2, 0);
      leftSide.castShadow = true;
      wardrobeGroup.add(leftSide);

      const rightSide = new THREE.Mesh(sideGeo, oakMat);
      rightSide.position.set(width / 2 - 0.020, height / 2, 0);
      rightSide.castShadow = true;
      wardrobeGroup.add(rightSide);

      const backBoard = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, height - 0.04, 0.02), oakMat);
      backBoard.position.set(0, height / 2, -depth / 2 + 0.01);
      backBoard.receiveShadow = true;
      wardrobeGroup.add(backBoard);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth - 0.04), oakMat);
      plinth.position.set(0, 0.06, 0.02);
      wardrobeGroup.add(plinth);

      // Shelves with Integrated Warm LED Lighting Strips along top edge
      const shelfYPositions = [0.12, 0.52, 0.94, 1.34, 2.22];
      const shelfGeo = new THREE.BoxGeometry(width - 0.08, 0.030, depth - 0.02);

      shelfYPositions.forEach((shY) => {
        const shelf = new THREE.Mesh(shelfGeo, oakMat);
        shelf.position.set(0, shY, 0);
        shelf.receiveShadow = true;
        shelf.castShadow = true;
        wardrobeGroup.add(shelf);

        // Integrated warm recessed LED glow strip
        if (shY > 0.12) {
          const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.09, 0.010, 0.032), ledMat);
          ledStrip.position.set(0, shY - 0.020, 0.08);
          wardrobeGroup.add(ledStrip);
        }
      });

      // Internal warm ambient shelf lights
      const shelfLight1 = new THREE.PointLight(0xFFA834, 1.15, 2.8);
      shelfLight1.position.set(0, 2.15, 0.14);
      wardrobeGroup.add(shelfLight1);

      const shelfLight2 = new THREE.PointLight(0xFFA834, 0.90, 2.2);
      shelfLight2.position.set(0, 1.25, 0.14);
      wardrobeGroup.add(shelfLight2);

      // 1. TOP SHELF: Luxury White Box with Gold Pull + Trailing Potted Ivy
      const boxMat = new THREE.MeshStandardMaterial({ color: 0xFAF7F2, roughness: 0.60 });
      const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.36), boxMat);
      topBox.position.set(-0.25, 2.33, 0);
      topBox.castShadow = true;
      wardrobeGroup.add(topBox);

      const boxPull = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 16), brassMat);
      boxPull.position.set(-0.25, 2.33, 0.185);
      wardrobeGroup.add(boxPull);

      // Cascading Trailing Green Ivy Plant
      const plantGroup = new THREE.Group();
      plantGroup.position.set(0.34, 2.24, 0.08);
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.14, 24),
        new THREE.MeshStandardMaterial({ color: 0x3A3632, roughness: 0.50 })
      );
      pot.position.y = 0.07;
      plantGroup.add(pot);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x3E5E36, roughness: 0.55 });
      for (let p = 0; p < 12; p++) {
        const topLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), leafMat);
        topLeaf.scale.set(1.4, 0.22, 0.9);
        topLeaf.position.set(Math.cos(p * 0.6) * 0.07, 0.15 + Math.sin(p * 0.4) * 0.02, Math.sin(p * 0.6) * 0.07);
        plantGroup.add(topLeaf);
      }
      // Cascading trailing ivy vines
      for (let v = 0; v < 5; v++) {
        const vineLen = 0.45 + v * 0.12;
        const vineX = 0.05 + Math.sin(v) * 0.04;
        const vineZ = 0.04 + Math.cos(v) * 0.04;
        const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.002, vineLen, 8), leafMat);
        vine.position.set(vineX, 0.05 - vineLen / 2, vineZ);
        plantGroup.add(vine);

        for (let l = 0; l < 9; l++) {
          const lY = 0.05 - (l / 9) * vineLen;
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.020, 6, 6), leafMat);
          leaf.scale.set(1.3, 0.16, 0.85);
          leaf.position.set(vineX + (l % 2 === 0 ? 0.024 : -0.024), lY, vineZ + 0.015);
          plantGroup.add(leaf);
        }
      }
      wardrobeGroup.add(plantGroup);

      // 2. MAIN CLOTHING RAIL & 3D GARMENTS ON WOODEN HANGERS
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, width - 0.08, 16), brassMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, 2.12, 0);
      rail.castShadow = true;
      wardrobeGroup.add(rail);

      // Distinct 3D sculpted garments matching reference image:
      // 1. Off-white silk blouse
      // 2. Charcoal tailored jacket
      // 3. Crisp white button-down shirt
      // 4. Grey knit blazer
      // 5. Dark blazer
      const hangerGarments = [
        { x: -0.36, color: 0xF4ECE1, len: 0.68, type: 'shirt' },
        { x: -0.20, color: 0x33363B, len: 0.74, type: 'blazer' },
        { x: -0.04, color: 0xFAF8F5, len: 0.66, type: 'shirt' },
        { x: 0.12, color: 0x585B62, len: 0.72, type: 'blazer' },
        { x: 0.28, color: 0x1E2024, len: 0.75, type: 'blazer' }
      ];

      hangerGarments.forEach((g) => {
        const hangerGroup = new THREE.Group();
        hangerGroup.position.set(g.x, 2.12, 0);

        // Wooden Wishbone Hanger
        const hangerBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, 0.36, 12),
          oakMat
        );
        hangerBar.rotation.z = Math.PI / 2;
        hangerBar.position.y = -0.04;
        hangerGroup.add(hangerBar);

        const hangerHook = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.003, 8, 16, Math.PI * 1.3), brassMat);
        hangerHook.position.set(0, 0.015, 0);
        hangerGroup.add(hangerHook);

        // Sculpted 3D Garment Mesh with Torso, Shoulders, and Collar
        const garmentGroup = new THREE.Group();
        garmentGroup.position.y = -0.05;

        const gMat = new THREE.MeshStandardMaterial({
          color: g.color,
          roughness: 0.72,
          metalness: 0.02
        });

        // Contoured Body & Drapery
        const bodyGeo = new THREE.CylinderGeometry(0.09, 0.14, g.len, 20);
        bodyGeo.scale(1.2, 1.0, 0.65);
        const bodyMesh = new THREE.Mesh(bodyGeo, gMat);
        bodyMesh.position.y = -g.len / 2;
        bodyMesh.castShadow = true;
        garmentGroup.add(bodyMesh);

        // Collar / Lapels
        const collar = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.04, 0.10),
          gMat
        );
        collar.position.set(0, -0.02, 0.02);
        garmentGroup.add(collar);

        hangerGroup.add(garmentGroup);
        wardrobeGroup.add(hangerGroup);
      });

      // 3. MIDDLE DISPLAY SHELF: Luxury White Handbag + Books & Accessories
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xFDFBF7, roughness: 0.40, metalness: 0.02 });
      const bagGroup = new THREE.Group();
      bagGroup.position.set(-0.28, 1.37, 0.02);

      // Structured Trapezoid Handbag Body
      const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.10), bagMat);
      bagBody.position.y = 0.08;
      bagBody.castShadow = true;
      bagGroup.add(bagBody);

      // Gold Clasp & Handle
      const bagClasp = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.016, 0.012), brassMat);
      bagClasp.position.set(0, 0.09, 0.052);
      bagGroup.add(bagClasp);

      const bagHandle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 8, 20, Math.PI), brassMat);
      bagHandle.position.set(0, 0.16, 0);
      bagGroup.add(bagHandle);
      wardrobeGroup.add(bagGroup);

      // Stack of Fashion Books / Magazines & Sunglasses
      const bookMat1 = new THREE.MeshStandardMaterial({ color: 0x3A342E, roughness: 0.65 });
      const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.22), bookMat1);
      book1.position.set(0.18, 1.36, 0.02);
      wardrobeGroup.add(book1);

      const bookMat2 = new THREE.MeshStandardMaterial({ color: 0xF5F0E6, roughness: 0.60 });
      const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.020, 0.20), bookMat2);
      book2.position.set(0.18, 1.38, 0.02);
      wardrobeGroup.add(book2);

      // 4. LOWER SHELVES: Neatly Folded Knitwear Sweaters & 2 Oak Drawers
      // Cream & Grey Folded Sweater Stacks
      const knitCream = new THREE.MeshStandardMaterial({ color: 0xF3EFE6, roughness: 0.85 });
      const knitGrey = new THREE.MeshStandardMaterial({ color: 0x8C8984, roughness: 0.85 });

      for (let s = 0; s < 3; s++) {
        const sw1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.038, 0.28), s % 2 === 0 ? knitCream : knitGrey);
        sw1.position.set(-0.20, 0.96 + s * 0.038, 0.02);
        sw1.castShadow = true;
        wardrobeGroup.add(sw1);
      }

      for (let s = 0; s < 2; s++) {
        const sw2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.042, 0.28), s === 0 ? knitGrey : knitCream);
        sw2.position.set(0.20, 0.96 + s * 0.042, 0.02);
        sw2.castShadow = true;
        wardrobeGroup.add(sw2);
      }

      // Two Oak Drawers with Brass Button Pulls
      const drawerY = 0.72;
      const drawerHeight = 0.18;
      [-0.24, 0.24].forEach((dx) => {
        const drawerFront = new THREE.Mesh(
          new THREE.BoxGeometry(width / 2 - 0.06, drawerHeight, 0.02),
          oakMat
        );
        drawerFront.position.set(dx, drawerY, depth / 2 - 0.02);
        wardrobeGroup.add(drawerFront);

        const drawerPull = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12), brassMat);
        drawerPull.rotation.x = Math.PI / 2;
        drawerPull.position.set(dx, drawerY, depth / 2 - 0.005);
        wardrobeGroup.add(drawerPull);
      });

      // 5. BOTTOM SHOE DISPLAY: 4 Distinct Pairs of Footwear
      const shoeMatWhite = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.40 });
      const shoeMatBeige = new THREE.MeshStandardMaterial({ color: 0xD8C4B0, roughness: 0.45 });
      const shoeMatLoafer = new THREE.MeshStandardMaterial({ color: 0xF2ECE2, roughness: 0.38 });

      const shoes = [
        { x: -0.34, mat: shoeMatWhite, name: 'White Sneakers' },
        { x: -0.12, mat: shoeMatBeige, name: 'Beige Low Heels' },
        { x: 0.10, mat: shoeMatLoafer, name: 'Cream Loafers' },
        { x: 0.32, mat: shoeMatWhite, name: 'Court Trainers' }
      ];

      shoes.forEach((sh) => {
        const shoePair = new THREE.Group();
        shoePair.position.set(sh.x, 0.14, 0.04);

        [-0.038, 0.038].forEach((offset) => {
          const sole = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.020, 0.17), shoeMatWhite);
          sole.position.set(offset, 0.010, 0);
          shoePair.add(sole);

          const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.042, 16), sh.mat);
          upper.scale.set(1.0, 1.0, 1.8);
          upper.position.set(offset, 0.035, 0.01);
          upper.castShadow = true;
          shoePair.add(upper);
        });

        wardrobeGroup.add(shoePair);
      });

      // Raycastable Bounding Box for Touch / Click
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.2, height, depth + 0.3),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, height / 2, 0);
      hitBox.userData = { interactiveType: 'wardrobe', name: 'Built-in Oak Wardrobe' };
      wardrobeGroup.add(hitBox);
      this.interactiveObjects.push(hitBox);

      this.scene.add(wardrobeGroup);
    }

    /**
     * RIGHT-SIDE DRESSING VANITY & ARCHED MIRROR
     * Rebuilt with rich details matching Target Reference:
     * Large arched mirror with continuous glowing 360° warm LED rim,
     * white Calacatta marble console with golden brass legs,
     * glass perfume bottles, makeup brushes, skincare containers,
     * baby's breath floral arrangement, and round cream bouclé stool with brass rim
     */
    /**
     * DRESSING VANITY & ILLUMINATED GROOMING MIRROR
     * Powered by extracted Mirror & Vanity module: modules/3d-studio/mirror-vanity/VanityModel.js
     */
    buildDressingVanity() {
      if (typeof window !== 'undefined' && window.WoobiVanity && typeof window.WoobiVanity.createVanity === 'function') {
        this.vanityModel = window.WoobiVanity.createVanity(this.scene, this.textures, THREE);
        this.vanityGroup = this.vanityModel.group;
        this.mirrorGlassMesh = this.vanityModel.mirrorGlassMesh;
        if (Array.isArray(this.vanityModel.interactiveObjects)) {
          this.vanityModel.interactiveObjects.forEach(obj => this.interactiveObjects.push(obj));
        }
        return;
      }

      const vanityGroup = new THREE.Group();
      vanityGroup.position.set(0.92, 0, -0.05);
      vanityGroup.rotation.y = -0.32; // Angled gracefully towards stage

      const brassMat = new THREE.MeshStandardMaterial({
        color: COLOR_PALETTE.warmBrass,
        metalness: 0.88,
        roughness: 0.22
      });

      // 1. Polished Calacatta Gold Marble Countertop Table
      const tableHeight = 0.84;
      const tableWidth = 0.98;
      const tableDepth = 0.46;

      const marbleMat = new THREE.MeshStandardMaterial({
        map: this.textures.calacatta,
        roughness: 0.22,
        metalness: 0.02,
        color: 0xFCFAF6
      });
      const topSlab = new THREE.Mesh(new THREE.BoxGeometry(tableWidth, 0.065, tableDepth), marbleMat);
      topSlab.position.set(0, tableHeight, 0);
      topSlab.castShadow = true;
      topSlab.receiveShadow = true;
      vanityGroup.add(topSlab);

      // Slim Golden Brass Metallic Legs
      const legGeo = new THREE.BoxGeometry(0.030, tableHeight - 0.03, 0.030);
      const legPositions = [
        [-tableWidth / 2 + 0.035, -tableDepth / 2 + 0.035],
        [tableWidth / 2 - 0.035, -tableDepth / 2 + 0.035],
        [-tableWidth / 2 + 0.035, tableDepth / 2 - 0.035],
        [tableWidth / 2 - 0.035, tableDepth / 2 - 0.035]
      ];
      legPositions.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, brassMat);
        leg.position.set(lx, (tableHeight - 0.03) / 2, lz);
        leg.castShadow = true;
        vanityGroup.add(leg);
      });

      // 2. LARGE ARCHED / CIRCULAR MIRROR WITH CONTINUOUS WARM LED GLOW RING
      const mirrorGroup = new THREE.Group();
      mirrorGroup.position.set(0, tableHeight + 0.62, -tableDepth / 2 + 0.03);

      const mirrorRadius = 0.48;

      // Glowing Neon Ring Halo (Continuous 360° LED Rim Light)
      const ledGlowGeo = new THREE.TorusGeometry(mirrorRadius + 0.012, 0.014, 16, 64);
      const ledGlowMat = new THREE.MeshBasicMaterial({ color: 0xFFF2D2 });
      const glowRing = new THREE.Mesh(ledGlowGeo, ledGlowMat);
      mirrorGroup.add(glowRing);

      // Brushed Brass Frame Border
      const frameRing = new THREE.Mesh(new THREE.TorusGeometry(mirrorRadius + 0.025, 0.010, 16, 64), brassMat);
      mirrorGroup.add(frameRing);

      // Backing Panel
      const mirrorBack = new THREE.Mesh(
        new THREE.CircleGeometry(mirrorRadius + 0.01, 64),
        new THREE.MeshStandardMaterial({ color: 0x2A241E, roughness: 0.6 })
      );
      mirrorBack.position.z = -0.015;
      mirrorGroup.add(mirrorBack);

      // Mirror Glass Surface
      const mirrorGlassGeo = new THREE.CircleGeometry(mirrorRadius, 64);
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: 0xEAE6DE,
        roughness: 0.04,
        metalness: 0.94
      });
      this.mirrorGlassMesh = new THREE.Mesh(mirrorGlassGeo, mirrorMat);
      this.mirrorGlassMesh.position.z = 0.002;
      mirrorGroup.add(this.mirrorGlassMesh);

      // Warm continuous radiance light from the mirror ring
      const mirrorGlowLight = new THREE.PointLight(0xFFE8BE, 1.4, 3.2);
      mirrorGlowLight.position.set(0, 0, 0.25);
      mirrorGroup.add(mirrorGlowLight);

      vanityGroup.add(mirrorGroup);

      // 3. TABLETOP LUXURY COSMETICS & FLORAL ARRANGEMENT
      // Clear Glass Perfume Bottles with Gold & Black Atomizers
      const perfumeGroup = new THREE.Group();
      perfumeGroup.position.set(0.24, tableHeight + 0.035, 0.05);

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.08,
        metalness: 0.15,
        transparent: true,
        opacity: 0.75
      });
      const amberGlassMat = new THREE.MeshStandardMaterial({
        color: 0xC88546,
        roughness: 0.12,
        metalness: 0.20,
        transparent: true,
        opacity: 0.85
      });

      // Perfume 1: Tall Faceted Flacon
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.080, 0.044), glassMat);
      p1.position.set(0, 0.040, 0);
      perfumeGroup.add(p1);
      const p1Cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.024, 16), brassMat);
      p1Cap.position.set(0, 0.092, 0);
      perfumeGroup.add(p1Cap);

      // Perfume 2: Round Amber Bottle
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.065, 16), amberGlassMat);
      p2.position.set(0.065, 0.032, 0.02);
      perfumeGroup.add(p2);
      const p2Cap = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 12), new THREE.MeshStandardMaterial({ color: 0x1A1816 }));
      p2Cap.position.set(0.065, 0.070, 0.02);
      perfumeGroup.add(p2Cap);

      vanityGroup.add(perfumeGroup);

      // Ceramic Makeup Brush Holder & Brushes
      const brushHolder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.024, 0.075, 16),
        new THREE.MeshStandardMaterial({ color: 0x2A2622, roughness: 0.40 })
      );
      brushHolder.position.set(0.12, tableHeight + 0.070, 0.08);
      vanityGroup.add(brushHolder);

      // Makeup brushes
      for (let b = 0; b < 4; b++) {
        const brush = new THREE.Mesh(
          new THREE.CylinderGeometry(0.002, 0.002, 0.11, 8),
          brassMat
        );
        brush.rotation.set(0.12 * Math.sin(b * 1.5), 0, 0.12 * Math.cos(b * 1.5));
        brush.position.set(0.12 + Math.sin(b) * 0.008, tableHeight + 0.11, 0.08 + Math.cos(b) * 0.008);
        vanityGroup.add(brush);
      }

      // Clear Glass Vase with Delicate White Baby's Breath Flowers
      const vaseGroup = new THREE.Group();
      vaseGroup.position.set(-0.28, tableHeight + 0.035, 0.04);

      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.028, 0.15, 20), glassMat);
      vase.position.y = 0.075;
      vaseGroup.add(vase);

      // Delicate botanical stems and white blossom clusters
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x485840, roughness: 0.65 });
      const bloomMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85 });

      for (let s = 0; s < 6; s++) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.24, 8), stemMat);
        const ang = s * 1.05;
        stem.rotation.set(0.18 * Math.cos(ang), 0, 0.18 * Math.sin(ang));
        stem.position.set(Math.cos(ang) * 0.015, 0.16, Math.sin(ang) * 0.015);
        vaseGroup.add(stem);

        // White flower blossoms
        for (let fl = 0; fl < 4; fl++) {
          const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), bloomMat);
          blossom.position.set(
            Math.cos(ang) * 0.04 + (fl - 2) * 0.015,
            0.26 + fl * 0.018,
            Math.sin(ang) * 0.04 + (fl % 2 === 0 ? 0.01 : -0.01)
          );
          vaseGroup.add(blossom);
        }
      }
      vanityGroup.add(vaseGroup);

      // 4. ROUND CREAM BOUCLÉ UPHOLSTERED OTTOMAN STOOL WITH BRASS BASE
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(0.12, 0, 0.42);

      // Brushed Brass Circular Plinth Base
      const stoolPlinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.05, 36),
        brassMat
      );
      stoolPlinth.position.y = 0.025;
      stoolPlinth.castShadow = true;
      stoolGroup.add(stoolPlinth);

      // Round Cream Bouclé Seat Cushion
      const stoolCushion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.24, 0.40, 36),
        new THREE.MeshStandardMaterial({
          map: this.textures.wovenRug,
          color: 0xF5F0E6,
          roughness: 0.84,
          metalness: 0.02
        })
      );
      stoolCushion.position.y = 0.25;
      stoolCushion.castShadow = true;
      stoolGroup.add(stoolCushion);

      vanityGroup.add(stoolGroup);

      // Raycastable Bounding Box
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(tableWidth + 0.2, 1.8, tableDepth + 0.5),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.set(0, 1.0, 0.1);
      hitBox.userData = { interactiveType: 'vanity', name: 'Arched Vanity & Grooming Mirror' };
      vanityGroup.add(hitBox);
      this.interactiveObjects.push(hitBox);

      this.scene.add(vanityGroup);
    }

    /**
     * HIGH-FIDELITY STYLIZED FEMALE CHARACTER SCULPT
     * Faithfully matching Target Reference:
     * Stylized anime/Disney beauty proportions, expressive almond eyes with catchlights,
     * sculpted high bun updo with wisps, delicate nose, satin lips, soft blush,
     * ribbed off-white halter crop tank top, high-waisted wide-leg fluid sand trousers,
     * minimalist chunky white platform sneakers, and idle breathing + blinking animation
     */
    buildHumanoidAvatar() {
      // Delegate to modular 3D Studio Avatar submodule if available
      if (typeof window !== 'undefined' && window.WoobiAvatar && typeof window.WoobiAvatar.createAvatar === 'function') {
        this.avatarModel = window.WoobiAvatar.createAvatar(this.scene, this.textures, THREE);
        this.avatarController = new window.WoobiAvatar.AvatarController(this.avatarModel);
        this.avatarRoot = this.avatarModel.avatarRoot;
        this.sculptedAvatarGroup = this.avatarModel.sculptedAvatarGroup;
        this.headGroup = this.avatarModel.rig ? this.avatarModel.rig.headGroup : null;
        this.chestGroup = this.avatarModel.rig ? this.avatarModel.rig.chestGroup : null;
        this.eyelids = this.avatarModel.rig ? this.avatarModel.rig.eyelids : [];
        this.skinMaterials = this.avatarModel.materials ? this.avatarModel.materials.skinMaterials : [];
        this.hairMaterials = this.avatarModel.materials ? this.avatarModel.materials.hairMaterials : [];
        this.activeAvatarType = this.avatarModel.activeAvatarType;
        return;
      }

      this.avatarRoot = new THREE.Group();
      this.avatarRoot.position.set(0, 0.080, 0); // Grounded on elevated 8cm stage dais

      this.sculptedAvatarGroup = new THREE.Group();
      this.avatarRoot.add(this.sculptedAvatarGroup);

      this.skinMaterials = [];
      this.hairMaterials = [];

      // Primary Radiant Warm Ivory Skin Material
      const skinMat = new THREE.MeshStandardMaterial({
        color: 0xF3D5C6,
        roughness: 0.38,
        metalness: 0.02
      });
      this.skinMaterials.push(skinMat);

      // Rich Espresso Brown Hair Material
      const hairMat = new THREE.MeshStandardMaterial({
        color: 0x1E120A,
        roughness: 0.28,
        metalness: 0.04
      });
      this.hairMaterials.push(hairMat);

      const lipMat = new THREE.MeshStandardMaterial({
        color: 0xCE6F66, // Satin rosy lip finish
        roughness: 0.24,
        metalness: 0.02
      });
      const blushMat = new THREE.MeshStandardMaterial({
        color: 0xDE8B80,
        roughness: 0.55,
        transparent: true,
        opacity: 0.35
      });

      // 1. HEAD & FACIAL ANATOMY (Stylized Beauty with expressive almond eyes)
      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0, 1.54, 0);

      // Smooth Head / Cranium
      const craniumGeo = new THREE.SphereGeometry(0.096, 32, 32);
      craniumGeo.scale(0.88, 1.15, 0.95);
      const cranium = new THREE.Mesh(craniumGeo, skinMat);
      cranium.castShadow = true;
      this.headGroup.add(cranium);

      // Tapered chin
      const chin = new THREE.Mesh(new THREE.SphereGeometry(0.032, 20, 20), skinMat);
      chin.scale.set(0.9, 0.8, 0.9);
      chin.position.set(0, -0.072, 0.038);
      this.headGroup.add(chin);

      // Soft blushing cheeks
      [-1, 1].forEach((side) => {
        const blush = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), blushMat);
        blush.scale.set(1.2, 0.6, 0.3);
        blush.position.set(side * 0.048, -0.015, 0.076);
        this.headGroup.add(blush);
      });

      // Expressive Almond Eyes: Sclera, Iris, Pupil, Catchlight Glint & Eyelashes
      const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFAF8F5 });
      const irisMat = new THREE.MeshStandardMaterial({ color: 0x2A190E, roughness: 0.22 });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0A0604 });
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const lashMat = new THREE.MeshBasicMaterial({ color: 0x1A100A });
      const browMat = new THREE.MeshBasicMaterial({ color: 0x24160E });
      this.hairMaterials.push(browMat);

      this.eyelids = [];

      [-1, 1].forEach((side) => {
        const eyeX = side * 0.032;

        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0098, 16, 12), eyeWhiteMat);
        sclera.scale.set(1.28, 0.70, 0.5);
        sclera.position.set(eyeX, 0.015, 0.082);
        this.headGroup.add(sclera);

        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 12, 12), irisMat);
        iris.scale.set(1.0, 1.0, 0.3);
        iris.position.set(eyeX, 0.015, 0.086);
        this.headGroup.add(iris);

        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0030, 8, 8), pupilMat);
        pupil.position.set(eyeX, 0.015, 0.088);
        this.headGroup.add(pupil);

        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0015, 6, 6), glintMat);
        glint.position.set(eyeX + 0.0018, 0.017, 0.089);
        this.headGroup.add(glint);

        // Dynamic Eyelid for Natural Blinking Animation
        const eyelid = new THREE.Mesh(new THREE.SphereGeometry(0.0102, 16, 10), skinMat);
        eyelid.scale.set(1.30, 0.02, 0.52);
        eyelid.position.set(eyeX, 0.022, 0.084);
        this.headGroup.add(eyelid);
        this.eyelids.push(eyelid);

        // Curved upper lashes
        const lash = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.026, 8), lashMat);
        lash.rotation.z = Math.PI / 2 + side * 0.15;
        lash.position.set(eyeX, 0.022, 0.084);
        this.headGroup.add(lash);

        // Arched Natural Brows
        const brow = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0014, 0.035, 8), browMat);
        brow.rotation.z = side * 0.16;
        brow.position.set(eyeX, 0.036, 0.082);
        this.headGroup.add(brow);

        // Ears with subtle gold hoops
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 12), skinMat);
        ear.scale.set(0.35, 1.15, 0.65);
        ear.position.set(side * 0.088, 0.008, -0.005);
        this.headGroup.add(ear);

        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 8, 16), new THREE.MeshStandardMaterial({ color: COLOR_PALETTE.warmBrass, metalness: 0.9, roughness: 0.2 }));
        hoop.position.set(side * 0.090, -0.010, -0.005);
        this.headGroup.add(hoop);
      });

      // Contoured Nose
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.010, 0.038, 12), skinMat);
      bridge.position.set(0, -0.006, 0.089);
      bridge.rotation.x = -0.16;
      this.headGroup.add(bridge);

      const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 12), skinMat);
      noseTip.scale.set(0.9, 0.75, 1.0);
      noseTip.position.set(0, -0.024, 0.093);
      this.headGroup.add(noseTip);

      // Satin Rosy Lips with Cupid's Bow
      const upperLip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), lipMat);
      upperLip.scale.set(1.5, 0.45, 0.6);
      upperLip.position.set(0, -0.048, 0.084);
      this.headGroup.add(upperLip);

      const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), lipMat);
      lowerLip.scale.set(1.4, 0.55, 0.7);
      lowerLip.position.set(0, -0.058, 0.082);
      this.headGroup.add(lowerLip);

      // 2. SIGNATURE HIGH BUN UPDO WITH FACE-FRAMING WISPS (Matching Reference)
      this.buildHairstyles(hairMat);

      this.sculptedAvatarGroup.add(this.headGroup);

      // 3. SLENDER NECK & ANATOMICAL CLAVICLES
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.046, 0.14, 24), skinMat);
      neck.position.set(0, 1.41, 0);
      this.sculptedAvatarGroup.add(neck);

      // 4. TORSO: CHEST & MIDRIFF (With Subtle Breathing Movement)
      this.chestGroup = new THREE.Group();
      this.chestGroup.position.set(0, 1.22, 0);

      // 5. WEARABLE OUTFIT: Off-White Ribbed Crop Tank Top
      const tankMat = new THREE.MeshStandardMaterial({
        map: this.textures.ribbedKnit,
        color: COLOR_PALETTE.cropTankIvory,
        roughness: 0.68,
        metalness: 0.02
      });

      // High-neck sleeveless crop top body
      const tankTop = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.104, 0.22, 32), tankMat);
      tankTop.castShadow = true;
      this.chestGroup.add(tankTop);

      // High-neck collar rim
      const neckCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.045, 24), tankMat);
      neckCollar.position.set(0, 0.12, 0);
      this.chestGroup.add(neckCollar);

      this.sculptedAvatarGroup.add(this.chestGroup);

      // Exposed Midriff
      const midriff = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.110, 0.14, 32), skinMat);
      midriff.position.set(0, 1.06, 0);
      this.sculptedAvatarGroup.add(midriff);

      // 6. ARMS & HANDS WITH NATURAL RESTING FINGERS
      [-1, 1].forEach((side) => {
        const armGroup = new THREE.Group();
        armGroup.position.set(side * 0.168, 1.31, 0);

        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), skinMat);
        armGroup.add(shoulder);

        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.027, 0.26, 20), skinMat);
        upperArm.position.set(0, -0.13, 0);
        upperArm.rotation.z = side * 0.05;
        upperArm.castShadow = true;
        armGroup.add(upperArm);

        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.26, 20), skinMat);
        forearm.position.set(side * 0.010, -0.37, 0);
        forearm.rotation.z = side * -0.03;
        forearm.castShadow = true;
        armGroup.add(forearm);

        // Sculpted Hand with 5 Distinct Curved Fingers
        const hand = new THREE.Group();
        hand.position.set(side * 0.015, -0.52, 0);

        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.042, 0.014), skinMat);
        hand.add(palm);

        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.0040, 0.0032, 0.026, 8), skinMat);
        thumb.rotation.z = side * -0.42;
        thumb.position.set(side * -0.013, 0.004, 0.004);
        hand.add(thumb);

        for (let f = 0; f < 4; f++) {
          const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0026, 0.036 - f * 0.003, 8), skinMat);
          finger.position.set(side * (0.008 - f * 0.005), -0.035, 0);
          hand.add(finger);
        }
        armGroup.add(hand);

        this.sculptedAvatarGroup.add(armGroup);
      });

      // 7. HIGH-WAISTED FLUID WIDE-LEG TAILORED TROUSERS IN SAND / BEIGE
      const trouserMat = new THREE.MeshStandardMaterial({
        map: this.textures.linenWeave,
        color: COLOR_PALETTE.trousersSand,
        roughness: 0.72,
        metalness: 0.01
      });

      // High-rise waistband with front pleats
      const waistHips = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.136, 0.18, 32), trouserMat);
      waistHips.position.set(0, 0.95, 0);
      waistHips.castShadow = true;
      this.sculptedAvatarGroup.add(waistHips);

      // Belt loops & center front button
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.006, 12), trouserMat);
      button.rotation.x = Math.PI / 2;
      button.position.set(0, 1.01, 0.115);
      this.sculptedAvatarGroup.add(button);

      // Fluid Wide Legs with Crisp Front Creases
      [-1, 1].forEach((side) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(side * 0.076, 0.86, 0);

        // Fluid wide-leg cylinder draping naturally to shoe level
        const pantLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.098, 0.78, 28), trouserMat);
        pantLeg.position.y = -0.39;
        pantLeg.castShadow = true;
        legGroup.add(pantLeg);

        // Vertical front tailored crease line
        const crease = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.76, 0.004), trouserMat);
        crease.position.set(0, -0.39, 0.088);
        legGroup.add(crease);

        this.sculptedAvatarGroup.add(legGroup);
      });

      // 8. MINIMALIST CHUNKY WHITE PLATFORM SNEAKERS (Matching Reference)
      const sneakerMat = new THREE.MeshStandardMaterial({
        color: COLOR_PALETTE.sneakersWhite,
        roughness: 0.32,
        metalness: 0.02
      });
      const soleMat = new THREE.MeshStandardMaterial({
        color: 0xF8F8F8,
        roughness: 0.45
      });

      [-1, 1].forEach((side) => {
        const sneaker = new THREE.Group();
        sneaker.position.set(side * 0.085, 0.018, 0.035);

        // Chunky Platform Rubber Sole with Tread
        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.036, 0.22), soleMat);
        sole.position.y = 0.018;
        sole.castShadow = true;
        sneaker.add(sole);

        // Contoured White Leather Upper & Toe Cap
        const upper = new THREE.Mesh(new THREE.SphereGeometry(0.040, 16, 16), sneakerMat);
        upper.scale.set(1.0, 0.85, 1.9);
        upper.position.set(0, 0.046, 0.01);
        upper.castShadow = true;
        sneaker.add(upper);

        // Padded Tongue & Laces
        const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.040, 0.06), sneakerMat);
        tongue.position.set(0, 0.062, -0.01);
        tongue.rotation.x = -0.3;
        sneaker.add(tongue);

        this.sculptedAvatarGroup.add(sneaker);
      });

      this.scene.add(this.avatarRoot);
    }

    /**
     * Builds detailed Hairstyle Options (Updo Bun, Sleek Bob, Soft Waves, Short Crop)
     */
    buildHairstyles(hairMat) {
      // 1. SIGNATURE HIGH BUN UPDO (Reference Image Match)
      const bunGroup = new THREE.Group();

      // Scalp base volume
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 24), hairMat);
      crown.scale.set(0.92, 1.16, 0.96);
      crown.position.set(0, 0.02, -0.012);
      crown.castShadow = true;
      bunGroup.add(crown);

      // High Sculpted Bun on top-back
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.058, 20, 20), hairMat);
      bun.scale.set(1.0, 0.9, 0.9);
      bun.position.set(0, 0.125, -0.035);
      bun.castShadow = true;
      bunGroup.add(bun);

      // Hair tie wrap
      const hairTie = new THREE.Mesh(
        new THREE.TorusGeometry(0.045, 0.008, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0x140E0A })
      );
      hairTie.rotation.x = Math.PI / 2;
      hairTie.position.set(0, 0.095, -0.035);
      bunGroup.add(hairTie);

      // Face-framing side wisps and tendrils
      [-1, 1].forEach((side) => {
        const wisp = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.002, 0.14, 8), hairMat);
        wisp.rotation.z = side * 0.12;
        wisp.position.set(side * 0.082, -0.02, 0.03);
        bunGroup.add(wisp);
      });

      this.hairStyles.bun = bunGroup;
      this.headGroup.add(bunGroup);
    }

    /**
     * Asynchronously loads Rigged Avatar GLB (Ready Player Me or custom model)
     * Replaces procedural meshes with genuine rigged 3D character if available
     */
    loadRiggedAvatarGLB() {
      if (this.avatarModel && typeof this.avatarModel.loadRiggedAvatarGLB === 'function') {
        this.avatarModel.loadRiggedAvatarGLB(
          (model, url) => {
            console.log('Studio3D: Rigged 3D avatar loaded successfully from', url);
            this.gltfAvatarGroup = this.avatarModel.gltfAvatarGroup;
            this.activeAvatarType = this.avatarModel.activeAvatarType;
          },
          (err) => {
            console.log('Studio3D: Using high-definition sculpted avatar.');
          }
        );
        return;
      }

      if (typeof THREE.GLTFLoader === 'undefined') {
        return;
      }

      const loader = new THREE.GLTFLoader();
      const modelUrls = [
        'assets/models/avatar_female.glb',
        'https://readyplayerme.github.io/visage/female.glb'
      ];

      const tryLoad = (index) => {
        if (index >= modelUrls.length) return;
        const url = modelUrls[index];

        loader.load(
          url,
          (gltf) => {
            console.log('Studio3D: Rigged 3D avatar loaded successfully from', url);
            const model = gltf.scene;

            // Scale & position model correctly onto the elevated stage dais
            model.scale.set(0.96, 0.96, 0.96);
            model.position.set(0, 0.080, 0);

            // Traverse and apply luxury reference styling
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Configure skin, hair, and clothing materials to match reference
                if (child.name.includes('Hair')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.honeyOak).multiplyScalar(0.2);
                  this.hairMaterials.push(child.material);
                } else if (child.name.includes('Head') || child.name.includes('Body')) {
                  this.skinMaterials.push(child.material);
                } else if (child.name.includes('Top') || child.name.includes('Shirt')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.cropTankIvory);
                } else if (child.name.includes('Bottom') || child.name.includes('Pants')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.trousersSand);
                } else if (child.name.includes('Footwear') || child.name.includes('Shoes')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.sneakersWhite);
                }
              }
            });

            // Smoothly replace sculpted fallback with the rigged model
            this.gltfAvatarGroup = model;
            this.avatarRoot.add(this.gltfAvatarGroup);
            this.sculptedAvatarGroup.visible = false;
            this.activeAvatarType = 'glb';
          },
          undefined,
          (err) => {
            console.log(`Studio3D: Model ${url} not found or blocked, using high-definition sculpted avatar.`);
            tryLoad(index + 1);
          }
        );
      };

      tryLoad(0);
    }

    /**
     * Setups Real-time Mirror Camera & Render Target
     */
    setupMirrorRenderPipeline() {
      try {
        if (this.vanityModel && this.vanityModel.reflection && this.vanityModel.reflection.renderTarget) {
          this.mirrorRenderTarget = this.vanityModel.reflection.renderTarget;
          this.mirrorCamera = this.vanityModel.reflection.mirrorCamera;
          return;
        }

        this.mirrorRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
          format: THREE.RGBFormat,
          generateMipmaps: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter
        });

        this.mirrorCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
        this.scene.add(this.mirrorCamera);

        if (this.mirrorGlassMesh) {
          this.mirrorGlassMesh.material.map = this.mirrorRenderTarget.texture;
          this.mirrorGlassMesh.material.needsUpdate = true;
        }
      } catch (err) {
        console.warn('Studio3D: Mirror render target fallback active', err);
      }
    }

    /**
     * Mouse, Touch, Drag-to-Rotate & Zoom Handlers
     */
    setupInteractionHandlers() {
      const el = this.canvas;
      if (!el) return;

      if (this.cameraController) {
        // Interactions are managed cleanly by CameraController and detached upon destroy()
        return;
      }

      // Mouse Drag
      el.addEventListener('mousedown', (e) => {
        this.isPointerDown = true;
        this.hasDragged = false;
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isPointerDown) return;
        const deltaX = e.clientX - this.lastPointerX;
        const deltaY = e.clientY - this.lastPointerY;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          this.hasDragged = true;
        }

        // Horizontal rotation around avatar
        this.targetRotationY += deltaX * 0.008;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      });

      window.addEventListener('mouseup', (e) => {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;
        if (!this.hasDragged) {
          this.handleCanvasClick(e.clientX, e.clientY);
        }
      });

      // Touch Drag & Pinch-to-Zoom
      el.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          this.isPointerDown = true;
          this.hasDragged = false;
          this.pointerStartX = e.touches[0].clientX;
          this.pointerStartY = e.touches[0].clientY;
          this.lastPointerX = e.touches[0].clientX;
          this.lastPointerY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          this.pinchStartDist = Math.hypot(dx, dy);
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && this.isPointerDown) {
          const deltaX = e.touches[0].clientX - this.lastPointerX;
          const deltaY = e.touches[0].clientY - this.lastPointerY;

          if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
            this.hasDragged = true;
          }

          this.targetRotationY += deltaX * 0.009;
          this.lastPointerX = e.touches[0].clientX;
          this.lastPointerY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const diff = dist - this.pinchStartDist;

          this.cameraZoomFactor = Math.max(0.7, Math.min(1.4, this.cameraZoomFactor - diff * 0.002));
          this.pinchStartDist = dist;
        }
      }, { passive: true });

      window.addEventListener('touchend', (e) => {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;
        if (!this.hasDragged && e.changedTouches && e.changedTouches.length > 0) {
          this.handleCanvasClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      });

      // Mouse Wheel Zoom
      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.001;
        this.cameraZoomFactor = Math.max(0.7, Math.min(1.4, this.cameraZoomFactor + zoomDelta));
      }, { passive: false });

      // Resize Listener
      window.addEventListener('resize', () => {
        this.onResize();
      });
    }

    /**
     * Handles Raycast selection on wardrobe & vanity 3D objects
     */
    handleCanvasClick(clientX, clientY) {
      if (!this.canvas || !this.camera || !this.scene) return;
      if (this.cameraController && typeof this.cameraController.raycastClick === 'function') {
        this.cameraController.raycastClick(clientX, clientY, this.canvas, this.interactiveObjects, (type, userData) => {
          if (typeof this.onObjectClick === 'function') {
            this.onObjectClick(type, userData);
          } else if (window.app && typeof window.app.serenInteract === 'function') {
            window.app.serenInteract(type);
          }
        });
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.interactiveType && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData.interactiveType) {
          const type = obj.userData.interactiveType;
          if (typeof this.onObjectClick === 'function') {
            this.onObjectClick(type, obj.userData);
          } else if (window.app && typeof window.app.serenInteract === 'function') {
            window.app.serenInteract(type);
          }
        }
      }
    }

    /**
     * Sets Camera Viewpoint Preset with smooth interpolation
     */
    setCameraState(stateName) {
      if (this.cameraController && typeof this.cameraController.setCameraPreset === 'function') {
        const ok = this.cameraController.setCameraPreset(stateName);
        if (ok) {
          this.currentCameraState = stateName;
          return;
        }
      }
      if (CAMERA_STATES[stateName]) {
        this.currentCameraState = stateName;
        this.targetCameraPos.copy(CAMERA_STATES[stateName].position);
        this.targetCameraLookAt.copy(CAMERA_STATES[stateName].target);
      }
    }

    /**
     * Avatar Customization API: Skin Tone
     */
    setSkinTone(hex) {
      this.avatarConfig.skinTone = hex;
      if (this.avatarController && typeof this.avatarController.setSkinTone === 'function') {
        this.avatarController.setSkinTone(hex);
        return;
      }
      const col = new THREE.Color(hex);
      this.skinMaterials.forEach(mat => {
        if (mat) {
          mat.color.copy(col);
          mat.needsUpdate = true;
        }
      });
      this.savePreferences();
    }

    /**
     * Avatar Customization API: Hair Color
     */
    setHairColor(hex) {
      this.avatarConfig.hairColor = hex;
      if (this.avatarController && typeof this.avatarController.setHairColor === 'function') {
        this.avatarController.setHairColor(hex);
        return;
      }
      const col = new THREE.Color(hex);
      this.hairMaterials.forEach(mat => {
        if (mat) {
          mat.color.copy(col);
          mat.needsUpdate = true;
        }
      });
      this.savePreferences();
    }

    /**
     * Avatar Customization API: Hairstyle
     */
    setHairstyle(styleName) {
      this.avatarConfig.hairStyle = styleName;
      if (this.avatarController && typeof this.avatarController.setHairstyle === 'function') {
        this.avatarController.setHairstyle(styleName);
        return;
      }
      this.savePreferences();
    }

    /**
     * Avatar Customization API: Body Proportions
     */
    setBodyProportions(preset) {
      this.avatarConfig.proportions = preset;
      if (this.avatarController && typeof this.avatarController.setBodyProportions === 'function') {
        this.avatarController.setBodyProportions(preset);
        return;
      }
      let scaleX = 1.0;
      let scaleY = 1.0;

      switch (preset) {
        case 'petite':
          scaleX = 0.94;
          scaleY = 0.94;
          break;
        case 'tall':
          scaleX = 0.98;
          scaleY = 1.06;
          break;
        case 'athletic':
          scaleX = 1.05;
          scaleY = 1.02;
          break;
        case 'curvy':
          scaleX = 1.08;
          scaleY = 1.00;
          break;
        default:
          scaleX = 1.0;
          scaleY = 1.0;
      }

      if (this.avatarRoot) {
        this.avatarRoot.scale.set(scaleX, scaleY, scaleX);
      }
      this.savePreferences();
    }

    /**
     * Avatar Customization API: Gender Presentation
     */
    setGenderPresentation(gender) {
      this.avatarConfig.gender = gender;
      if (this.avatarController && typeof this.avatarController.setGenderPresentation === 'function') {
        this.avatarController.setGenderPresentation(gender);
        return;
      }
      if (gender === 'masculine') {
        this.setBodyProportions('athletic');
      } else {
        this.setBodyProportions('regular');
      }
      this.savePreferences();
    }

    /**
     * Avatar Customization API: Toggle Accessories
     */
    toggleAccessory(name, isActive) {
      if (!this.avatarConfig.accessories) this.avatarConfig.accessories = {};
      this.avatarConfig.accessories[name] = isActive;
      if (this.avatarController && typeof this.avatarController.toggleAccessory === 'function') {
        this.avatarController.toggleAccessory(name, isActive);
        return;
      }
      this.savePreferences();
    }

    /**
     * Applies complete avatar configuration
     */
    applyAvatarConfig(cfg) {
      if (!cfg) return;
      if (this.avatarController && typeof this.avatarController.applyAvatarConfig === 'function') {
        this.avatarController.applyAvatarConfig(cfg);
        this.avatarConfig = Object.assign(this.avatarConfig, this.avatarController.avatarConfig);
        return;
      }
      if (cfg.skinTone) this.setSkinTone(cfg.skinTone);
      if (cfg.hairColor) this.setHairColor(cfg.hairColor);
      if (cfg.proportions) this.setBodyProportions(cfg.proportions);
      if (cfg.gender) this.setGenderPresentation(cfg.gender);
    }

    /**
     * Load & Save Preferences via localStorage
     */
    loadSavedPreferences() {
      try {
        const saved = localStorage.getItem('seren_avatar_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.avatarConfig = Object.assign(this.avatarConfig, parsed);
        }
      } catch (e) {
        console.warn('Studio3D: Could not read avatar prefs from storage', e);
      }
    }

    savePreferences() {
      try {
        localStorage.setItem('seren_avatar_prefs', JSON.stringify(this.avatarConfig));
      } catch (e) {
        console.warn('Studio3D: Could not persist avatar prefs', e);
      }
    }

    /**
     * Initializes 3D Studio Features Module
     */
    initStudioFeatures() {
      if (typeof window !== 'undefined' && window.WoobiStudioFeatures && typeof window.WoobiStudioFeatures.createStudioFeatures === 'function') {
        this.features = window.WoobiStudioFeatures.createStudioFeatures(this);
        if (this.features && this.avatarModel) {
          this.features.setAvatarModel(this.avatarModel);
        }
      }
    }

    /**
     * Equips Garments on Avatar
     */
    equipGarment(category, id) {
      if (this.features && this.features.tryOn && typeof this.features.tryOn.equipGarment === 'function') {
        return this.features.tryOn.equipGarment(category, id);
      }
      console.log(`Studio3D: Equipped [${category}] -> [${id}]`);
    }

    /**
     * Triggers High Fashion Pose on Avatar
     */
    triggerPose(poseName, durationMs = 600) {
      if (this.features && this.features.animations && typeof this.features.animations.triggerPose === 'function') {
        return this.features.animations.triggerPose(poseName, durationMs);
      }
      console.log(`Studio3D: Triggered pose [${poseName}]`);
    }

    /**
     * Window / Container Resize Handler
     */
    onResize() {
      if (!this.container || !this.renderer || !this.camera) return;
      const rect = this.container.getBoundingClientRect();
      const width = rect.width || this.container.clientWidth || 390;
      const height = rect.height || this.container.clientHeight || 750;

      if (this.cameraController && typeof this.cameraController.resize === 'function') {
        this.cameraController.resize(width, height);
      } else {
        const aspect = width / height;
        this.camera.aspect = aspect;
        const isPortrait = aspect < 0.75;
        const baseFov = isPortrait ?
          CAMERA_STATES[this.currentCameraState].fovPortrait :
          CAMERA_STATES[this.currentCameraState].fovLandscape;

        this.camera.fov = Math.max(this.minFov, Math.min(this.maxFov, baseFov * this.cameraZoomFactor));
        this.camera.updateProjectionMatrix();
      }

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * Main Animation & Render Loop
     */
    animate() {
      this.animationFrameId = requestAnimationFrame(this.animate);

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // 1. Smooth Avatar Rotation Damping & Animations
      if (this.avatarModel && typeof this.avatarModel.update === 'function') {
        if (this.avatarController) {
          this.avatarController.setTargetRotation(this.targetRotationY);
        }
        this.avatarModel.update(delta, time);
        if (this.features && typeof this.features.update === 'function') {
          this.features.update(delta, time);
        }
        if (this.avatarModel.animations) {
          this.avatarRotationY = this.avatarModel.animations.avatarRotationY;
        }
      } else {
        this.avatarRotationY += (this.targetRotationY - this.avatarRotationY) * 0.12;
        if (this.avatarRoot) {
          this.avatarRoot.rotation.y = this.avatarRotationY;
        }

        // 2. Subtle Idle Breathing Motion
        const breath = Math.sin(time * 1.6) * 0.003;
        if (this.chestGroup) {
          this.chestGroup.position.y = 1.22 + breath;
        }
        if (this.headGroup) {
          this.headGroup.position.y = 1.54 + breath * 0.6;
        }

        // 3. Natural Periodic Eyelid Blinking
        this.blinkTimer += delta;
        if (this.blinkTimer > this.nextBlinkTime) {
          this.isBlinking = true;
          this.blinkProgress += delta * 12; // Quick blink motion
          if (this.blinkProgress >= Math.PI) {
            this.isBlinking = false;
            this.blinkProgress = 0;
            this.blinkTimer = 0;
            this.nextBlinkTime = 2.8 + Math.random() * 2.6; // Random interval
          }
        }

        if (this.eyelids && this.eyelids.length > 0) {
          const lidScaleY = this.isBlinking ? Math.sin(this.blinkProgress) * 0.72 : 0.02;
          this.eyelids.forEach(lid => {
            lid.scale.y = Math.max(0.02, lidScaleY);
          });
        }
      }

      // 4. Smooth Camera Transitions & FOV Damping
      if (this.cameraController && typeof this.cameraController.update === 'function') {
        this.cameraController.update(delta);
        this.cameraZoomFactor = this.cameraController.zoomFactor;
      } else {
        this.camera.position.lerp(this.targetCameraPos, 0.075);
        this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.075);
        this.camera.lookAt(this.currentCameraLookAt);

        // 5. Update FOV with zoom damping
        const aspect = this.camera.aspect;
        const isPortrait = aspect < 0.75;
        const baseFov = isPortrait ?
          CAMERA_STATES[this.currentCameraState].fovPortrait :
          CAMERA_STATES[this.currentCameraState].fovLandscape;
        const targetFov = Math.max(this.minFov, Math.min(this.maxFov, baseFov * this.cameraZoomFactor));
        this.camera.fov += (targetFov - this.camera.fov) * 0.1;
        this.camera.updateProjectionMatrix();
      }

      // 6. Real-time Mirror Rendering (Render from mirror perspective)
      if (this.mirrorRenderTarget && this.mirrorCamera && this.mirrorGlassMesh) {
        this.mirrorGlassMesh.visible = false;
        this.mirrorCamera.position.set(0.92, 1.46, -0.02);
        this.mirrorCamera.lookAt(0, 1.25, 0); // Looking towards avatar

        this.renderer.setRenderTarget(this.mirrorRenderTarget);
        this.renderer.render(this.scene, this.mirrorCamera);
        this.renderer.setRenderTarget(null);

        this.mirrorGlassMesh.visible = true;
      }

      // 7. Render Main Viewport
      this.renderer.render(this.scene, this.camera);
    }

    /**
     * Cleanup resources
     */
    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.stageModel) {
        this.stageModel.dispose(this.scene);
      }
      if (this.wardrobeModel) {
        this.wardrobeModel.dispose(this.scene);
      }
      if (this.vanityModel) {
        this.vanityModel.dispose(this.scene);
      }
      if (this.avatarModel) {
        this.avatarModel.dispose(this.scene);
      }
      if (this.lightingModel) {
        this.lightingModel.dispose(this.scene);
      }
      if (this.themeModel) {
        this.themeModel.dispose(this.scene);
      }
      if (this.cameraController) {
        this.cameraController.dispose();
      }
      if (this.features && typeof this.features.dispose === 'function') {
        this.features.dispose();
        this.features = null;
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
      this.isInitialized = false;
    }
  }

  return new Studio3DEngine();
}));
