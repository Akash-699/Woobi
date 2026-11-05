# Smart Outfit Colour Matching (`modules/3d-studio-features/colour-matching`)

## Overview
The **Smart Outfit Colour Matching** feature for AURA Wardrobe provides algorithmic color combination analysis, rating scores (Excellent, Good, Needs Improvement), color theory explanations, and dynamic alternative suggestions for outfits comprising **shirts**, **pants**, and **shoes**.

## Key Capabilities

1. **Colour Selection Interface:**
   - Interactive selection for Shirt, Pants, and Shoes.
   - Quick-select curated fashion swatches (neutrals, earth tones, pastels, rich accents).
   - Custom hex code input (`#001F3F`) and native HTML5 color-picker support.
   - Support for wide range of shades and subtle variations (e.g. powder blue, midnight navy, ecru, sage, terracotta).

2. **Colour Combination Analysis (Colour Theory):**
   - Precise color conversion (Hex ⇄ RGB ⇄ HSL).
   - Relative luminance & WCAG contrast calculation.
   - Color wheel angular distance & harmony evaluation:
     - **Monochromatic** (within 20° hue delta, lightness variation)
     - **Analogous** (25° - 60° hue delta)
     - **Complementary** (140° - 180° hue delta)
     - **Split-Complementary**
     - **Neutral Anchor + Accent**
     - **All-Neutral Tonal / Quiet Luxury**
     - **Earth Tonal**
   - Value hierarchy & silhouette grounding analysis.
   - "Sandwiching" / Echoing principle detection (shoes mirroring top).

3. **Scoring & Rating Tiers:**
   - **Excellent** (85 - 100%): Timeless harmony, balanced contrast, and grounded silhouette.
   - **Good** (65 - 84%): Coordinated and wearable with minor refinement opportunities.
   - **Needs Improvement** (0 - 64%): Clashing saturation, discordant angles, or lack of neutral eye-rest.

4. **Detailed Explanations:**
   - Clear diagnostic feedback explaining *why* colors match or clash.
   - Top & bottom interplay breakdown.
   - Footwear grounding role.

5. **Smart Alternative Suggestions:**
   - Recommends alternative shirt, pants, or shoe colors that elevate any combination to an "Excellent" rating.
   - Interactive 1-click alternative replacement chips.

## Core API

```javascript
import {
  SmartColourMatcher,
  createColourMatcher,
  ColourSelectionInterface,
  ColourTheory
} from './colour-matching/index.js';

// 1. Programmatic Analysis
const matcher = createColourMatcher();
const result = matcher.analyzeOutfit({
  shirt: 'Crisp White',
  pants: 'Midnight Navy',
  shoes: 'Espresso Brown'
});

console.log(result.rating); // "Excellent"
console.log(result.score);  // 96
console.log(result.verdict); // "Exceptional Ensemble — Sophisticated Harmony..."

// 2. Interactive UI Interface
const ui = new ColourSelectionInterface();
ui.mount('#myContainer');
```

