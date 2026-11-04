/**
 * Woobi Core State - ClothingCaptureState
 * Authoritative manager for Clothing Silhouette Capture Sessions.
 * Enforces strict category budgeting:
 * - Shirts: Max 7 (Tops)
 * - Pants:  Max 7 (Bottoms)
 * - Shoes:  Max 2 (Shoes)
 * Total Max: 16 items.
 */

export const CLOTHING_CATEGORIES = {
  SHIRT: 'shirt',
  PANT: 'pant',
  SHOE: 'shoe'
};

export const CATEGORY_LIMITS = {
  shirt: 7,
  pant: 7,
  shoe: 2
};

export const TOTAL_LIMIT = 16;

export const CATEGORY_METADATA = {
  shirt: {
    id: 'shirt',
    label: 'Shirt',
    pluralLabel: 'Shirts',
    emoji: '👕',
    internalCategory: 'Tops',
    max: 7,
    guideline: 'Lay shirt flat and align shoulders & torso inside the outline'
  },
  pant: {
    id: 'pant',
    label: 'Pant',
    pluralLabel: 'Pants',
    emoji: '👖',
    internalCategory: 'Bottoms',
    max: 7,
    guideline: 'Lay pants flat and align waistband & legs inside the outline'
  },
  shoe: {
    id: 'shoe',
    label: 'Shoe',
    pluralLabel: 'Shoes',
    emoji: '👟',
    internalCategory: 'Shoes',
    max: 2,
    guideline: 'Place footwear pair side-by-side inside the outline'
  }
};

export const CAPTURE_EVENTS = {
  UPDATED: 'clothing:updated',
  CONFIRMED: 'clothing:confirmed',
  REMOVED: 'clothing:removed',
  CLEARED: 'clothing:cleared',
  ERROR: 'clothing:error'
};

