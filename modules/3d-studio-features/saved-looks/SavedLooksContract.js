/**
 * Woobi - 3D Studio Features
 * SavedLooksContract.js - Lookbook Schema, Storage API Contract & Event Names
 */

export const LOOKS_EVENTS = {
  SAVED: 'looks:saved',
  DELETED: 'looks:deleted',
  RENAMED: 'looks:renamed',
  LOADED: 'looks:loaded',
  CLEARED: 'looks:cleared',
  ERROR: 'looks:error'
};

export const SavedLooksContract = {
  name: 'SavedLooksManager',
  version: '1.0.0',
  methods: [
    'saveLook',
    'getLook',
    'getAllLooks',
    'deleteLook',
    'renameLook',
    'reEquipLook',
    'exportLooksJSON',
    'importLooksJSON',
    'clearAllLooks',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(LOOKS_EVENTS)
};
