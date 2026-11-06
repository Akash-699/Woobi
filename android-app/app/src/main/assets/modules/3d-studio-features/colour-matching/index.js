/**
 * Woobi - 3D Studio Features
 * colour-matching/index.js - Public Interface & Monorepo Submodule Entry Point
 */

import * as ColourTheoryModule from './ColourTheory.js';
import {
  SmartColourMatcher,
  createColourMatcher
} from './SmartColourMatcher.js';

import {
  ColourSelectionInterface,
  createColourSelectionInterface
} from './ColourSelectionInterface.js';

import {
  FASHION_COLOURS,
  findPresetByName,
  SHIRT_COLOUR_SWATCHES,
  PANTS_COLOUR_SWATCHES,
  SHOES_COLOUR_SWATCHES,
  BENCHMARK_OUTFITS
} from './ColourPresets.js';

import {
  RATING_TIERS,
  HARMONY_TYPES,
  OUTFIT_SLOTS,
  COLOUR_MATCHING_EVENTS,
  ColourMatchingContract
} from './ColourMatchingContract.js';

// Unified ColourTheory namespace
export const ColourTheory = ColourTheoryModule;
export const ColorTheory = ColourTheoryModule;

// US English Aliases
export const SmartColorMatcher = SmartColourMatcher;
export const createColorMatcher = createColourMatcher;
export const ColorSelectionInterface = ColourSelectionInterface;
export const createColorSelectionInterface = createColourSelectionInterface;
export const FASHION_COLORS = FASHION_COLOURS;
export const COLOR_MATCHING_EVENTS = COLOUR_MATCHING_EVENTS;
export const ColorMatchingContract = ColourMatchingContract;

export {
  SmartColourMatcher,
  createColourMatcher,
  ColourSelectionInterface,
  createColourSelectionInterface,
  FASHION_COLOURS,
  findPresetByName,
  SHIRT_COLOUR_SWATCHES,
  PANTS_COLOUR_SWATCHES,
  SHOES_COLOUR_SWATCHES,
  BENCHMARK_OUTFITS,
  RATING_TIERS,
  HARMONY_TYPES,
  OUTFIT_SLOTS,
  COLOUR_MATCHING_EVENTS,
  ColourMatchingContract
};

// Global browser mount
if (typeof window !== 'undefined') {
  const mountObj = {
    SmartColourMatcher,
    createColourMatcher,
    ColourSelectionInterface,
    createColourSelectionInterface,
    ColourTheory,
    FASHION_COLOURS,
    SHIRT_COLOUR_SWATCHES,
    PANTS_COLOUR_SWATCHES,
    SHOES_COLOUR_SWATCHES,
    BENCHMARK_OUTFITS,
    RATING_TIERS,
    HARMONY_TYPES,
    OUTFIT_SLOTS,
    ColourMatchingContract
  };

  window.WoobiColourMatching = mountObj;
  window.AuraColourMatching = mountObj;
}

export default ColourMatchingContract;

