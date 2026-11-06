/**
 * Woobi - 3D Studio Features
 * index.js - Unified Public Interface, Factory & Monorepo Entry Point for 3D Studio Features
 */

import {
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord,
  TryOnContract,
  TRY_ON_EVENTS,
  VirtualTryOn,
  createVirtualTryOn
} from './virtual-try-on/index.js';

import {
  INTERACTION_STATES,
  INTERACTION_EVENTS,
  InteractionsContract,
  SelectionFeedback,
  GarmentInteractions,
  createGarmentInteractions
} from './garment-interactions/index.js';

import {
  OCCASIONS,
  STYLE_AESTHETICS,
  RecommendationsContract,
  CURATED_LOOKS,
  GARMENT_METRICS,
  COLOR_HARMONY_PAIRS,
  RecommendationEngine,
  createRecommendationEngine
} from './outfit-recommendations/index.js';

import {
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG,
  CUSTOMIZER_EVENTS,
  CustomizerContract,
  AvatarCustomizer,
  createAvatarCustomizer
} from './avatar-customization/index.js';

import {
  STUDIO_POSES,
  ANIMATION_EVENTS,
  AnimationsContract,
  IdleMotion,
  POSE_KEYFRAMES,
  PoseController,
  createPoseController
} from './animations/index.js';

import {
  LOOKS_EVENTS,
  SavedLooksContract,
  LookbookStorage,
  SavedLooksManager,
  createSavedLooksManager
} from './saved-looks/index.js';

import {
  SmartColourMatcher,
  createColourMatcher,
  SmartColorMatcher,
  createColorMatcher,
  ColourSelectionInterface,
  createColourSelectionInterface,
  ColorSelectionInterface,
  createColorSelectionInterface,
  ColourTheory,
  ColorTheory,
  ColourMatchingContract,
  ColorMatchingContract,
  FASHION_COLOURS,
  FASHION_COLORS,
  SHIRT_COLOUR_SWATCHES,
  PANTS_COLOUR_SWATCHES,
  SHOES_COLOUR_SWATCHES,
  BENCHMARK_OUTFITS,
  COLOUR_MATCHING_EVENTS,
  COLOR_MATCHING_EVENTS,
  RATING_TIERS,
  HARMONY_TYPES,
  OUTFIT_SLOTS
} from './colour-matching/index.js';

/**
 * Backward-compatible StudioFeaturesContract
 */
export const StudioFeaturesContract = {
  tryOn: TryOnContract,
  interactions: InteractionsContract,
  recommendations: RecommendationsContract,
  customizer: CustomizerContract,
  animations: AnimationsContract,
  savedLooks: SavedLooksContract,
  colourMatching: ColourMatchingContract,
  colorMatching: ColorMatchingContract
};

/**
 * Top-Level Features Orchestrator
 * Packages all 6 modular feature submodules into a cohesive suite bound to Studio3D
 */
export class StudioFeatures {
  constructor(studio3d = null, options = {}) {
    this.studio3d = studio3d;
    this.options = options;

    const avatarModel = studio3d ? studio3d.avatarModel : null;
    const camera = studio3d ? studio3d.camera : null;
    const domElement = studio3d ? (studio3d.renderer ? studio3d.renderer.domElement : null) : null;
    const THREE = (typeof window !== 'undefined' ? window.THREE : null);

    // 1. Virtual Try-On
    this.tryOn = createVirtualTryOn(avatarModel, options.tryOn || {}, THREE);

    // 2. Garment Interactions
    this.interactions = createGarmentInteractions({
      camera,
      domElement,
      ...(options.interactions || {})
    }, THREE);

    // 3. Outfit Recommendations
    this.recommendations = createRecommendationEngine(options.recommendations || {});

    // 4. Avatar Customizer
    this.customizer = createAvatarCustomizer(avatarModel, options.customizer || {});

    // 5. Pose Animations
    this.animations = createPoseController(avatarModel, THREE);

    // 6. Saved Looks Manager
    this.savedLooks = createSavedLooksManager(options.savedLooks || {});

    // 7. Smart Outfit Colour Matcher
    this.colourMatcher = createColourMatcher(options.colourMatcher || options.colorMatcher || {});
    this.colorMatcher = this.colourMatcher;
  }

  setAvatarModel(avatarModel) {
    if (this.tryOn) this.tryOn.setAvatarModel(avatarModel);
    if (this.customizer) this.customizer.setAvatarModel(avatarModel);
    if (this.animations) this.animations.setAvatarModel(avatarModel);
  }

