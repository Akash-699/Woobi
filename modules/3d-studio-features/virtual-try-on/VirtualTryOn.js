/**
 * Woobi - 3D Studio Features
 * VirtualTryOn.js - Core Virtual Try-On Engine & Garment Swapping Manager
 */

import {
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord
} from './GarmentCatalog.js';
import { TRY_ON_EVENTS } from './TryOnContract.js';

export class VirtualTryOn {
  constructor(avatarModel = null, options = {}, THREE = (typeof window !== 'undefined' ? window.THREE : null)) {
    this.avatarModel = avatarModel;
    this.options = Object.assign({
      autoApplyToAvatar: true,
      initialOutfit: { ...DEFAULT_OUTFIT }
    }, options);
    this.THREE = THREE;

    // Equipped state: category -> garmentId
    this.equippedOutfit = {
      [GARMENT_CATEGORIES.TOP]: null,
      [GARMENT_CATEGORIES.BOTTOM]: null,
      [GARMENT_CATEGORIES.SHOES]: null,
      [GARMENT_CATEGORIES.ACCESSORY]: null
    };

    // Event listeners: eventName -> Set<Function>
    this.listeners = new Map();

    // Initialize with default outfit
    this.initializeOutfit(this.options.initialOutfit);
  }

  setAvatarModel(avatarModel) {
    this.avatarModel = avatarModel;
    if (this.options.autoApplyToAvatar) {
      this.applyCurrentOutfitToAvatar();
    }
  }

