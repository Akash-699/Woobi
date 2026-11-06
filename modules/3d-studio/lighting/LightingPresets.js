/**
 * Woobi - 3D Studio Lighting Module
 * LightingPresets.js - Curated Lighting Presets, Color Temperatures & Intensities
 */

export const LIGHTING_PRESETS = {
  // Baseline Target Reference: Warm diagonal morning sunlight, gentle fill, golden rim
  'luxury-warm': {
    name: 'luxury-warm',
    description: 'Serene warm morning sunlight streaming through studio windows',
    ambient: {
      color: 0xFFF6EC,
      intensity: 0.68
    },
    keySunlight: {
      color: 0xFFF7E6,
      intensity: 1.25,
      position: { x: 2.8, y: 4.8, z: 3.0 },
      shadow: {
        mapSize: 1024,
        near: 0.5,
        far: 10.0,
        bias: -0.0002,
        bounds: 2.4
      }
    },
    fillLight: {
      color: 0xFDF1E2,
      intensity: 0.42,
      position: { x: -2.6, y: 3.2, z: 1.6 }
    },
    rimLight: {
      color: 0xFFE5BE,
      intensity: 0.85,
      position: { x: 0.0, y: 3.8, z: -2.4 }
    },
    wardrobeSpot: {
      color: 0xFFE5BF,
      intensity: 0.50,
      distance: 5.6,
      angle: Math.PI / 4,
      penumbra: 0.45,
      decay: 1.2,
      position: { x: -1.65, y: 3.4, z: -2.10 },
      target: { x: -1.65, y: 1.22, z: -3.50 }
    },
    vanitySpot: {
      color: 0xFFE5BF,
      intensity: 0.80,
      distance: 5.6,
      angle: Math.PI / 4,
      penumbra: 0.45,
      decay: 1.2,
      position: { x: 1.60, y: 3.5, z: -2.00 },
      target: { x: 1.60, y: 1.20, z: -3.30 }
    }
  },

  // Editorial High-Key Neutral Lighting
  'editorial-neutral': {
    name: 'editorial-neutral',
    description: 'Clean high-fashion editorial lighting with balanced neutral color rendering',
    ambient: {
      color: 0xF4F5F8,
      intensity: 0.65
    },
    keySunlight: {
      color: 0xFFFFFF,
      intensity: 1.15,
      position: { x: 2.5, y: 5.0, z: 2.8 },
      shadow: {
        mapSize: 1024,
        near: 0.5,
        far: 10.0,
        bias: -0.0002,
        bounds: 2.4
      }
    },
    fillLight: {
      color: 0xEAECEF,
      intensity: 0.46,
      position: { x: -2.4, y: 3.0, z: 1.5 }
    },
    rimLight: {
      color: 0xF0F2F5,
      intensity: 0.75,
      position: { x: 0.0, y: 3.8, z: -2.4 }
    },
    wardrobeSpot: {
      color: 0xF2F2F2,
      intensity: 0.45,
      distance: 5.6,
      angle: Math.PI / 4,
      penumbra: 0.45,
      decay: 1.2,
      position: { x: -1.65, y: 3.4, z: -2.10 },
      target: { x: -1.65, y: 1.22, z: -3.50 }
    },
    vanitySpot: {
      color: 0xF2F2F2,
      intensity: 0.70,
      distance: 5.6,
      angle: Math.PI / 4,
      penumbra: 0.45,
      decay: 1.2,
      position: { x: 1.60, y: 3.5, z: -2.00 },
      target: { x: 1.60, y: 1.20, z: -3.30 }
    }
  },

  // Soft Golden Hour Evening Atmosphere
  'soft-evening': {
    name: 'soft-evening',
    description: 'Intimate golden sunset glow with deep warm rim highlights',
    ambient: {
      color: 0xF2E4D5,
      intensity: 0.58
    },
    keySunlight: {
      color: 0xFFDDB0,
      intensity: 1.05,
      position: { x: 3.0, y: 4.2, z: 2.8 },
      shadow: {
        mapSize: 1024,
        near: 0.5,
        far: 10.0,
        bias: -0.0002,
        bounds: 2.4
      }
    },
    fillLight: {
      color: 0xE8D5C4,
      intensity: 0.40,
      position: { x: -2.6, y: 3.0, z: 1.4 }
    },
    rimLight: {
      color: 0xFFA866,
      intensity: 0.92,
      position: { x: 0.0, y: 3.6, z: -2.4 }
    },
    wardrobeSpot: {
      color: 0xFFDDB0,
      intensity: 0.48,
      distance: 5.6,
      angle: Math.PI / 4,
      penumbra: 0.45,
      decay: 1.2,
      position: { x: -1.65, y: 3.4, z: -2.10 },
      target: { x: -1.65, y: 1.22, z: -3.50 }
    },
    vanitySpot: {
      color: 0xFFDDB0,
      intensity: 0.75,
      distance: 5.6,
      angle: Math.PI / 4,
      penumbra: 0.45,
      decay: 1.2,
      position: { x: 1.60, y: 3.5, z: -2.00 },
      target: { x: 1.60, y: 1.20, z: -3.30 }
    }
  }
};

export const DEFAULT_LIGHTING_PRESET = 'luxury-warm';
