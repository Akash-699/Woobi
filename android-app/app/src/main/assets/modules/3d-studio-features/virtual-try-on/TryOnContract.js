/**
 * Woobi - 3D Studio Features
 * TryOnContract.js - Interface Contract & Type Specifications for Virtual Try-On
 */

export const TryOnContract = {
  name: 'VirtualTryOn',
  version: '1.0.0',
  methods: [
    'equipGarment',
    'removeGarment',
    'replaceGarment',
    'getEquippedOutfit',
    'getEquippedGarment',
    'isEquipped',
    'resetTryOn',
    'getGarmentDetails',
    'on',
    'off',
    'dispose'
  ],
  events: [
    'tryon:equip',
    'tryon:remove',
    'tryon:replace',
    'tryon:reset',
    'tryon:error'
  ]
};

export const TRY_ON_EVENTS = {
  EQUIP: 'tryon:equip',
  REMOVE: 'tryon:remove',
  REPLACE: 'tryon:replace',
  RESET: 'tryon:reset',
  ERROR: 'tryon:error'
};
