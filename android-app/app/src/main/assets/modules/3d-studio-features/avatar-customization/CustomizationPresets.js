/**
 * Woobi - 3D Studio Features
 * CustomizationPresets.js - Presets for Skin Tones, Hair Colors, Hair Styles & Proportions
 */

export const SKIN_TONE_PRESETS = [
  { id: 'alabaster', name: 'Warm Alabaster', hex: '#F7E7DC', tone: 'fair' },
  { id: 'porcelain', name: 'Warm Porcelain', hex: '#F3D5C6', tone: 'light' },
  { id: 'golden_beige', name: 'Golden Beige', hex: '#DEB192', tone: 'medium' },
  { id: 'olive', name: 'Warm Olive', hex: '#C69970', tone: 'medium_deep' },
  { id: 'honey', name: 'Rich Honey', hex: '#A26F47', tone: 'deep' },
  { id: 'espresso', name: 'Deep Espresso', hex: '#523420', tone: 'rich' }
];

export const HAIR_COLOR_PRESETS = [
  { id: 'onyx', name: 'Midnight Onyx', hex: '#1E120A' },
  { id: 'espresso', name: 'Dark Espresso', hex: '#2B1A12' },
  { id: 'chestnut', name: 'Rich Chestnut', hex: '#4A2C1D' },
  { id: 'copper', name: 'Warm Copper', hex: '#8B4513' },
  { id: 'honey_blonde', name: 'Honey Golden Blonde', hex: '#C29864' },
  { id: 'platinum', name: 'Nordic Platinum', hex: '#E6DECE' },
  { id: 'silver', name: 'Smoky Silver', hex: '#A8A6A4' }
];

export const HAIR_STYLES = [
  { id: 'bun', name: 'Signature High Bun Updo', icon: 'bun' },
  { id: 'bob', name: 'Blunt French Bob', icon: 'bob' },
  { id: 'pixie', name: 'Tapered Textured Pixie', icon: 'pixie' },
  { id: 'ponytail', name: 'Sleek Mid Ponytail', icon: 'ponytail' }
];

export const BODY_PROPORTIONS = [
  { id: 'slim_fit', name: 'Slim & Fit', scaleX: 0.92, scaleY: 1.02, scaleZ: 0.90 },
  { id: 'regular', name: 'Classic Balanced', scaleX: 1.00, scaleY: 1.00 },
  { id: 'petite', name: 'Petite Slender', scaleX: 0.94, scaleY: 0.94 },
  { id: 'tall', name: 'Tall Runway', scaleX: 0.98, scaleY: 1.06 },
  { id: 'athletic', name: 'Athletic Sculpted', scaleX: 1.05, scaleY: 1.02 },
  { id: 'curvy', name: 'Soft Curvaceous', scaleX: 1.08, scaleY: 1.00 }
];

export const DEFAULT_AVATAR_CONFIG = {
  gender: 'female',
  skinTone: '#F3D5C6',
  hairStyle: 'bun',
  hairColor: '#1E120A',
  proportions: 'regular',
  accessories: {
    earrings: true,
    watch: false,
    necklace: false
  }
};
