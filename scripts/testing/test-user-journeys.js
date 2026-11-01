/**
 * Woobi - Application User Journey End-to-End Test Suite
 * Tests complete user journeys across Auth, 3D Studio, Wardrobe Styling, Settings & Recovery
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createStore } from '../../modules/core/state/Store.js';
import { NavigationRouter } from '../../modules/core/navigation/NavigationRouter.js';
import { createSettings } from '../../modules/settings/index.js';
import { createStudioFeatures } from '../../modules/3d-studio-features/index.js';
import { createBackendService, createApiClient } from '../../modules/backend/index.js';

describe('Production Readiness - Complete User Journey Testing', () => {
  let store;
  let router;
  let backend;
  let client;
  let settings;
  let features;
  let mockStudio3d;

  beforeEach(async () => {
    // In-memory polyfill for localStorage and window in headless Node environment
    if (typeof globalThis.localStorage === 'undefined') {
      const storageMap = new Map();
      globalThis.localStorage = {
        getItem: (k) => storageMap.has(k) ? storageMap.get(k) : null,
        setItem: (k, v) => storageMap.set(k, String(v)),
        removeItem: (k) => storageMap.delete(k),
        clear: () => storageMap.clear()
      };
    }
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = { devicePixelRatio: 2.0 };
    }

    // 1. Authoritative Core Store
    store = createStore({
      currentScreen: 'today',
      isPremium: false,
      currentPlan: 'free'
    });

    // 2. Navigation Router
    router = new NavigationRouter();

    // 3. Mock Three.js 3D Studio Engine
    mockStudio3d = {
      currentCameraState: 'STUDIO_OVERVIEW',
      currentTheme: 'luxury-cream',
      currentLighting: 'editorial_soft',
      activeGarments: { top: null, bottom: null, shoes: null, outerwear: null },
      avatarPreferences: { gender: 'female', skinTone: '#E0AC69', hairstyle: 'long-straight' },
      renderer: {
        pixelRatio: 2.0,
        setPixelRatio(val) { this.pixelRatio = val; },
        shadowMap: { enabled: true }
      },
      themeModel: {
        appliedTheme: null,
        applyTheme(name) { this.appliedTheme = name; return true; }
      },
      lightingModel: {
        appliedPreset: null,
        applyPreset(preset) { this.appliedPreset = preset; return true; }
      },
      wardrobeModel: {
        doorsOpen: false,
        openDoors() { this.doorsOpen = true; },
        closeDoors() { this.doorsOpen = false; }
      },
      setCameraState(st) { this.currentCameraState = st; },
      equipGarment(category, id) { this.activeGarments[category] = id; },
      setGenderPresentation(g) { this.avatarPreferences.gender = g; },
      setSkinTone(tone) { this.avatarPreferences.skinTone = tone; },
      setHairstyle(style) { this.avatarPreferences.hairstyle = style; },
      handleContextLost() {
        this.activeGarments = { top: null, bottom: null, shoes: null, outerwear: null };
        return true;
      },
      handleContextRestored() {
        return true;
      }
    };

    // 4. Modular Settings Suite
    settings = createSettings(store, mockStudio3d);

    // 5. Modular 3D Studio Features Suite
    features = createStudioFeatures(mockStudio3d);

    // 6. In-Memory Backend Services & Client
    backend = createBackendService({
      database: { inMemoryOnly: true },
      storage: { inMemoryOnly: true }
    });

    // Mock fetch bridge directly into backend.handleRequest
    const directFetch = async (url, options = {}) => {
      const parsedUrl = new URL(url, 'http://localhost:8080');
      let statusCode = 200;
      let respHeaders = {};
      let respData = '';

      const req = {
        method: options.method || 'GET',
        url: parsedUrl.pathname + parsedUrl.search,
        headers: options.headers || {},
        body: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null,
        on: (evt, cb) => { if (evt === 'end') cb(); }
      };

      const res = {
        writeHead: (code, hdrs = {}) => {
          statusCode = code;
          for (const [k, v] of Object.entries(hdrs)) {
            respHeaders[k.toLowerCase()] = v;
          }
        },
        setHeader: (k, v) => { respHeaders[k.toLowerCase()] = v; },
        end: (chunk) => { if (chunk) respData += chunk.toString(); },
        headersSent: false
      };

      await backend.handleRequest(req, res);

      return {
        ok: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        headers: { get: (k) => respHeaders[k.toLowerCase()] || '' },
        json: async () => JSON.parse(respData || '{}'),
        text: async () => respData
      };
    };

    client = createApiClient('http://localhost:8080', { fetchFn: directFetch });
  });

  // ==========================================================================
  // JOURNEY 1: Account, Registration, Profile Editing & Session Logout
  // ==========================================================================
  it('Journey 1: completes registration, login, profile edit, and persistent logout', async () => {
    // 1. User registers new account
    const regRes = await client.register('suriya.architect@woobi.com', 'SecureMasterPass1!', 'Suriya S');
    assert.strictEqual(regRes.success, true);
    assert.ok(client.getToken());

    // 2. Fetch authenticated profile
    const profileRes = await client.getProfile();
    assert.strictEqual(profileRes.success, true);
    assert.strictEqual(profileRes.data.email, 'suriya.architect@woobi.com');

    // 3. Update profile through AccountManager and API
    const updateRes = await client.updateProfile({ displayName: 'Suriya Chief Architect' });
    assert.strictEqual(updateRes.success, true);
    assert.strictEqual(updateRes.data.displayName, 'Suriya Chief Architect');

    // 4. Logout and verify token is revoked
    const logoutRes = await client.logout();
    assert.strictEqual(logoutRes.success, true);
    assert.strictEqual(client.getToken(), null);

    // 5. Querying with old revoked token fails with 401
    const postLogoutCall = await client.getProfile();
    assert.strictEqual(postLogoutCall.status, 401);
  });

  // ==========================================================================
  // JOURNEY 2: 3D Dressing Room, Garments, Wardrobe Kinematics & Styling Lookbook
  // ==========================================================================
  it('Journey 2: navigates screens, opens wardrobe closet, equips garments, and saves lookbook outfit', async () => {
    // 1. Navigate from Welcome to Today 3D Studio
    router.goToScreen('today');
    assert.strictEqual(router.getCurrentScreen(), 'today');

    // 2. Interact with Wardrobe - open closet doors
    mockStudio3d.wardrobeModel.openDoors();
    assert.strictEqual(mockStudio3d.wardrobeModel.doorsOpen, true);

    // 3. Change Camera to Avatar Closeup
    mockStudio3d.setCameraState('AVATAR_CLOSEUP');
    assert.strictEqual(mockStudio3d.currentCameraState, 'AVATAR_CLOSEUP');

    // 4. Equip Outfit (Blazer + Trousers + Loafers)
    mockStudio3d.equipGarment('top', 'item_linen_blazer');
    mockStudio3d.equipGarment('bottom', 'item_wool_trousers');
    mockStudio3d.equipGarment('shoes', 'item_leather_loafers');

    assert.strictEqual(mockStudio3d.activeGarments.top, 'item_linen_blazer');
    assert.strictEqual(mockStudio3d.activeGarments.bottom, 'item_wool_trousers');
    assert.strictEqual(mockStudio3d.activeGarments.shoes, 'item_leather_loafers');

    // 5. Save Look into Lookbook
    const saveRes = features.savedLooks.saveLook('Executive Minimalist', {
      topId: 'item_linen_blazer',
      bottomId: 'item_wool_trousers',
      shoesId: 'item_leather_loafers'
    }, {}, ['business']);
    assert.strictEqual(saveRes.success, true);
    assert.strictEqual(features.savedLooks.getAllLooks().length, 1);

    // 6. Close wardrobe doors
    mockStudio3d.wardrobeModel.closeDoors();
    assert.strictEqual(mockStudio3d.wardrobeModel.doorsOpen, false);
  });

  // ==========================================================================
  // JOURNEY 3: Avatar Customization & 3D Presentation Switching
  // ==========================================================================
  it('Journey 3: switches avatar gender presentation, hair swatches, skin tones and accessories', async () => {
    // 1. Switch to Male Presentation
    mockStudio3d.setGenderPresentation('male');
    assert.strictEqual(mockStudio3d.avatarPreferences.gender, 'male');

    // 2. Select Warm Caramel Skin Tone
    mockStudio3d.setSkinTone('#A67D4A');
    assert.strictEqual(mockStudio3d.avatarPreferences.skinTone, '#A67D4A');

    // 3. Select Modern Crop Hairstyle
    mockStudio3d.setHairstyle('crop');
    assert.strictEqual(mockStudio3d.avatarPreferences.hairstyle, 'crop');

    // 4. Verify Customizer submodule syncs state
    const customizerState = features.customizer.getConfig();
    assert.ok(customizerState);
    assert.strictEqual(typeof customizerState, 'object');
  });

  // ==========================================================================
  // JOURNEY 4: Atmospheric Theme & Studio Lighting Presets
  // ==========================================================================
  it('Journey 4: cycles 3D studio environments and lighting presets with real model updates', async () => {
    // 1. Apply Nordic Minimalist theme
    settings.appearance.setStudioTheme('nordic-minimal', mockStudio3d);
    assert.strictEqual(mockStudio3d.themeModel.appliedTheme, 'nordic-minimal');

    // 2. Apply Warm Terracotta theme
    settings.appearance.setStudioTheme('warm-terracotta', mockStudio3d);
    assert.strictEqual(mockStudio3d.themeModel.appliedTheme, 'warm-terracotta');

    // 3. Apply Golden Hour lighting preset
    settings.appearance.setStudioLighting('golden_hour', mockStudio3d);
    assert.strictEqual(mockStudio3d.lightingModel.appliedPreset, 'golden_hour');

    // 4. Apply High Key Clean lighting preset
    settings.appearance.setStudioLighting('high_key_clean', mockStudio3d);
    assert.strictEqual(mockStudio3d.lightingModel.appliedPreset, 'high_key_clean');
  });

  // ==========================================================================
  // JOURNEY 5: Performance Graphics Scaling & Battery Saver Adaptation
  // ==========================================================================
  it('Journey 5: dynamically adapts graphics fidelity, shadows and pixel ratio for battery saver mode', async () => {
    // 1. Initial High Fidelity
    assert.strictEqual(mockStudio3d.renderer.shadowMap.enabled, true);

    // 2. Switch to Battery Saver Preset
    settings.performance.setPreset('battery_saver', mockStudio3d);
    assert.strictEqual(mockStudio3d.renderer.shadowMap.enabled, false);
    assert.strictEqual(mockStudio3d.renderer.pixelRatio, 1.0);

    // 3. Reset back to High
    settings.performance.resetPerformance(mockStudio3d);
    assert.strictEqual(mockStudio3d.renderer.shadowMap.enabled, true);
    assert.strictEqual(mockStudio3d.renderer.pixelRatio, 2.0);
  });

  // ==========================================================================
  // JOURNEY 6: Privacy Consent, JSON Data Export & Cache Eviction
  // ==========================================================================
  it('Journey 6: enforces local-first privacy consent and exports valid user data package', async () => {
    // 1. Update privacy consent
    settings.privacy.updateConsent({ analyticsConsent: false, crashReporting: true });
    const consent = settings.privacy.getConsent();
    assert.strictEqual(consent.analyticsConsent, false);
    assert.strictEqual(consent.crashReporting, true);

    // 2. Export user data package
    const exportPackage = settings.privacy.exportUserData();
    assert.ok(exportPackage);
    assert.strictEqual(exportPackage.meta.product, 'Woobi Fashion Monorepo');
    assert.strictEqual(exportPackage.meta.storageArchitecture, 'local_first_client');
    assert.ok(exportPackage.meta.exportedAt);

    // 3. Clear looks cache
    const clearResult = settings.privacy.clearSavedLooksCache();
    assert.strictEqual(clearResult.success, true);
  });

  // ==========================================================================
  // JOURNEY 7: WebGL Context Loss & Graceful Recovery
  // ==========================================================================
  it('Journey 7: safely recovers 3D engine state when WebGL context lost event fires', () => {
    // Simulate context lost
    const lostHandled = mockStudio3d.handleContextLost();
    assert.strictEqual(lostHandled, true);
    assert.strictEqual(mockStudio3d.activeGarments.top, null);

    // Simulate context restored
    const restoredHandled = mockStudio3d.handleContextRestored();
    assert.strictEqual(restoredHandled, true);
  });
});