  update(delta, time) {
    if (this.animations) {
      this.animations.update(delta, time);
    }
  }

  dispose() {
    if (this.tryOn) this.tryOn.dispose();
    if (this.interactions) this.interactions.dispose();
    if (this.customizer) this.customizer.dispose();
    if (this.animations) this.animations.dispose();
    if (this.savedLooks) this.savedLooks.dispose();
    this.studio3d = null;
  }
}

export function createStudioFeatures(studio3d = null, options = {}) {
  return new StudioFeatures(studio3d, options);
}

// Public API Export
export {
  // Virtual Try-On
  GARMENT_CATEGORIES,
  GARMENT_CATALOG,
  DEFAULT_OUTFIT,
  getGarmentRecord,
  TryOnContract,
  TRY_ON_EVENTS,
  VirtualTryOn,
  createVirtualTryOn,

  // Garment Interactions
  INTERACTION_STATES,
  INTERACTION_EVENTS,
  InteractionsContract,
  SelectionFeedback,
  GarmentInteractions,
  createGarmentInteractions,

  // Outfit Recommendations
  OCCASIONS,
  STYLE_AESTHETICS,
  RecommendationsContract,
  CURATED_LOOKS,
  GARMENT_METRICS,
  COLOR_HARMONY_PAIRS,
  RecommendationEngine,
  createRecommendationEngine,

  // Avatar Customization
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  BODY_PROPORTIONS,
  DEFAULT_AVATAR_CONFIG,
  CUSTOMIZER_EVENTS,
  CustomizerContract,
  AvatarCustomizer,
  createAvatarCustomizer,

  // Animations & Poses
  STUDIO_POSES,
  ANIMATION_EVENTS,
  AnimationsContract,
  IdleMotion,
  POSE_KEYFRAMES,
  PoseController,
  createPoseController,

  // Saved Looks & Lookbook
  LOOKS_EVENTS,
  SavedLooksContract,
  LookbookStorage,
  SavedLooksManager,
  createSavedLooksManager,

  // Smart Outfit Colour Matching
  SmartColourMatcher,
  createColourMatcher,
  SmartColorMatcher,
  createColorMatcher,
  ColourSelectionInterface,
  createColourSelectionInterface,
  ColorSelectionInterface,
  createColorSelectionInterface,
  ColourTheory,
  ColorTheory,
  ColourMatchingContract,
  ColorMatchingContract,
  FASHION_COLOURS,
  FASHION_COLORS,
  SHIRT_COLOUR_SWATCHES,
  PANTS_COLOUR_SWATCHES,
  SHOES_COLOUR_SWATCHES,
  BENCHMARK_OUTFITS,
  COLOUR_MATCHING_EVENTS,
  COLOR_MATCHING_EVENTS,
  RATING_TIERS,
  HARMONY_TYPES,
  OUTFIT_SLOTS
};

if (typeof window !== 'undefined') {
  window.WoobiStudioFeatures = {
    StudioFeatures,
    createStudioFeatures,
    StudioFeaturesContract,
    virtualTryOn: { VirtualTryOn, createVirtualTryOn, GARMENT_CATALOG, GARMENT_CATEGORIES, DEFAULT_OUTFIT, getGarmentRecord },
    interactions: { GarmentInteractions, createGarmentInteractions, SelectionFeedback, INTERACTION_STATES, INTERACTION_EVENTS },
    recommendations: { RecommendationEngine, createRecommendationEngine, OCCASIONS, STYLE_AESTHETICS, CURATED_LOOKS },
    customizer: { AvatarCustomizer, createAvatarCustomizer, SKIN_TONE_PRESETS, HAIR_COLOR_PRESETS, HAIR_STYLES, BODY_PROPORTIONS },
    animations: { PoseController, createPoseController, IdleMotion, STUDIO_POSES, POSE_KEYFRAMES },
    savedLooks: { SavedLooksManager, createSavedLooksManager, LookbookStorage, LOOKS_EVENTS },
    colourMatching: {
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
    },
    colorMatching: {
      SmartColorMatcher,
      createColorMatcher,
      ColorSelectionInterface,
      createColorSelectionInterface,
      ColorTheory,
      FASHION_COLORS,
      ColorMatchingContract
    }
  };
}

export default StudioFeaturesContract;
