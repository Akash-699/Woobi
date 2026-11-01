/**
 * Woobi - Settings Module
 * AppearanceManager.js - App Styling, 3D Studio Theme & Lighting Orchestrator
 */

import {
  APP_THEMES,
  STUDIO_THEMES,
  LIGHTING_PRESETS,
  DEFAULT_APPEARANCE,
  APPEARANCE_EVENTS,
  AppearanceContract
} from './AppearanceContract.js';

export class AppearanceManager {
  constructor(studio3d = null, options = {}) {
    this.studio3d = studio3d;
    this.options = Object.assign({
      storageKey: 'woobi_appearance_settings_v1',
      legacyStorageKey: 'seren_appearance_settings',
      autoApplyToDom: true
    }, options);

    this.settings = { ...DEFAULT_APPEARANCE };
    this.listeners = new Map();

    this.loadSettings();

    if (this.options.autoApplyToDom) {
      this.applyAppThemeToDom(this.settings.appTheme);
    }

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
      console.warn('AppearanceManager: could not load stored appearance', e);
    }
  }

  saveSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.settings);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.legacyStorageKey, data);
    } catch (e) {
      console.warn('AppearanceManager: could not persist appearance', e);
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
          console.error(`AppearanceManager error [${event}]:`, e);
        }
      });
    }
  }

  getAppearance() {
    return { ...this.settings };
  }

  setAppTheme(theme) {
    if (!Object.values(APP_THEMES).includes(theme)) {
      console.warn(`AppearanceManager: Invalid app theme '${theme}'`);
      return false;
    }

    this.settings.appTheme = theme;
    this.saveSettings();
    this.applyAppThemeToDom(theme);

    this.emit(APPEARANCE_EVENTS.APP_THEME_CHANGED, { theme });
    return true;
  }

  applyAppThemeToDom(theme) {
    if (typeof document === 'undefined') return;

    let effectiveTheme = theme;
    if (theme === APP_THEMES.SYSTEM && typeof window !== 'undefined' && window.matchMedia) {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const body = document.body;
    if (body && body.classList) {
      body.classList.remove('theme-light', 'theme-dark');
      body.classList.add(`theme-${effectiveTheme}`);
      body.dataset.theme = effectiveTheme;
    }
  }

  setStudioTheme(themeName, explicitStudio3d = null) {
    const targetTheme = Object.values(STUDIO_THEMES).includes(themeName) ?
      themeName : STUDIO_THEMES.LUXURY_CREAM;

    this.settings.studioTheme = targetTheme;
    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      if (instance.themeModel && typeof instance.themeModel.applyTheme === 'function') {
        instance.themeModel.applyTheme(targetTheme);
      } else if (typeof instance.applyStudioTheme === 'function') {
        instance.applyStudioTheme(targetTheme);
      }
    }

    this.emit(APPEARANCE_EVENTS.STUDIO_THEME_CHANGED, { theme: targetTheme });
    return true;
  }

  setStudioLighting(presetName, explicitStudio3d = null) {
    // Standardize legacy alias
    const normalizedPreset = presetName === 'luxury-warm' ? 'editorial_soft' : presetName;
    const isValid = Object.values(LIGHTING_PRESETS).includes(presetName) ||
                    Object.values(LIGHTING_PRESETS).includes(normalizedPreset);

    const targetPreset = isValid ? presetName : LIGHTING_PRESETS.LUXURY_WARM;

    this.settings.studioLighting = targetPreset;
    this.saveSettings();

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      if (instance.lightingModel && typeof instance.lightingModel.applyPreset === 'function') {
        instance.lightingModel.applyPreset(targetPreset);
      } else if (typeof instance.applyLightingPreset === 'function') {
        instance.applyLightingPreset(targetPreset);
      }
    }

    this.emit(APPEARANCE_EVENTS.LIGHTING_CHANGED, { preset: targetPreset });
    return true;
  }

  setFontScale(scale) {
    const num = parseFloat(scale);
    if (isNaN(num) || num < 0.8 || num > 1.5) {
      return false;
    }

    this.settings.fontScale = num;
    this.saveSettings();

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--app-font-scale', `${num}`);
    }

    return true;
  }

  toggleHighContrast(enabled) {
    this.settings.highContrast = !!enabled;
    this.saveSettings();

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('high-contrast-mode', this.settings.highContrast);
    }

    return true;
  }

  applyToStudio3D(studio3d) {
    if (!studio3d) return;
    this.setStudioTheme(this.settings.studioTheme, studio3d);
    this.setStudioLighting(this.settings.studioLighting, studio3d);
  }

  resetAppearance(explicitStudio3d = null) {
    this.settings = { ...DEFAULT_APPEARANCE };
    this.saveSettings();

    if (this.options.autoApplyToDom) {
      this.applyAppThemeToDom(this.settings.appTheme);
    }

    const instance = explicitStudio3d || this.studio3d;
    if (instance) {
      this.applyToStudio3D(instance);
    }

    this.emit(APPEARANCE_EVENTS.RESET, { appearance: this.getAppearance() });
    return true;
  }

  dispose() {
    this.listeners.clear();
    this.studio3d = null;
  }
}

export function createAppearanceManager(studio3d = null, options = {}) {
  return new AppearanceManager(studio3d, options);
}

