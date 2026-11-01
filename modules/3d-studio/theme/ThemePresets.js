/**
 * Woobi - 3D Studio Theme Module
 * ThemePresets.js - Color Palette Tokens & Studio Environment Atmosphere Presets
 */

export const COLOR_PALETTE = {
  bgScene: 0xF7F3ED,
  ivorySurface: 0xFFFCF8,
  warmBeige: 0xEAE0D3,
  lightWood: 0xD8B992,
  softTaupe: 0xA58F7A,
  primaryText: 0x51463E,
  trousersSand: 0xC8BAA7, // Fluid tailored linen trousers
  cropTankIvory: 0xFAF6EF, // Ribbed knit high-neck crop tank
  honeyOak: 0xC69967,
  warmBrass: 0xD8B478,
  sneakersWhite: 0xFFFFFF
};

export const THEME_PRESETS = {
  // Baseline Target Reference: Serene cream plaster walls, polished marble, soft fog
  'luxury-cream': {
    name: 'luxury-cream',
    description: 'Serene warm cream plaster walls with soft polished marble and gentle fog',
    bgScene: 0xF7F3ED,
    fog: {
      color: 0xF7F3ED,
      near: 9.0,
      far: 24.0
    },
    wall: {
      color: 0xF7F2EA,
      roughness: 0.88,
      metalness: 0.01
    },
    floor: {
      color: 0xFFFFFF,
      roughness: 0.28,
      metalness: 0.04
    },
    windowShadow: {
      color: 0x4A3A2A,
      opacity: 0.075
    },
    foliage: {
      color: 0x2A4526,
      roughness: 0.48,
      metalness: 0.05
    }
  },

  // High-Fashion Nordic Minimalist Atmosphere
  'nordic-minimal': {
    name: 'nordic-minimal',
    description: 'Airy cool-toned minimalist plaster with clean architectural lines',
    bgScene: 0xF2F2F4,
    fog: {
      color: 0xF2F2F4,
      near: 10.0,
      far: 25.0
    },
    wall: {
      color: 0xEEEEF2,
      roughness: 0.85,
      metalness: 0.01
    },
    floor: {
      color: 0xF8F8FA,
      roughness: 0.25,
      metalness: 0.03
    },
    windowShadow: {
      color: 0x383A42,
      opacity: 0.060
    },
    foliage: {
      color: 0x253B25,
      roughness: 0.45,
      metalness: 0.05
    }
  },

  // Earthy Warm Terracotta Dressing Room
  'warm-terracotta': {
    name: 'warm-terracotta',
    description: 'Rich earth-toned Mediterranean plaster with cozy ambient warmth',
    bgScene: 0xF4EDE4,
    fog: {
      color: 0xF4EDE4,
      near: 8.0,
      far: 22.0
    },
    wall: {
      color: 0xF0E2D2,
      roughness: 0.90,
      metalness: 0.01
    },
    floor: {
      color: 0xFAF3EC,
      roughness: 0.30,
      metalness: 0.04
    },
    windowShadow: {
      color: 0x4E3424,
      opacity: 0.090
    },
    foliage: {
      color: 0x243E20,
      roughness: 0.50,
      metalness: 0.05
    }
  }
};

export const DEFAULT_THEME_PRESET = 'luxury-cream';
