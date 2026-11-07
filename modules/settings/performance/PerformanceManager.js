/**
 * Woobi - Settings Module
 * PerformanceManager.js - 3D Graphics Fidelity, Shadow Tunnels & Mobile Battery Optimizations
 */

import {
  PERFORMANCE_PRESETS,
  SHADOW_QUALITY,
  REFLECTION_QUALITY,
  DEFAULT_PERFORMANCE,
  PERFORMANCE_EVENTS,
  PerformanceContract
} from './PerformanceContract.js';

export class PerformanceManager {
  constructor(studio3d = null, options = {}) {
    this.studio3d = studio3d;
    this.options = Object.assign({
      storageKey: 'woobi_performance_settings_v1',
      legacyStorageKey: 'seren_performance_settings'
    }, options);

    this.settings = { ...DEFAULT_PERFORMANCE };
    this.listeners = new Map();

    this.loadSettings();

    if (this.studio3d) {
      this.applyToStudio3D(this.studio3d);
    }
  }

  setStudio3D(studio3d) {
    this.studio3d = studio3d;
    if (this.studio3d) {
      this.applyToStudio3D(this.studio3d);
    }
  }

  loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.options.storageKey) ||
                  localStorage.getItem(this.options.legacyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.settings = Object.assign(this.settings, parsed);
        }
      }
    } catch (e) {
      console.warn('PerformanceManager: failed to load settings', e);
    }
  }

  saveSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.settings);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.legacyStorageKey, data);
    } catch (e) {
      console.warn('PerformanceManager: failed to persist settings', e);
    }
  }

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`PerformanceManager error [${event}]:`, e);
        }
      });
    }
  }

  getPerformanceSettings() {
    return { ...this.settings };
  }

  getSettings() {
    return this.getPerformanceSettings();
  }

  detectOptimalPreset() {
    if (typeof navigator === 'undefined') return PERFORMANCE_PRESETS.HIGH;

    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

    if (isMobile) {
      return cores >= 8 ? PERFORMANCE_PRESETS.MEDIUM : PERFORMANCE_PRESETS.LOW;
    }

    return cores >= 4 ? PERFORMANCE_PRESETS.HIGH : PERFORMANCE_PRESETS.MEDIUM;
  }

  setPreset(preset, explicitStudio3d = null) {
    let resolvedPreset = preset;
    if (preset === PERFORMANCE_PRESETS.AUTO) {
      resolvedPreset = this.detectOptimalPreset();
    }

    if (!Object.values(PERFORMANCE_PRESETS).includes(preset)) {
      console.warn(`PerformanceManager: Unknown preset '${preset}'`);
      return false;
    }

    this.settings.preset = preset;

    // Configure metrics according to preset
    switch (resolvedPreset) {
      case PERFORMANCE_PRESETS.HIGH:
        this.settings.maxPixelRatio = 2.0;
        this.settings.targetFps = 60;
        this.settings.shadows = SHADOW_QUALITY.SOFT;
        this.settings.reflections = REFLECTION_QUALITY.FULL;
        this.settings.idleAnimations = true;
        break;

      case PERFORMANCE_PRESETS.MEDIUM:
        this.settings.maxPixelRatio = 1.5;
        this.settings.targetFps = 60;
        this.settings.shadows = SHADOW_QUALITY.BASIC;
        this.settings.reflections = REFLECTION_QUALITY.HALF;
        this.settings.idleAnimations = true;
        break;

      case PERFORMANCE_PRESETS.LOW:
        this.settings.maxPixelRatio = 1.0;
        this.settings.targetFps = 30;
        this.settings.shadows = SHADOW_QUALITY.OFF;
        this.settings.reflections = REFLECTION_QUALITY.OFF;
        this.settings.idleAnimations = false;
        break;

      case PERFORMANCE_PRESETS.BATTERY_SAVER:
        this.settings.maxPixelRatio = 1.0;
        this.settings.targetFps = 30;
        this.settings.shadows = SHADOW_QUALITY.OFF;
        this.settings.reflections = REFLECTION_QUALITY.OFF;
        this.settings.idleAnimations = false;
        break;

      default:
        break;
    }

    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      this.applyToStudio3D(instance);
    }

    this.emit(PERFORMANCE_EVENTS.PRESET_CHANGED, {
      preset,
      resolvedPreset,
      settings: this.getPerformanceSettings()
    });

    return true;
  }

  setShadowQuality(quality, explicitStudio3d = null) {
    if (!Object.values(SHADOW_QUALITY).includes(quality)) {
      return false;
    }

    this.settings.shadows = quality;
    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      this.applyShadows(instance);
    }

    this.emit(PERFORMANCE_EVENTS.SHADOWS_CHANGED, { quality });
    return true;
  }

  setReflectionQuality(quality, explicitStudio3d = null) {
    if (!Object.values(REFLECTION_QUALITY).includes(quality)) {
      return false;
    }

    this.settings.reflections = quality;
    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      this.applyReflections(instance);
    }

    this.emit(PERFORMANCE_EVENTS.REFLECTIONS_CHANGED, { quality });
    return true;
  }

  toggleIdleAnimations(enabled, explicitStudio3d = null) {
    this.settings.idleAnimations = !!enabled;
    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      this.applyAnimations(instance);
    }

    this.emit(PERFORMANCE_EVENTS.ANIMATIONS_CHANGED, { enabled: this.settings.idleAnimations });
    return true;
  }

  applyToStudio3D(studio3d) {
    if (!studio3d) return;
    this.applyRenderer(studio3d);
    this.applyShadows(studio3d);
    this.applyReflections(studio3d);
    this.applyAnimations(studio3d);
  }

  applyRenderer(studio3d) {
    if (studio3d && studio3d.renderer && typeof studio3d.renderer.setPixelRatio === 'function') {
      const currentDpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      const targetRatio = Math.min(currentDpr, this.settings.maxPixelRatio);
      studio3d.renderer.setPixelRatio(targetRatio);
    }
  }

  applyShadows(studio3d) {
    if (studio3d && studio3d.renderer && studio3d.renderer.shadowMap) {
      const enabled = this.settings.shadows !== SHADOW_QUALITY.OFF;
      studio3d.renderer.shadowMap.enabled = enabled;
      studio3d.renderer.shadowMap.needsUpdate = true;
    }
  }

  applyReflections(studio3d) {
    if (studio3d && studio3d.vanityModel && studio3d.vanityModel.reflection) {
      const enabled = this.settings.reflections !== REFLECTION_QUALITY.OFF;
      studio3d.vanityModel.reflection.enabled = enabled;
    }
  }

  applyAnimations(studio3d) {
    if (studio3d && studio3d.features && studio3d.features.animations &&
        typeof studio3d.features.animations.setIdleEnabled === 'function') {
      studio3d.features.animations.setIdleEnabled(this.settings.idleAnimations);
    }
  }

  resetPerformance(explicitStudio3d = null) {
    this.settings = { ...DEFAULT_PERFORMANCE };
    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      this.applyToStudio3D(instance);
    }

    this.emit(PERFORMANCE_EVENTS.RESET, { settings: this.getPerformanceSettings() });
    return true;
  }

  dispose() {
    this.listeners.clear();
    this.studio3d = null;
  }
}

export function createPerformanceManager(studio3d = null, options = {}) {
  return new PerformanceManager(studio3d, options);
}

