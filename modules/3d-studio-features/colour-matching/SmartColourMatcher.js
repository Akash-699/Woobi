/**
 * Woobi - 3D Studio Features
 * SmartColourMatcher.js - Algorithmic Color Matching Engine, Harmony Analysis & Alternatives
 */

import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToHex,
  getHueDifference,
  getContrastRatio,
  analyzeNeutrality,
  getColorTemperature,
  getPairwiseHarmony,
  normalizeHex
} from './ColourTheory.js';

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
  ColourMatchingContract
} from './ColourMatchingContract.js';

export class SmartColourMatcher {
  constructor(options = {}) {
    this.options = Object.assign({
      excellentThreshold: RATING_TIERS.EXCELLENT.minScore,
      goodThreshold: RATING_TIERS.GOOD.minScore
    }, options);
  }

  /**
   * Normalizes any input (hex string, preset name, RGB, or HSL) into a rich ColorRecord
   */
  resolveColor(input, fallbackPreset = 'crisp_white') {
    if (!input) {
      const fb = FASHION_COLOURS[fallbackPreset] || FASHION_COLOURS.crisp_white;
      return this._buildRecordFromPreset(fb);
    }

    // 1. If already a structured ColorRecord
    if (typeof input === 'object' && input.hex && input.rgb && input.hsl) {
      return input;
    }

    // 2. If object with hex
    if (typeof input === 'object' && input.hex) {
      return this._buildRecordFromHex(input.hex, input.name);
    }

    // 3. If string
    if (typeof input === 'string') {
      const trimmed = input.trim();

      // Check if it's a Hex code (#fff, #123456, etc.)
      if (trimmed.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(trimmed) || /^[0-9A-Fa-f]{3}$/.test(trimmed)) {
        return this._buildRecordFromHex(trimmed);
      }

      // Check preset dictionary by name or synonym
      const preset = findPresetByName(trimmed);
      if (preset) {
        return this._buildRecordFromPreset(preset);
      }

      // If unrecognized string, try cleaning hex
      return this._buildRecordFromHex(trimmed, trimmed);
    }

    // Fallback default
    return this._buildRecordFromPreset(FASHION_COLOURS.crisp_white);
  }

  _buildRecordFromPreset(preset) {
    const hex = normalizeHex(preset.hex);
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const neutrality = analyzeNeutrality(hsl.h, hsl.s, hsl.l);
    const temp = getColorTemperature(hsl.h, hsl.s, hsl.l);
    const isNeon = preset.category === 'neon' || (hsl.s >= 80 && hsl.l >= 30 && hsl.l <= 75 && !neutrality.isNeutral);
    const isLoud = isNeon || (hsl.s > 70 && hsl.l >= 25 && hsl.l <= 75 && !neutrality.isNeutral);

    return {
      name: preset.name,
      hex: `#${hex}`,
      rgb,
      hsl,
      family: preset.family,
      isNeutral: neutrality.isNeutral,
      neutralType: neutrality.type,
      temperature: temp,
      isNeon,
      isLoud,
      isPastel: hsl.s >= 20 && hsl.s <= 65 && hsl.l >= 75,
      isMuted: hsl.s <= 45 && hsl.l >= 20 && hsl.l <= 75
    };
  }

