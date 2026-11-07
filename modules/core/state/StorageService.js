
(function (global) {
  'use strict';

  class StorageService {
    constructor() {
      this.memory = new Map();
      this.storageAvailable = this.checkStorage();
    }

    checkStorage() {
      try {
        if (typeof global.localStorage === 'undefined') {
          return false;
        }

        const testKey = '__woobi_storage_test__';
        global.localStorage.setItem(testKey, '1');
        global.localStorage.removeItem(testKey);

        return true;
      } catch (error) {
        return false;
      }
    }

    save(key, value) {
      if (!key) return false;

      // Keep an in-memory copy regardless of browser storage.
      this.memory.set(key, value);

      if (!this.storageAvailable) return true;

      try {
        global.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        this.storageAvailable = false;
        return true;
      }
    }

    retrieve(key, fallback = null) {
      if (!key) return fallback;

      if (this.storageAvailable) {
        try {
          const raw = global.localStorage.getItem(key);

          if (raw !== null) {
            const parsed = JSON.parse(raw);
            this.memory.set(key, parsed);
            return parsed;
          }
        } catch (error) {
          // Ignore corrupted data and use the fallback.
          try {
            global.localStorage.removeItem(key);
          } catch (removeError) {
            this.storageAvailable = false;
          }
        }
      }

      return this.memory.has(key)
        ? this.memory.get(key)
        : fallback;
    }

    update(key, updater, fallback = null) {
      if (typeof updater !== 'function') return false;

      const current = this.retrieve(key, fallback);

      try {
        const updated = updater(current);
        return this.save(key, updated);
      } catch (error) {
        return false;
      }
    }

    remove(key) {
      if (!key) return false;

      this.memory.delete(key);

      if (!this.storageAvailable) return true;

      try {
        global.localStorage.removeItem(key);
        return true;
      } catch (error) {
        this.storageAvailable = false;
        return true;
      }
    }
  }

  global.WoobiStorageService = new StorageService();

})(typeof window !== 'undefined' ? window : globalThis);
