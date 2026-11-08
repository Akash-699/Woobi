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

  // Camera Presets configured specifically for Portrait Mobile & Desktop Framing.
  // Instantiated lazily only when Three.js is loaded.
  let CAMERA_STATES = null;

  function createCameraStates() {
    if (typeof THREE === 'undefined') return null;

    CAMERA_STATES = {
      STUDIO_OVERVIEW: {
        position: new THREE.Vector3(-0.10, 1.35, 4.60),
        target: new THREE.Vector3(-0.10, 1.08, -0.15),
        fovLandscape: 42,
        fovPortrait: 56
      },
      WARDROBE_CLOSEUP: {
        position: new THREE.Vector3(-1.65, 1.25, -1.30),
        target: new THREE.Vector3(-1.65, 1.20, -3.50),
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
        position: new THREE.Vector3(1.35, 1.25, -1.75),
        target: new THREE.Vector3(1.60, 1.20, -3.30),
        fovLandscape: 38,
        fovPortrait: 46
      },
      MIRROR_VIEW: {
        position: new THREE.Vector3(1.35, 1.25, -1.75),
        target: new THREE.Vector3(1.60, 1.20, -3.30),
        fovLandscape: 38,
        fovPortrait: 46
      }
    };

    return CAMERA_STATES;
  }

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
      this.cameraStates = null;
      this.targetCameraPos = null;
      this.targetCameraLookAt = null;
      this.currentCameraLookAt = null;

      // Zoom & Distance clamping
      this.cameraZoomFactor = 1.0;
      this.minFov = 26;
      this.maxFov = 66;

      // Interactive 3D Objects for Raycasting
      this.interactiveObjects = [];
      this.raycaster = null;
      this.mouse = null;

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
        proportions: 'slim_fit',
        bodyFat: 25,
        waistDefinition: 70,
        anatomy: {
          female: {
            waist: 70,
            height: 1.70,
            weight: 58
          },
          male: {
            waist: 70,
            height: 1.80,
            weight: 78
          }
        },
        top: 'tank',
        bottom: 'wide_linen',
        shoes: 'sneakers',
        accessories: {
          watch: true,
          earrings: true,
          necklace: false
        }
      };

      // Anatomical Feature Meshes (Breasts, Glutes, Pecs, Shoulders, Stomach)
      this.anatomicalGroup = null;
      this.anatomicalMeshes = {};

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
      this.clock = null;
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
        console.warn('Studio3D: THREE.js library is not loaded');
        if (typeof window !== 'undefined' && typeof window.showStudio3DFallback === 'function') {
          window.showStudio3DFallback('The 3D studio is unavailable offline or without WebGL.');
        }
        return false;
      }

      // Initialize deferred Three.js state
      this.cameraStates = createCameraStates();
      if (!this.targetCameraPos && this.cameraStates) {
        this.targetCameraPos = this.cameraStates.STUDIO_OVERVIEW.position.clone();
        this.targetCameraLookAt = this.cameraStates.STUDIO_OVERVIEW.target.clone();
        this.currentCameraLookAt = this.cameraStates.STUDIO_OVERVIEW.target.clone();
      }
      if (!this.raycaster) this.raycaster = new THREE.Raycaster();
      if (!this.mouse) this.mouse = new THREE.Vector2();
      if (!this.clock) this.clock = new THREE.Clock();

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
          maxZoomFactor: 1.0,
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
        this.renderer.toneMappingExposure = 0.88; // Calibrated exposure preventing washed-out overly bright appearance and preserving rich contrast
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
      // 1. Warm Champagne Travertine Stone Floor Texture (512x512) - Warm Mediterranean Luxury (#D2BEA0)
      const floorCanvas = document.createElement('canvas');
      floorCanvas.width = 512;
      floorCanvas.height = 512;
      const fCtx = floorCanvas.getContext('2d');
      fCtx.fillStyle = '#D2BEA0';
      fCtx.fillRect(0, 0, 512, 512);

      // Travertine horizontal sedimentary striations and tonal layers
      for (let y = 0; y < 512; y += 3) {
        const bandAlpha = 0.08 + Math.sin(y * 0.035) * 0.05 + Math.random() * 0.04;
        fCtx.fillStyle = y % 6 < 3 ? `rgba(203, 177, 141, ${bandAlpha})` : `rgba(225, 212, 192, ${bandAlpha * 1.1})`;
        fCtx.fillRect(0, y, 512, 2.5);
      }

      // Micro-porous travertine voids & mineral grain noise
      const fImg = fCtx.getImageData(0, 0, 512, 512);
      const fd = fImg.data;
      for (let i = 0; i < fd.length; i += 4) {
        const noise = (Math.random() - 0.5) * 14;
        fd[i] = Math.min(255, Math.max(0, fd[i] + noise));
        fd[i + 1] = Math.min(255, Math.max(0, fd[i + 1] + noise * 0.90));
        fd[i + 2] = Math.min(255, Math.max(0, fd[i + 2] + noise * 0.72));
      }
      fCtx.putImageData(fImg, 0, 0);

      // Delicate warm travertine mineral veining with warm taupe and espresso micro-accents
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
      drawVein(fCtx, [{ x: 0, y: 120 }, { x: 160, y: 135 }, { x: 320, y: 125 }, { x: 512, y: 140 }], 'rgba(180, 155, 125, 0.25)', 8);
      drawVein(fCtx, [{ x: 0, y: 260 }, { x: 200, y: 275 }, { x: 390, y: 265 }, { x: 512, y: 285 }], 'rgba(152, 129, 107, 0.20)', 6);
      drawVein(fCtx, [{ x: 0, y: 390 }, { x: 220, y: 405 }, { x: 380, y: 395 }, { x: 512, y: 415 }], 'rgba(235, 218, 192, 0.32)', 10);
      drawVein(fCtx, [{ x: 80, y: 260 }, { x: 220, y: 270 }, { x: 350, y: 265 }], 'rgba(64, 49, 38, 0.08)', 2.5);

      // Travertine tile joint seam lines
      fCtx.strokeStyle = 'rgba(152, 129, 107, 0.32)';
      fCtx.lineWidth = 1.8;
      fCtx.strokeRect(0, 0, 512, 512);

      this.textures.creamMarble = new THREE.CanvasTexture(floorCanvas);
      this.textures.creamMarble.wrapS = THREE.RepeatWrapping;
      this.textures.creamMarble.wrapT = THREE.RepeatWrapping;
      this.textures.creamMarble.repeat.set(4, 4);
      this.textures.champagneStone = this.textures.creamMarble;

      // 1.5. Authentic European Oak Herringbone Parquet Floor & White Shag Rug Textures
      const floorSrc = (typeof window !== 'undefined' && window.WOOBI_HERRINGBONE_FLOOR_DATA)
        ? window.WOOBI_HERRINGBONE_FLOOR_DATA
        : 'assets/herringbone_floor.jpg';
      const floorBumpSrc = (typeof window !== 'undefined' && window.WOOBI_HERRINGBONE_BUMP_DATA)
        ? window.WOOBI_HERRINGBONE_BUMP_DATA
        : 'assets/herringbone_bump.jpg';
      const shagSrc = (typeof window !== 'undefined' && window.WOOBI_SHAG_RUG_DATA)
        ? window.WOOBI_SHAG_RUG_DATA
        : 'assets/shag_rug.png';
      const shagBumpSrc = (typeof window !== 'undefined' && window.WOOBI_SHAG_RUG_BUMP_DATA)
        ? window.WOOBI_SHAG_RUG_BUMP_DATA
        : 'assets/shag_rug_bump.png';

      if (typeof THREE.TextureLoader !== 'undefined') {
        const texLoader = new THREE.TextureLoader();
        const hFloorTex = texLoader.load(floorSrc, (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(10, 10);
          if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
          if (this.themeModel?.floor?.material) {
            this.themeModel.floor.material.map = tex;
            this.themeModel.floor.material.color.setHex(0xFFFFFF);
            this.themeModel.floor.material.needsUpdate = true;
          }
          if (this.fallbackFloorMat) {
            this.fallbackFloorMat.map = tex;
            this.fallbackFloorMat.color.setHex(0xFFFFFF);
            this.fallbackFloorMat.needsUpdate = true;
          }
        });
        hFloorTex.wrapS = THREE.RepeatWrapping;
        hFloorTex.wrapT = THREE.RepeatWrapping;
        hFloorTex.repeat.set(10, 10);
        this.textures.herringboneFloor = hFloorTex;

        const hBumpTex = texLoader.load(floorBumpSrc, (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(10, 10);
          if (this.themeModel?.floor?.material) {
            this.themeModel.floor.material.bumpMap = tex;
            this.themeModel.floor.material.bumpScale = 0.005;
            this.themeModel.floor.material.needsUpdate = true;
          }
          if (this.fallbackFloorMat) {
            this.fallbackFloorMat.bumpMap = tex;
            this.fallbackFloorMat.bumpScale = 0.005;
            this.fallbackFloorMat.needsUpdate = true;
          }
        });
        hBumpTex.wrapS = THREE.RepeatWrapping;
        hBumpTex.wrapT = THREE.RepeatWrapping;
        hBumpTex.repeat.set(10, 10);
        this.textures.herringboneBump = hBumpTex;

        const shagTex = texLoader.load(shagSrc, (tex) => {
          if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
          if (this.stageModel?.shagRugMesh?.material) {
            this.stageModel.shagRugMesh.material.map = tex;
            this.stageModel.shagRugMesh.material.needsUpdate = true;
          }
          if (this.fallbackShagMesh?.material) {
            this.fallbackShagMesh.material.map = tex;
            this.fallbackShagMesh.material.needsUpdate = true;
          }
        });
        this.textures.shagRug = shagTex;

        const shagBumpTex = texLoader.load(shagBumpSrc, (tex) => {
          if (this.stageModel?.shagRugMesh?.material) {
            this.stageModel.shagRugMesh.material.bumpMap = tex;
            this.stageModel.shagRugMesh.material.bumpScale = 0.018;
            this.stageModel.shagRugMesh.material.needsUpdate = true;
          }
          if (this.fallbackShagMesh?.material) {
            this.fallbackShagMesh.material.bumpMap = tex;
            this.fallbackShagMesh.material.bumpScale = 0.018;
            this.fallbackShagMesh.material.needsUpdate = true;
          }
        });
        this.textures.shagRugBump = shagBumpTex;
      }

      // 2. Warm Champagne Travertine Circular Dais Texture (512x512) - Archidea Home Organic Stone Decor
      const rugCanvas = document.createElement('canvas');
      rugCanvas.width = 512;
      rugCanvas.height = 512;
      const rCtx = rugCanvas.getContext('2d');
      rCtx.fillStyle = '#D2BEA0'; // Warm champagne stone base (#D2BEA0)
      rCtx.fillRect(0, 0, 512, 512);

      // Organic travertine clouding and natural tonal patches
      for (let c = 0; c < 18; c++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 512;
        const cRad = 60 + Math.random() * 120;
        const grad = rCtx.createRadialGradient(cx, cy, 5, cx, cy, cRad);
        const isWarm = Math.random() > 0.45;
        grad.addColorStop(0, isWarm ? 'rgba(216, 197, 168, 0.45)' : 'rgba(197, 173, 136, 0.40)');
        grad.addColorStop(1, 'rgba(210, 190, 160, 0)');
        rCtx.fillStyle = grad;
        rCtx.beginPath();
        rCtx.arc(cx, cy, cRad, 0, Math.PI * 2);
        rCtx.fill();
      }

      // Circular dais sedimentary stone rings
      for (let radius = 10; radius < 256; radius += 5) {
        const rAlpha = radius % 15 === 0 ? 0.35 : 0.16;
        rCtx.strokeStyle = radius % 10 === 0 ? `rgba(180, 155, 125, ${rAlpha})` : `rgba(228, 215, 195, ${rAlpha * 1.25})`;
        rCtx.lineWidth = 2.2;
        rCtx.beginPath();
        rCtx.arc(256, 256, radius, 0, Math.PI * 2);
        rCtx.stroke();
      }

      // High-density mineral grain stippling & micro-cavity pores (Archidea Home reference)
      for (let i = 0; i < 9000; i++) {
        const rnd = Math.random();
        if (rnd < 0.45) {
          rCtx.fillStyle = 'rgba(145, 120, 95, 0.38)'; // Dark warm mineral pores
        } else if (rnd < 0.80) {
          rCtx.fillStyle = 'rgba(242, 232, 216, 0.55)'; // Light calcite granules
        } else {
          rCtx.fillStyle = 'rgba(190, 165, 130, 0.40)'; // Sandstone mid-tones
        }
        const size = Math.random() < 0.85 ? 1.5 : 2.5;
        rCtx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
      }
      this.textures.wovenRug = new THREE.CanvasTexture(rugCanvas);

      // 2.5. Dedicated Tactile Stone Bump Texture (512x512) for Dais & Stonework
      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = 512;
      bumpCanvas.height = 512;
      const bCtx = bumpCanvas.getContext('2d');
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 512, 512);

      // Micro-cavities (dark depressions) and crystalline grains (bright peaks)
      for (let i = 0; i < 8000; i++) {
        const isDepression = Math.random() < 0.50;
        bCtx.fillStyle = isDepression ? 'rgba(40, 40, 40, 0.22)' : 'rgba(220, 220, 220, 0.25)';
        const bSize = Math.random() < 0.80 ? 1.2 : 2.4;
        bCtx.fillRect(Math.random() * 512, Math.random() * 512, bSize, bSize);
      }
      this.textures.stoneBump = new THREE.CanvasTexture(bumpCanvas);

      // 3. Natural European Oak Wood Grain (512x1024) - Natural Vertical Timber Grain
      const oakCanvas = document.createElement('canvas');
      oakCanvas.width = 512;
      oakCanvas.height = 1024;
      const oCtx = oakCanvas.getContext('2d');
      const oGrad = oCtx.createLinearGradient(0, 0, 512, 0);
      oGrad.addColorStop(0.00, '#A67644');
      oGrad.addColorStop(0.28, '#B88652');
      oGrad.addColorStop(0.62, '#9A6B3A');
      oGrad.addColorStop(1.00, '#A67644');
      oCtx.fillStyle = oGrad;
      oCtx.fillRect(0, 0, 512, 1024);

      // Vertical fibrous striations and longitudinal pores
      for (let i = 0; i < 480; i++) {
        const x = Math.random() * 512;
        const alpha = 0.06 + Math.random() * 0.16;
        oCtx.strokeStyle = Math.random() > 0.35
          ? `rgba(75, 46, 20, ${alpha})`
          : `rgba(215, 175, 130, ${alpha * 0.75})`;
        oCtx.lineWidth = 0.6 + Math.random() * 2.2;
        oCtx.beginPath();
        oCtx.moveTo(x, 0);
        oCtx.bezierCurveTo(
          x + (Math.random() - 0.5) * 14, 340,
          x + (Math.random() - 0.5) * 14, 680,
          x + (Math.random() - 0.5) * 8, 1024
        );
        oCtx.stroke();
      }

      // Natural timber pores & medullary flecks
      const oImg = oCtx.getImageData(0, 0, 512, 1024);
      const od = oImg.data;
      for (let i = 0; i < od.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
        od[i] = Math.min(255, Math.max(0, od[i] + noise));
        od[i + 1] = Math.min(255, Math.max(0, od[i + 1] + noise * 0.85));
        od[i + 2] = Math.min(255, Math.max(0, od[i + 2] + noise * 0.65));
      }
      oCtx.putImageData(oImg, 0, 0);

      this.textures.oak = new THREE.CanvasTexture(oakCanvas);
      this.textures.oak.wrapS = THREE.RepeatWrapping;
      this.textures.oak.wrapT = THREE.RepeatWrapping;
      this.textures.oak.repeat.set(1.5, 2.0);

      // 3.1 Dedicated Oak Timber Bump Map (256x512)
      const oakBumpCanvas = document.createElement('canvas');
      oakBumpCanvas.width = 256;
      oakBumpCanvas.height = 512;
      const obCtx = oakBumpCanvas.getContext('2d');
      obCtx.fillStyle = '#808080';
      obCtx.fillRect(0, 0, 256, 512);
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 256;
        obCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(220, 220, 220, 0.16)' : 'rgba(35, 35, 35, 0.16)';
        obCtx.lineWidth = 0.5 + Math.random() * 1.8;
        obCtx.beginPath();
        obCtx.moveTo(x, 0);
        obCtx.lineTo(x + (Math.random() - 0.5) * 6, 512);
        obCtx.stroke();
      }
      this.textures.oakBump = new THREE.CanvasTexture(oakBumpCanvas);
      this.textures.oakBump.wrapS = THREE.RepeatWrapping;
      this.textures.oakBump.wrapT = THREE.RepeatWrapping;
      this.textures.oakBump.repeat.set(1.5, 2.0);

      // 3.5. Premium Architectural Interior Wall Limewash Plaster Texture (1024x512)
      // Soft warm beige, ivory, and light greige artisan wall finish
      const plasterCanvas = document.createElement('canvas');
      plasterCanvas.width = 1024;
      plasterCanvas.height = 512;
      const pCtx = plasterCanvas.getContext('2d');

      // Base: Elegant warm greige-ivory neutral (#E2D8CB) with seamless horizontal gradient
      const pBaseGrad = pCtx.createLinearGradient(0, 0, 1024, 0);
      pBaseGrad.addColorStop(0.0, '#E3D9CC');
      pBaseGrad.addColorStop(0.35, '#E0D5C7');
      pBaseGrad.addColorStop(0.70, '#E5DCCD');
      pBaseGrad.addColorStop(1.0, '#E3D9CC'); // Seamless horizontal wrap
      pCtx.fillStyle = pBaseGrad;
      pCtx.fillRect(0, 0, 1024, 512);

      // Subtle multi-scale artisan trowel sweeps (soft, organic, feathered blending)
      // Avoids repetitive blobs or harsh geometric seams
      const trowelPasses = [
        { x: 180, y: 140, rx: 320, ry: 90, rot: -0.08, col: 'rgba(242, 237, 229, 0.18)' }, // Warm ivory highlight
        { x: 740, y: 160, rx: 340, ry: 100, rot: 0.06, col: 'rgba(240, 234, 225, 0.16)' },
        { x: 420, y: 380, rx: 360, ry: 110, rot: -0.05, col: 'rgba(218, 207, 193, 0.14)' }, // Gentle greige undertone
        { x: 890, y: 390, rx: 280, ry: 85, rot: 0.08, col: 'rgba(238, 232, 222, 0.15)' },
        { x: 110, y: 410, rx: 260, ry: 80, rot: -0.04, col: 'rgba(219, 208, 194, 0.13)' },
        { x: 530, y: 220, rx: 290, ry: 95, rot: 0.03, col: 'rgba(244, 239, 232, 0.14)' },
        { x: 0, y: 250, rx: 240, ry: 90, rot: 0.02, col: 'rgba(224, 214, 201, 0.12)' },
        { x: 1024, y: 250, rx: 240, ry: 90, rot: 0.02, col: 'rgba(224, 214, 201, 0.12)' } // Seamless edge wrap
      ];

      for (let t = 0; t < trowelPasses.length; t++) {
        const tp = trowelPasses[t];
        pCtx.save();
        pCtx.beginPath();
        pCtx.ellipse(tp.x, tp.y, tp.rx, tp.ry, tp.rot, 0, Math.PI * 2);
        pCtx.fillStyle = tp.col;
        pCtx.fill();
        pCtx.restore();
      }

      // Fine artisan lime pigment micro-grain (subtle organic tooth without harsh contrast)
      const pImg = pCtx.getImageData(0, 0, 1024, 512);
      const pd = pImg.data;
      for (let i = 0; i < pd.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8.0;
        pd[i] = Math.min(255, Math.max(0, pd[i] + noise));
        pd[i + 1] = Math.min(255, Math.max(0, pd[i + 1] + noise * 0.92));
        pd[i + 2] = Math.min(255, Math.max(0, pd[i + 2] + noise * 0.82));
      }

      // Seamless horizontal edge blend across 48px boundary to guarantee zero visible tiling seam
      const seamWidth = 48;
      for (let y = 0; y < 512; y++) {
        for (let x = 0; x < seamWidth; x++) {
          const leftIdx = (y * 1024 + x) * 4;
          const rightIdx = (y * 1024 + (1024 - seamWidth + x)) * 4;
          const blendFactor = x / seamWidth;
          for (let c = 0; c < 3; c++) {
            const avg = pd[leftIdx + c] * (1 - blendFactor) + pd[rightIdx + c] * blendFactor;
            pd[leftIdx + c] = avg;
            pd[rightIdx + c] = avg;
          }
        }
      }
      pCtx.putImageData(pImg, 0, 0);

      this.textures.sandPlaster = new THREE.CanvasTexture(plasterCanvas);
      this.textures.sandPlaster.wrapS = THREE.RepeatWrapping;
      this.textures.sandPlaster.wrapT = THREE.ClampToEdgeWrapping;
      this.textures.sandPlaster.repeat.set(2, 1);

      // 3.6. Dedicated Architectural Wall Plaster Bump Map (512x256)
      // Delicate micro-stipple relief for soft, matte light dispersion
      const wallBumpCanvas = document.createElement('canvas');
      wallBumpCanvas.width = 512;
      wallBumpCanvas.height = 256;
      const wbCtx = wallBumpCanvas.getContext('2d');
      wbCtx.fillStyle = '#808080';
      wbCtx.fillRect(0, 0, 512, 256);

      const wbImg = wbCtx.getImageData(0, 0, 512, 256);
      const wbd = wbImg.data;
      for (let i = 0; i < wbd.length; i += 4) {
        const bNoise = (Math.random() - 0.5) * 12.0;
        const val = Math.min(255, Math.max(0, 128 + bNoise));
        wbd[i] = val;
        wbd[i + 1] = val;
        wbd[i + 2] = val;
      }

      // Seamless edge blend for bump map
      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 24; x++) {
          const leftIdx = (y * 512 + x) * 4;
          const rightIdx = (y * 512 + (512 - 24 + x)) * 4;
          const blendFactor = x / 24;
          const avg = wbd[leftIdx] * (1 - blendFactor) + wbd[rightIdx] * blendFactor;
          wbd[leftIdx] = avg;
          wbd[leftIdx + 1] = avg;
          wbd[leftIdx + 2] = avg;
          wbd[rightIdx] = avg;
          wbd[rightIdx + 1] = avg;
          wbd[rightIdx + 2] = avg;
        }
      }
      wbCtx.putImageData(wbImg, 0, 0);

      this.textures.wallBump = new THREE.CanvasTexture(wallBumpCanvas);
      this.textures.wallBump.wrapS = THREE.RepeatWrapping;
      this.textures.wallBump.wrapT = THREE.ClampToEdgeWrapping;
      this.textures.wallBump.repeat.set(2, 1);

      // 3.7. Authentic Red-Brown Brick Wall Texture (User-Uploaded Reference)
      const brickSrc = (typeof window !== 'undefined' && window.WOOBI_BRICK_WALL_DATA)
        ? window.WOOBI_BRICK_WALL_DATA
        : 'assets/brick_wall.jpg';

      if (typeof THREE.TextureLoader !== 'undefined') {
        const textureLoader = new THREE.TextureLoader();
        const brickTex = textureLoader.load(
          brickSrc,
          (loadedTex) => {
            loadedTex.wrapS = THREE.RepeatWrapping;
            loadedTex.wrapT = THREE.RepeatWrapping;
            // Cylindrical wall is 34m wide x 8m high; repeat 6 horizontally and 2 vertically
            loadedTex.repeat.set(6, 2);
            if (THREE.sRGBEncoding) {
              loadedTex.encoding = THREE.sRGBEncoding;
            }
            if (this.themeModel && this.themeModel.materials && this.themeModel.materials.wallMat) {
              this.themeModel.materials.wallMat.map = loadedTex;
              this.themeModel.materials.wallMat.color.setHex(0xFFFFFF);
              this.themeModel.materials.wallMat.needsUpdate = true;
            }
            if (this.themeModel && this.themeModel.backWall && this.themeModel.backWall.material) {
              this.themeModel.backWall.material.map = loadedTex;
              this.themeModel.backWall.material.color.setHex(0xFFFFFF);
              this.themeModel.backWall.material.needsUpdate = true;
            }
            if (this.fallbackWallMat) {
              this.fallbackWallMat.map = loadedTex;
              this.fallbackWallMat.color.setHex(0xFFFFFF);
              this.fallbackWallMat.needsUpdate = true;
            }
          },
          undefined,
          (err) => {
            console.warn('Studio3D: Could not load brick wall texture, falling back to procedural wall texture.', err);
          }
        );
        brickTex.wrapS = THREE.RepeatWrapping;
        brickTex.wrapT = THREE.RepeatWrapping;
        brickTex.repeat.set(6, 2);
        this.textures.brickWall = brickTex;
      }

      // 4. Warm Beige Limestone / Travertine for Vanity Countertop (#CBB18D)
      const mCanvas = document.createElement('canvas');
      mCanvas.width = 512;
      mCanvas.height = 512;
      const mCtx = mCanvas.getContext('2d');
      mCtx.fillStyle = '#CBB18D';
      mCtx.fillRect(0, 0, 512, 512);

      // Travertine sedimentary bands
      for (let y = 0; y < 512; y += 4) {
        const bandAlpha = 0.12 + Math.sin(y * 0.04) * 0.06;
        mCtx.fillStyle = y % 8 < 4 ? `rgba(218, 196, 168, ${bandAlpha})` : `rgba(180, 155, 125, ${bandAlpha * 0.9})`;
        mCtx.fillRect(0, y, 512, 3);
      }

      // Micro mineral speckling
      for (let i = 0; i < 4000; i++) {
        mCtx.fillStyle = Math.random() < 0.5 ? 'rgba(152, 129, 107, 0.28)' : 'rgba(235, 220, 198, 0.35)';
        mCtx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
      }

      // Natural limestone veining
      drawVein(mCtx, [{ x: 0, y: 110 }, { x: 180, y: 155 }, { x: 340, y: 140 }, { x: 512, y: 220 }], 'rgba(152, 129, 107, 0.28)', 6);
      drawVein(mCtx, [{ x: 50, y: 20 }, { x: 220, y: 210 }, { x: 390, y: 360 }, { x: 512, y: 440 }], 'rgba(230, 212, 188, 0.35)', 8);
      drawVein(mCtx, [{ x: 120, y: 400 }, { x: 260, y: 430 }, { x: 440, y: 410 }], 'rgba(64, 49, 38, 0.12)', 2.0);

      this.textures.calacatta = new THREE.CanvasTexture(mCanvas);
      this.textures.limestone = this.textures.calacatta;

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
        // Calibrate lighting intensity multiplier to soften harsh highlights and prevent washed-out appearance
        this.lightingController.setIntensityMultiplier(0.78);
        if (this.lightingModel.ambientLight) {
          this.lightingModel.ambientLight.color.setHex(0xEAD8C2);
          this.lightingModel.ambientLight.intensity = 0.32;
        }
        if (this.lightingModel.fillLight) {
          this.lightingModel.fillLight.color.setHex(0xE8D5C0);
          this.lightingModel.fillLight.intensity = 0.22;
        }
        if (this.lightingModel.keySunlight) {
          this.lightingModel.keySunlight.color.setHex(0xFFEED4);
          this.lightingModel.keySunlight.intensity = 0.88;
        }
        if (this.lightingModel.rimLight) {
          this.lightingModel.rimLight.color.setHex(0xF5D6A8);
          this.lightingModel.rimLight.intensity = 0.65;
        }
        if (this.lightingModel.vanitySpot) {
          this.lightingModel.vanitySpot.intensity = 0.38;
        }
        if (this.lightingModel.wardrobeSpot) {
          this.lightingModel.wardrobeSpot.intensity = 0.30;
        }
        if (this.lightingModel.keySunlight && this.lightingModel.keySunlight.shadow) {
          const d = 5.5;
          this.lightingModel.keySunlight.shadow.camera.left = -d;
          this.lightingModel.keySunlight.shadow.camera.right = d;
          this.lightingModel.keySunlight.shadow.camera.top = d;
          this.lightingModel.keySunlight.shadow.camera.bottom = -d;
          this.lightingModel.keySunlight.shadow.camera.far = 20.0;
          this.lightingModel.keySunlight.shadow.bias = -0.0003;
          this.lightingModel.keySunlight.shadow.normalBias = 0.02;
          this.lightingModel.keySunlight.shadow.radius = 1.6;
          if (typeof this.lightingModel.keySunlight.shadow.camera.updateProjectionMatrix === 'function') {
            this.lightingModel.keySunlight.shadow.camera.updateProjectionMatrix();
          }
        }
        return;
      }

      // Warm, serene ambient illumination (calibrated to provide clear chiaroscuro and depth)
      const ambientLight = new THREE.AmbientLight(0xEAD8C2, 0.32);
      this.scene.add(ambientLight);

      // Primary Key Sunlight (Diagonal morning sunlight streaming from upper right)
      const keySunlight = new THREE.DirectionalLight(0xFFEED4, 0.88);
      keySunlight.position.set(2.8, 4.8, 3.0);
      keySunlight.castShadow = true;
      keySunlight.shadow.mapSize.width = 1024;
      keySunlight.shadow.mapSize.height = 1024;
      keySunlight.shadow.camera.near = 0.5;
      keySunlight.shadow.camera.far = 20.0;
      keySunlight.shadow.bias = -0.0003;
      keySunlight.shadow.normalBias = 0.02;
      keySunlight.shadow.radius = 1.6;
      const d = 5.5; // Wide frustum bounds covering stage, wardrobe, and floor without cutoff
      keySunlight.shadow.camera.left = -d;
      keySunlight.shadow.camera.right = d;
      keySunlight.shadow.camera.top = d;
      keySunlight.shadow.camera.bottom = -d;
      this.scene.add(keySunlight);

      // Soft Fill Light from left to soften shadows on wardrobe and body
      const fillLight = new THREE.DirectionalLight(0xE8D5C0, 0.22);
      fillLight.position.set(-2.6, 2.8, 1.6);
      this.scene.add(fillLight);

      // Warm Golden Rim Light for hair and shoulder separation from background
      const rimLight = new THREE.DirectionalLight(0xF5D6A8, 0.65);
      rimLight.position.set(0, 3.6, -2.4);
      this.scene.add(rimLight);

      // Soft Warm Interior Fill for Wardrobe (Toned down so oak wood does not blow out)
      const wardrobeSpot = new THREE.SpotLight(0xFFF2DE, 0.30, 5.6, Math.PI / 4, 0.45, 1.2);
      wardrobeSpot.position.set(-1.65, 3.4, -2.10);
      wardrobeSpot.target.position.set(-1.65, 1.22, -3.50);
      this.scene.add(wardrobeSpot);
      this.scene.add(wardrobeSpot.target);

      const vanitySpot = new THREE.SpotLight(0xFFF2DE, 0.38, 5.6, Math.PI / 4, 0.45, 1.2);
      vanitySpot.position.set(1.60, 3.5, -2.00);
      vanitySpot.target.position.set(1.60, 1.20, -3.30);
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
        const themePreset = (window.WoobiTheme.THEME_PRESETS && window.WoobiTheme.THEME_PRESETS['mediterranean-luxury'])
          ? 'mediterranean-luxury'
          : 'luxury-cream';
        this.themeModel = window.WoobiTheme.createStudioTheme(this.scene, this.textures, themePreset, THREE);
        return;
      }

      // 1. European Oak Herringbone Parquet Floor with Tactile Relief
      const floorGeo = new THREE.PlaneGeometry(28, 28);
      const floorMat = new THREE.MeshStandardMaterial({
        map: this.textures.herringboneFloor || this.textures.champagneStone || null,
        bumpMap: this.textures.herringboneBump || this.textures.stoneBump || null,
        bumpScale: this.textures.herringboneFloor ? 0.005 : 0.003,
        roughness: 0.58,
        metalness: 0.02,
        color: this.textures.herringboneFloor ? 0xFFFFFF : 0xC49B67
      });
      this.fallbackFloorMat = floorMat;
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.receiveShadow = true;
      this.scene.add(floor);

      // 2. Architectural Wall Material (Authentic Brick Wall with Plaster Fallback)
      this.fallbackWallMat = new THREE.MeshStandardMaterial({
        map: this.textures.brickWall || this.textures.sandPlaster || null,
        bumpMap: this.textures.wallBump || this.textures.stoneBump || null,
        bumpScale: 0.0020,
        color: this.textures.brickWall ? 0xFFFFFF : 0xDCC5A3,
        roughness: 0.85,
        metalness: 0.01,
        side: THREE.BackSide
      });
      const wallMat = this.fallbackWallMat;
      const wallGeo = new THREE.CylinderGeometry(12.0, 12.0, 8.0, 48, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
      const backWall = new THREE.Mesh(wallGeo, wallMat);
      backWall.position.set(0, 4.0, 7.0);
      backWall.rotation.y = Math.PI; // Orient curved wall behind avatar towards negative Z
      backWall.receiveShadow = false; // Prevents directional shadow frustum from cutting off horizontally across the curved back wall
      this.scene.add(backWall);

      // Opposing Front Architectural Wall (Completes 360° Room Enclosure for Mirror Reflections)
      const frontWallGeo = new THREE.CylinderGeometry(12.0, 12.0, 8.0, 48, 1, true, -Math.PI * 0.55, Math.PI * 1.1);
      const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
      frontWall.position.set(0, 4.0, 7.0);
      frontWall.receiveShadow = false;
      this.scene.add(frontWall);

      // Architectural Studio Ceiling
      const ceilingGeo = new THREE.CircleGeometry(12.0, 48);
      const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xF5EFEB, roughness: 0.96, side: THREE.BackSide });
      const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.set(0, 8.0, 7.0);
      this.scene.add(ceiling);

      // Architectural Baseboard Skirting
      const baseboardGeo = new THREE.CylinderGeometry(11.96, 11.96, 0.22, 64, 1, true);
      const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x362518, roughness: 0.5, side: THREE.BackSide });
      const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
      baseboard.position.set(0, 0.11, 7.0);
      this.scene.add(baseboard);

      // 3. Diagonal Window Mullion Sunlight Shadow Projected on Wall/Floor
      const windowShadowGroup = new THREE.Group();
      windowShadowGroup.position.set(1.4, 2.1, -1.8);
      windowShadowGroup.rotation.set(-0.25, 0.45, -0.2);
      windowShadowGroup.visible = false; // Hidden to remove window glare projection from wall and mirror

      const shadowBarMat = new THREE.MeshBasicMaterial({
        color: 0x3D2B1E, // Deep espresso contrast accent (#3D2B1E)
        transparent: true,
        opacity: 0.10
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
      studioLightGroup.position.set(-2.15, 2.95, 1.10);
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
      // Hidden to eliminate dark strip artifacts on floor when zooming out fully
      const fgFoliageGroup = new THREE.Group();
      fgFoliageGroup.position.set(-1.85, 0.15, 2.40);
      fgFoliageGroup.visible = false;

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
        fgLeaf.visible = false;
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
      rugGroup.scale.set(0.88, 1.0, 0.88);

      // 1. Deep ground contact shadow disc
      const shadowGeo = new THREE.CircleGeometry(1.65, 64);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x22180F, transparent: true, opacity: 0.30 });
      const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.002;
      rugGroup.add(shadowDisc);

      // 1.5. Large Plush White Shaggy Bouclé Circular Rug (Ground level beneath dais)
      const shagGeo = new THREE.CylinderGeometry(1.50, 1.515, 0.012, 64);
      const shagMat = new THREE.MeshStandardMaterial({
        map: this.textures.shagRug || null,
        bumpMap: this.textures.shagRugBump || this.textures.stoneBump || null,
        bumpScale: 0.018,
        roughness: 0.92,
        metalness: 0.0,
        color: 0xFFFFFF,
        transparent: true,
        alphaTest: 0.02
      });
      const shagRug = new THREE.Mesh(shagGeo, shagMat);
      shagRug.position.y = 0.006;
      shagRug.receiveShadow = true;
      rugGroup.add(shagRug);
      this.fallbackShagMesh = shagRug;

      const rugRadius = 0.95;
      const rugThickness = 0.080;
      const rugGeo = new THREE.CylinderGeometry(rugRadius, rugRadius + 0.012, rugThickness, 64);
      const rugMat = new THREE.MeshStandardMaterial({
        map: this.textures.champagneStone || this.textures.wovenRug,
        bumpMap: this.textures.stoneBump || null,
        bumpScale: 0.012,
        roughness: 0.70,
        metalness: 0.02,
        color: 0xD2BEA0
      });

      // Complete concentric architectural base circle beneath dais
      const baseCircle = new THREE.Mesh(
        new THREE.CylinderGeometry(1.12, 1.132, 0.008, 64),
        rugMat
      );
      baseCircle.position.set(0, 0.004, 0);
      baseCircle.receiveShadow = true;
      rugGroup.add(baseCircle);
      const rug = new THREE.Mesh(rugGeo, rugMat);
      rug.position.y = rugThickness / 2;
      rug.receiveShadow = true;
      rug.castShadow = true;
      rugGroup.add(rug);

      const trimGeo = new THREE.TorusGeometry(rugRadius + 0.004, 0.012, 16, 64);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xCBB18D, roughness: 0.78 });
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
      wardrobeGroup.position.set(-1.65, 0, -3.50);
      wardrobeGroup.rotation.y = 0.35;

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
          // Widen the wardrobe horizontally (1.38x) for a spacious, modern open closet layout
          model.scale.set(scale * 1.38, scale, scale);
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
      // 3-Tier balanced layout: Bottom footwear shelf (0.12), Footwear separator (0.60), Upper shelf (2.22)
      const shelfYPositions = [0.12, 0.60, 2.22];
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
      shelfLight2.position.set(0, 1.35, 0.14);
      wardrobeGroup.add(shelfLight2);

      const shelfLight3 = new THREE.PointLight(0xFFA834, 0.80, 1.8);
      shelfLight3.position.set(0, 0.55, 0.14);
      wardrobeGroup.add(shelfLight3);

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

      // 2. MAIN CLOTHING RAIL & SHIRTS ON WOODEN HANGERS (Positioned slightly upwards, balanced)
      const railY = 2.16;
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, width - 0.08, 16), brassMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, railY, 0);
      rail.castShadow = true;
      wardrobeGroup.add(rail);

      // Shirts & blazers neatly hung, moderately sized so they don't dominate
      const hangerGarments = [
        { x: -0.32, color: 0xF4ECE1, len: 0.48, type: 'shirt' },
        { x: -0.16, color: 0x33363B, len: 0.52, type: 'blazer' },
        { x: 0.00,  color: 0xFAF8F5, len: 0.46, type: 'shirt' },
        { x: 0.16,  color: 0x585B62, len: 0.50, type: 'blazer' },
        { x: 0.32,  color: 0xD4C5B2, len: 0.48, type: 'shirt' }
      ];

      hangerGarments.forEach((g) => {
        const hangerGroup = new THREE.Group();
        hangerGroup.position.set(g.x, railY, 0);

        // Wooden Wishbone Hanger
        const hangerBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, 0.32, 12),
          oakMat
        );
        hangerBar.rotation.z = Math.PI / 2;
        hangerBar.position.y = -0.04;
        hangerGroup.add(hangerBar);

        const hangerHook = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 8, 16, Math.PI * 1.3), brassMat);
        hangerHook.position.set(0, 0.014, 0);
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
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.12, g.len, 20);
        bodyGeo.scale(1.2, 1.0, 0.65);
        const bodyMesh = new THREE.Mesh(bodyGeo, gMat);
        bodyMesh.position.y = -g.len / 2;
        bodyMesh.castShadow = true;
        garmentGroup.add(bodyMesh);

        // Collar / Lapels
        const collar = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 0.035, 0.09),
          gMat
        );
        collar.position.set(0, -0.02, 0.02);
        garmentGroup.add(collar);

        hangerGroup.add(garmentGroup);
        wardrobeGroup.add(hangerGroup);
      });

      // 3. HORIZONTAL HANGING ROD DIRECTLY BELOW SHIRTS & VERTICALLY HANGING TROUSERS
      const trouserRailY = 1.38;
      const trouserRail = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, width - 0.08, 16), brassMat);
      trouserRail.rotation.z = Math.PI / 2;
      trouserRail.position.set(0, trouserRailY, 0);
      trouserRail.castShadow = true;
      wardrobeGroup.add(trouserRail);

      // Vertically hanging trousers on clip hangers
      const trouserSpecs = [
        { x: -0.30, color: 0x1E2A3A, len: 0.44 },
        { x: -0.15, color: 0xC4AA78, len: 0.42 },
        { x: 0.00,  color: 0x3A3A3C, len: 0.46 },
        { x: 0.15,  color: 0x5C6B4A, len: 0.43 },
        { x: 0.30,  color: 0xD4B896, len: 0.42 }
      ];

      trouserSpecs.forEach((tr) => {
        const trHanger = new THREE.Group();
        trHanger.position.set(tr.x, trouserRailY, 0);

        // Oak clip hanger bar
        const clipBar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 12), oakMat);
        clipBar.rotation.z = Math.PI / 2;
        clipBar.position.y = -0.035;
        trHanger.add(clipBar);

        const hook = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0025, 8, 14, Math.PI * 1.3), brassMat);
        hook.position.set(0, 0.010, 0);
        trHanger.add(hook);

        const trMat = new THREE.MeshStandardMaterial({ color: tr.color, roughness: 0.70 });

        // Waistband
        const waistband = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.026, 0.05), trMat);
        waistband.position.set(0, -0.055, 0);
        trHanger.add(waistband);

        // Two vertical hanging legs
        [-0.050, 0.050].forEach((lx) => {
          const legGeo = new THREE.CylinderGeometry(0.036, 0.028, tr.len, 14);
          legGeo.scale(0.65, 1.0, 1.0);
          const leg = new THREE.Mesh(legGeo, trMat);
          leg.position.set(lx, -0.068 - tr.len / 2, 0);
          leg.castShadow = true;
          trHanger.add(leg);
        });

        wardrobeGroup.add(trHanger);
      });

      // 4. DEDICATED FOOTWEAR AREA BELOW TROUSERS (Shoes, Sneakers, and Sandals)
      const shoeMatWhite = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.40 });
      const shoeMatBeige = new THREE.MeshStandardMaterial({ color: 0xD8C4B0, roughness: 0.45 });
      const shoeMatLoafer = new THREE.MeshStandardMaterial({ color: 0xF2ECE2, roughness: 0.38 });
      const shoeMatSandal = new THREE.MeshStandardMaterial({ color: 0xC49E6C, roughness: 0.45, metalness: 0.02 });

      const footwearItems = [
        { x: -0.35, type: 'sneaker', mat: shoeMatWhite, name: 'White Sneakers' },
        { x: -0.21, type: 'loafer',  mat: shoeMatLoafer, name: 'Tailored Loafers' },
        { x: -0.07, type: 'sandal',  mat: shoeMatSandal, name: 'Tan Slide Sandals' },
        { x: 0.07,  type: 'sandal',  mat: shoeMatBeige,  name: 'Strap Sandals' },
        { x: 0.21,  type: 'heel',    mat: shoeMatBeige,  name: 'Low Heels' },
        { x: 0.35,  type: 'sneaker', mat: shoeMatWhite,  name: 'Court Trainers' }
      ];

      footwearItems.forEach((sh) => {
        const shoePair = new THREE.Group();
        shoePair.position.set(sh.x, 0.14, 0.04);

        [-0.032, 0.032].forEach((offset) => {
          if (sh.type === 'sandal') {
            const sole = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.16), shoeMatSandal);
            sole.position.set(offset, 0.006, 0);
            shoePair.add(sole);

            const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.016, 0.032), sh.mat);
            strap1.position.set(offset, 0.016, 0.03);
            shoePair.add(strap1);

            const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.020, 0.028), sh.mat);
            strap2.position.set(offset, 0.020, -0.02);
            shoePair.add(strap2);
          } else {
            const sole = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.018, 0.16), shoeMatWhite);
            sole.position.set(offset, 0.009, 0);
            shoePair.add(sole);

            const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.038, 14), sh.mat);
            upper.scale.set(1.0, 1.0, 1.8);
            upper.position.set(offset, 0.032, 0.01);
            upper.castShadow = true;
            shoePair.add(upper);
          }
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
      vanityGroup.position.set(1.60, 0, -3.30);
      vanityGroup.rotation.y = -0.32; // Angled gracefully towards stage

      const brassMat = new THREE.MeshStandardMaterial({
        color: COLOR_PALETTE.warmBrass,
        metalness: 0.88,
        roughness: 0.22
      });

      // 1. Warm Beige Limestone / Stone Countertop Table (#CBB18D)
      const tableHeight = 0.84;
      const tableWidth = 0.98;
      const tableDepth = 0.46;

      const marbleMat = new THREE.MeshStandardMaterial({
        map: this.textures.calacatta || this.textures.champagneStone,
        bumpMap: this.textures.stoneBump || null,
        bumpScale: 0.005,
        roughness: 0.42,
        metalness: 0.02,
        color: 0xCBB18D
      });
      const topSlab = new THREE.Mesh(new THREE.BoxGeometry(tableWidth, 0.065, tableDepth), marbleMat);
      topSlab.position.set(0, tableHeight, 0);
      topSlab.castShadow = true;
      topSlab.receiveShadow = true;
      vanityGroup.add(topSlab);

      // Deep Espresso Dark Table Legs (#362B22)
      const legsMat = new THREE.MeshStandardMaterial({
        color: 0x362B22,
        roughness: 0.55,
        metalness: 0.40
      });
      const legGeo = new THREE.BoxGeometry(0.030, tableHeight - 0.03, 0.030);
      const legPositions = [
        [-tableWidth / 2 + 0.035, -tableDepth / 2 + 0.035],
        [tableWidth / 2 - 0.035, -tableDepth / 2 + 0.035],
        [-tableWidth / 2 + 0.035, tableDepth / 2 - 0.035],
        [tableWidth / 2 - 0.035, tableDepth / 2 - 0.035]
      ];
      legPositions.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legsMat);
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

      // Cream Bouclé Upholstery Material
      const stoolMat = new THREE.MeshStandardMaterial({
        color: 0xEEE6DC,
        roughness: 0.85,
        metalness: 0.02
      });

      // Warm Champagne Brass Plinth Base Ring
      const stoolPlinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.05, 36),
        brassMat
      );
      stoolPlinth.position.y = 0.025;
      stoolPlinth.castShadow = true;
      stoolGroup.add(stoolPlinth);

      // Soft Upholstered Ottoman Drum Body
      const stoolBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.245, 0.238, 0.33, 36),
        stoolMat
      );
      stoolBody.position.y = 0.215;
      stoolBody.castShadow = true;
      stoolGroup.add(stoolBody);

      // Plush Cream Cushion Seat
      const cushionMat = new THREE.MeshStandardMaterial({
        color: 0xF8F4EE,
        roughness: 0.80,
        metalness: 0.02
      });
      const stoolCushion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.245, 0.07, 36),
        cushionMat
      );
      stoolCushion.position.y = 0.415;
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

      // Attempt authentic Woobi Vanity GLB loading
      if (typeof THREE.GLTFLoader !== 'undefined') {
        const gltfLoader = new THREE.GLTFLoader();
        const vanityPaths = [
          '3D - Mirror and stuffs/woobi_vanity.glb',
          'woobi_vanity.glb',
          'seren_vanity.glb'
        ];
        const tryLoadGLB = (idx) => {
          if (idx >= vanityPaths.length) return;
          gltfLoader.load(vanityPaths[idx], (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0);
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.name === 'Mirror_Surface' || child.name.toLowerCase().includes('mirror_surface')) {
                  this.mirrorGlassMesh = child;
                }
              }
            });
            topSlab.visible = false;
            mirrorGroup.visible = false;
            perfumeGroup.visible = false;
            brushHolder.visible = false;
            vaseGroup.visible = false;
            stoolGroup.visible = false;
            vanityGroup.add(model);
          }, undefined, () => tryLoadGLB(idx + 1));
        };
        tryLoadGLB(0);
      }

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

      // 5. WEARABLE OUTFIT: Off-White Ribbed Crop Tank Top with Tactile Ribbed Depth
      const tankMat = new THREE.MeshStandardMaterial({
        map: this.textures.ribbedKnit,
        bumpMap: this.textures.ribbedKnit,
        bumpScale: 0.0025,
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

      // 7. HIGH-WAISTED FLUID WIDE-LEG TAILORED TROUSERS WITH TACTILE LINEN WEAVE
      const trouserMat = new THREE.MeshStandardMaterial({
        map: this.textures.linenWeave,
        bumpMap: this.textures.linenWeave,
        bumpScale: 0.0020,
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

      // Fluid Wide Legs with Front Creases and Natural Fashion Stance
      [-1, 1].forEach((side) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(side * 0.088, 0.86, 0);
        legGroup.rotation.y = side * -0.06;

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

      // 8. MINIMALIST CHUNKY WHITE PLATFORM SNEAKERS WITH NATURAL OUTWARD TOE FLARE
      const sneakerMat = new THREE.MeshStandardMaterial({
        color: COLOR_PALETTE.sneakersWhite,
        roughness: 0.28,
        metalness: 0.02
      });
      const soleMat = new THREE.MeshStandardMaterial({
        color: 0xEDE8DF,
        roughness: 0.58
      });

      [-1, 1].forEach((side) => {
        const sneaker = new THREE.Group();
        sneaker.position.set(side * 0.092, 0.018, 0.032);
        sneaker.rotation.y = side * -0.10;

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

      // 9. LOCALIZED HIGH-FIDELITY FOOT CONTACT SHADOWS DIRECTLY ON STAGE DAIS
      [-1, 1].forEach((side) => {
        const shadowGeo = new THREE.CircleGeometry(0.062, 32);
        const shadowMat = new THREE.MeshBasicMaterial({
          color: 0x1A140E,
          transparent: true,
          opacity: 0.42,
          depthWrite: false
        });
        const footShadow = new THREE.Mesh(shadowGeo, shadowMat);
        footShadow.rotation.x = -Math.PI / 2;
        footShadow.rotation.z = side * 0.10;
        footShadow.scale.set(0.70, 1.55, 1.0);
        footShadow.position.set(side * 0.092, 0.001, 0.032);
        this.avatarRoot.add(footShadow);
      });

      // Enable complete self-shadowing and contact shadow reception across all avatar anatomical and garment meshes
      this.avatarRoot.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
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
            if (this.sculptedAvatarGroup) {
              this.sculptedAvatarGroup.visible = false;
              this.sculptedAvatarGroup.traverse((c) => { c.visible = false; });
              if (this.avatarRoot && this.avatarRoot.children.includes(this.sculptedAvatarGroup)) {
                this.avatarRoot.remove(this.sculptedAvatarGroup);
              }
            }
            if (typeof this.buildAnatomicalFeatures === 'function') {
              this.buildAnatomicalFeatures(this.avatarConfig.gender || 'female');
            }
            if (typeof this.updateBodyMeshScale === 'function') {
              this.updateBodyMeshScale();
            }
          },
          (err) => {
            console.log('Studio3D: Using high-definition sculpted avatar.');
            if (typeof this.buildAnatomicalFeatures === 'function') {
              this.buildAnatomicalFeatures(this.avatarConfig.gender || 'female');
            }
            if (typeof this.updateBodyMeshScale === 'function') {
              this.updateBodyMeshScale();
            }
          }
        );
        return;
      }

      if (typeof THREE.GLTFLoader === 'undefined') {
        return;
      }

      const loader = new THREE.GLTFLoader();
      if (typeof MeshoptDecoder !== 'undefined') {
        loader.setMeshoptDecoder(MeshoptDecoder);
      } else if (typeof window !== 'undefined' && window.MeshoptDecoder) {
        loader.setMeshoptDecoder(window.MeshoptDecoder);
      }
      const modelUrls = [
        'assets/models/avatar_female.glb',
        'female_mannequin.glb',
        'Woobi_Female_Mannequin_Fixed.glb?v=human_v2',
        'woobi_female_mannequin.glb?v=human_v2',
        '3D - Mannequin By Astra/Woobi_Female_Mannequin.glb?v=human_v2',
        'seren_avatar.glb'
      ];

      const tryLoad = (index) => {
        if (index >= modelUrls.length) return;
        const url = modelUrls[index];

        loader.load(
          url,
          (gltf) => {
            console.log('Studio3D: Rigged 3D avatar loaded successfully from', url);
            const model = gltf.scene;

            // Scale & position model correctly onto the elevated stage dais (avatarRoot provides the 0.080m dais elevation)
            model.scale.set(0.96, 0.96, 0.96);
            model.position.set(0, 0, 0);

            // Traverse and apply luxury reference styling
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                  child.material.roughnessMap = null;
                  child.material.metalnessMap = null;
                  if ('clearcoat' in child.material) child.material.clearcoat = 0;
                  child.material.roughness = 0.85;
                  child.material.metalness = 0.0;
                }

                // Configure skin, hair, and clothing materials to match reference
                if (child.name.includes('Hair')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.honeyOak).multiplyScalar(0.2);
                  child.material.roughness = 0.78;
                  this.hairMaterials.push(child.material);
                } else if (child.name.includes('Head') || child.name.includes('Body')) {
                  this.skinMaterials.push(child.material);
                  child.material.roughness = 0.82;
                } else if (child.name.includes('Top') || child.name.includes('Shirt')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.cropTankIvory);
                  child.material.roughness = 0.85;
                } else if (child.name.includes('Bottom') || child.name.includes('Pants')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.trousersSand);
                  child.material.roughness = 0.88;
                } else if (child.name.includes('Footwear') || child.name.includes('Shoes')) {
                  child.material.color = new THREE.Color(COLOR_PALETTE.sneakersWhite);
                  child.material.roughness = 0.72;
                }

                if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                  if (!child.geometry.userData.basePositions) {
                    child.geometry.userData.basePositions = new Float32Array(child.geometry.attributes.position.array);
                  }
                }
              }
            });

            // Smoothly replace sculpted fallback with the rigged model
            this.gltfAvatarGroup = model;
            this.avatarRoot.add(this.gltfAvatarGroup);
            if (this.sculptedAvatarGroup) {
              this.sculptedAvatarGroup.visible = false;
              this.sculptedAvatarGroup.traverse((c) => { c.visible = false; });
              if (this.avatarRoot && this.avatarRoot.children.includes(this.sculptedAvatarGroup)) {
                this.avatarRoot.remove(this.sculptedAvatarGroup);
              }
            }
            this.activeAvatarType = 'glb';
            this.buildAnatomicalFeatures(this.avatarConfig.gender || 'female');
            this.updateBodyMeshScale();
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
     * Switch between Female and Male Mannequin Models
     */
    setMannequinGender(gender, callback) {
      if (this.avatarModel && typeof this.avatarModel.setMannequinGender === 'function') {
        return this.avatarModel.setMannequinGender(gender, (model) => {
          this.gltfAvatarGroup = this.avatarModel.gltfAvatarGroup;
          this.activeAvatarType = this.avatarModel.activeAvatarType;
          if (callback) callback(model);
        });
      }
      if (this.avatarController && typeof this.avatarController.setGenderPresentation === 'function') {
        this.avatarController.setGenderPresentation(gender);
      }
    }

    /**
     * Setups Real-time Mirror Camera & Render Target
     */
    setupMirrorRenderPipeline() {
      try {
        if (this.vanityModel && this.vanityModel.reflection && this.vanityModel.reflection.renderTarget) {
          this.mirrorRenderTarget = this.vanityModel.reflection.renderTarget;
          this.mirrorCamera = this.vanityModel.reflection.mirrorCamera;
          const targetMesh = (this.vanityModel && this.vanityModel.mirrorGlassMesh) ? this.vanityModel.mirrorGlassMesh : this.mirrorGlassMesh;
          if (targetMesh && this.vanityModel.reflection.bindMirrorMesh) {
            this.vanityModel.reflection.bindMirrorMesh(targetMesh, THREE);
          }
          return;
        }

        const renderFormat = (typeof THREE.RGBAFormat !== 'undefined') ? THREE.RGBAFormat : (THREE.RGBFormat || 1022);
        this.mirrorRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
          format: renderFormat,
          generateMipmaps: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter
        });

        this.mirrorCamera = new THREE.PerspectiveCamera(24, 0.62, 1.8, 60);
        this.mirrorCamera.position.set(2.25, 1.25, -3.50);
        this.mirrorCamera.lookAt(0, 1.15, 0);
        this.scene.add(this.mirrorCamera);

        if (this.mirrorGlassMesh) {
          this.mirrorGlassMesh.material = new THREE.MeshBasicMaterial({
            map: this.mirrorRenderTarget.texture,
            toneMapped: false
          });
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

          this.cameraZoomFactor = Math.max(0.7, Math.min(1.0, this.cameraZoomFactor - diff * 0.002));
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
        this.cameraZoomFactor = Math.max(0.7, Math.min(1.0, this.cameraZoomFactor + zoomDelta));
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
      if (!this.canvas || !this.camera || !this.scene || !this.raycaster || !this.mouse) return;
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
      const states = this.cameraStates || CAMERA_STATES;
      if (states && states[stateName]) {
        this.currentCameraState = stateName;
        if (this.targetCameraPos && states[stateName].position) {
          this.targetCameraPos.copy(states[stateName].position);
        }
        if (this.targetCameraLookAt && states[stateName].target) {
          this.targetCameraLookAt.copy(states[stateName].target);
        }
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
     * Avatar Customization API: Body Proportions & Silhouette
     */
    setBodyProportions(preset) {
      this.avatarConfig.proportions = preset;
      if (this.avatarController && typeof this.avatarController.setBodyProportions === 'function') {
        this.avatarController.setBodyProportions(preset);
      }
      this.updateBodyMeshScale();
      this.savePreferences();
    }

    /**
     * Avatar Customization API: Body Fat & Composition Adjustment
     * Adjusts body cross-sectional girth (X & Z) smoothly while maintaining elevation
     */
    setBodyFat(val) {
      const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
      this.avatarConfig.bodyFat = num;
      if (this.avatarController && typeof this.avatarController.setBodyComposition === 'function') {
        this.avatarController.setBodyComposition({ bodyFat: num });
      }
      this.updateBodyMeshScale();
      this.savePreferences();
      return num;
    }

    setWaistDefinition(val) {
      const num = Math.max(0, Math.min(100, parseFloat(val) || 0));
      this.avatarConfig.waistDefinition = num;
      if (this.avatarController && typeof this.avatarController.setBodyComposition === 'function') {
        this.avatarController.setBodyComposition({ waistDefinition: num });
      }
      this.updateBodyMeshScale();
      this.savePreferences();
      return num;
    }

    updateBodyMeshScale() {
      const isMale = (this.avatarConfig.gender === 'masculine' || this.avatarConfig.gender === 'male');
      const anatomy = this.avatarConfig.anatomy ? (isMale ? this.avatarConfig.anatomy.male : this.avatarConfig.anatomy.female) : null;

      const baseHeight = isMale ? 1.80 : 1.70;
      const baseWeight = isMale ? 78 : 58;
      const height = (anatomy && typeof anatomy.height === 'number') ? anatomy.height : baseHeight;
      const weight = (anatomy && typeof anatomy.weight === 'number') ? anatomy.weight : baseWeight;

      const scaleY = height / baseHeight;
      const scaleXZ = Math.sqrt(weight / (baseWeight * Math.max(0.5, scaleY)));

      const preset = this.avatarConfig.proportions || (isMale ? 'athletic' : 'slim_fit');
      let baseScaleX = 1.0;
      let baseScaleY = 1.0;
      let baseScaleZ = 1.0;

      switch (preset) {
        case 'slim_fit':
          baseScaleX = 0.92;
          baseScaleY = 1.02;
          baseScaleZ = 0.90;
          break;
        case 'petite':
          baseScaleX = 0.94;
          baseScaleY = 0.94;
          baseScaleZ = 0.94;
          break;
        case 'tall':
          baseScaleX = 0.98;
          baseScaleY = 1.06;
          baseScaleZ = 0.98;
          break;
        case 'athletic':
          baseScaleX = 1.05;
          baseScaleY = 1.02;
          baseScaleZ = 1.04;
          break;
        case 'curvy':
          baseScaleX = 1.08;
          baseScaleY = 1.00;
          baseScaleZ = 1.08;
          break;
        default:
          baseScaleX = 1.00;
          baseScaleY = 1.00;
          baseScaleZ = 1.00;
      }

      const fat = typeof this.avatarConfig.bodyFat === 'number' ? this.avatarConfig.bodyFat : (isMale ? 20 : 25);
      const fatMultiplier = 0.88 + (fat / 100) * 0.32;

      const waist = (anatomy && typeof anatomy.waist === 'number')
        ? anatomy.waist
        : (typeof this.avatarConfig.waistDefinition === 'number' ? this.avatarConfig.waistDefinition : 70);
      const waistMultiplier = isMale ? 1.0 : (1.08 - (waist / 100) * 0.16);

      const finalScaleX = baseScaleX * scaleXZ * fatMultiplier;
      const finalScaleZ = baseScaleZ * scaleXZ * fatMultiplier;
      const finalScaleY = baseScaleY * scaleY;

      if (this.avatarRoot) {
        this.avatarRoot.scale.set(finalScaleX, finalScaleY, finalScaleZ);
        this.avatarRoot.position.y = 0.080;
      }

      if (this.gltfAvatarGroup) {
        this.gltfAvatarGroup.position.set(0, 0, 0);
      }

      this.updateAnatomy();
    }

    /**
     * Avatar Customization API: Gender Presentation (Swaps Female / Male Mannequin)
     */
    setGenderPresentation(gender) {
      const isMale = (gender === 'masculine' || gender === 'male');
      const targetGender = isMale ? 'male' : 'female';
      this.avatarConfig.gender = targetGender;

      if (isMale) {
        this.loadMannequin('male');
        this.setBodyProportions('athletic');
      } else {
        this.loadMannequin('female');
        this.setBodyProportions('slim_fit');
      }

      if (this.avatarController && typeof this.avatarController.setGenderPresentation === 'function') {
        this.avatarController.setGenderPresentation(gender);
      }

      this.buildAnatomicalFeatures(targetGender);
      this.updateBodyMeshScale();
      this.savePreferences();
    }

    /**
     * Model Display Mode: Stylized Avatar vs. Astra Tailoring Mannequin
     */
    setModelType(type) {
      this.avatarConfig.modelType = type;
      if (type === 'mannequin_female' || type === 'female_mannequin') {
        this.loadMannequin('female');
      } else if (type === 'mannequin_male' || type === 'male_mannequin') {
        this.loadMannequin('male');
      } else {
        // Return to standard avatar
        if (this.gltfAvatarGroup && this.avatarRoot) {
          this.avatarRoot.remove(this.gltfAvatarGroup);
          this.gltfAvatarGroup = null;
        }
        if (this.sculptedAvatarGroup) {
          this.sculptedAvatarGroup.visible = true;
        }
        this.activeAvatarType = 'sculpted';
        this.avatarConfig.modelType = 'avatar';
        this.loadRiggedAvatarGLB();
        this.buildAnatomicalFeatures(this.avatarConfig.gender || 'female');
        this.savePreferences();
      }
    }

    /**
     * Smoothly rotates the active avatar/mannequin to an exact target yaw angle (in radians)
     */
    setAvatarRotation(rad) {
      this.targetRotationY = Number(rad) || 0;
    }

    /**
     * Creates matching warm porcelain PBR material for seamless anatomical blending
     */
    createPorcelainAnatomyMaterial() {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xD9CDBC), // Warm Ivory matching Astra
        roughness: 0.74,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });

      if (this.gltfAvatarGroup) {
        this.gltfAvatarGroup.traverse((child) => {
          if (child.isMesh && child.material && !child.material.map) {
            mat.color.copy(child.material.color);
            mat.roughness = child.material.roughness;
            mat.metalness = child.material.metalness;
          }
        });
      }
      return mat;
    }

    /**
     * Ensures clean, properly fitted basic underwear presentation
     * Male: plain boxer briefs
     * Female: full-coverage briefs & matching bra
     */
    buildMannequinUndergarments(targetGender = 'female') {
      if (!this.gltfAvatarGroup) return;

      const isMale = (targetGender === 'male' || targetGender === 'masculine');

      // Style and configure undergarment meshes with realistic PBR fabric material
      const fabricColor = new THREE.Color(0x222428); // Refined neutral matte charcoal
      this.gltfAvatarGroup.traverse((child) => {
        if (child.isMesh && (child.name === 'Woobi_Female_Brassiere' || child.name === 'Woobi_Female_Briefs' || child.name === 'Woobi_Male_Underwear')) {
          child.visible = true;
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.color.copy(fabricColor);
                mat.roughness = 0.78;
                mat.metalness = 0.0;
              });
            } else {
              child.material.color.copy(fabricColor);
              child.material.roughness = 0.78;
              child.material.metalness = 0.0;
            }
          }
        }
      });
    }

    /**
     * Builds and attaches natural features.
     * Mannequins natively feature understated, graceful, natural contours.
     * Guarantees zero unnatural muscle bumps, zero crude additions, and zero z-fighting.
     */
    buildAnatomicalFeatures(gender = 'female') {
      const isMale = (gender === 'male' || gender === 'masculine');
      const targetGender = isMale ? 'male' : 'female';

      // Clean up previous anatomical group to guarantee zero extraneous objects
      if (this.anatomicalGroup) {
        if (this.avatarRoot) {
          this.avatarRoot.remove(this.anatomicalGroup);
        }
        this.anatomicalGroup.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
              else child.material.dispose();
            }
          }
        });
        this.anatomicalGroup = null;
        this.anatomicalMeshes = {};
      }

      this.buildMannequinUndergarments(targetGender);
      this.updateAnatomy();
    }

    /**
     * Guarantees that the 3D mannequin mesh remains smooth, natural, and pristine.
     * Applies subtle, organic waistline silhouette contouring based on tailoring parameters.
     */
    applyAnatomicalVertexMorphs() {
      if (!this.gltfAvatarGroup) return;

      const isMale = (this.avatarConfig.gender === 'masculine' || this.avatarConfig.gender === 'male');
      const anatomy = this.avatarConfig.anatomy ? (isMale ? this.avatarConfig.anatomy.male : this.avatarConfig.anatomy.female) : null;
      const waist = (anatomy && typeof anatomy.waist === 'number')
        ? anatomy.waist
        : (typeof this.avatarConfig.waistDefinition === 'number' ? this.avatarConfig.waistDefinition : 70);

      // Natural waist factor: 70 is natural baseline (1.0), 90 is slim fit (~0.968), 30 is relaxed (~1.064)
      const waistFactor = 1.0 - ((waist - 70) / 100) * 0.16;
      const waistCenterY = isMale ? 1.08 : 1.04;
      const waistSigma = isMale ? 0.14 : 0.12;

      this.gltfAvatarGroup.traverse((child) => {
        if (!child.isMesh || !child.geometry || !child.geometry.attributes || !child.geometry.attributes.position) return;
        const geom = child.geometry;
        const posAttr = geom.attributes.position;
        if (!geom.userData.basePositions) {
          geom.userData.basePositions = new Float32Array(posAttr.array);
        }

        const base = geom.userData.basePositions;
        const count = posAttr.count;

        // If waist is standard baseline, restore base positions cleanly
        if (Math.abs(waist - 70) < 0.5) {
          posAttr.array.set(base);
        } else {
          for (let i = 0; i < count; i++) {
            const bx = base[i * 3];
            const by = base[i * 3 + 1];
            const bz = base[i * 3 + 2];

            // Gaussian falloff around waistline
            const dy = by - waistCenterY;
            const bell = Math.exp(-(dy * dy) / (waistSigma * waistSigma));

            const scale = 1.0 + (waistFactor - 1.0) * bell;
            posAttr.setX(i, bx * scale);
            posAttr.setY(i, by);
            posAttr.setZ(i, bz * (1.0 + (waistFactor - 1.0) * bell * 0.70));
          }
        }
        posAttr.needsUpdate = true;
        geom.computeVertexNormals();
      });
    }

    /**
     * Synchronizes natural mannequin geometry and proportions
     */
    updateAnatomy() {
      this.applyAnatomicalVertexMorphs();
    }

    /**
     * Sets specific sizing parameters (height, weight, waist) and updates whole-body scaling
     */
    setAnatomy(key, val, gender = null) {
      const g = gender || (this.avatarConfig.gender === 'masculine' || this.avatarConfig.gender === 'male' ? 'male' : 'female');
      if (!this.avatarConfig.anatomy) {
        this.avatarConfig.anatomy = {
          female: { waist: 70, height: 1.70, weight: 58 },
          male: { waist: 70, height: 1.80, weight: 78 }
        };
      }
      if (!this.avatarConfig.anatomy[g]) {
        this.avatarConfig.anatomy[g] = {};
      }
      this.avatarConfig.anatomy[g][key] = parseFloat(val);
      this.updateAnatomy();
      this.updateBodyMeshScale();
      try {
        localStorage.removeItem('seren_avatar_prefs');
        localStorage.removeItem('seren_avatar_prefs_v2');
      } catch (_) {}
      this.savePreferences();
    }

    /**
     * Resets avatar anatomy, proportions, and body shape to pristine natural mannequin shape
     */
    resetAnatomyToNormal() {
      const isMale = (this.avatarConfig.gender === 'masculine' || this.avatarConfig.gender === 'male');
      this.avatarConfig.anatomy = {
        female: { waist: 70, height: 1.70, weight: 58 },
        male: { waist: 70, height: 1.80, weight: 78 }
      };
      this.avatarConfig.proportions = isMale ? 'athletic' : 'slim_fit';
      this.avatarConfig.bodyFat = isMale ? 20 : 25;
      this.avatarConfig.waistDefinition = 70;

      // Restore base vertex positions directly (0 displacement = pristine natural model)
      if (this.gltfAvatarGroup) {
        this.gltfAvatarGroup.traverse((child) => {
          if (child.isMesh && child.geometry && child.geometry.userData && child.geometry.userData.basePositions) {
            const posAttr = child.geometry.attributes.position;
            posAttr.array.set(child.geometry.userData.basePositions);
            posAttr.needsUpdate = true;
            child.geometry.computeVertexNormals();
          }
        });
      }

      this.updateAnatomy();
      this.updateBodyMeshScale();
      try {
        localStorage.removeItem('seren_avatar_prefs');
        localStorage.removeItem('seren_avatar_prefs_v2');
        localStorage.removeItem('seren_avatar_prefs_v3');
      } catch (_) {}
      this.savePreferences();
    }

    /**
     * Loads Astra Mannequin (Female or Male)
     */
    loadMannequin(gender = 'female') {
      if (typeof THREE.GLTFLoader === 'undefined') return;

      const isMale = (gender === 'male' || gender === 'masculine');
      const targetGender = isMale ? 'male' : 'female';
      this.avatarConfig.gender = targetGender;

      const loader = new THREE.GLTFLoader();
      const urls = isMale
        ? [
            'assets/models/avatar_male.glb',
            'male_mannequin.glb',
            'woobi_male_mannequin.glb?v=human_v2',
            '3D - Mannequin By Astra/Woobi_Male_Mannequin.glb?v=human_v2',
            '3D - Mannequin By Astra/male/Woobi_Male_Mannequin.glb?v=human_v2'
          ]
        : [
            'assets/models/avatar_female.glb',
            'female_mannequin.glb',
            'Woobi_Female_Mannequin_Fixed.glb?v=human_v2',
            'woobi_female_mannequin.glb?v=human_v2',
            '3D - Mannequin By Astra/Woobi_Female_Mannequin.glb?v=human_v2',
            '3D - Mannequin By Astra/female/Woobi_Female_Mannequin.glb?v=human_v2'
          ];

      const tryLoad = (idx) => {
        if (idx >= urls.length) return;
        const url = urls[idx];
        loader.load(
          url,
          (gltf) => {
            console.log(`Studio3D: Astra ${targetGender} mannequin loaded successfully from`, url);
            const model = gltf.scene;

            // Remove existing gltfAvatarGroup if present
            if (this.gltfAvatarGroup && this.avatarRoot) {
              this.avatarRoot.remove(this.gltfAvatarGroup);
            }

            // Position model cleanly on the dais (avatarRoot provides the 0.080m dais elevation)
            model.position.set(0, 0, 0);

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                  if (!child.geometry.userData.basePositions) {
                    child.geometry.userData.basePositions = new Float32Array(child.geometry.attributes.position.array);
                  }
                }
              }
            });

            this.gltfAvatarGroup = model;
            if (this.avatarRoot) {
              this.avatarRoot.add(this.gltfAvatarGroup);
            }
            if (this.avatarModel) {
              this.avatarModel.gltfAvatarGroup = model;
              if (this.avatarModel.animations && typeof this.avatarModel.animations.setGLTFModel === 'function') {
                this.avatarModel.animations.setGLTFModel(this.gltfAvatarGroup);
              }
            }
            if (this.sculptedAvatarGroup) {
              this.sculptedAvatarGroup.visible = false;
            }
            this.activeAvatarType = 'mannequin';
            this.avatarConfig.modelType = `mannequin_${targetGender}`;

            // Build distinct anatomical contours
            this.buildAnatomicalFeatures(targetGender);

            this.updateBodyMeshScale();
            this.savePreferences();
          },
          undefined,
          () => tryLoad(idx + 1)
        );
      };

      tryLoad(0);
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
        const saved = localStorage.getItem('seren_avatar_prefs_v4');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.avatarConfig = Object.assign(this.avatarConfig, parsed);
          this.updateBodyMeshScale();
        }
      } catch (e) {
        console.warn('Studio3D: Could not read avatar prefs from storage', e);
      }
    }

    savePreferences() {
      try {
        localStorage.setItem('seren_avatar_prefs_v4', JSON.stringify(this.avatarConfig));
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
          this.cameraStates[this.currentCameraState].fovPortrait :
          this.cameraStates[this.currentCameraState].fovLandscape;

        this.camera.fov = Math.max(this.minFov, Math.min(this.maxFov, baseFov * this.cameraZoomFactor));
        this.camera.updateProjectionMatrix();
      }

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * Keep a prepared studio idle while the welcome dialog still covers it.
     */
    setRenderingPaused(paused) {
      this.renderingPaused = paused;
      if (paused) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      } else if (this.isInitialized && !this.animationFrameId) {
        this.clock.getDelta();
        this.animate();
      }
    }

    /**
     * Main Animation & Render Loop
     */
    animate() {
      this.animationFrameId = null;
      if (this.renderingPaused) return;
      this.animationFrameId = requestAnimationFrame(this.animate);

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // 1. Smooth Avatar Rotation Damping & Animations
      if (this.avatarModel && typeof this.avatarModel.update === 'function') {
        if (this.avatarController) {
          this.avatarController.setTargetRotation(this.targetRotationY);
        }
        if (this.avatarModel.animations && this.gltfAvatarGroup && typeof this.avatarModel.animations.setGLTFModel === 'function') {
          this.avatarModel.animations.setGLTFModel(this.gltfAvatarGroup);
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

        // 2. Continuous Organic Respiration & Living Postural Micro-Sway (Living Mannequin Presence)
        const breathSpeed = 1.365; // Relaxed respiration: ~13 breaths/min, 4.6s full cycle
        const breath = Math.sin(time * 1.6) * 0.003;
        const breathCycle = (time * breathSpeed) % (Math.PI * 2);
        // Asymmetric respiration waveform (active inhalation, smooth passive elastic recoil)
        const breathNormalized = Math.sin(breathCycle - Math.sin(breathCycle) * 0.28);

        // Biomechanical postural sway angles (inverted pendulum from ankle pivot)
        const swayZ = Math.sin(time * 0.95) * 0.016; // Coronal lateral weight shift between feet (6.6s cycle, ~0.92 deg)
        const swayX = Math.sin(time * 1.365 + 0.45) * 0.011 + Math.sin(time * 2.73) * 0.0025; // Sagittal postural lean synchronized with deep breath (~0.77 deg)
        const swayY = Math.cos(time * 0.74) * 0.012; // Natural idle presence yaw drift (8.5s cycle, ~0.69 deg)

        if (this.chestGroup) {
          this.chestGroup.position.y = 1.22 + breath;
          this.chestGroup.scale.set(1.0 + breathNormalized * 0.015, 1.0, 1.0 + breathNormalized * 0.025);
        }
        if (this.headGroup) {
          this.headGroup.position.y = 1.54 + breath * 0.6;
          this.headGroup.rotation.z = swayZ * 0.50;
          this.headGroup.rotation.x = swayX * 0.50;
        }

        // Animate loaded GLTF human mannequin (Organic breathing & living postural slow movements)
        if (this.gltfAvatarGroup) {
          // Thoracic breathing: Ribcage expansion and vertical elevation anchored at feet (y=0)
          this.gltfAvatarGroup.scale.set(
            1.0 + breathNormalized * 0.018, // 1.8% lateral ribcage expansion
            1.0 + breathNormalized * 0.012, // 1.2% (~2.1cm) vertical thoracic rise and fall
            1.0 + breathNormalized * 0.034  // 3.4% chest and bust forward expansion
          );
          // Natural living slow movements: graceful postural sway & weight shift from ankle/hip pivot
          this.gltfAvatarGroup.rotation.x = swayX;
          this.gltfAvatarGroup.rotation.z = swayZ;
          this.gltfAvatarGroup.rotation.y = swayY;
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
        let effectivePos = this.targetCameraPos;
        if (this.cameraZoomFactor < 1.0 && this.targetCameraPos && this.currentCameraLookAt) {
          const zoomDelta = this.cameraZoomFactor - 1.0;
          const dollyOffset = zoomDelta * 3.5;
          const dx = this.targetCameraPos.x - this.currentCameraLookAt.x;
          const dy = this.targetCameraPos.y - this.currentCameraLookAt.y;
          const dz = this.targetCameraPos.z - this.currentCameraLookAt.z;
          const len = Math.hypot(dx, dy, dz) || 1.0;
          effectivePos = new THREE.Vector3(
            this.targetCameraPos.x + (dx / len) * dollyOffset,
            this.targetCameraPos.y + (dy / len) * dollyOffset,
            this.targetCameraPos.z + (dz / len) * dollyOffset
          );
        }
        this.camera.position.lerp(effectivePos, 0.075);
        this.currentCameraLookAt.lerp(this.targetCameraLookAt, 0.075);
        this.camera.lookAt(this.currentCameraLookAt);

        // 5. Update FOV with zoom damping
        const aspect = this.camera.aspect;
        const isPortrait = aspect < 0.75;
        const baseFov = isPortrait ?
          this.cameraStates[this.currentCameraState].fovPortrait :
          this.cameraStates[this.currentCameraState].fovLandscape;
        const effectiveZoom = this.currentCameraState === 'STUDIO_OVERVIEW' ? Math.min(1.0, this.cameraZoomFactor) : this.cameraZoomFactor;
        const targetFov = Math.max(this.minFov, Math.min(this.maxFov, baseFov * effectiveZoom));
        this.camera.fov += (targetFov - this.camera.fov) * 0.1;
        this.camera.updateProjectionMatrix();
      }

      // 6. Real-time Mirror Rendering (Render from optical planar reflection perspective)
      const activeMirrorMesh = (this.vanityModel && this.vanityModel.mirrorGlassMesh) ? this.vanityModel.mirrorGlassMesh : this.mirrorGlassMesh;
      if (this.vanityModel && this.vanityModel.reflection) {
        this.vanityModel.reflection.update(this.renderer, this.scene, this.camera);
      } else if (this.mirrorRenderTarget && this.mirrorCamera && activeMirrorMesh) {
        activeMirrorMesh.visible = false;
        this.mirrorCamera.position.set(2.25, 1.25, -3.50);
        this.mirrorCamera.lookAt(0, 1.15, 0); // Looking towards avatar torso from optical reflection position
        this.mirrorCamera.far = 60.0;

        const origFog = this.scene.fog;
        if (origFog && typeof origFog.color !== 'undefined') {
          this.scene.fog = new THREE.Fog(origFog.color, 18.0, 60.0);
        }

        this.renderer.setRenderTarget(this.mirrorRenderTarget);
        this.renderer.render(this.scene, this.mirrorCamera);
        this.renderer.setRenderTarget(null);

        if (origFog) {
          this.scene.fog = origFog;
        }

        activeMirrorMesh.visible = true;
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
        this.animationFrameId = null;
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
        this.renderer = null;
      }
      this.isInitialized = false;
    }
  }

  return new Studio3DEngine();
}));