  _buildRecordFromHex(hexStr, customName = null) {
    const clean = normalizeHex(hexStr);
    const rgb = hexToRgb(clean);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const neutrality = analyzeNeutrality(hsl.h, hsl.s, hsl.l);
    const temp = getColorTemperature(hsl.h, hsl.s, hsl.l);

    // Check if close to a known fashion preset
    let displayName = customName;
    let closestFamily = 'custom';
    let isPresetNeon = false;

    if (!displayName) {
      for (const [key, val] of Object.entries(FASHION_COLOURS)) {
        const pClean = normalizeHex(val.hex);
        if (pClean.toLowerCase() === clean.toLowerCase()) {
          displayName = val.name;
          closestFamily = val.family;
          isPresetNeon = val.category === 'neon';
          break;
        }
      }
    }

    if (!displayName) {
      displayName = `#${clean}`;
      if (neutrality.isNeutral) {
        closestFamily = neutrality.family || 'neutral';
      }
    }

    const isNeon = isPresetNeon || (hsl.s >= 80 && hsl.l >= 30 && hsl.l <= 75 && !neutrality.isNeutral);
    const isLoud = isNeon || (hsl.s > 70 && hsl.l >= 25 && hsl.l <= 75 && !neutrality.isNeutral);

    return {
      name: displayName,
      hex: `#${clean}`,
      rgb,
      hsl,
      family: closestFamily,
      isNeutral: neutrality.isNeutral,
      neutralType: neutrality.type,
      temperature: temp,
      isNeon,
      isLoud,
      isPastel: hsl.s >= 20 && hsl.s <= 65 && hsl.l >= 75,
      isMuted: hsl.s <= 45 && hsl.l >= 20 && hsl.l <= 75
    };
  }

