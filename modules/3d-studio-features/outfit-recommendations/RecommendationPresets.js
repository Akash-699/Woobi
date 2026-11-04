/**
 * Woobi - 3D Studio Features
 * RecommendationPresets.js - Curated Looks, Harmony Rules, and Occasion Profiles
 */

import { OCCASIONS, STYLE_AESTHETICS } from './RecommendationsContract.js';

export const CURATED_LOOKS = [
  {
    id: 'quiet_luxury_day',
    name: 'Quiet Luxury Daywear',
    occasion: OCCASIONS.CASUAL,
    aesthetic: STYLE_AESTHETICS.QUIET_LUXURY,
    description: 'Bouclé ribbed cardigan draped effortlessly over fluid wide-leg taupe trousers with minimal platform sneakers.',
    outfit: {
      top: 'cardigan',
      bottom: 'taupe_wide',
      shoes: 'sneakers'
    },
    harmonyScore: 96,
    tags: ['capsule', 'neutral', 'chic']
  },
  {
    id: 'tailored_executive',
    name: 'Modern Executive Tailoring',
    occasion: OCCASIONS.BUSINESS,
    aesthetic: STYLE_AESTHETICS.CONTEMPORARY_WORK,
    description: 'Structured camel blazer paired with wide trousers and polished espresso leather loafers.',
    outfit: {
      top: 'blazer',
      bottom: 'taupe_wide',
      shoes: 'loafers'
    },
    harmonyScore: 98,
    tags: ['workwear', 'sharp', 'elegant']
  },
  {
    id: 'breton_coastal',
    name: 'Breton Coastal Stroll',
    occasion: OCCASIONS.CASUAL,
    aesthetic: STYLE_AESTHETICS.PARISIAN_CHIC,
    description: 'Classic ecru Breton striped knit with deep indigo raw denim and platform sneakers.',
    outfit: {
      top: 'striped_sweater',
      bottom: 'denim',
      shoes: 'sneakers'
    },
    harmonyScore: 94,
    tags: ['timeless', 'weekend', 'nautical']
  },
  {
    id: 'summer_slides',
    name: 'Warm Weather Linen & Slides',
    occasion: OCCASIONS.SUMMER,
    aesthetic: STYLE_AESTHETICS.RELAXED_MINIMAL,
    description: 'Breathable crop tank with wide linen trousers and saddle tan leather slides.',
    outfit: {
      top: 'tank',
      bottom: 'taupe_wide',
      shoes: 'sandals'
    },
    harmonyScore: 92,
    tags: ['summer', 'airy', 'effortless']
  },
  {
    id: 'evening_navy_monochrome',
    name: 'Evening Poplin & Loafers',
    occasion: OCCASIONS.EVENING,
    aesthetic: STYLE_AESTHETICS.QUIET_LUXURY,
    description: 'Crisp deep navy shirt paired with dark indigo denim and rich leather loafers.',
    outfit: {
      top: 'navy_shirt',
      bottom: 'denim',
      shoes: 'loafers'
    },
    harmonyScore: 95,
    tags: ['dinner', 'dusk', 'refined']
  }
];

export const GARMENT_METRICS = {
  tank: { formality: 2, warmth: 1, tone: 'warm_neutral' },
  cardigan: { formality: 6, warmth: 7, tone: 'warm_neutral' },
  blazer: { formality: 9, warmth: 5, tone: 'neutral' },
  navy_shirt: { formality: 7, warmth: 3, tone: 'cool_dark' },
  striped_sweater: { formality: 4, warmth: 6, tone: 'contrast' },

  taupe_wide: { formality: 7, warmth: 5, tone: 'warm_neutral' },
  denim: { formality: 4, warmth: 6, tone: 'cool_dark' },

  sneakers: { formality: 3, warmth: 5, tone: 'light_neutral' },
  loafers: { formality: 8, warmth: 6, tone: 'dark_neutral' },
  sandals: { formality: 2, warmth: 2, tone: 'warm_neutral' }
};

export const COLOR_HARMONY_PAIRS = {
  'warm_neutral': ['warm_neutral', 'light_neutral', 'dark_neutral'],
  'cool_dark': ['cool_dark', 'light_neutral', 'dark_neutral'],
  'neutral': ['warm_neutral', 'cool_dark', 'light_neutral', 'dark_neutral'],
  'contrast': ['cool_dark', 'light_neutral', 'warm_neutral'],
  'light_neutral': ['warm_neutral', 'cool_dark', 'neutral', 'contrast', 'dark_neutral'],
  'dark_neutral': ['warm_neutral', 'cool_dark', 'neutral', 'light_neutral']
};