  initializeOutfit(outfit) {
    if (!outfit) return;
    Object.entries(outfit).forEach(([cat, id]) => {
      if (id) {
        this.equipGarment(cat, id, { silent: true });
      }
    });
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
          console.error(`VirtualTryOn listener error [${event}]:`, e);
        }
      });
    }
  }

  getGarmentDetails(garmentId) {
    return getGarmentRecord(garmentId);
  }

  getEquippedOutfit() {
    return { ...this.equippedOutfit };
  }

  getEquippedGarment(category) {
    const id = this.equippedOutfit[category];
    return id ? getGarmentRecord(id) : null;
  }

  isEquipped(garmentId) {
    const record = getGarmentRecord(garmentId);
    if (!record) return false;
    return this.equippedOutfit[record.category] === record.id;
  }

  equipGarment(categoryOrId, explicitId = null, options = {}) {
    let category, garmentId;

    if (explicitId !== null) {
      category = categoryOrId;
      garmentId = explicitId;
    } else {
      // Single argument passed as garmentId
      const rec = getGarmentRecord(categoryOrId);
      if (!rec) {
        const error = new Error(`Unknown garment ID: ${categoryOrId}`);
        this.emit(TRY_ON_EVENTS.ERROR, { error, input: categoryOrId });
        return { success: false, error: error.message };
      }
      category = rec.category;
      garmentId = rec.id;
    }

    const record = getGarmentRecord(garmentId);
    if (!record) {
      const error = new Error(`Garment not found in catalog: [${garmentId}]`);
      this.emit(TRY_ON_EVENTS.ERROR, { error, category, garmentId });
      return { success: false, error: error.message };
    }

    const previousId = this.equippedOutfit[category];
    this.equippedOutfit[category] = record.id;

    if (this.options.autoApplyToAvatar) {
      this.applyGarmentToAvatar(record);
    }

    const payload = {
      category,
      garmentId: record.id,
      garment: record,
      previousId,
      outfit: this.getEquippedOutfit()
    };

    if (!options.silent) {
      if (previousId && previousId !== record.id) {
        this.emit(TRY_ON_EVENTS.REPLACE, payload);
      }
      this.emit(TRY_ON_EVENTS.EQUIP, payload);
    }

    return { success: true, ...payload };
  }

  replaceGarment(category, newGarmentId) {
    return this.equipGarment(category, newGarmentId);
  }

  removeGarment(category, options = {}) {
    if (!this.equippedOutfit[category]) {
      return { success: false, message: `No garment equipped in slot: ${category}` };
    }

    const previousId = this.equippedOutfit[category];
    const previousRecord = getGarmentRecord(previousId);
    this.equippedOutfit[category] = null;

    if (this.options.autoApplyToAvatar) {
      this.resetCategoryOnAvatar(category);
    }

    const payload = {
      category,
      removedId: previousId,
      removedGarment: previousRecord,
      outfit: this.getEquippedOutfit()
    };

    if (!options.silent) {
      this.emit(TRY_ON_EVENTS.REMOVE, payload);
    }

    return { success: true, ...payload };
  }

  resetTryOn(options = {}) {
    this.equippedOutfit = {
      [GARMENT_CATEGORIES.TOP]: null,
      [GARMENT_CATEGORIES.BOTTOM]: null,
      [GARMENT_CATEGORIES.SHOES]: null,
      [GARMENT_CATEGORIES.ACCESSORY]: null
    };

    this.initializeOutfit(this.options.initialOutfit);

    if (!options.silent) {
      this.emit(TRY_ON_EVENTS.RESET, { outfit: this.getEquippedOutfit() });
    }

    return { success: true, outfit: this.getEquippedOutfit() };
  }

  applyCurrentOutfitToAvatar() {
    Object.values(this.equippedOutfit).forEach((garmentId) => {
      if (garmentId) {
        const record = getGarmentRecord(garmentId);
        if (record) {
          this.applyGarmentToAvatar(record);
        }
      }
    });
  }

  applyGarmentToAvatar(garmentRecord) {
    if (!this.avatarModel) return;

    const materials = this.avatarModel.materials;
    const rig = this.avatarModel.rig;

    switch (garmentRecord.category) {
      case GARMENT_CATEGORIES.TOP: {
        if (materials && materials.tankMat) {
          if (garmentRecord.color !== undefined) {
            if (typeof materials.tankMat.color?.setHex === 'function') {
              materials.tankMat.color.setHex(garmentRecord.color);
            } else if (materials.tankMat.color) {
              materials.tankMat.color = garmentRecord.color;
            }
          }
          if (garmentRecord.roughness !== undefined) {
            materials.tankMat.roughness = garmentRecord.roughness;
          }
          if (garmentRecord.metalness !== undefined) {
            materials.tankMat.metalness = garmentRecord.metalness;
          }
          materials.tankMat.needsUpdate = true;
        }

        // Apply scale multiplier if specified and meshTarget exists
        if (rig && rig.chestGroup && garmentRecord.scaleMultiplier) {
          const targetMesh = rig.chestGroup.getObjectByName('AvatarTop');
          if (targetMesh && targetMesh.scale) {
            targetMesh.scale.set(
              garmentRecord.scaleMultiplier.x || 1,
              garmentRecord.scaleMultiplier.y || 1,
              garmentRecord.scaleMultiplier.z || 1
            );
          }
        }
        break;
      }

      case GARMENT_CATEGORIES.BOTTOM: {
        if (materials && materials.trouserMat) {
          if (garmentRecord.color !== undefined) {
            if (typeof materials.trouserMat.color?.setHex === 'function') {
              materials.trouserMat.color.setHex(garmentRecord.color);
            } else if (materials.trouserMat.color) {
              materials.trouserMat.color = garmentRecord.color;
            }
          }
          if (garmentRecord.roughness !== undefined) {
            materials.trouserMat.roughness = garmentRecord.roughness;
          }
          if (garmentRecord.metalness !== undefined) {
            materials.trouserMat.metalness = garmentRecord.metalness;
          }
          materials.trouserMat.needsUpdate = true;
        }
        break;
      }

      case GARMENT_CATEGORIES.SHOES: {
        if (materials && materials.sneakerMat) {
          if (garmentRecord.color !== undefined) {
            if (typeof materials.sneakerMat.color?.setHex === 'function') {
              materials.sneakerMat.color.setHex(garmentRecord.color);
            } else if (materials.sneakerMat.color) {
              materials.sneakerMat.color = garmentRecord.color;
            }
          }
          if (garmentRecord.roughness !== undefined) {
            materials.sneakerMat.roughness = garmentRecord.roughness;
          }
          if (garmentRecord.metalness !== undefined) {
            materials.sneakerMat.metalness = garmentRecord.metalness;
          }
          materials.sneakerMat.needsUpdate = true;
        }
        break;
      }

      default:
        break;
    }
  }

  resetCategoryOnAvatar(category) {
    if (!this.avatarModel) return;
    const defaultId = DEFAULT_OUTFIT[category];
    if (defaultId) {
      const record = getGarmentRecord(defaultId);
      if (record) {
        this.applyGarmentToAvatar(record);
      }
    }
  }

  dispose() {
    this.listeners.clear();
    this.avatarModel = null;
    this.equippedOutfit = {
      [GARMENT_CATEGORIES.TOP]: null,
      [GARMENT_CATEGORIES.BOTTOM]: null,
      [GARMENT_CATEGORIES.SHOES]: null,
      [GARMENT_CATEGORIES.ACCESSORY]: null
    };
  }
}

export function createVirtualTryOn(avatarModel, options, THREE) {
  return new VirtualTryOn(avatarModel, options, THREE);
}
