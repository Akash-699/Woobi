/**
 * Woobi - 3D Studio Features
 * RecommendationEngine.js - Algorithmic Outfit Scoring, Occasion Matching & Curated Styling
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
import { GARMENT_CATALOG, getGarmentRecord } from '../virtual-try-on/index.js';

export class RecommendationEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      curatedLooks: [...CURATED_LOOKS],
      minScoreThreshold: 60
    }, options);
  }

  getOccasions() {
    return Object.values(OCCASIONS);
  }

  getCuratedLooks(occasionFilter = null) {
    if (!occasionFilter) {
      return [...this.options.curatedLooks];
    }
    return this.options.curatedLooks.filter(l => l.occasion === occasionFilter);
  }

  scoreOutfit(outfit) {
    if (!outfit) {
      return { score: 0, feedback: 'No outfit provided' };
    }

    const topId = outfit.top;
    const bottomId = outfit.bottom;
    const shoesId = outfit.shoes;

    const topMeta = topId ? GARMENT_METRICS[topId] : null;
    const bottomMeta = bottomId ? GARMENT_METRICS[bottomId] : null;
    const shoesMeta = shoesId ? GARMENT_METRICS[shoesId] : null;

    let baseScore = 50;
    const positiveFactors = [];
    const negativeFactors = [];

    // Completeness check
    let itemCount = 0;
    if (topId) itemCount++;
    if (bottomId) itemCount++;
    if (shoesId) itemCount++;

    if (itemCount === 3) {
      baseScore += 20;
      positiveFactors.push('Full ensemble complete (top, bottom, footwear)');
    } else if (itemCount === 2) {
      baseScore += 5;
      negativeFactors.push('Outfit is missing an item slot');
    } else {
      baseScore -= 20;
      negativeFactors.push('Outfit is incomplete');
    }

    // Color & Tone Harmony
    if (topMeta && bottomMeta) {
      const allowedTones = COLOR_HARMONY_PAIRS[topMeta.tone] || [];
      if (allowedTones.includes(bottomMeta.tone)) {
        baseScore += 15;
        positiveFactors.push('High tonal synergy between top and bottom');
      } else {
        baseScore -= 10;
        negativeFactors.push('Subtle tone clash between top and bottom');
      }
    }

    // Formality Consistency Check
    if (topMeta && bottomMeta) {
      const deltaFormality = Math.abs(topMeta.formality - bottomMeta.formality);
      if (deltaFormality <= 3) {
        baseScore += 10;
        positiveFactors.push('Consistent formality spectrum');
      } else {
        baseScore -= 15;
        negativeFactors.push('Formality clash (e.g. formal tailoring paired with casual piece)');
      }
    }

    // Footwear Formality Check
    if (shoesMeta && bottomMeta) {
      const deltaShoes = Math.abs(shoesMeta.formality - bottomMeta.formality);
      if (deltaShoes <= 4) {
        baseScore += 5;
      } else {
        baseScore -= 10;
        negativeFactors.push('Footwear formality diverges from trousers');
      }
    }

    const finalScore = Math.max(10, Math.min(100, baseScore));

    return {
      score: finalScore,
      rating: finalScore >= 85 ? 'Exceptional' : (finalScore >= 70 ? 'Harmonious' : 'Experimental'),
      positiveFactors,
      negativeFactors
    };
  }

  getRecommendations(currentOutfit = {}, options = {}) {
    const occasion = options.occasion || null;
    const limit = options.limit || 3;

    // Filter curated looks by occasion if provided
    let candidates = this.options.curatedLooks;
    if (occasion) {
      candidates = candidates.filter(l => l.occasion === occasion);
    }

    // Score candidates against user's current outfit preference
    const results = candidates.map((look) => {
      const similarity = this.calculateOutfitSimilarity(currentOutfit, look.outfit);
      const scoreData = this.scoreOutfit(look.outfit);
      return {
        ...look,
        overallScore: scoreData.score,
        matchConfidence: Math.round((look.harmonyScore * 0.7) + (similarity * 30)),
        analysis: scoreData
      };
    });

    results.sort((a, b) => b.matchConfidence - a.matchConfidence);
    return results.slice(0, limit);
  }

  calculateOutfitSimilarity(outfitA, outfitB) {
    if (!outfitA || !outfitB) return 0;
    let matches = 0;
    let total = 0;

    ['top', 'bottom', 'shoes'].forEach((slot) => {
      if (outfitA[slot] && outfitB[slot]) {
        total++;
        if (outfitA[slot] === outfitB[slot]) matches++;
      }
    });

    return total > 0 ? (matches / total) : 0;
  }

  completeOutfit(partialOutfit = {}) {
    const missing = [];
    if (!partialOutfit.top) missing.push('top');
    if (!partialOutfit.bottom) missing.push('bottom');
    if (!partialOutfit.shoes) missing.push('shoes');

    if (missing.length === 0) {
      return {
        isComplete: true,
        outfit: { ...partialOutfit },
        score: this.scoreOutfit(partialOutfit)
      };
    }

    // Find closest matching curated look
    let bestLook = null;
    let highestSim = -1;

    for (const look of this.options.curatedLooks) {
      const sim = this.calculateOutfitSimilarity(partialOutfit, look.outfit);
      if (sim > highestSim) {
        highestSim = sim;
        bestLook = look;
      }
    }

    if (!bestLook) {
      bestLook = this.options.curatedLooks[0];
    }

    const completed = { ...partialOutfit };
    missing.forEach((slot) => {
      completed[slot] = bestLook.outfit[slot];
    });

    return {
      isComplete: false,
      missingSlots: missing,
      completedOutfit: completed,
      suggestedLook: bestLook,
      score: this.scoreOutfit(completed)
    };
  }

  getMatchingGarments(garmentId) {
    const record = getGarmentRecord(garmentId);
    if (!record) return [];

    const matches = [];
    for (const look of this.options.curatedLooks) {
      const isPresent = Object.values(look.outfit).includes(record.id);
      if (isPresent) {
        Object.entries(look.outfit).forEach(([category, id]) => {
          if (id !== record.id) {
            const matchRec = getGarmentRecord(id);
            if (matchRec && !matches.some(m => m.id === matchRec.id)) {
              matches.push({
                ...matchRec,
                recommendedWithLook: look.name
              });
            }
          }
        });
      }
    }

    return matches;
  }
}

export function createRecommendationEngine(options = {}) {
  return new RecommendationEngine(options);
}