  /**
   * Main Outfit Analysis Method
   * Analyzes { shirt, pants, shoes } (or { top, bottom, shoes }) using Color Theory
   */
  analyzeOutfit(outfit) {
    if (!outfit) {
      throw new Error('SmartColourMatcher: Outfit configuration object is required.');
    }

    const shirtRaw = outfit.shirt || outfit.top || 'Crisp White';
    const pantsRaw = outfit.pants || outfit.bottom || 'Midnight Navy';
    const shoesRaw = outfit.shoes || outfit.footwear || 'Espresso Brown';

    const shirt = this.resolveColor(shirtRaw, 'crisp_white');
    const pants = this.resolveColor(pantsRaw, 'midnight_navy');
    const shoes = this.resolveColor(shoesRaw, 'espresso');

    // 1. Neutral Foundations & Saturation Count
    const colors = [shirt, pants, shoes];
    const neutralCount = colors.filter(c => c.isNeutral).length;
    const loudCount = colors.filter(c => c.isLoud).length;

    // 2. Angular distances & pairwise harmonies
    const hueDiffShirtPants = getHueDifference(shirt.hsl.h, pants.hsl.h);
    const hueDiffPantsShoes = getHueDifference(pants.hsl.h, shoes.hsl.h);
    const hueDiffShirtShoes = getHueDifference(shirt.hsl.h, shoes.hsl.h);

    const pairTopBottom = getPairwiseHarmony(shirt.hsl.h, pants.hsl.h);
    const pairBottomShoes = getPairwiseHarmony(pants.hsl.h, shoes.hsl.h);

    // 3. Contrast Ratios
    const contrastTopBottom = getContrastRatio(shirt.rgb, pants.rgb);
    const contrastBottomShoes = getContrastRatio(pants.rgb, shoes.rgb);

    // 4. Clashing & Discordance Detection
    let isClashing = false;
    const clashReasons = [];

    // Rule A: Over-saturation / Neon overload
    const neonCount = colors.filter(c => c.isNeon).length;
    if (loudCount >= 2 && neutralCount === 0) {
      isClashing = true;
      clashReasons.push('Multiple loud, high-saturation colors compete aggressively without a neutral anchor.');
    } else if (loudCount >= 3 || neonCount >= 2) {
      isClashing = true;
      clashReasons.push('Extreme neon vibrancy across garments causes severe visual vibration and clash.');
    }

    // Rule B: Discordant non-complementary angles between non-neutral top and bottom
    if (!shirt.isNeutral && !pants.isNeutral) {
      if (
        hueDiffShirtPants >= 75 &&
        hueDiffShirtPants <= 105 &&
        shirt.hsl.s > 50 &&
        pants.hsl.s > 50 &&
        shirt.hsl.l >= 25 &&
        shirt.hsl.l <= 75 &&
        pants.hsl.l >= 25 &&
        pants.hsl.l <= 75
      ) {
        isClashing = true;
        clashReasons.push(`Discordant hue angle (~${hueDiffShirtPants}°) between shirt and pants produces a jarring color clash.`);
      }
    }

    // Rule C: Dark Muddy Collision (near-black vs dark non-navy brown)
    if (
      (shirt.family === 'black' && pants.family === 'brown' && pants.hsl.l < 25) ||
      (pants.family === 'black' && shoes.family === 'brown' && shoes.hsl.l < 25)
    ) {
      clashReasons.push('Near-black and dark brown collide without sufficient value distinction.');
    }

    // 5. Calculate Comprehensive Harmony Score (0 - 100)
    let score = 50; // Starting baseline
    const positiveFactors = [];
    const stylingNotes = [];

    // Single neon penalty
    if (neonCount === 1) {
      score -= 22;
      clashReasons.push('High-intensity neon piece introduces sharp optical vibration against everyday tailoring.');
    }

    // --- Factor A: Neutral Anchor Stability (up to +35 pts) ---
    if (neutralCount === 3) {
      score += 32;
      positiveFactors.push('Full neutral tonal palette creating a refined, understated aesthetic.');
    } else if (neutralCount === 2) {
      score += 30;
      positiveFactors.push('Two grounding neutrals framing a single intentional accent piece.');
    } else if (neutralCount === 1) {
      if (!isClashing) {
        score += 18;
        positiveFactors.push('Neutral anchor provides an eye rest for coordinated accent shades.');
      } else {
        score += 5;
      }
    } else {
      // 0 neutrals
      if (!isClashing && (pairTopBottom.harmony === 'analogous' || pairTopBottom.harmony === 'monochromatic')) {
        score += 15;
        positiveFactors.push('Unified tonal harmony compensates for the absence of true neutrals.');
      } else {
        score -= 15;
        clashReasons.push('No neutral grounding pieces (black, white, navy, grey, tan) to balance the outfit.');
      }
    }

    // --- Factor B: Color Wheel Harmony Type (up to +25 pts) ---
    let harmonyType = HARMONY_TYPES.NEUTRAL_ACCENT;

    if (neutralCount === 3) {
      harmonyType = HARMONY_TYPES.ALL_NEUTRAL;
    } else if (hueDiffShirtPants <= 20 && (!shoes.isNeutral ? hueDiffPantsShoes <= 20 : true)) {
      harmonyType = HARMONY_TYPES.MONOCHROMATIC;
      score += 18;
      positiveFactors.push('Monochromatic color story with variations in depth and texture.');
    } else if (pairTopBottom.harmony === 'analogous') {
      harmonyType = HARMONY_TYPES.ANALOGOUS;
      score += 16;
      positiveFactors.push('Analogous color wheel neighbors create a natural, harmonious gradient.');
    } else if (pairTopBottom.harmony === 'complementary') {
      harmonyType = HARMONY_TYPES.COMPLEMENTARY;
      score += 18;
      positiveFactors.push('Complementary color pairing creates dynamic, high-impact aesthetic balance.');
    } else if (shirt.family === 'brown' || pants.family === 'brown' || shirt.family === 'green') {
      harmonyType = HARMONY_TYPES.EARTH_TONAL;
      score += 14;
      positiveFactors.push('Warm earth-tone synergy inspired by natural organic palettes.');
    }

    // --- Factor C: The Sandwiching & Footwear Grounding Principle (up to +15 pts) ---
    // If shoes match shirt tone/color or provide solid neutral grounding
    if (shoes.isNeutral) {
      score += 8;
      stylingNotes.push(`${shoes.name} footwear securely anchors the silhouette.`);
    }

    // Sandwiching: Shoes echo Shirt lightness or family (e.g. White shirt + Navy pants + White shoes)
    if (
      shirt.family === shoes.family ||
      (shirt.isNeutral && shoes.isNeutral && Math.abs(shirt.hsl.l - shoes.hsl.l) < 25) ||
      hueDiffShirtShoes <= 25
    ) {
      score += 10;
      positiveFactors.push('Sandwiching effect: Footwear mirrors the shirt tone, cleanly framing the trousers.');
    }

    // --- Factor D: Value Contrast & Hierarchy (up to +12 pts) ---
    if (contrastTopBottom >= 2.0) {
      score += 8;
      stylingNotes.push(`Clean visual separation between top and bottom (contrast ratio ${contrastTopBottom.toFixed(1)}:1).`);
    } else if (contrastTopBottom < 1.3 && harmonyType !== HARMONY_TYPES.MONOCHROMATIC && harmonyType !== HARMONY_TYPES.ALL_NEUTRAL) {
      score -= 6;
      clashReasons.push('Lack of value contrast makes the boundary between shirt and pants look muddy.');
    }

    // Grounding: Pants or shoes darker than shirt
    if (pants.hsl.l <= shirt.hsl.l || shoes.hsl.l <= shirt.hsl.l) {
      score += 5;
      stylingNotes.push('Naturally grounded visual weight (lower body anchored in equal or darker values).');
    }

    // Penalties for clashing
    if (isClashing) {
      harmonyType = HARMONY_TYPES.CLASHING;
      score = Math.min(score, 58); // Cap below Good threshold
      if (loudCount >= 2) score -= 15;
    }

    // Final Score Clamping
    score = Math.max(15, Math.min(99, Math.round(score)));

    // Rating Assignment
    const ratingTier = this.getRatingTier(score);

    // Detailed explanation assembly
    const explanation = this._generateExplanation({
      shirt,
      pants,
      shoes,
      ratingTier,
      harmonyType,
      isClashing,
      positiveFactors,
      clashReasons,
      stylingNotes,
      contrastTopBottom
    });

    // Generate intelligent alternatives if score is below Excellent or upon request
    const alternatives = this._generateAlternatives(shirt, pants, shoes, score);

    return {
      score,
      rating: ratingTier.label,
      ratingId: ratingTier.id,
      badgeColor: ratingTier.badgeColor,
      harmonyType,
      isClashing,
      verdict: this._getVerdictHeadline(score, harmonyType, isClashing),
      explanation,
      positiveFactors,
      clashReasons,
      stylingNotes,
      metrics: {
        neutralCount,
        loudCount,
        contrastTopBottom: parseFloat(contrastTopBottom.toFixed(2)),
        contrastBottomShoes: parseFloat(contrastBottomShoes.toFixed(2)),
        hueDiffShirtPants,
        hueDiffPantsShoes
      },
      palette: {
        shirt,
        pants,
        shoes
      },
      alternatives
    };
  }

