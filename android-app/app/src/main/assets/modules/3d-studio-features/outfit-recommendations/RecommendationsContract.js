/**
 * Woobi - 3D Studio Features
 * RecommendationsContract.js - Recommendation API Contract, Occasions & Style Taxonomy
 */

export const OCCASIONS = {
  CASUAL: 'casual',
  BUSINESS: 'business',
  EVENING: 'evening',
  MINIMALIST: 'minimalist',
  SUMMER: 'summer'
};

export const STYLE_AESTHETICS = {
  QUIET_LUXURY: 'quiet_luxury',
  PARISIAN_CHIC: 'parisian_chic',
  CONTEMPORARY_WORK: 'contemporary_work',
  RELAXED_MINIMAL: 'relaxed_minimal'
};

export const RecommendationsContract = {
  name: 'OutfitRecommendations',
  version: '1.0.0',
  methods: [
    'getRecommendations',
    'scoreOutfit',
    'completeOutfit',
    'getMatchingGarments',
    'getCuratedLooks',
    'getOccasions'
  ]
};
