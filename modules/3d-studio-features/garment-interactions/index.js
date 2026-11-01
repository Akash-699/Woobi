/**
 * Woobi - 3D Studio Features
 * garment-interactions/index.js - Public Interface & Factory for Garment Interactions
 */

import {
  INTERACTION_STATES,
  INTERACTION_EVENTS,
  InteractionsContract
} from './InteractionsContract.js';
import { SelectionFeedback } from './SelectionFeedback.js';
import { GarmentInteractions, createGarmentInteractions } from './GarmentInteractions.js';

export {
  INTERACTION_STATES,
  INTERACTION_EVENTS,
  InteractionsContract,
  SelectionFeedback,
  GarmentInteractions,
  createGarmentInteractions
};

if (typeof window !== 'undefined') {
  window.WoobiGarmentInteractions = {
    INTERACTION_STATES,
    INTERACTION_EVENTS,
    InteractionsContract,
    SelectionFeedback,
    GarmentInteractions,
    createGarmentInteractions
  };
}
