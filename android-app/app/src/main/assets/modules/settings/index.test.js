/**
 * Woobi - Settings Module
 * index.test.js - Integration Test Suite for Root Settings Entry Point & SettingsManager
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  SettingsManager,
  createSettings,
  SettingsContract,
  AccountManager,
  AppearanceManager,
  PrivacyManager,
  NotificationsManager,
  PerformanceManager,
  SUBSCRIPTION_PLANS,
  STUDIO_THEMES,
  PERFORMANCE_PRESETS
} from './index.js';

// Mock localStorage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

function createMockCoreStore(initial = {}) {
  let state = {
    isPremium: false,
    currentPlan: 'free',
    ...initial
  };
  return {
    getState: () => ({ ...state }),
    setState: (partial) => { state = Object.assign(state, partial); }
  };
}

function createMockStudio3D() {
  return {
    renderer: {
      pixelRatio: 1,
      setPixelRatio(r) { this.pixelRatio = r; },
      shadowMap: { enabled: true }
    },
    themeModel: {
      appliedTheme: null,
      applyTheme(t) { this.appliedTheme = t; }
    },
    lightingModel: {
      appliedPreset: null,
      applyPreset(p) { this.appliedPreset = p; }
    },
    vanityModel: {
      reflection: { enabled: true }
    },
    features: {
      animations: {
        idleEnabled: true,
        setIdleEnabled(b) { this.idleEnabled = b; }
      }
    }
  };
}

describe('Root Settings Module - Unified Exports & Orchestrator', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('1. should export all 5 submodule classes and factories', () => {
    assert.ok(AccountManager);
    assert.ok(AppearanceManager);
    assert.ok(PrivacyManager);
    assert.ok(NotificationsManager);
    assert.ok(PerformanceManager);
  });

  it('2. should instantiate SettingsManager with all 5 sub-managers', () => {
    const coreStore = createMockCoreStore();
    const studio3d = createMockStudio3D();
    const settings = createSettings(coreStore, studio3d);

    assert.ok(settings.account);
    assert.ok(settings.appearance);
    assert.ok(settings.privacy);
    assert.ok(settings.notifications);
    assert.ok(settings.performance);
  });

  it('3. should satisfy backward-compatible SettingsContract functions', () => {
    const settings = createSettings();
    assert.ok(SettingsContract.account.getProfile(settings));
    assert.strictEqual(SettingsContract.account.isPremiumUser(settings), false);
    assert.strictEqual(SettingsContract.appearance.getTheme(settings), 'luxury-cream');
    assert.strictEqual(SettingsContract.performance.getQualityLevel(settings), 'high');
  });

  it('4. should synchronize plan changes from account to Core Store', () => {
    const coreStore = createMockCoreStore();
    const settings = createSettings(coreStore);

    settings.account.upgradePlan(SUBSCRIPTION_PLANS.MONTHLY);
    assert.strictEqual(coreStore.getState().currentPlan, 'monthly');
    assert.strictEqual(coreStore.getState().isPremium, true);
  });

  it('5. should synchronize studio theme changes to 3D studio', () => {
    const studio3d = createMockStudio3D();
    const settings = createSettings(null, studio3d);

    settings.appearance.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);
    assert.strictEqual(studio3d.themeModel.appliedTheme, 'warm-terracotta');
  });

  it('6. should synchronize performance quality to 3D studio renderer', () => {
    const studio3d = createMockStudio3D();
    const settings = createSettings(null, studio3d);

    settings.performance.setPreset(PERFORMANCE_PRESETS.LOW);
    assert.strictEqual(studio3d.renderer.shadowMap.enabled, false);
    assert.strictEqual(studio3d.vanityModel.reflection.enabled, false);
  });

  it('7. should reset all settings across submodules via resetAllSettings', () => {
    const studio3d = createMockStudio3D();
    const settings = createSettings(null, studio3d);

    settings.appearance.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);
    settings.performance.setPreset(PERFORMANCE_PRESETS.LOW);

    settings.resetAllSettings();
    assert.strictEqual(settings.appearance.getAppearance().studioTheme, 'luxury-cream');
    assert.strictEqual(settings.performance.getPerformanceSettings().preset, 'high');
  });

  it('8. should clean up all managers on dispose', () => {
    const settings = createSettings(createMockCoreStore(), createMockStudio3D());
    assert.doesNotThrow(() => {
      settings.dispose();
    });
    assert.strictEqual(settings.coreStore, null);
    assert.strictEqual(settings.studio3d, null);
  });
});

