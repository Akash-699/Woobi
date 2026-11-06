/**
 * Woobi - Settings Module
 * appearance/index.js - Public Interface & Factory
 */

import {
  APP_THEMES,
  STUDIO_THEMES,
  LIGHTING_PRESETS,
  DEFAULT_APPEARANCE,
  APPEARANCE_EVENTS,
  AppearanceContract
} from './AppearanceContract.js';
import { AppearanceManager, createAppearanceManager } from './AppearanceManager.js';

export {
  APP_THEMES,
  STUDIO_THEMES,
  LIGHTING_PRESETS,
  DEFAULT_APPEARANCE,
  APPEARANCE_EVENTS,
  AppearanceContract,
  AppearanceManager,
  createAppearanceManager
};

if (typeof window !== 'undefined') {
  window.WoobiAppearanceSettings = {
    APP_THEMES,
    STUDIO_THEMES,
    LIGHTING_PRESETS,
    DEFAULT_APPEARANCE,
    APPEARANCE_EVENTS,
    AppearanceContract,
    AppearanceManager,
    createAppearanceManager
  };
}

