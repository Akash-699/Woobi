/**
 * Woobi - Settings Module
 * AppearanceManager.test.js - Unit & Integration Test Suite for Appearance Settings
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  APP_THEMES,
  STUDIO_THEMES,
  LIGHTING_PRESETS,
  DEFAULT_APPEARANCE,
  APPEARANCE_EVENTS,
  AppearanceContract
} from './AppearanceContract.js';
import { AppearanceManager, createAppearanceManager } from './AppearanceManager.js';

// Mock localStorage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// Mock Document DOM
function setupMockDom() {
  const classListSet = new Set(['theme-light']);
  const styleMap = new Map();
  globalThis.document = {
    body: {
      classList: {
        add: (...cls) => cls.forEach(c => classListSet.add(c)),
        remove: (...cls) => cls.forEach(c => classListSet.delete(c)),
        contains: (c) => classListSet.has(c),
        toggle: (c, val) => {
          if (val) classListSet.add(c); else classListSet.delete(c);
        }
      },
      dataset: {}
    },
    documentElement: {
      style: {
        setProperty: (k, v) => styleMap.set(k, v),
        getPropertyValue: (k) => styleMap.get(k)
      }
    }
  };
}

function createMockStudio3D() {
  return {
    themeModel: {
      appliedTheme: null,
      applyTheme(t) { this.appliedTheme = t; }
    },
    lightingModel: {
      appliedPreset: null,
      applyPreset(p) { this.appliedPreset = p; }
    }
  };
}

describe('Appearance Settings Module - Specifications & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
    setupMockDom();
  });

  it('1. should export standard app themes', () => {
    assert.strictEqual(APP_THEMES.LIGHT, 'light');
    assert.strictEqual(APP_THEMES.DARK, 'dark');
    assert.strictEqual(APP_THEMES.SYSTEM, 'system');
  });

  it('2. should export standard studio themes', () => {
    assert.strictEqual(STUDIO_THEMES.LUXURY_CREAM, 'luxury-cream');
    assert.strictEqual(STUDIO_THEMES.NORDIC_MINIMAL, 'nordic-minimal');
    assert.strictEqual(STUDIO_THEMES.WARM_TERRACOTTA, 'warm-terracotta');
  });

  it('3. should export studio lighting presets', () => {
    assert.strictEqual(LIGHTING_PRESETS.EDITORIAL_SOFT, 'editorial_soft');
    assert.strictEqual(LIGHTING_PRESETS.WARM_ATELIER, 'warm_atelier');
    assert.strictEqual(LIGHTING_PRESETS.LUXURY_WARM, 'luxury-warm');
  });

  it('4. should satisfy AppearanceContract API definition', () => {
    assert.strictEqual(AppearanceContract.name, 'AppearanceSettings');
    assert.ok(Array.isArray(AppearanceContract.methods));
    assert.ok(AppearanceContract.methods.includes('setAppTheme'));
    assert.ok(AppearanceContract.methods.includes('setStudioTheme'));
    assert.ok(AppearanceContract.methods.includes('setStudioLighting'));
    assert.ok(AppearanceContract.methods.includes('resetAppearance'));
  });

  it('5. should initialize with default luxury-cream appearance', () => {
    const manager = createAppearanceManager();
    const app = manager.getAppearance();
    assert.strictEqual(app.studioTheme, STUDIO_THEMES.LUXURY_CREAM);
    assert.strictEqual(app.appTheme, APP_THEMES.LIGHT);
  });
});

describe('Appearance Settings Module - App Theme & DOM Updates', () => {
  beforeEach(() => {
    mockStorage.clear();
    setupMockDom();
  });

  it('6. should switch app theme to dark and update body class', () => {
    const manager = createAppearanceManager();
    const res = manager.setAppTheme(APP_THEMES.DARK);
    assert.strictEqual(res, true);
    assert.strictEqual(manager.getAppearance().appTheme, 'dark');
    assert.strictEqual(document.body.classList.contains('theme-dark'), true);
    assert.strictEqual(document.body.classList.contains('theme-light'), false);
  });

  it('7. should switch app theme to light', () => {
    const manager = createAppearanceManager();
    manager.setAppTheme(APP_THEMES.DARK);
    manager.setAppTheme(APP_THEMES.LIGHT);
    assert.strictEqual(manager.getAppearance().appTheme, 'light');
    assert.strictEqual(document.body.classList.contains('theme-light'), true);
  });

  it('8. should reject invalid app theme names', () => {
    const manager = createAppearanceManager();
    const res = manager.setAppTheme('neon_matrix');
    assert.strictEqual(res, false);
    assert.strictEqual(manager.getAppearance().appTheme, APP_THEMES.LIGHT);
  });

  it('9. should adjust font scale within valid range (0.8 - 1.5)', () => {
    const manager = createAppearanceManager();
    const res = manager.setFontScale(1.15);
    assert.strictEqual(res, true);
    assert.strictEqual(manager.getAppearance().fontScale, 1.15);
    assert.strictEqual(document.documentElement.style.getPropertyValue('--app-font-scale'), '1.15');
  });

  it('10. should reject font scale outside bounds', () => {
    const manager = createAppearanceManager();
    assert.strictEqual(manager.setFontScale(0.4), false);
    assert.strictEqual(manager.setFontScale(2.5), false);
  });

  it('11. should toggle high contrast mode', () => {
    const manager = createAppearanceManager();
    manager.toggleHighContrast(true);
    assert.strictEqual(manager.getAppearance().highContrast, true);
    assert.strictEqual(document.body.classList.contains('high-contrast-mode'), true);

    manager.toggleHighContrast(false);
    assert.strictEqual(manager.getAppearance().highContrast, false);
  });
});

describe('Appearance Settings Module - 3D Studio Theme & Lighting Integration', () => {
  beforeEach(() => {
    mockStorage.clear();
    setupMockDom();
  });

  it('12. should change studio theme to nordic-minimal and update 3D themeModel', () => {
    const mock3D = createMockStudio3D();
    const manager = createAppearanceManager(mock3D);

    const res = manager.setStudioTheme(STUDIO_THEMES.NORDIC_MINIMAL);
    assert.strictEqual(res, true);
    assert.strictEqual(manager.getAppearance().studioTheme, 'nordic-minimal');
    assert.strictEqual(mock3D.themeModel.appliedTheme, 'nordic-minimal');
  });

  it('13. should change studio theme to warm-terracotta', () => {
    const mock3D = createMockStudio3D();
    const manager = createAppearanceManager(mock3D);

    manager.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);
    assert.strictEqual(mock3D.themeModel.appliedTheme, 'warm-terracotta');
  });

  it('14. should fall back to luxury-cream on invalid studio theme', () => {
    const mock3D = createMockStudio3D();
    const manager = createAppearanceManager(mock3D);

    manager.setStudioTheme('unknown_theme_xyz');
    assert.strictEqual(manager.getAppearance().studioTheme, STUDIO_THEMES.LUXURY_CREAM);
    assert.strictEqual(mock3D.themeModel.appliedTheme, STUDIO_THEMES.LUXURY_CREAM);
  });

  it('15. should change lighting preset and update 3D lightingModel', () => {
    const mock3D = createMockStudio3D();
    const manager = createAppearanceManager(mock3D);

    const res = manager.setStudioLighting('warm_atelier');
    assert.strictEqual(res, true);
    assert.strictEqual(manager.getAppearance().studioLighting, 'warm_atelier');
    assert.strictEqual(mock3D.lightingModel.appliedPreset, 'warm_atelier');
  });

  it('16. should apply appearance settings when new studio3d instance is bound', () => {
    const manager = createAppearanceManager();
    manager.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);
    manager.setStudioLighting('golden_hour');

    const mock3D = createMockStudio3D();
    manager.setStudio3D(mock3D);

    assert.strictEqual(mock3D.themeModel.appliedTheme, 'warm-terracotta');
    assert.strictEqual(mock3D.lightingModel.appliedPreset, 'golden_hour');
  });

  it('17. should reset appearance to defaults via resetAppearance', () => {
    const mock3D = createMockStudio3D();
    const manager = createAppearanceManager(mock3D);

    manager.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);
    manager.setAppTheme(APP_THEMES.DARK);

    manager.resetAppearance();
    assert.strictEqual(manager.getAppearance().studioTheme, STUDIO_THEMES.LUXURY_CREAM);
    assert.strictEqual(manager.getAppearance().appTheme, APP_THEMES.LIGHT);
    assert.strictEqual(mock3D.themeModel.appliedTheme, STUDIO_THEMES.LUXURY_CREAM);
  });
});

describe('Appearance Settings Module - Events, Storage & Cleanup', () => {
  beforeEach(() => {
    mockStorage.clear();
    setupMockDom();
  });

  it('18. should emit appearance:app_theme_changed on theme change', () => {
    const manager = createAppearanceManager();
    let emitted = null;
    manager.on(APPEARANCE_EVENTS.APP_THEME_CHANGED, (d) => { emitted = d; });

    manager.setAppTheme(APP_THEMES.DARK);
    assert.ok(emitted);
    assert.strictEqual(emitted.theme, 'dark');
  });

  it('19. should emit appearance:studio_theme_changed on studio theme change', () => {
    const manager = createAppearanceManager();
    let themeData = null;
    manager.on(APPEARANCE_EVENTS.STUDIO_THEME_CHANGED, (d) => { themeData = d; });

    manager.setStudioTheme(STUDIO_THEMES.NORDIC_MINIMAL);
    assert.ok(themeData);
    assert.strictEqual(themeData.theme, 'nordic-minimal');
  });

  it('20. should emit appearance:lighting_changed on lighting change', () => {
    const manager = createAppearanceManager();
    let lightingData = null;
    manager.on(APPEARANCE_EVENTS.LIGHTING_CHANGED, (d) => { lightingData = d; });

    manager.setStudioLighting('dramatic_chiaroscuro');
    assert.ok(lightingData);
    assert.strictEqual(lightingData.preset, 'dramatic_chiaroscuro');
  });

  it('21. should allow unsubscribing from appearance events', () => {
    const manager = createAppearanceManager();
    let count = 0;
    const unsub = manager.on(APPEARANCE_EVENTS.APP_THEME_CHANGED, () => { count++; });

    manager.setAppTheme(APP_THEMES.DARK);
    assert.strictEqual(count, 1);

    unsub();
    manager.setAppTheme(APP_THEMES.LIGHT);
    assert.strictEqual(count, 1);
  });

  it('22. should persist settings to localStorage', () => {
    const manager = createAppearanceManager();
    manager.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA);
    manager.setAppTheme(APP_THEMES.DARK);

    const raw = mockStorage.get('woobi_appearance_settings_v1');
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.studioTheme, 'warm-terracotta');
    assert.strictEqual(parsed.appTheme, 'dark');
  });

  it('23. should restore appearance settings from localStorage on startup', () => {
    mockStorage.set('woobi_appearance_settings_v1', JSON.stringify({
      appTheme: 'dark',
      studioTheme: 'nordic-minimal'
    }));

    const manager = createAppearanceManager();
    assert.strictEqual(manager.getAppearance().appTheme, 'dark');
    assert.strictEqual(manager.getAppearance().studioTheme, 'nordic-minimal');
  });

  it('24. should support explicit studio3d argument in methods', () => {
    const manager = createAppearanceManager();
    const explicit3D = createMockStudio3D();

    manager.setStudioTheme(STUDIO_THEMES.WARM_TERRACOTTA, explicit3D);
    assert.strictEqual(explicit3D.themeModel.appliedTheme, 'warm-terracotta');
  });

  it('25. should clean up listeners and references on dispose', () => {
    const manager = createAppearanceManager(createMockStudio3D());
    manager.dispose();
    assert.strictEqual(manager.studio3d, null);
  });
});

