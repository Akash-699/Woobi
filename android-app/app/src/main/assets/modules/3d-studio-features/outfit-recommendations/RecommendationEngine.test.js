/**
 * Woobi - 3D Studio Features
 * RecommendationEngine.test.js - Unit & Integration Test Suite for Outfit Recommendations
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
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

describe('Outfit Recommendations Module - Specifications & Contracts', () => {
  it('1. should export standard occasions', () => {
    assert.strictEqual(OCCASIONS.CASUAL, 'casual');
    assert.strictEqual(OCCASIONS.BUSINESS, 'business');
    assert.strictEqual(OCCASIONS.EVENING, 'evening');
    assert.strictEqual(OCCASIONS.SUMMER, 'summer');
  });

  it('2. should export style aesthetic categories', () => {
    assert.strictEqual(STYLE_AESTHETICS.QUIET_LUXURY, 'quiet_luxury');
    assert.strictEqual(STYLE_AESTHETICS.PARISIAN_CHIC, 'parisian_chic');
    assert.strictEqual(STYLE_AESTHETICS.CONTEMPORARY_WORK, 'contemporary_work');
  });

  it('3. should satisfy RecommendationsContract specification', () => {
    assert.strictEqual(RecommendationsContract.name, 'OutfitRecommendations');
    assert.ok(Array.isArray(RecommendationsContract.methods));
    assert.ok(RecommendationsContract.methods.includes('scoreOutfit'));
    assert.ok(RecommendationsContract.methods.includes('getRecommendations'));
    assert.ok(RecommendationsContract.methods.includes('completeOutfit'));
  });

  it('4. should provide curated looks with required schema', () => {
    assert.ok(CURATED_LOOKS.length >= 4);
    const look = CURATED_LOOKS[0];
    assert.ok(look.id);
    assert.ok(look.name);
    assert.ok(look.outfit.top);
    assert.ok(look.outfit.bottom);
    assert.ok(look.outfit.shoes);
    assert.ok(typeof look.harmonyScore === 'number');
  });

  it('5. should define garment metrics for all primary catalog items', () => {
    assert.ok(GARMENT_METRICS.tank);
    assert.ok(GARMENT_METRICS.blazer);
    assert.ok(GARMENT_METRICS.taupe_wide);
    assert.ok(GARMENT_METRICS.sneakers);
    assert.ok(GARMENT_METRICS.loafers);
  });
});

describe('Outfit Recommendations Module - Scoring Engine', () => {
  it('6. should score complete harmonious outfit with high grade', () => {
    const engine = createRecommendationEngine();
    const result = engine.scoreOutfit({
      top: 'cardigan',
      bottom: 'taupe_wide',
      shoes: 'sneakers'
    });
    assert.ok(result.score >= 80);
    assert.ok(result.positiveFactors.length > 0);
  });

  it('7. should score executive business outfit with exceptional grade', () => {
    const engine = createRecommendationEngine();
    const result = engine.scoreOutfit({
      top: 'blazer',
      bottom: 'taupe_wide',
      shoes: 'loafers'
    });
    assert.ok(result.score >= 90);
    assert.strictEqual(result.rating, 'Exceptional');
  });

  it('8. should penalize incomplete outfits', () => {
    const engine = createRecommendationEngine();
    const result = engine.scoreOutfit({
      top: 'tank'
    });
    assert.ok(result.score < 50);
    assert.ok(result.negativeFactors.some(f => f.includes('incomplete') || f.includes('missing')));
  });

  it('9. should gracefully score empty or null outfits', () => {
    const engine = createRecommendationEngine();
    const resNull = engine.scoreOutfit(null);
    assert.strictEqual(resNull.score, 0);

    const resEmpty = engine.scoreOutfit({});
    assert.ok(resEmpty.score <= 30);
  });

  it('10. should penalize extreme formality clashes', () => {
    const engine = createRecommendationEngine();
    // Formal blazer (9) with casual sandals (2)
    const clash = engine.scoreOutfit({
      top: 'blazer',
      bottom: 'taupe_wide',
      shoes: 'sandals'
    });
    assert.ok(clash.negativeFactors.some(f => f.includes('diverges') || f.includes('clash')));
  });
});

describe('Outfit Recommendations Module - Occasion & Similarity Matching', () => {
  it('11. should return available occasions via getOccasions', () => {
    const engine = createRecommendationEngine();
    const occasions = engine.getOccasions();
    assert.ok(occasions.includes('business'));
    assert.ok(occasions.includes('casual'));
  });

  it('12. should filter curated looks by occasion', () => {
    const engine = createRecommendationEngine();
    const businessLooks = engine.getCuratedLooks(OCCASIONS.BUSINESS);
    assert.ok(businessLooks.length > 0);
    assert.ok(businessLooks.every(l => l.occasion === OCCASIONS.BUSINESS));
  });

  it('13. should return all curated looks when no filter is provided', () => {
    const engine = createRecommendationEngine();
    const all = engine.getCuratedLooks();
    assert.strictEqual(all.length, CURATED_LOOKS.length);
  });

  it('14. should calculate outfit similarity accurately', () => {
    const engine = createRecommendationEngine();
    const outfitA = { top: 'tank', bottom: 'taupe_wide', shoes: 'sneakers' };
    const outfitB = { top: 'tank', bottom: 'denim', shoes: 'sneakers' };

    const sim = engine.calculateOutfitSimilarity(outfitA, outfitB);
    assert.ok(sim > 0.65 && sim < 0.68); // 2 out of 3 matches ~0.667
  });

  it('15. should return 1.0 similarity for identical outfits', () => {
    const engine = createRecommendationEngine();
    const outfit = { top: 'blazer', bottom: 'taupe_wide', shoes: 'loafers' };
    const sim = engine.calculateOutfitSimilarity(outfit, outfit);
    assert.strictEqual(sim, 1.0);
  });

  it('16. should return 0.0 similarity for completely disjoint outfits', () => {
    const engine = createRecommendationEngine();
    const outfitA = { top: 'tank', bottom: 'taupe_wide', shoes: 'sneakers' };
    const outfitB = { top: 'blazer', bottom: 'denim', shoes: 'loafers' };
    const sim = engine.calculateOutfitSimilarity(outfitA, outfitB);
    assert.strictEqual(sim, 0.0);
  });

  it('17. should generate tailored recommendations based on current outfit', () => {
    const engine = createRecommendationEngine();
    const recs = engine.getRecommendations({ top: 'blazer' });
    assert.ok(Array.isArray(recs));
    assert.ok(recs.length > 0);
    assert.strictEqual(recs[0].id, 'tailored_executive');
  });

  it('18. should respect recommendation limit option', () => {
    const engine = createRecommendationEngine();
    const recs = engine.getRecommendations({}, { limit: 2 });
    assert.strictEqual(recs.length, 2);
  });

  it('19. should filter recommendations by occasion', () => {
    const engine = createRecommendationEngine();
    const recs = engine.getRecommendations({}, { occasion: OCCASIONS.SUMMER });
    assert.ok(recs.length > 0);
    assert.strictEqual(recs[0].occasion, OCCASIONS.SUMMER);
  });
});

describe('Outfit Recommendations Module - Outfit Completion & Item Matching', () => {
  it('20. should complete a partial outfit missing bottoms and shoes', () => {
    const engine = createRecommendationEngine();
    const completed = engine.completeOutfit({ top: 'blazer' });
    assert.strictEqual(completed.isComplete, false);
    assert.ok(completed.missingSlots.includes('bottom'));
    assert.ok(completed.missingSlots.includes('shoes'));
    assert.strictEqual(completed.completedOutfit.top, 'blazer');
    assert.ok(completed.completedOutfit.bottom);
    assert.ok(completed.completedOutfit.shoes);
  });

  it('21. should return intact outfit when completing an already complete ensemble', () => {
    const engine = createRecommendationEngine();
    const full = { top: 'tank', bottom: 'taupe_wide', shoes: 'sneakers' };
    const res = engine.completeOutfit(full);
    assert.strictEqual(res.isComplete, true);
    assert.deepStrictEqual(res.outfit, full);
  });

  it('22. should recommend matching garments for a given top', () => {
    const engine = createRecommendationEngine();
    const matches = engine.getMatchingGarments('striped_sweater');
    assert.ok(matches.length > 0);
    assert.ok(matches.some(m => m.id === 'denim'));
    assert.ok(matches.some(m => m.id === 'sneakers'));
  });

  it('23. should recommend matching garments for bottoms', () => {
    const engine = createRecommendationEngine();
    const matches = engine.getMatchingGarments('taupe_wide');
    assert.ok(matches.length > 0);
    assert.ok(matches.some(m => m.id === 'blazer' || m.id === 'cardigan'));
  });

  it('24. should return empty matches for unknown garment ID', () => {
    const engine = createRecommendationEngine();
    const matches = engine.getMatchingGarments('nonexistent_item');
    assert.deepStrictEqual(matches, []);
  });

  it('25. should prioritize curated looks containing the requested garment in recommendations', () => {
    const engine = createRecommendationEngine();
    const recs = engine.getRecommendations({ shoes: 'loafers' });
    assert.ok(recs.some(r => r.outfit.shoes === 'loafers'));
  });
});
