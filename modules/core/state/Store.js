
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
    try {
      const storage = typeof window !== 'undefined'
        ? window.WoobiStorageService
        : null;

      let prefs = null;

      if (storage) {
        prefs = storage.retrieve(STORAGE_KEYS.USER_PREFS, null);
      } else if (typeof localStorage !== 'undefined') {
        const rawPrefs = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
        if (rawPrefs) {
          prefs = JSON.parse(rawPrefs);
        }
      }

      if (
        prefs &&
        typeof prefs === 'object' &&
        !Array.isArray(prefs)
      ) {
        Object.assign(this.state, prefs);
      }
    } catch (e) {
      console.warn(
        '[Woobi Store] Could not restore user preferences:',
        e
      );
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
    try {
      const toSave = {
        currentPlan: this.state.currentPlan,
        isPremium: this.state.isPremium,
        wearHistoryCount: this.state.wearHistoryCount
      };

      const storage = typeof window !== 'undefined'
        ? window.WoobiStorageService
        : null;

      if (storage) {
        storage.save(STORAGE_KEYS.USER_PREFS, toSave);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEYS.USER_PREFS,
          JSON.stringify(toSave)
        );
      }
    } catch (e) {
      console.warn(
        '[Woobi Store] Could not save preferences:',
        e
      );
    }
  }

  // Storage helper with fallback to legacy keys
  getItem(primaryKey, fallbackKey) {
    try {
      const storage = typeof window !== 'undefined'
        ? window.WoobiStorageService
        : null;

      if (storage) {
        const value = storage.retrieve(primaryKey, null);

        if (value !== null) {
          return value;
        }

        if (fallbackKey) {
          return storage.retrieve(fallbackKey, null);
        }

        return null;
      }

      if (typeof localStorage === 'undefined') {
        return null;
      }

      const val = localStorage.getItem(primaryKey);

      if (val !== null) {
        return JSON.parse(val);
      }

      if (fallbackKey) {
        const legacyVal = localStorage.getItem(fallbackKey);

        if (legacyVal !== null) {
          return JSON.parse(legacyVal);
        }
      }
    } catch (e) {
      console.warn(
        `[Woobi Store] Failed to read ${primaryKey}:`,
        e
      );
    }

    return null;
  }

  setItem(primaryKey, value, fallbackKey) {
    try {
      const storage = typeof window !== 'undefined'
        ? window.WoobiStorageService
        : null;

      if (storage) {
        storage.save(primaryKey, value);

        if (fallbackKey) {
          storage.save(fallbackKey, value);
        }

        return;
      }

      if (typeof localStorage === 'undefined') {
        return;
      }

      const serialized = JSON.stringify(value);

      localStorage.setItem(primaryKey, serialized);

      if (fallbackKey) {
        localStorage.setItem(fallbackKey, serialized);
      }
    } catch (e) {
      console.warn(
        `[Woobi Store] Failed to write ${primaryKey}:`,
        e
      );
    }
  }
}

export const store = new Store();
export const createStore = (initialState) => new Store(initialState);

// Backward compatibility bridge for window.app.state
if (typeof window !== 'undefined') {
  window.Store = Store;
  window.woobiStore = store;

  if (!window.app) {
    window.app = {};
  }

  if (!window.app.state) {
    window.app.state = store.getState();
  }
}

export default store;
