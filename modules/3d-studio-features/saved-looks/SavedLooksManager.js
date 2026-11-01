/**
 * Woobi - 3D Studio Features
 * SavedLooksManager.js - User Lookbook Orchestrator, Outfit Serialization & Quick-Recall Manager
 */

import { LOOKS_EVENTS, SavedLooksContract } from './SavedLooksContract.js';
import { LookbookStorage } from './LookbookStorage.js';

export class SavedLooksManager {
  constructor(options = {}) {
    this.options = Object.assign({
      maxLooks: 50,
      autoPersist: true
    }, options);

    this.storage = new LookbookStorage(options);
    this.looks = new Map(); // id -> look object
    this.listeners = new Map();

    this.loadLooksFromStorage();
  }

  loadLooksFromStorage() {
    const stored = this.storage.loadLooks();
    this.looks.clear();
    stored.forEach((look) => {
      if (look && look.id) {
        this.looks.set(look.id, look);
      }
    });
    this.emit(LOOKS_EVENTS.LOADED, { count: this.looks.size });
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
          console.error(`SavedLooksManager error [${event}]:`, e);
        }
      });
    }
  }

  generateLookId() {
    return 'look_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  }

  saveLook(name, outfit = {}, avatarConfig = {}, tags = [], thumbnailUri = null) {
    if (!name || typeof name !== 'string') {
      const error = new Error('Look name is required');
      this.emit(LOOKS_EVENTS.ERROR, { error });
      return { success: false, error: error.message };
    }

    if (this.looks.size >= this.options.maxLooks) {
      const error = new Error(`Maximum lookbook capacity reached (${this.options.maxLooks} looks)`);
      this.emit(LOOKS_EVENTS.ERROR, { error });
      return { success: false, error: error.message };
    }

    const lookRecord = {
      id: this.generateLookId(),
      name: name.trim(),
      outfit: { ...outfit },
      avatarConfig: { ...avatarConfig },
      tags: Array.isArray(tags) ? [...tags] : [],
      thumbnailUri: thumbnailUri || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.looks.set(lookRecord.id, lookRecord);

    if (this.options.autoPersist) {
      this.persist();
    }

    this.emit(LOOKS_EVENTS.SAVED, { look: { ...lookRecord } });
    return { success: true, look: { ...lookRecord } };
  }

  getLook(id) {
    const look = this.looks.get(id);
    return look ? { ...look } : null;
  }

  getAllLooks() {
    return Array.from(this.looks.values()).map(l => ({ ...l }));
  }

  deleteLook(id) {
    if (!this.looks.has(id)) {
      return { success: false, error: `Look not found: ${id}` };
    }

    const deleted = this.looks.get(id);
    this.looks.delete(id);

    if (this.options.autoPersist) {
      this.persist();
    }

    this.emit(LOOKS_EVENTS.DELETED, { id, look: deleted });
    return { success: true, id };
  }

  renameLook(id, newName) {
    if (!this.looks.has(id)) {
      return { success: false, error: `Look not found: ${id}` };
    }
    if (!newName || typeof newName !== 'string') {
      return { success: false, error: 'New name must be a valid string' };
    }

    const look = this.looks.get(id);
    const oldName = look.name;
    look.name = newName.trim();
    look.updatedAt = new Date().toISOString();

    if (this.options.autoPersist) {
      this.persist();
    }

    this.emit(LOOKS_EVENTS.RENAMED, { id, oldName, newName: look.name });
    return { success: true, look: { ...look } };
  }

  reEquipLook(id, tryOnEngine = null, customizerEngine = null) {
    const look = this.getLook(id);
    if (!look) {
      return { success: false, error: `Look not found: ${id}` };
    }

    // 1. Re-equip Garments via VirtualTryOn
    if (tryOnEngine && look.outfit) {
      if (typeof tryOnEngine.equipGarment === 'function') {
        Object.entries(look.outfit).forEach(([cat, garmentId]) => {
          if (garmentId) {
            tryOnEngine.equipGarment(cat, garmentId);
          }
        });
      }
    }

    // 2. Re-apply Avatar Customizations via AvatarCustomizer
    if (customizerEngine && look.avatarConfig) {
      if (typeof customizerEngine.applyConfig === 'function') {
        customizerEngine.applyConfig(look.avatarConfig);
      }
    }

    return { success: true, look };
  }

  exportLooksJSON() {
    return JSON.stringify(this.getAllLooks(), null, 2);
  }

  importLooksJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'Expected JSON array of looks' };
      }

      let importedCount = 0;
      parsed.forEach((look) => {
        if (look && look.name && look.outfit) {
          const id = look.id || this.generateLookId();
          this.looks.set(id, {
            id,
            name: look.name,
            outfit: { ...look.outfit },
            avatarConfig: { ...(look.avatarConfig || {}) },
            tags: Array.isArray(look.tags) ? [...look.tags] : [],
            thumbnailUri: look.thumbnailUri || null,
            createdAt: look.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          importedCount++;
        }
      });

      if (this.options.autoPersist) {
        this.persist();
      }

      return { success: true, importedCount, total: this.looks.size };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  clearAllLooks() {
    this.looks.clear();
    this.storage.clear();
    this.emit(LOOKS_EVENTS.CLEARED, {});
    return { success: true };
  }

  persist() {
    return this.storage.persistLooks(Array.from(this.looks.values()));
  }

  dispose() {
    this.listeners.clear();
    this.looks.clear();
  }
}

export function createSavedLooksManager(options = {}) {
  return new SavedLooksManager(options);
}
