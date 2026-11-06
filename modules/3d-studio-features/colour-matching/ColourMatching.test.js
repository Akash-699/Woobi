/**
 * Woobi - 3D Studio Features
 * ColourMatching.test.js - Comprehensive Test Suite for Smart Outfit Colour Matching
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  SmartColourMatcher,
  createColourMatcher,
  SmartColorMatcher,
  ColourSelectionInterface,
  createColourSelectionInterface,
  ColourTheory,
  FASHION_COLOURS,
  findPresetByName,
  RATING_TIERS,
  HARMONY_TYPES,
  BENCHMARK_OUTFITS,
  COLOUR_MATCHING_EVENTS
} from './index.js';

describe('Smart Outfit Colour Matching - Colour Theory Math & Science', () => {
  it('1. should accurately convert Hex to RGB and RGB to Hex', () => {
    const rgb = ColourTheory.hexToRgb('#101D2C');
    assert.strictEqual(rgb.r, 16);
    assert.strictEqual(rgb.g, 29);
    assert.strictEqual(rgb.b, 44);

    const hex = ColourTheory.rgbToHex(16, 29, 44);
    assert.strictEqual(hex, '#101D2C');

    // 3-char hex shorthand
    const shortRgb = ColourTheory.hexToRgb('#FFF');
    assert.strictEqual(shortRgb.r, 255);
    assert.strictEqual(shortRgb.g, 255);
    assert.strictEqual(shortRgb.b, 255);
  });

  it('2. should accurately convert RGB to HSL and HSL to Hex', () => {
    const hsl = ColourTheory.rgbToHsl(255, 0, 0); // Pure Red
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 100);
    assert.strictEqual(hsl.l, 50);

    const hexBack = ColourTheory.hslToHex(0, 100, 50);
    assert.strictEqual(hexBack, '#FF0000');
  });

  it('3. should calculate shortest angular distance on the 360° color wheel', () => {
    assert.strictEqual(ColourTheory.getHueDifference(10, 30), 20);
    assert.strictEqual(ColourTheory.getHueDifference(350, 10), 20); // wrap-around
    assert.strictEqual(ColourTheory.getHueDifference(0, 180), 180); // complementary
    assert.strictEqual(ColourTheory.getHueDifference(10, 200), 170);
  });

  it('4. should compute relative luminance and WCAG contrast ratios', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const ratio = ColourTheory.getContrastRatio(white, black);
    assert.ok(ratio >= 20.5 && ratio <= 21.0); // Perfect contrast
  });

  it('5. should correctly identify fashion neutrals (true neutrals & staple neutrals)', () => {
    // Pure White
    const whiteNeutral = ColourTheory.analyzeNeutrality(0, 0, 100);
    assert.strictEqual(whiteNeutral.isNeutral, true);

    // Jet Black
    const blackNeutral = ColourTheory.analyzeNeutrality(0, 0, 5);
    assert.strictEqual(blackNeutral.isNeutral, true);

    // Charcoal Grey
    const greyNeutral = ColourTheory.analyzeNeutrality(210, 10, 30);
    assert.strictEqual(greyNeutral.isNeutral, true);

    // Deep Navy (acting as staple fashion neutral)
    const navyNeutral = ColourTheory.analyzeNeutrality(215, 45, 20);
    assert.strictEqual(navyNeutral.isNeutral, true);

    // Camel / Khaki (earth neutral)
    const camelNeutral = ColourTheory.analyzeNeutrality(35, 45, 55);
    assert.strictEqual(camelNeutral.isNeutral, true);

    // Loud Neon Green (accent / loud)
    const neonNeutral = ColourTheory.analyzeNeutrality(120, 100, 50);
    assert.strictEqual(neonNeutral.isNeutral, false);
  });
});

describe('Smart Outfit Colour Matching - Preset Lookup & Shade Resolution', () => {
  const matcher = createColourMatcher();

  it('6. should resolve color names, synonyms, and variations case-insensitively', () => {
    const white = matcher.resolveColor('crisp white');
    assert.strictEqual(white.name, 'Crisp White');
    assert.strictEqual(white.hex, '#F8F9FA');

    const navy = matcher.resolveColor('navy');
    assert.strictEqual(navy.name, 'Midnight Navy');
    assert.strictEqual(navy.hex, '#101D2C');

    const olive = matcher.resolveColor('olive green');
    assert.strictEqual(olive.name, 'Olive Green');
    assert.strictEqual(olive.hex, '#556B2F');

    const camel = matcher.resolveColor('Camel');
    assert.strictEqual(camel.name, 'Camel');
    assert.strictEqual(camel.hex, '#C19A6B');
  });

  it('7. should resolve custom hex colors and assign closest properties', () => {
    const custom = matcher.resolveColor('#2C3E50');
    assert.strictEqual(custom.hex, '#2C3E50');
    assert.ok(custom.rgb);
    assert.ok(custom.hsl);
    assert.ok(typeof custom.isNeutral === 'boolean');
  });
});

describe('Smart Outfit Colour Matching - Classic "Excellent" Ensembles', () => {
  const matcher = createColourMatcher();

  it('8. should rate White Shirt + Navy Pants + Brown Shoes as Excellent (Score >= 85)', () => {
    const result = matcher.analyzeOutfit({
      shirt: 'Crisp White',
      pants: 'Midnight Navy',
      shoes: 'Espresso Brown'
    });

    assert.strictEqual(result.rating, 'Excellent');
    assert.ok(result.score >= 85, `Expected score >= 85, got ${result.score}`);
    assert.strictEqual(result.isClashing, false);
    assert.ok(result.verdict.includes('Exceptional') || result.verdict.includes('Excellent'));
    assert.ok(result.explanation.includes('Excellent'));
  });

  it('9. should rate Quiet Luxury Earth Tones (Cream + Olive Green + Tan) as Excellent', () => {
    const result = matcher.analyzeOutfit({
      shirt: 'Cream',
      pants: 'Olive Green',
      shoes: 'Tan'
    });

    assert.strictEqual(result.rating, 'Excellent');
    assert.ok(result.score >= 85, `Expected score >= 85, got ${result.score}`);
    assert.strictEqual(result.isClashing, false);
  });

  it('10. should rate Urban Contemporary Monochrome (Heather Grey + Charcoal + Jet Black) as Excellent', () => {
    const result = matcher.analyzeOutfit({
      shirt: 'Heather Grey',
      pants: 'Charcoal',
      shoes: 'Jet Black'
    });

    assert.strictEqual(result.rating, 'Excellent');
    assert.ok(result.score >= 85, `Expected score >= 85, got ${result.score}`);
    assert.strictEqual(result.harmonyType, HARMONY_TYPES.ALL_NEUTRAL);
  });

  it('11. should rate Sartorial Complementary (Terracotta + Midnight Navy + Espresso) as Excellent', () => {
    const result = matcher.analyzeOutfit({
      shirt: 'Terracotta',
      pants: 'Midnight Navy',
      shoes: 'Espresso Brown'
    });

    assert.strictEqual(result.rating, 'Excellent');
    assert.ok(result.score >= 85, `Expected score >= 85, got ${result.score}`);
    assert.strictEqual(result.harmonyType, HARMONY_TYPES.COMPLEMENTARY);
  });

  it('12. should reward the "Sandwiching" principle when shoes echo shirt tone', () => {
    // White shirt + Navy pants + White shoes
    const sandwiched = matcher.analyzeOutfit({
      shirt: 'Crisp White',
      pants: 'Midnight Navy',
      shoes: 'Crisp White'
    });

    assert.strictEqual(sandwiched.rating, 'Excellent');
    assert.ok(sandwiched.score >= 90);
    assert.ok(sandwiched.positiveFactors.some(f => f.includes('Sandwiching')));
  });
});

describe('Smart Outfit Colour Matching - Wearable "Good" Combinations', () => {
  const matcher = createColourMatcher();

  it('13. should rate Burgundy + Beige + White as Good (Score 65 - 84)', () => {
    const result = matcher.analyzeOutfit({
      shirt: 'Burgundy',
      pants: 'Beige',
      shoes: 'Crisp White'
    });

    assert.ok(result.rating === 'Good' || result.rating === 'Excellent');
    assert.ok(result.score >= 65, `Expected score >= 65, got ${result.score}`);
    assert.strictEqual(result.isClashing, false);
  });

  it('14. should rate Sage Green + Classic Denim + Espresso as Good or Excellent', () => {
    const result = matcher.analyzeOutfit({
      shirt: 'Sage Green',
      pants: 'Classic Denim',
      shoes: 'Espresso Brown'
    });

    assert.ok(result.score >= 65);
    assert.strictEqual(result.isClashing, false);
  });
});

describe('Smart Outfit Colour Matching - Clashing & "Needs Improvement"', () => {
  const matcher = createColourMatcher();

  it('15. should flag high-neon clash (Neon Green + Hot Pink + Electric Lime) as Needs Improvement', () => {
    const result = matcher.analyzeOutfit({
      shirt: '#39FF14', // Neon Green
      pants: '#FF1493', // Hot Pink
      shoes: '#CCFF00'  // Electric Lime
    });

    assert.strictEqual(result.rating, 'Needs Improvement');
    assert.ok(result.score < 65, `Expected score < 65, got ${result.score}`);
    assert.strictEqual(result.isClashing, true);
    assert.strictEqual(result.harmonyType, HARMONY_TYPES.CLASHING);
    assert.ok(result.clashReasons.length > 0);
  });

  it('16. should flag discordant non-complementary angles as Needs Improvement', () => {
    const result = matcher.analyzeOutfit({
      shirt: '#FF6600', // Blaze Orange
      pants: '#FF1493', // Magenta
      shoes: '#39FF14'  // Neon Green
    });

    assert.strictEqual(result.rating, 'Needs Improvement');
    assert.ok(result.score < 65);
    assert.strictEqual(result.isClashing, true);
  });
});

describe('Smart Outfit Colour Matching - Feedback & Alternative Suggestions', () => {
  const matcher = createColourMatcher();

  it('17. should explain why clashing colors clash in clear educational language', () => {
    const result = matcher.analyzeOutfit({
      shirt: '#39FF14',
      pants: '#FF1493',
      shoes: '#CCFF00'
    });

    assert.ok(result.explanation.includes('Needs Improvement'));
    assert.ok(result.explanation.includes('clash') || result.explanation.includes('compete'));
    assert.ok(result.explanation.includes('Styling Tip'));
  });

  it('18. should provide alternative color suggestions that elevate a clashing outfit', () => {
    const result = matcher.analyzeOutfit({
      shirt: '#39FF14', // Neon Green
      pants: 'Midnight Navy',
      shoes: 'Espresso Brown'
    });

    const alts = result.alternatives;
    assert.ok(alts);
    assert.ok(alts.shirtAlternatives.length > 0, 'Should provide shirt alternatives');

    // The suggested shirt alternative should project an Excellent score
    const topAlt = alts.shirtAlternatives[0];
    assert.ok(topAlt.projectedScore >= 85, `Projected score should be >= 85, got ${topAlt.projectedScore}`);
    assert.strictEqual(topAlt.projectedRating, 'Excellent');
  });

  it('19. should provide curated ready-to-wear benchmark palettes', () => {
    const benchmarks = matcher.getCuratedBenchmarks();
    assert.ok(benchmarks.EXCELLENT.length >= 3);
    assert.ok(benchmarks.NEEDS_IMPROVEMENT.length >= 2);
  });
});

describe('Smart Outfit Colour Matching - UI Component & State Management', () => {
  it('20. should instantiate ColourSelectionInterface with initial colors', () => {
    const ui = createColourSelectionInterface({
      initialShirt: 'Crisp White',
      initialPants: 'Midnight Navy',
      initialShoes: 'Espresso Brown'
    });

    const sel = ui.getSelection();
    assert.strictEqual(sel.shirt, 'Crisp White');
    assert.strictEqual(sel.pants, 'Midnight Navy');
    assert.strictEqual(sel.shoes, 'Espresso Brown');

    const analysis = ui.getAnalysis();
    assert.strictEqual(analysis.rating, 'Excellent');
    assert.ok(analysis.score >= 85);
  });

  it('21. should update selection and re-analyze on setColour()', () => {
    const ui = new ColourSelectionInterface();
    let changeEmitted = false;

    ui.on(COLOUR_MATCHING_EVENTS.CHANGE, data => {
      changeEmitted = true;
      assert.strictEqual(data.slot, 'shirt');
      assert.strictEqual(data.colour, 'Camel');
    });

    ui.setColour('shirt', 'Camel');

    assert.strictEqual(changeEmitted, true);
    assert.strictEqual(ui.getSelection().shirt, 'Camel');
    assert.ok(ui.getAnalysis().score > 0);
  });

  it('22. should support US English alias methods (setColor, SmartColorMatcher)', () => {
    assert.strictEqual(SmartColorMatcher, SmartColourMatcher);
    const ui = new ColourSelectionInterface();
    ui.setColor('pants', 'Khaki');
    assert.strictEqual(ui.getSelection().pants, 'Khaki');
  });

  it('23. should apply suggested alternatives smoothly', () => {
    const ui = new ColourSelectionInterface();
    let appliedEmitted = false;

    ui.on(COLOUR_MATCHING_EVENTS.ALTERNATIVE_APPLIED, data => {
      appliedEmitted = true;
      assert.strictEqual(data.slot, 'shirt');
      assert.strictEqual(data.colour, 'Powder Blue');
    });

    ui.applyAlternative('shirt', 'Powder Blue');

    assert.strictEqual(appliedEmitted, true);
    assert.strictEqual(ui.getSelection().shirt, 'Powder Blue');
  });

  it('24. should reset back to default initial values on reset()', () => {
    const ui = new ColourSelectionInterface({
      initialShirt: 'Crisp White'
    });

    ui.setColour('shirt', '#39FF14');
    assert.strictEqual(ui.getSelection().shirt, '#39FF14');

    ui.reset();
    assert.strictEqual(ui.getSelection().shirt, 'Crisp White');
  });

  it('25. should render cleanly in headless environment', () => {
    const ui = new ColourSelectionInterface();
    const rendered = ui.render();
    assert.ok(rendered);
    assert.strictEqual(rendered.type, 'headless-colour-interface');
  });
});

