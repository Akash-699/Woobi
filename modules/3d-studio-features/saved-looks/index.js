/**
 * Woobi - 3D Studio Features
 * saved-looks/index.js - Public Interface & Factory
 */

import { LOOKS_EVENTS, SavedLooksContract } from './SavedLooksContract.js';
import { LookbookStorage } from './LookbookStorage.js';
import {
  SavedLooksManager,
  createSavedLooksManager
} from './SavedLooksManager.js';

export {
  LOOKS_EVENTS,
  SavedLooksContract,
  LookbookStorage,
  SavedLooksManager,
  createSavedLooksManager
};

if (typeof window !== 'undefined') {
  window.WoobiSavedLooks = {
    LOOKS_EVENTS,
    SavedLooksContract,
    LookbookStorage,
    SavedLooksManager,
    createSavedLooksManager
  };
}
