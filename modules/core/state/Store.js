/**
 * Woobi Core State - Store
 * Central reactive store with automatic localStorage persistence and legacy migration adapters.
 */

const STORAGE_KEYS = {
  STREAK: 'woobi_outfit_streak_v2',
  WARDROBE: 'woobi_wardrobe_items_v1',
  LEGACY_WARDROBE: 'aura_wardrobe_items',
  SAVED_LOOKS: 'woobi_saved_looks_v1',
  LEGACY_SAVED_LOOKS: 'aura_saved_looks',
  USER_PREFS: 'woobi_user_preferences_v1'
};

export class Store {
  constructor(initialState = {}) {
    this.listeners = new Set();
    
    // Initialize default state
    this.state = {
      currentScreen: 'today',
      todayCanvasMode: 'model',
      stylistViewMode: 'model',
      currentLookIndex: 0,
      currentStylistOptionIndex: 0,
      stylistForm: {
        occasion: 'College',
        vibe: 'Relaxed',
        weather: 'Chennai 29°C'
      },
      builderSelection: {
        top: null,
        bottom: null,
        shoe: null,
        accessory: null
      },
      builderCurrentTab: 'Tops',
      activeEditingItemId: null,
      modalCondition: 'clean',
      modalFit: 'perfect',
      wardrobeActiveCategory: 'All',
      activeSwapSlot: 'footwear',
      savedBookmarks: new Set(['look_1', 'look_2', 'look_3']),
      currentPlan: 'monthly',
      isPremium: false,
      wearHistoryCount: 6,
      ...initialState
    };

    this._initPersistence();
  }

  _initPersistence() {
    if (typeof localStorage === 'undefined') return;

    try {
      // Restore user preferences
      const rawPrefs = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
      if (rawPrefs) {
        const prefs = JSON.parse(rawPrefs);
        Object.assign(this.state, prefs);
      }
    } catch (e) {
      console.warn('[Woobi Store] Could not restore user preferences from localStorage:', e);
    }
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    const prevState = { ...this.state };
    Object.assign(this.state, partialState);
    this.persist();
    this.listeners.forEach(fn => fn(this.state, prevState));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  persist() {
    if (typeof localStorage === 'undefined') return;
    try {
      const toSave = {
        currentPlan: this.state.currentPlan,
        isPremium: this.state.isPremium,
        wearHistoryCount: this.state.wearHistoryCount
      };
      localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(toSave));
    } catch (e) {
      console.warn('[Woobi Store] Could not save preferences to localStorage:', e);
    }
  }

  // Storage helper with fallback to legacy keys
  getItem(primaryKey, fallbackKey) {
    if (typeof localStorage === 'undefined') return null;
    try {
      const val = localStorage.getItem(primaryKey);
      if (val !== null) return JSON.parse(val);
      if (fallbackKey) {
        const legacyVal = localStorage.getItem(fallbackKey);
        if (legacyVal !== null) return JSON.parse(legacyVal);
      }
    } catch (e) {
      console.warn(`[Woobi Store] Failed to read ${primaryKey}:`, e);
    }
    return null;
  }

  setItem(primaryKey, value, fallbackKey) {
    if (typeof localStorage === 'undefined') return;
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(primaryKey, serialized);
      if (fallbackKey) {
        localStorage.setItem(fallbackKey, serialized);
      }
    } catch (e) {
      console.warn(`[Woobi Store] Failed to write ${primaryKey}:`, e);
    }
  }
}

export const store = new Store();
export const createStore = (initialState) => new Store(initialState);

// Backward compatibility bridge for window.app.state
if (typeof window !== 'undefined') {
  window.Store = Store;
  window.woobiStore = store;
  if (!window.app) window.app = {};
  if (!window.app.state) {
    window.app.state = store.getState();
  }
}

export default store;