export class ClothingCaptureState {
  constructor(options = {}) {
    this.options = Object.assign({
      storageKey: 'woobi_clothing_capture_session_v1'
    }, options);

    this.captured = {
      shirt: [],
      pant: [],
      shoe: []
    };

    this.activeCategory = CLOTHING_CATEGORIES.SHIRT;
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, list);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`ClothingCaptureState error in [${event}]:`, err);
        }
      }
    }
  }

  setActiveCategory(category) {
    const norm = (category || '').toLowerCase();
    if (!CATEGORY_METADATA[norm]) {
      throw new Error(`Invalid clothing category: ${category}`);
    }
    this.activeCategory = norm;
    this.emit(CAPTURE_EVENTS.UPDATED, this.getSlotSummary());
    return this.activeCategory;
  }

  getActiveCategory() {
    return this.activeCategory;
  }

  canAdd(category = this.activeCategory) {
    const norm = (category || '').toLowerCase();
    const limit = CATEGORY_LIMITS[norm];
    if (typeof limit !== 'number') return false;
    return (this.captured[norm] || []).length < limit;
  }

  getRemainingSlots(category = this.activeCategory) {
    const norm = (category || '').toLowerCase();
    const limit = CATEGORY_LIMITS[norm];
    if (typeof limit !== 'number') return 0;
    const current = (this.captured[norm] || []).length;
    return Math.max(0, limit - current);
  }

  getSlotSummary() {
    const shirts = this.captured.shirt.length;
    const pants = this.captured.pant.length;
    const shoes = this.captured.shoe.length;
    const total = shirts + pants + shoes;

    return {
      shirt: {
        count: shirts,
        max: CATEGORY_LIMITS.shirt,
        remaining: Math.max(0, CATEGORY_LIMITS.shirt - shirts),
        isFull: shirts >= CATEGORY_LIMITS.shirt
      },
      pant: {
        count: pants,
        max: CATEGORY_LIMITS.pant,
        remaining: Math.max(0, CATEGORY_LIMITS.pant - pants),
        isFull: pants >= CATEGORY_LIMITS.pant
      },
      shoe: {
        count: shoes,
        max: CATEGORY_LIMITS.shoe,
        remaining: Math.max(0, CATEGORY_LIMITS.shoe - shoes),
        isFull: shoes >= CATEGORY_LIMITS.shoe
      },
      total: {
        count: total,
        max: TOTAL_LIMIT,
        remaining: Math.max(0, TOTAL_LIMIT - total),
        isFull: total >= TOTAL_LIMIT
      },
      activeCategory: this.activeCategory
    };
  }

  addConfirmedPhoto(category, photoDataUrl, metadata = {}) {
    const norm = (category || this.activeCategory).toLowerCase();
    const meta = CATEGORY_METADATA[norm];
    if (!meta) {
      const err = new Error(`Invalid category: ${category}`);
      this.emit(CAPTURE_EVENTS.ERROR, { message: err.message });
      throw err;
    }

    if (!photoDataUrl || typeof photoDataUrl !== 'string') {
      const err = new Error('Photo data URL or image source is required');
      this.emit(CAPTURE_EVENTS.ERROR, { message: err.message });
      throw err;
    }

    const currentCount = this.captured[norm].length;
    const maxLimit = CATEGORY_LIMITS[norm];

    if (currentCount >= maxLimit) {
      const err = new Error(`Cannot add ${meta.label}. Maximum limit of ${maxLimit} reached.`);
      this.emit(CAPTURE_EVENTS.ERROR, { category: norm, message: err.message });
      return { success: false, error: err.message };
    }

    const item = {
      id: `capture_${norm}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: norm,
      internalCategory: meta.internalCategory,
      name: metadata.name || `${meta.label} #${currentCount + 1}`,
      photo: photoDataUrl,
      timestamp: Date.now(),
      condition: 'clean',
      fit: 'perfect',
      ...metadata
    };

    this.captured[norm].push(item);

    this.emit(CAPTURE_EVENTS.CONFIRMED, { item, summary: this.getSlotSummary() });
    this.emit(CAPTURE_EVENTS.UPDATED, this.getSlotSummary());

    return { success: true, item, summary: this.getSlotSummary() };
  }

  removePhoto(category, photoId) {
    const norm = (category || '').toLowerCase();
    if (!this.captured[norm]) {
      return { success: false, error: `Invalid category: ${category}` };
    }

    const idx = this.captured[norm].findIndex(i => i.id === photoId);
    if (idx === -1) {
      return { success: false, error: `Photo not found: ${photoId}` };
    }

    const [removed] = this.captured[norm].splice(idx, 1);

    this.emit(CAPTURE_EVENTS.REMOVED, { item: removed, summary: this.getSlotSummary() });
    this.emit(CAPTURE_EVENTS.UPDATED, this.getSlotSummary());

    return {
      success: true,
      removedItem: removed,
      freedSlot: true,
      remaining: this.getRemainingSlots(norm),
      summary: this.getSlotSummary()
    };
  }

  getPhotos(category) {
    const norm = (category || '').toLowerCase();
    if (norm) {
      return [...(this.captured[norm] || [])];
    }
    return {
      shirt: [...this.captured.shirt],
      pant: [...this.captured.pant],
      shoe: [...this.captured.shoe]
    };
  }

  getAllPhotos() {
    return [
      ...this.captured.shirt,
      ...this.captured.pant,
      ...this.captured.shoe
    ];
  }

  getTotalCount() {
    return (
      this.captured.shirt.length +
      this.captured.pant.length +
      this.captured.shoe.length
    );
  }

  clearCategory(category) {
    const norm = (category || '').toLowerCase();
    if (this.captured[norm]) {
      this.captured[norm] = [];
      this.emit(CAPTURE_EVENTS.UPDATED, this.getSlotSummary());
    }
  }

  clearAll() {
    this.captured = {
      shirt: [],
      pant: [],
      shoe: []
    };
    this.emit(CAPTURE_EVENTS.CLEARED, this.getSlotSummary());
    this.emit(CAPTURE_EVENTS.UPDATED, this.getSlotSummary());
  }

  /**
   * Export all confirmed items into standard Woobi digital wardrobe records
   * ready for immediate use by AI Stylist, Custom Builder, and 3D Studio.
   */
  exportToWardrobeItems() {
    const all = this.getAllPhotos();
    return all.map((item, index) => {
      const meta = CATEGORY_METADATA[item.category];
      return {
        id: `wardrobe_item_${Date.now()}_${index}_${item.id}`,
        name: item.name || `${meta.label} ${index + 1}`,
        category: meta.internalCategory, // 'Tops' | 'Bottoms' | 'Shoes'
        subCategory: meta.label,
        photo: item.photo,
        condition: item.condition || 'clean',
        fit: item.fit || 'perfect',
        capturedVia: 'clothing_silhouette_capture',
        dateAdded: new Date(item.timestamp || Date.now()).toISOString()
      };
    });
  }
}

export function createClothingCaptureState(options = {}) {
  return new ClothingCaptureState(options);
}

export const clothingCaptureState = new ClothingCaptureState();

