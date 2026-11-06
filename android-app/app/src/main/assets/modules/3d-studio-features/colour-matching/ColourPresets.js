/**
 * Woobi - 3D Studio Features
 * ColourPresets.js - Curated Fashion Palette, Swatches, Categories & Benchmark Combinations
 */

export const FASHION_COLOURS = {
  // --- Whites & Creams ---
  'pure_white': { name: 'Pure White', hex: '#FFFFFF', family: 'white', category: 'neutral', tone: 'cool_neutral' },
  'crisp_white': { name: 'Crisp White', hex: '#F8F9FA', family: 'white', category: 'neutral', tone: 'true_neutral' },
  'off_white': { name: 'Off-White', hex: '#FAF9F6', family: 'white', category: 'neutral', tone: 'warm_neutral' },
  'cream': { name: 'Cream', hex: '#FFFDD0', family: 'white', category: 'neutral', tone: 'warm_neutral' },
  'ivory': { name: 'Ivory', hex: '#FFFFF0', family: 'white', category: 'neutral', tone: 'warm_neutral' },
  'linen': { name: 'Linen', hex: '#FAF0E6', family: 'white', category: 'neutral', tone: 'warm_neutral' },

  // --- Greys & Blacks ---
  'heather_grey': { name: 'Heather Grey', hex: '#B0B7BD', family: 'grey', category: 'neutral', tone: 'cool_neutral' },
  'light_grey': { name: 'Light Grey', hex: '#D3D3D3', family: 'grey', category: 'neutral', tone: 'cool_neutral' },
  'slate_grey': { name: 'Slate Grey', hex: '#708090', family: 'grey', category: 'neutral', tone: 'cool_neutral' },
  'charcoal': { name: 'Charcoal', hex: '#36454F', family: 'grey', category: 'neutral', tone: 'cool_neutral' },
  'jet_black': { name: 'Jet Black', hex: '#0A0A0A', family: 'black', category: 'neutral', tone: 'true_neutral' },
  'soft_black': { name: 'Soft Black', hex: '#1C1C1C', family: 'black', category: 'neutral', tone: 'true_neutral' },

  // --- Earth Tones, Tans & Browns ---
  'beige': { name: 'Beige', hex: '#F5F5DC', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'sand': { name: 'Sand', hex: '#C2B280', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'khaki': { name: 'Khaki', hex: '#C3B091', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'camel': { name: 'Camel', hex: '#C19A6B', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'tan': { name: 'Tan', hex: '#D2B48C', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'taupe': { name: 'Taupe', hex: '#87756B', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'cognac': { name: 'Cognac', hex: '#9E4714', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'espresso': { name: 'Espresso Brown', hex: '#362B28', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },
  'chocolate': { name: 'Chocolate Brown', hex: '#4A2C11', family: 'brown', category: 'earth_neutral', tone: 'warm_neutral' },

  // --- Blues & Navies ---
  'midnight_navy': { name: 'Midnight Navy', hex: '#101D2C', family: 'blue', category: 'cool_neutral', tone: 'cool_neutral' },
  'navy_blue': { name: 'Navy Blue', hex: '#001F3F', family: 'blue', category: 'cool_neutral', tone: 'cool_neutral' },
  'dark_indigo': { name: 'Dark Indigo', hex: '#1A243B', family: 'blue', category: 'cool_neutral', tone: 'cool_neutral' },
  'classic_denim': { name: 'Classic Denim', hex: '#2B4C7E', family: 'blue', category: 'cool', tone: 'cool' },
  'sky_blue': { name: 'Sky Blue', hex: '#87CEEB', family: 'blue', category: 'pastel', tone: 'cool' },
  'powder_blue': { name: 'Powder Blue', hex: '#B0E0E6', family: 'blue', category: 'pastel', tone: 'cool' },
  'baby_blue': { name: 'Baby Blue', hex: '#89CFF0', family: 'blue', category: 'pastel', tone: 'cool' },
  'royal_blue': { name: 'Royal Blue', hex: '#4169E1', family: 'blue', category: 'accent', tone: 'cool' },
  'teal': { name: 'Teal', hex: '#008080', family: 'blue', category: 'accent', tone: 'cool' },

  // --- Greens ---
  'olive_green': { name: 'Olive Green', hex: '#556B2F', family: 'green', category: 'earth_neutral', tone: 'warm_neutral' },
  'army_green': { name: 'Army Green', hex: '#4B5320', family: 'green', category: 'earth_neutral', tone: 'warm_neutral' },
  'sage_green': { name: 'Sage Green', hex: '#9CAF88', family: 'green', category: 'muted', tone: 'warm_neutral' },
  'forest_green': { name: 'Forest Green', hex: '#228B22', family: 'green', category: 'accent', tone: 'cool' },
  'dark_emerald': { name: 'Dark Emerald', hex: '#046307', family: 'green', category: 'accent', tone: 'cool' },
  'mint_green': { name: 'Mint Green', hex: '#98FF98', family: 'green', category: 'pastel', tone: 'cool' },

  // --- Reds, Pinks & Earth Warm ---
  'burgundy': { name: 'Burgundy', hex: '#800020', family: 'red', category: 'accent', tone: 'warm_neutral' },
  'wine': { name: 'Wine', hex: '#722F37', family: 'red', category: 'accent', tone: 'warm_neutral' },
  'maroon': { name: 'Maroon', hex: '#800000', family: 'red', category: 'accent', tone: 'warm' },
  'crimson': { name: 'Crimson', hex: '#DC143C', family: 'red', category: 'accent', tone: 'warm' },
  'terracotta': { name: 'Terracotta', hex: '#E2725B', family: 'red', category: 'warm', tone: 'warm' },
  'rust': { name: 'Rust', hex: '#B7410E', family: 'red', category: 'warm', tone: 'warm' },
  'blush_pink': { name: 'Blush Pink', hex: '#FFD1DC', family: 'pink', category: 'pastel', tone: 'warm' },
  'dusty_rose': { name: 'Dusty Rose', hex: '#DCAE96', family: 'pink', category: 'muted', tone: 'warm_neutral' },

  // --- Yellows & Oranges ---
  'mustard_yellow': { name: 'Mustard Yellow', hex: '#FFDB58', family: 'yellow', category: 'warm', tone: 'warm' },
  'ochre': { name: 'Ochre', hex: '#CC7722', family: 'yellow', category: 'warm', tone: 'warm' },
  'burnt_orange': { name: 'Burnt Orange', hex: '#CC5500', family: 'orange', category: 'warm', tone: 'warm' },
  'peach': { name: 'Peach', hex: '#FFE5B4', family: 'orange', category: 'pastel', tone: 'warm' },

  // --- Purples ---
  'lavender': { name: 'Lavender', hex: '#E6E6FA', family: 'purple', category: 'pastel', tone: 'cool' },
  'plum': { name: 'Plum', hex: '#673147', family: 'purple', category: 'accent', tone: 'cool' },
  'lilac': { name: 'Lilac', hex: '#C8A2C8', family: 'purple', category: 'pastel', tone: 'cool' },

  // --- High-Vibrancy / Statement Neons (Included for Testing Clashing) ---
  'neon_green': { name: 'Neon Green', hex: '#39FF14', family: 'green', category: 'neon', tone: 'loud' },
  'hot_pink': { name: 'Hot Pink', hex: '#FF1493', family: 'pink', category: 'neon', tone: 'loud' },
  'electric_lime': { name: 'Electric Lime', hex: '#CCFF00', family: 'green', category: 'neon', tone: 'loud' },
  'blaze_orange': { name: 'Blaze Orange', hex: '#FF6600', family: 'orange', category: 'neon', tone: 'loud' }
};

/**
 * Normalized Lookup index for instant matching by name or common synonyms
 */
const SYNONYMS = {
  'white': 'crisp_white',
  'black': 'jet_black',
  'grey': 'heather_grey',
  'gray': 'heather_grey',
  'navy': 'midnight_navy',
  'dark blue': 'midnight_navy',
  'blue': 'classic_denim',
  'light blue': 'powder_blue',
  'denim': 'classic_denim',
  'brown': 'espresso',
  'dark brown': 'espresso',
  'green': 'olive_green',
  'olive': 'olive_green',
  'sage': 'sage_green',
  'red': 'burgundy',
  'pink': 'blush_pink',
  'yellow': 'mustard_yellow',
  'orange': 'burnt_orange',
  'purple': 'plum'
};

/**
 * Finds a color preset by case-insensitive name or synonym
 */
export function findPresetByName(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim().toLowerCase().replace(/[-_]+/g, ' ');

  // Direct key check
  const directKey = clean.replace(/\s+/g, '_');
  if (FASHION_COLOURS[directKey]) {
    return { key: directKey, ...FASHION_COLOURS[directKey] };
  }

  // Synonym check
  if (SYNONYMS[clean]) {
    const synKey = SYNONYMS[clean];
    return { key: synKey, ...FASHION_COLOURS[synKey] };
  }

  // Search by display name
  for (const [key, val] of Object.entries(FASHION_COLOURS)) {
    if (val.name.toLowerCase() === clean) {
      return { key, ...val };
    }
  }

  // Partial substring match
  for (const [key, val] of Object.entries(FASHION_COLOURS)) {
    if (val.name.toLowerCase().includes(clean) || clean.includes(val.name.toLowerCase())) {
      return { key, ...val };
    }
  }

  return null;
}

/**
 * Curated swatches recommended for Shirts / Tops
 */
export const SHIRT_COLOUR_SWATCHES = [
  FASHION_COLOURS.crisp_white,
  FASHION_COLOURS.off_white,
  FASHION_COLOURS.powder_blue,
  FASHION_COLOURS.midnight_navy,
  FASHION_COLOURS.sage_green,
  FASHION_COLOURS.camel,
  FASHION_COLOURS.burgundy,
  FASHION_COLOURS.heather_grey,
  FASHION_COLOURS.blush_pink,
  FASHION_COLOURS.jet_black
];

/**
 * Curated swatches recommended for Pants / Bottoms
 */
export const PANTS_COLOUR_SWATCHES = [
  FASHION_COLOURS.midnight_navy,
  FASHION_COLOURS.classic_denim,
  FASHION_COLOURS.charcoal,
  FASHION_COLOURS.khaki,
  FASHION_COLOURS.beige,
  FASHION_COLOURS.olive_green,
  FASHION_COLOURS.jet_black,
  FASHION_COLOURS.off_white,
  FASHION_COLOURS.espresso
];

/**
 * Curated swatches recommended for Shoes / Footwear
 */
export const SHOES_COLOUR_SWATCHES = [
  FASHION_COLOURS.crisp_white,
  FASHION_COLOURS.jet_black,
  FASHION_COLOURS.espresso,
  FASHION_COLOURS.cognac,
  FASHION_COLOURS.tan,
  FASHION_COLOURS.midnight_navy,
  FASHION_COLOURS.heather_grey
];

/**
 * Benchmark outfit combinations for validation and automated testing
 */
export const BENCHMARK_OUTFITS = {
  EXCELLENT: [
    {
      title: 'Timeless Riviera / Smart Casual',
      shirt: 'Crisp White',
      pants: 'Midnight Navy',
      shoes: 'Espresso Brown',
      expectedRating: 'Excellent',
      expectedHarmony: 'neutral_accent'
    },
    {
      title: 'Quiet Luxury Earth Tones',
      shirt: 'Cream',
      pants: 'Olive Green',
      shoes: 'Tan',
      expectedRating: 'Excellent',
      expectedHarmony: 'analogous'
    },
    {
      title: 'Contemporary Monochrome',
      shirt: 'Heather Grey',
      pants: 'Charcoal',
      shoes: 'Jet Black',
      expectedRating: 'Excellent',
      expectedHarmony: 'monochromatic'
    },
    {
      title: 'Sartorial Complementary',
      shirt: 'Terracotta',
      pants: 'Midnight Navy',
      shoes: 'Espresso Brown',
      expectedRating: 'Excellent',
      expectedHarmony: 'complementary'
    },
    {
      title: 'Summer Clean Coastal',
      shirt: 'Powder Blue',
      pants: 'Off-White',
      shoes: 'Crisp White',
      expectedRating: 'Excellent',
      expectedHarmony: 'monochromatic'
    }
  ],
  GOOD: [
    {
      title: 'Casual Weekend Chino',
      shirt: 'Burgundy',
      pants: 'Beige',
      shoes: 'Crisp White',
      expectedRating: 'Good',
      expectedHarmony: 'neutral_accent'
    },
    {
      title: 'Relaxed Indigo & Sage',
      shirt: 'Sage Green',
      pants: 'Classic Denim',
      shoes: 'Espresso Brown',
      expectedRating: 'Good',
      expectedHarmony: 'analogous'
    }
  ],
  NEEDS_IMPROVEMENT: [
    {
      title: 'Over-Saturated High Neon Clash',
      shirt: '#39FF14', // Neon Green
      pants: '#FF1493', // Hot Pink
      shoes: '#CCFF00', // Electric Lime
      expectedRating: 'Needs Improvement',
      expectedHarmony: 'clashing'
    },
    {
      title: 'Discordant Non-Complementary Clash',
      shirt: '#FF6600', // Blaze Orange
      pants: '#FF1493', // Magenta
      shoes: '#39FF14', // Neon Green
      expectedRating: 'Needs Improvement',
      expectedHarmony: 'clashing'
    }
  ]
};