  getRatingTier(score) {
    if (score >= this.options.excellentThreshold) {
      return RATING_TIERS.EXCELLENT;
    }
    if (score >= this.options.goodThreshold) {
      return RATING_TIERS.GOOD;
    }
    return RATING_TIERS.NEEDS_IMPROVEMENT;
  }

  _getVerdictHeadline(score, harmonyType, isClashing) {
    if (isClashing) {
      return 'Discordant Clashing — Lacks Neutral Anchor & Value Balance';
    }
    if (score >= 90) {
      return 'Exceptional Ensemble — Sophisticated Harmony & Impeccable Balance';
    }
    if (score >= 85) {
      return 'Excellent Combination — Cohesive Color Story with Strong Grounding';
    }
    if (score >= 75) {
      return 'Good Everyday Match — Versatile & Balanced Coordination';
    }
    if (score >= 65) {
      return 'Solid Base — Subtle Adjustments Could Elevate Cohesion';
    }
    return 'Needs Improvement — High Risk of Visual Clashing';
  }

  _generateExplanation(ctx) {
    const {
      shirt,
      pants,
      shoes,
      ratingTier,
      harmonyType,
      isClashing,
      positiveFactors,
      clashReasons,
      stylingNotes
    } = ctx;

    const sections = [];

    // 1. Overview
    if (ratingTier.id === 'excellent') {
      sections.push(
        `This combination achieves an Excellent rating (${ratingTier.label}). The interplay of ${shirt.name} on top with ${pants.name} trousers and ${shoes.name} footwear creates a balanced and stylish outfit.`
      );
    } else if (ratingTier.id === 'good') {
      sections.push(
        `This is a Good, wearable combination. ${shirt.name} and ${pants.name} coordinate decently, with ${shoes.name} grounding the lower half.`
      );
    } else {
      sections.push(
        `This combination Needs Improvement. The colors compete rather than harmonize, creating visual discord or an ungrounded look.`
      );
    }

    // 2. Garment Synergy (Shirt vs Pants)
    if (isClashing) {
      sections.push(
        `Why they clash: ${clashReasons.join(' ')} Pairing ${shirt.name} with ${pants.name} lacks complementary harmony or an eye-resting neutral buffer.`
      );
    } else {
      sections.push(
        `Top & Bottom Synergy: ${positiveFactors[0] || 'The chosen top and bottom complement each other naturally.'}`
      );
    }

    // 3. Footwear Role
    if (stylingNotes.length > 0) {
      sections.push(`Footwear Role: ${stylingNotes.join(' ')}`);
    }

    // 4. Styling Recommendation
    if (ratingTier.id === 'needs_improvement') {
      sections.push(
        `Styling Tip: Introduce at least one classic neutral (Crisp White, Charcoal, Midnight Navy, or Espresso Brown) to restore balance and anchor the outfit.`
      );
    } else if (ratingTier.id === 'good') {
      sections.push(
        `Styling Tip: To elevate this from Good to Excellent, consider mirroring your shirt tone in your footwear (sandwiching), or adjusting contrast between top and trousers.`
      );
    } else {
      sections.push(
        `Styling Tip: This is a turnkey look ready for wear across social, casual, or smart settings.`
      );
    }

    return sections.join('\n\n');
  }

