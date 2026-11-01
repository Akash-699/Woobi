/**
 * Woobi - Settings Module
 * PrivacyContract.js - Privacy Consent Schema, Data Export & Deletion Contracts
 */

export const PRIVACY_EVENTS = {
  CONSENT_CHANGED: 'privacy:consent_changed',
  DATA_EXPORTED: 'privacy:data_exported',
  CACHE_CLEARED: 'privacy:cache_cleared',
  ALL_CLEARED: 'privacy:all_cleared',
  ERROR: 'privacy:error'
};

export const DEFAULT_CONSENT = {
  analyticsConsent: false,
  crashReporting: true,
  marketingConsent: false,
  personalizedStyling: true,
  storageMode: 'local_only'
};

export const PrivacyContract = {
  name: 'PrivacySettings',
  version: '1.0.0',
  methods: [
    'getConsent',
    'updateConsent',
    'exportUserData',
    'clearSavedLooksCache',
    'clearAvatarPreferencesCache',
    'clearAllLocalData',
    'getStorageDiagnostics',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(PRIVACY_EVENTS)
};

