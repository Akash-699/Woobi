/**
 * Woobi - 3D Studio Features
 * InteractionsContract.js - Interaction Interface Contract, Events & State Constants
 */

export const INTERACTION_STATES = {
  IDLE: 'idle',
  HOVERED: 'hovered',
  SELECTED: 'selected'
};

export const INTERACTION_EVENTS = {
  SELECT: 'garment:select',
  DESELECT: 'garment:deselect',
  HOVER: 'garment:hover',
  UNHOVER: 'garment:unhover',
  POINTER_DOWN: 'garment:pointerdown'
};

export const InteractionsContract = {
  name: 'GarmentInteractions',
  version: '1.0.0',
  methods: [
    'selectGarment',
    'deselectGarment',
    'clearSelection',
    'getSelectedGarment',
    'registerInteractiveMesh',
    'unregisterInteractiveMesh',
    'handlePointerMove',
    'handlePointerDown',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(INTERACTION_EVENTS)
};