  /**
   * Generates alternative color suggestions for shirt, pants, and shoes
   * to turn any outfit into an "Excellent" rating
   */
  _generateAlternatives(shirt, pants, shoes, currentScore) {
    const suggestions = {
      shirtAlternatives: [],
      pantsAlternatives: [],
      shoesAlternatives: [],
      recommendedPalettes: []
    };

    // 1. Shirt Alternatives (keeping pants & shoes)
    const shirtCandidates = [
      FASHION_COLOURS.crisp_white,
      FASHION_COLOURS.off_white,
      FASHION_COLOURS.powder_blue,
      FASHION_COLOURS.heather_grey,
      FASHION_COLOURS.sage_green,
      FASHION_COLOURS.camel,
      FASHION_COLOURS.midnight_navy
    ];

    for (const cand of shirtCandidates) {
      if (cand.hex.toLowerCase() === shirt.hex.toLowerCase()) continue;
      const sim = this.analyzeOutfitSim(cand.name, pants.hex, shoes.hex);
      if (sim.score >= 85) {
        suggestions.shirtAlternatives.push({
          slot: 'shirt',
          name: cand.name,
          hex: cand.hex,
          projectedScore: sim.score,
          projectedRating: sim.rating,
          reason: `Switching to ${cand.name} creates a cleaner, high-contrast anchor against ${pants.name}.`
        });
      }
    }

    // 2. Pants Alternatives (keeping shirt & shoes)
    const pantsCandidates = [
      FASHION_COLOURS.midnight_navy,
      FASHION_COLOURS.charcoal,
      FASHION_COLOURS.khaki,
      FASHION_COLOURS.beige,
      FASHION_COLOURS.olive_green,
      FASHION_COLOURS.jet_black
    ];

    for (const cand of pantsCandidates) {
      if (cand.hex.toLowerCase() === pants.hex.toLowerCase()) continue;
      const sim = this.analyzeOutfitSim(shirt.hex, cand.name, shoes.hex);
      if (sim.score >= 85) {
        suggestions.pantsAlternatives.push({
          slot: 'pants',
          name: cand.name,
          hex: cand.hex,
          projectedScore: sim.score,
          projectedRating: sim.rating,
          reason: `Replacing trousers with ${cand.name} introduces a grounding neutral foundation.`
        });
      }
    }

    // 3. Shoes Alternatives (keeping shirt & pants)
    const shoesCandidates = [
      FASHION_COLOURS.crisp_white,
      FASHION_COLOURS.espresso,
      FASHION_COLOURS.jet_black,
      FASHION_COLOURS.tan,
      FASHION_COLOURS.midnight_navy
    ];

    for (const cand of shoesCandidates) {
      if (cand.hex.toLowerCase() === shoes.hex.toLowerCase()) continue;
      const sim = this.analyzeOutfitSim(shirt.hex, pants.hex, cand.name);
      if (sim.score >= 85) {
        suggestions.shoesAlternatives.push({
          slot: 'shoes',
          name: cand.name,
          hex: cand.hex,
          projectedScore: sim.score,
          projectedRating: sim.rating,
          reason: `Choosing ${cand.name} footwear provides immediate grounding and style cohesion.`
        });
      }
    }

    // Sort by projectedScore descending and limit to top 3 each
    suggestions.shirtAlternatives.sort((a, b) => b.projectedScore - a.projectedScore);
    suggestions.pantsAlternatives.sort((a, b) => b.projectedScore - a.projectedScore);
    suggestions.shoesAlternatives.sort((a, b) => b.projectedScore - a.projectedScore);

    suggestions.shirtAlternatives = suggestions.shirtAlternatives.slice(0, 3);
    suggestions.pantsAlternatives = suggestions.pantsAlternatives.slice(0, 3);
    suggestions.shoesAlternatives = suggestions.shoesAlternatives.slice(0, 3);

    // 4. Curated Full-Outfit Palettes
    suggestions.recommendedPalettes = [
      {
        name: 'The Modern Classic',
        shirt: 'Crisp White',
        pants: 'Midnight Navy',
        shoes: 'Espresso Brown',
        score: 96,
        rating: 'Excellent',
        aesthetic: 'Timeless Smart Casual'
      },
      {
        name: 'Quiet Luxury Earth Tones',
        shirt: 'Camel',
        pants: 'Olive Green',
        shoes: 'Tan',
        score: 94,
        rating: 'Excellent',
        aesthetic: 'Organic Elegance'
      },
      {
        name: 'Urban Monochromatic',
        shirt: 'Heather Grey',
        pants: 'Charcoal',
        shoes: 'Jet Black',
        score: 95,
        rating: 'Excellent',
        aesthetic: 'Minimalist Contemporary'
      }
    ];

    return suggestions;
  }

