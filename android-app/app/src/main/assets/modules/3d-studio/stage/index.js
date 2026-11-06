/**
 * Woobi 3D Studio - Stage Submodule Public Interface
 */

import { StageModel, STAGE_CONFIG } from './StageModel.js';
import { StageMaterials } from './StageMaterials.js';

export {
  StageModel,
  STAGE_CONFIG,
  StageMaterials
};

/**
 * Convenience factory to instantiate and mount the stage.
 */
export function createStage(scene, textures, THREE) {
  const stage = new StageModel();
  stage.build(scene, textures, THREE);
  return stage;
}

export const StageContract = {
  StageModel,
  STAGE_CONFIG,
  StageMaterials,
  createStage
};

if (typeof window !== 'undefined') {
  window.WoobiStage = StageContract;
}

export default StageContract;

