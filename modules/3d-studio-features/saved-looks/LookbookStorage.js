/**
 * Woobi - 3D Studio Features
 * LookbookStorage.js - Fault-Tolerant LocalStorage & Memory Driver for Lookbook Persistence
 */

export class LookbookStorage {
  constructor(options = {}) {
    this.primaryKey = options.primaryKey || 'woobi_saved_looks_v1';
    this.legacyKey = options.legacyKey || 'seren_saved_looks';
    this.memoryCache = new Map();
  }

  isStorageAvailable() {
    return typeof localStorage !== 'undefined';
  }

  loadLooks() {
    const looks = [];
    if (!this.isStorageAvailable()) {
      return Array.from(this.memoryCache.values());
    }

    try {
      const raw = localStorage.getItem(this.primaryKey) || localStorage.getItem(this.legacyKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((look) => {
            if (look && look.id) {
              looks.push(look);
              this.memoryCache.set(look.id, look);
            }
          });
        }
      }
    } catch (e) {
      console.warn('LookbookStorage: error reading stored looks, returning cached memory items', e);
      return Array.from(this.memoryCache.values());
    }

    return looks;
  }

  persistLooks(looksArray) {
    if (!Array.isArray(looksArray)) return false;

    // Synchronize memory cache
    this.memoryCache.clear();
    looksArray.forEach(l => { if (l && l.id) this.memoryCache.set(l.id, l); });

    if (!this.isStorageAvailable()) return true;

    try {
      const serialized = JSON.stringify(looksArray);
      localStorage.setItem(this.primaryKey, serialized);
      localStorage.setItem(this.legacyKey, serialized);
      return true;
    } catch (e) {
      console.warn('LookbookStorage: failed to write to localStorage', e);
      return false;
    }
  }

  clear() {
    this.memoryCache.clear();
    if (this.isStorageAvailable()) {
      try {
        localStorage.removeItem(this.primaryKey);
        localStorage.removeItem(this.legacyKey);
      } catch (e) {
        console.warn('LookbookStorage: clear error', e);
      }
    }
  }
}
