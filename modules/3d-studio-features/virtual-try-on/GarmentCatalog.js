/**
 * Woobi - 3D Studio Features
 * GarmentCatalog.js - Canonical Garment Definitions, Categories, Layering & Material Attributes
 */

export const GARMENT_CATEGORIES = {
  TOP: 'top',
  BOTTOM: 'bottom',
  SHOES: 'shoes',
  ACCESSORY: 'accessory'
};

export const GARMENT_CATALOG = {
  // --- TOPS ---
  tank: {
    id: 'tank',
    name: 'Crop Tank',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xEDE3D2, // Cream / warm ivory
    roughness: 0.65,
    metalness: 0.05,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.0, y: 1.0, z: 1.0 },
    layer: 1
  },
  cardigan: {
    id: 'cardigan',
    name: 'Cream Cardigan',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xE8DFCE, // Bouclé ribbed knit
    roughness: 0.78,
    metalness: 0.02,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.05, y: 1.02, z: 1.06 },
    layer: 2
  },
  blazer: {
    id: 'blazer',
    name: 'Tailored Blazer',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x9E8F7A, // Taupe camel
    roughness: 0.58,
    metalness: 0.08,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.08, y: 1.05, z: 1.08 },
    layer: 3
  },
  navy_shirt: {
    id: 'navy_shirt',
    name: 'Navy Poplin Shirt',
    category: GARMENT_CATEGORIES.TOP,
    color: 0x243242, // Deep navy
    roughness: 0.45,
    metalness: 0.05,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.04, y: 1.02, z: 1.04 },
    layer: 2
  },
  striped_sweater: {
    id: 'striped_sweater',
    name: 'Striped Breton Knit',
    category: GARMENT_CATEGORIES.TOP,
    color: 0xEFEAE1, // Ecru with subtle navy
    roughness: 0.72,
    metalness: 0.02,
    meshTarget: 'AvatarTop',
    scaleMultiplier: { x: 1.06, y: 1.03, z: 1.06 },
    layer: 2
  },

  // --- BOTTOMS ---
  taupe_wide: {
    id: 'taupe_wide',
    name: 'Fluid Wide-Leg Trousers',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0xB8AC96, // Sand taupe
    roughness: 0.60,
    metalness: 0.05,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  wide_linen: {
    id: 'wide_linen',
    name: 'Wide Linen Trousers',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0xD8CBB5, // Light linen oatmeal
    roughness: 0.75,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },
  denim: {
    id: 'denim',
    name: 'Straight Dark Denim',
    category: GARMENT_CATEGORIES.BOTTOM,
    color: 0x2A3645, // Indigo raw denim
    roughness: 0.70,
    metalness: 0.02,
    meshTargets: ['AvatarWaistHips', 'AvatarBottom_Left', 'AvatarBottom_Right'],
    layer: 1
  },

  // --- SHOES ---
  sneakers: {
    id: 'sneakers',
    name: 'White Platform Sneakers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0xF7F6F2, // Clean chalk white
    roughness: 0.35,
    metalness: 0.05,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  loafers: {
    id: 'loafers',
    name: 'Polished Leather Loafers',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x2B231D, // Rich dark espresso
    roughness: 0.30,
    metalness: 0.12,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  },
  sandals: {
    id: 'sandals',
    name: 'Minimal Leather Slides',
    category: GARMENT_CATEGORIES.SHOES,
    color: 0x6E543C, // Tan saddle leather
    roughness: 0.40,
    metalness: 0.08,
    meshTargets: ['AvatarSneaker_Left', 'AvatarSneaker_Right'],
    layer: 1
  }
};

export const DEFAULT_OUTFIT = {
  top: 'tank',
  bottom: 'taupe_wide',
  shoes: 'sneakers'
};

export function getGarmentRecord(garmentId) {
  const normalizedId = garmentId === 'wide_linen' ? 'taupe_wide' : garmentId;
  return GARMENT_CATALOG[normalizedId] || null;
}
