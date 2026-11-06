/**
 * Woobi - 3D Studio Features
 * ColourMatchingContract.js - API Specifications, Rating Tiers & Event Constants
 */

export const RATING_TIERS = {
  EXCELLENT: {
    id: 'excellent',
    label: 'Excellent',
    minScore: 85,
    maxScore: 100,
    badgeColor: '#10B981', // Emerald
    description: 'High aesthetic cohesion, balanced contrast, and timeless color harmony.'
  },
  GOOD: {
    id: 'good',
    label: 'Good',
    minScore: 65,
    maxScore: 84,
    badgeColor: '#F59E0B', // Amber
    description: 'Coordinated and wearable combination with minor visual refinement opportunities.'
  },
  NEEDS_IMPROVEMENT: {
    id: 'needs_improvement',
    label: 'Needs Improvement',
    minScore: 0,
    maxScore: 64,
    badgeColor: '#EF4444', // Coral Red
    description: 'Colors fight for dominance, clash in temperature/saturation, or lack a neutral anchor.'
  }
};

export const HARMONY_TYPES = {
  MONOCHROMATIC: 'monochromatic',
  ANALOGOUS: 'analogous',
  COMPLEMENTARY: 'complementary',
  SPLIT_COMPLEMENTARY: 'split_complementary',
  TRIADIC: 'triadic',
  NEUTRAL_ACCENT: 'neutral_accent',
  ALL_NEUTRAL: 'all_neutral',
  EARTH_TONAL: 'earth_tonal',
  CLASHING: 'clashing'
};

export const OUTFIT_SLOTS = {
  SHIRT: 'shirt',
  PANTS: 'pants',
  SHOES: 'shoes'
};

export const COLOUR_MATCHING_EVENTS = {
  CHANGE: 'colour:change',
  ANALYSIS: 'colour:analysis',
  ALTERNATIVE_APPLIED: 'colour:alternative_applied',
  RESET: 'colour:reset'
};

export const ColourMatchingContract = {
  name: 'SmartColourMatcher',
  version: '1.0.0',
  slots: [OUTFIT_SLOTS.SHIRT, OUTFIT_SLOTS.PANTS, OUTFIT_SLOTS.SHOES],
  ratings: [RATING_TIERS.EXCELLENT.label, RATING_TIERS.GOOD.label, RATING_TIERS.NEEDS_IMPROVEMENT.label],
  methods: [
    'analyzeOutfit',
    'suggestAlternatives',
    'resolveColor',
    'getRatingTier',
    'getCuratedBenchmarks',
    'createInterface'
  ]
};

