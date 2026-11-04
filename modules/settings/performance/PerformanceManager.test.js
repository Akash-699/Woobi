/**
 * Woobi - Settings Module
 * PerformanceManager.test.js - Unit & Integration Test Suite for Performance Settings
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PERFORMANCE_PRESETS,
  SHADOW_QUALITY,
  REFLECTION_QUALITY,
  DEFAULT_PERFORMANCE,
  PERFORMANCE_EVENTS,
  PerformanceContract
} from './PerformanceContract.js';
import {
  PerformanceManager,
  createPerformanceManager
} from './PerformanceManager.js';

// Mock localStorage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

function createMockStudio3D() {
  return {
    renderer: {
      pixelRatio: 1,
      setPixelRatio(r) { this.pixelRatio = r; },
      shadowMap: {
        enabled: true,
        needsUpdate: false
      }
    },
    vanityModel: {
      reflection: {
        enabled: true
      }
    },
    features: {
      animations: {
        idleEnabled: true,
        setIdleEnabled(b) { this.idleEnabled = b; }
      }
    }
  };
}

describe('Performance Settings Module - Specifications & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('1. should export standard performance presets', () => {
    assert.strictEqual(PERFORMANCE_PRESETS.HIGH, 'high');
    assert.strictEqual(PERFORMANCE_PRESETS.MEDIUM, 'medium');
    assert.strictEqual(PERFORMANCE_PRESETS.LOW, 'low');
    assert.strictEqual(PERFORMANCE_PRESETS.BATTERY_SAVER, 'battery_saver');
    assert.strictEqual(PERFORMANCE_PRESETS.AUTO, 'auto');
  });

  it('2. should export shadow quality options', () => {
    assert.strictEqual(SHADOW_QUALITY.SOFT, 'soft');
    assert.strictEqual(SHADOW_QUALITY.BASIC, 'basic');
    assert.strictEqual(SHADOW_QUALITY.OFF, 'off');
  });

  it('3. should export reflection quality options', () => {
    assert.strictEqual(REFLECTION_QUALITY.FULL, 'full');
    assert.strictEqual(REFLECTION_QUALITY.HALF, 'half');
    assert.strictEqual(REFLECTION_QUALITY.OFF, 'off');
  });

  it('4. should satisfy PerformanceContract API definition', () => {
    assert.strictEqual(PerformanceContract.name, 'PerformanceSettings');
    assert.ok(Array.isArray(PerformanceContract.methods));
    assert.ok(PerformanceContract.methods.includes('setPreset'));
    assert.ok(PerformanceContract.methods.includes('setShadowQuality'));
    assert.ok(PerformanceContract.methods.includes('setReflectionQuality'));
    assert.ok(PerformanceContract.methods.includes('applyToStudio3D'));
  });

  it('5. should initialize with default high-performance settings', () => {
    const manager = createPerformanceManager();
    const settings = manager.getPerformanceSettings();
    assert.strictEqual(settings.preset, PERFORMANCE_PRESETS.HIGH);
    assert.strictEqual(settings.maxPixelRatio, 2.0);
    assert.strictEqual(settings.shadows, SHADOW_QUALITY.SOFT);
  });
});

describe('Performance Settings Module - Quality Presets & Studio3D Application', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('6. should set preset to medium and update maxPixelRatio and shadow metrics', () => {
    const manager = createPerformanceManager();
    const res = manager.setPreset(PERFORMANCE_PRESETS.MEDIUM);
    assert.strictEqual(res, true);

    const s = manager.getPerformanceSettings();
    assert.strictEqual(s.preset, 'medium');
    assert.strictEqual(s.maxPixelRatio, 1.5);
    assert.strictEqual(s.shadows, SHADOW_QUALITY.BASIC);
    assert.strictEqual(s.reflections, REFLECTION_QUALITY.HALF);
  });

  it('7. should set preset to low and disable shadows and reflections', () => {
    const manager = createPerformanceManager();
    manager.setPreset(PERFORMANCE_PRESETS.LOW);

    const s = manager.getPerformanceSettings();
    assert.strictEqual(s.maxPixelRatio, 1.0);
    assert.strictEqual(s.shadows, SHADOW_QUALITY.OFF);
    assert.strictEqual(s.reflections, REFLECTION_QUALITY.OFF);
    assert.strictEqual(s.idleAnimations, false);
  });

  it('8. should set preset to battery_saver', () => {
    const manager = createPerformanceManager();
    manager.setPreset(PERFORMANCE_PRESETS.BATTERY_SAVER);

    const s = manager.getPerformanceSettings();
    assert.strictEqual(s.preset, 'battery_saver');
    assert.strictEqual(s.targetFps, 30);
    assert.strictEqual(s.idleAnimations, false);
  });

  it('9. should apply pixelRatio to studio3d renderer', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.setPreset(PERFORMANCE_PRESETS.LOW);
    assert.strictEqual(mock3D.renderer.pixelRatio, 1.0);
  });

  it('10. should disable shadowMap on studio3d renderer when shadows are off', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.setPreset(PERFORMANCE_PRESETS.LOW);
    assert.strictEqual(mock3D.renderer.shadowMap.enabled, false);
  });

  it('11. should disable vanity mirror reflections on studio3d', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.setPreset(PERFORMANCE_PRESETS.LOW);
    assert.strictEqual(mock3D.vanityModel.reflection.enabled, false);
  });

  it('12. should disable secondary idle motion in animations features', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.setPreset(PERFORMANCE_PRESETS.BATTERY_SAVER);
    assert.strictEqual(mock3D.features.animations.idleEnabled, false);
  });

  it('13. should reject unknown presets gracefully', () => {
    const manager = createPerformanceManager();
    const res = manager.setPreset('quantum_ultra');
    assert.strictEqual(res, false);
    assert.strictEqual(manager.getPerformanceSettings().preset, PERFORMANCE_PRESETS.HIGH);
  });
});

describe('Performance Settings Module - Granular Controls & Auto Detection', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('14. should toggle shadow quality selectively', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.setShadowQuality(SHADOW_QUALITY.OFF);
    assert.strictEqual(mock3D.renderer.shadowMap.enabled, false);

    manager.setShadowQuality(SHADOW_QUALITY.SOFT);
    assert.strictEqual(mock3D.renderer.shadowMap.enabled, true);
  });

  it('15. should toggle reflection quality selectively', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.setReflectionQuality(REFLECTION_QUALITY.OFF);
    assert.strictEqual(mock3D.vanityModel.reflection.enabled, false);

    manager.setReflectionQuality(REFLECTION_QUALITY.FULL);
    assert.strictEqual(mock3D.vanityModel.reflection.enabled, true);
  });

  it('16. should toggle idle animations selectively', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);

    manager.toggleIdleAnimations(false);
    assert.strictEqual(mock3D.features.animations.idleEnabled, false);

    manager.toggleIdleAnimations(true);
    assert.strictEqual(mock3D.features.animations.idleEnabled, true);
  });

  it('17. should detect optimal preset for hardware platform', () => {
    const manager = createPerformanceManager();
    const optimal = manager.detectOptimalPreset();
    assert.ok(Object.values(PERFORMANCE_PRESETS).includes(optimal));
  });

  it('18. should apply optimal preset when AUTO is chosen', () => {
    const manager = createPerformanceManager();
    manager.setPreset(PERFORMANCE_PRESETS.AUTO);
    assert.strictEqual(manager.getPerformanceSettings().preset, PERFORMANCE_PRESETS.AUTO);
  });

  it('19. should apply performance settings when new studio3d instance is bound', () => {
    const manager = createPerformanceManager();
    manager.setPreset(PERFORMANCE_PRESETS.LOW);

    const mock3D = createMockStudio3D();
    manager.setStudio3D(mock3D);

    assert.strictEqual(mock3D.renderer.pixelRatio, 1.0);
    assert.strictEqual(mock3D.renderer.shadowMap.enabled, false);
  });
});

describe('Performance Settings Module - Events, Persistence & Reset', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('20. should emit performance:preset_changed event on preset change', () => {
    const manager = createPerformanceManager();
    let presetData = null;
    manager.on(PERFORMANCE_EVENTS.PRESET_CHANGED, (d) => { presetData = d; });

    manager.setPreset(PERFORMANCE_PRESETS.MEDIUM);
    assert.ok(presetData);
    assert.strictEqual(presetData.preset, 'medium');
  });

  it('21. should emit performance:shadows_changed on shadow change', () => {
    const manager = createPerformanceManager();
    let shadowData = null;
    manager.on(PERFORMANCE_EVENTS.SHADOWS_CHANGED, (d) => { shadowData = d; });

    manager.setShadowQuality(SHADOW_QUALITY.OFF);
    assert.ok(shadowData);
    assert.strictEqual(shadowData.quality, 'off');
  });

  it('22. should allow unsubscribing from performance events', () => {
    const manager = createPerformanceManager();
    let count = 0;
    const unsub = manager.on(PERFORMANCE_EVENTS.PRESET_CHANGED, () => { count++; });

    manager.setPreset(PERFORMANCE_PRESETS.MEDIUM);
    assert.strictEqual(count, 1);

    unsub();
    manager.setPreset(PERFORMANCE_PRESETS.LOW);
    assert.strictEqual(count, 1);
  });

  it('23. should persist performance preferences in localStorage', () => {
    const manager = createPerformanceManager();
    manager.setPreset(PERFORMANCE_PRESETS.MEDIUM);

    const raw = mockStorage.get('woobi_performance_settings_v1');
    assert.ok(raw);
    assert.strictEqual(JSON.parse(raw).preset, 'medium');
  });

  it('24. should restore performance preferences from localStorage on startup', () => {
    mockStorage.set('woobi_performance_settings_v1', JSON.stringify({
      preset: 'battery_saver',
      maxPixelRatio: 1.0
    }));

    const manager = createPerformanceManager();
    assert.strictEqual(manager.getPerformanceSettings().preset, 'battery_saver');
  });

  it('25. should reset performance to default high profile via resetPerformance', () => {
    const mock3D = createMockStudio3D();
    const manager = createPerformanceManager(mock3D);
    manager.setPreset(PERFORMANCE_PRESETS.LOW);

    manager.resetPerformance();
    const s = manager.getPerformanceSettings();
    assert.strictEqual(s.preset, PERFORMANCE_PRESETS.HIGH);
    assert.strictEqual(s.maxPixelRatio, 2.0);
    assert.strictEqual(mock3D.renderer.shadowMap.enabled, true);
  });

  it('26. should clean up listeners and references on dispose', () => {
    const manager = createPerformanceManager(createMockStudio3D());
    manager.dispose();
    assert.strictEqual(manager.studio3d, null);
  });
});

