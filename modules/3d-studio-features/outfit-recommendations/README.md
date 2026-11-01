# Outfit Recommendations Module (`outfit-recommendations`)

The **Outfit Recommendations Module** provides algorithmic outfit scoring, occasion-based curation, color harmony verification, and look completion for the Woobi 3D Studio.

## Architecture

- **`RecommendationsContract.js`**: Contract specification, occasion definitions (`casual`, `business`, `evening`, `summer`, `minimalist`), and aesthetic taxonomy.
- **`RecommendationPresets.js`**: Curated editorial lookbook ensembles, garment formality and warmth metrics, and color-theory pairing rules.
- **`RecommendationEngine.js`**: Core scoring and recommendation algorithmic engine.
- **`index.js`**: Public export and `window.WoobiRecommendations` global registration.

## Usage

```javascript
import { createRecommendationEngine } from './modules/3d-studio-features/outfit-recommendations/index.js';

const engine = createRecommendationEngine();

// Score user's current 3D outfit
const scoreResult = engine.scoreOutfit({
  top: 'cardigan',
  bottom: 'taupe_wide',
  shoes: 'sneakers'
});
console.log('Outfit harmony score:', scoreResult.score, scoreResult.rating);

// Get occasion-tailored recommendations
const recommendations = engine.getRecommendations({ top: 'blazer' }, { occasion: 'business' });
```
