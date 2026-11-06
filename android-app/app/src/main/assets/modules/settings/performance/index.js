/**
 * Woobi - Settings Module
 * performance/index.js - Public Interface & Factory
 */

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

export {
  PERFORMANCE_PRESETS,
  SHADOW_QUALITY,
  REFLECTION_QUALITY,
  DEFAULT_PERFORMANCE,
  PERFORMANCE_EVENTS,
  PerformanceContract,
  PerformanceManager,
  createPerformanceManager
};

if (typeof window !== 'undefined') {
  window.WoobiPerformanceSettings = {
    PERFORMANCE_PRESETS,
    SHADOW_QUALITY,
    REFLECTION_QUALITY,
    DEFAULT_PERFORMANCE,
    PERFORMANCE_EVENTS,
    PerformanceContract,
    PerformanceManager,
    createPerformanceManager
  };
}

