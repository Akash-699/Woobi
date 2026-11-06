/**
 * Woobi - 3D Studio Theme Module
 * ThemePresets.js - Color Palette Tokens & Studio Environment Atmosphere Presets
 */

export const COLOR_PALETTE = {
  // Warm Mediterranean Luxury Environment Tokens
  desertSand: 0xDCC5A3,       // Main walls (#DCC5A3)
  warmBeige: 0xCBB18D,        // Architectural surfaces (#CBB18D)
  europeanOak: 0xB48653,      // Wood surfaces (#B48653)
  champagneStone: 0xD2BEA0,   // Floor and platform (#D2BEA0)
  warmTaupe: 0x98816B,        // Secondary accents (#98816B)
  antiqueBronze: 0x74583D,    // Metal details (#74583D)
  deepEspresso: 0x403126,     // Contrast accents (#403126)

  // Baseline & Compatibility Tokens
  bgScene: 0xF7F3ED,
  ivorySurface: 0xFFFCF8,
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
  // Warm Mediterranean Luxury Direction
  'mediterranean-luxury': {
    name: 'mediterranean-luxury',
    description: 'Warm Mediterranean luxury with desert sand plaster, European oak, champagne stone, and deep espresso accents',
    bgScene: 0xDCC5A3,
    fog: {
      color: 0xDCC5A3,
      near: 9.0,
      far: 24.0
    },
    wall: {
      color: 0xFFFFFF, // Full texture fidelity for custom wall map (authentic red-brown brick wall)
      roughness: 0.85,
      metalness: 0.01
    },
    architectural: {
      color: 0xCBB18D, // Warm beige
      roughness: 0.88,
      metalness: 0.01
    },
    wood: {
      color: 0xA27443, // European natural honey oak (#A27443)
      roughness: 0.48,
      metalness: 0.02
    },
    floor: {
      color: 0xFFFFFF, // European Oak Herringbone Parquet (#FFFFFF enables full texture color fidelity)
      roughness: 0.58, // Satin luxury timber sheen
      metalness: 0.02
    },
    accent: {
      color: 0x98816B // Warm taupe
    },
    metal: {
      color: 0x74583D, // Antique bronze
      roughness: 0.35,
      metalness: 0.75
    },
    windowShadow: {
      color: 0x3D2B1E, // Deep espresso shadow accent
      opacity: 0.10
    },
    foliage: {
      color: 0x2A4526,
      roughness: 0.48,
      metalness: 0.05
    }
  },

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
      color: 0xFFFFFF, // European Oak Herringbone Parquet (#FFFFFF enables full texture color fidelity)
      roughness: 0.58, // Satin luxury timber sheen
      metalness: 0.02
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
