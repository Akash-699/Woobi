/**
 * Woobi - 3D Studio Features
 * outfit-recommendations/index.js - Public Interface & Factory
 */

import {
  OCCASIONS,
  STYLE_AESTHETICS,
  RecommendationsContract
} from './RecommendationsContract.js';
import {
  CURATED_LOOKS,
  GARMENT_METRICS,
  COLOR_HARMONY_PAIRS
} from './RecommendationPresets.js';
import {
  RecommendationEngine,
  createRecommendationEngine
} from './RecommendationEngine.js';

export {
  OCCASIONS,
  STYLE_AESTHETICS,
  RecommendationsContract,
  CURATED_LOOKS,
  GARMENT_METRICS,
  COLOR_HARMONY_PAIRS,
  RecommendationEngine,
  createRecommendationEngine
};

if (typeof window !== 'undefined') {
  window.WoobiRecommendations = {
    OCCASIONS,
    STYLE_AESTHETICS,
    RecommendationsContract,
    CURATED_LOOKS,
    GARMENT_METRICS,
    COLOR_HARMONY_PAIRS,
    RecommendationEngine,
    createRecommendationEngine
  };
}