  /**
   * Fast lightweight simulation for score projection
   */
  analyzeOutfitSim(shirt, pants, shoes) {
    const s = this.resolveColor(shirt);
    const p = this.resolveColor(pants);
    const sh = this.resolveColor(shoes);

    const neutralCount = [s, p, sh].filter(c => c.isNeutral).length;
    const loudCount = [s, p, sh].filter(c => c.isLoud).length;
    const neonCount = [s, p, sh].filter(c => c.isNeon).length;

    let score = 55;
    if (neutralCount === 3) score += 32;
    else if (neutralCount === 2) score += 30;
    else if (neutralCount === 1) score += 18;

    const diff = getHueDifference(s.hsl.h, p.hsl.h);
    if (diff <= 20 || (diff >= 140 && diff <= 180) || (diff >= 25 && diff <= 60)) {
      score += 15;
    }

    if (s.family === sh.family || (s.isNeutral && sh.isNeutral)) {
      score += 8;
    }

    if (neonCount >= 2) {
      score = Math.min(score - 35, 45);
    } else if (neonCount === 1) {
      score -= 22;
    } else if (loudCount >= 2 && neutralCount === 0) {
      score = Math.min(score - 30, 50);
    }

    score = Math.max(20, Math.min(99, Math.round(score)));
    const tier = this.getRatingTier(score);

    return {
      score,
      rating: tier.label
    };
  }

  /**
   * Returns benchmark outfits for testing and automated validation
   */
  getCuratedBenchmarks() {
    return BENCHMARK_OUTFITS;
  }
}

export function createColourMatcher(options = {}) {
  return new SmartColourMatcher(options);
}
