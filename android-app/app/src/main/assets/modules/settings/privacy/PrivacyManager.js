/**
 * Woobi - Settings Module
 * PrivacyManager.js - User Data Governance, Granular Local Data Purging & JSON Export
 */

import {
  PRIVACY_EVENTS,
  DEFAULT_CONSENT,
  PrivacyContract
} from './PrivacyContract.js';

export class PrivacyManager {
  constructor(options = {}) {
    this.options = Object.assign({
      storageKey: 'woobi_privacy_settings_v1',
      legacyStorageKey: 'seren_privacy_settings',
      appVersion: '1.0.0'
    }, options);

    this.consent = { ...DEFAULT_CONSENT };
    this.listeners = new Map();

    this.loadConsent();
  }

  loadConsent() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.options.storageKey) ||
                  localStorage.getItem(this.options.legacyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.consent = Object.assign(this.consent, parsed);
        }
      }
    } catch (e) {
      console.warn('PrivacyManager: could not read privacy settings', e);
    }
  }

  saveConsent() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.consent);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.legacyStorageKey, data);
    } catch (e) {
      console.warn('PrivacyManager: could not persist privacy settings', e);
    }
  }

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`PrivacyManager error [${event}]:`, e);
        }
      });
    }
  }

  getConsent() {
    return { ...this.consent };
  }

  updateConsent(updates = {}) {
    if (updates.analyticsConsent !== undefined) {
      this.consent.analyticsConsent = !!updates.analyticsConsent;
    }
    if (updates.marketingConsent !== undefined) {
      this.consent.marketingConsent = !!updates.marketingConsent;
    }
    if (updates.crashReporting !== undefined) {
      this.consent.crashReporting = !!updates.crashReporting;
    }
    if (updates.personalizedStyling !== undefined) {
      this.consent.personalizedStyling = !!updates.personalizedStyling;
    }

    this.saveConsent();
    const result = this.getConsent();

    this.emit(PRIVACY_EVENTS.CONSENT_CHANGED, { consent: result });
    return { success: true, consent: result };
  }

  exportUserData() {
    const exportPackage = {
      meta: {
        product: 'Woobi Fashion Monorepo',
        exportedAt: new Date().toISOString(),
        version: this.options.appVersion,
        storageArchitecture: 'local_first_client'
      },
      privacyConsent: this.getConsent(),
      profile: null,
      savedLooks: [],
      avatarPreferences: null,
      wardrobeItems: []
    };

    if (typeof localStorage !== 'undefined') {
      try {
        const rawProfile = localStorage.getItem('woobi_account_profile_v1');
        if (rawProfile) exportPackage.profile = JSON.parse(rawProfile);

        const rawLooks = localStorage.getItem('woobi_saved_looks_v1') ||
                         localStorage.getItem('seren_saved_looks');
        if (rawLooks) exportPackage.savedLooks = JSON.parse(rawLooks);

        const rawAvatar = localStorage.getItem('seren_avatar_prefs') ||
                          localStorage.getItem('woobi_avatar_prefs');
        if (rawAvatar) exportPackage.avatarPreferences = JSON.parse(rawAvatar);

        const rawWardrobe = localStorage.getItem('woobi_wardrobe_items_v1') ||
                            localStorage.getItem('aura_wardrobe_items');
        if (rawWardrobe) exportPackage.wardrobeItems = JSON.parse(rawWardrobe);
      } catch (e) {
        console.warn('PrivacyManager: partial read error during export', e);
      }
    }

    this.emit(PRIVACY_EVENTS.DATA_EXPORTED, { timestamp: exportPackage.meta.exportedAt });
    return exportPackage;
  }

  clearSavedLooksCache() {
    if (typeof localStorage === 'undefined') return { success: false };
    try {
      localStorage.removeItem('woobi_saved_looks_v1');
      localStorage.removeItem('seren_saved_looks');
      this.emit(PRIVACY_EVENTS.CACHE_CLEARED, { cache: 'saved_looks' });
      return { success: true, cleared: 'saved_looks' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  clearAvatarPreferencesCache() {
    if (typeof localStorage === 'undefined') return { success: false };
    try {
      localStorage.removeItem('seren_avatar_prefs');
      localStorage.removeItem('woobi_avatar_prefs');
      this.emit(PRIVACY_EVENTS.CACHE_CLEARED, { cache: 'avatar_preferences' });
      return { success: true, cleared: 'avatar_preferences' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  clearAllLocalData(confirmationToken) {
    if (confirmationToken !== 'CONFIRM_DELETE_ALL') {
      const error = new Error('Explicit confirmation token "CONFIRM_DELETE_ALL" required to clear all local data');
      this.emit(PRIVACY_EVENTS.ERROR, { error });
      return { success: false, error: error.message };
    }

    const keysToPurge = [
      'woobi_account_profile_v1',
      'seren_account_profile',
      'woobi_auth_session',
      'woobi_appearance_settings_v1',
      'seren_appearance_settings',
      'woobi_privacy_settings_v1',
      'seren_privacy_settings',
      'woobi_notification_settings_v1',
      'woobi_performance_settings_v1',
      'woobi_saved_looks_v1',
      'seren_saved_looks',
      'seren_avatar_prefs',
      'woobi_avatar_prefs',
      'woobi_wardrobe_items_v1',
      'aura_wardrobe_items',
      'woobi_user_preferences_v1'
    ];

    if (typeof localStorage !== 'undefined') {
      keysToPurge.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      });
    }

    this.consent = { ...DEFAULT_CONSENT };
    this.emit(PRIVACY_EVENTS.ALL_CLEARED, { success: true });
    return { success: true, message: 'All local application data purged safely' };
  }

  getStorageDiagnostics() {
    let keyCount = 0;
    let estimatedBytes = 0;

    if (typeof localStorage !== 'undefined') {
      try {
        keyCount = localStorage.length || 0;
        for (let i = 0; i < keyCount; i++) {
          const k = localStorage.key(i);
          if (k) {
            const v = localStorage.getItem(k) || '';
            estimatedBytes += (k.length + v.length) * 2;
          }
        }
      } catch (e) {}
    }

    return {
      totalKeys: keyCount,
      estimatedBytes,
      storageMode: 'client_local_only',
      cloudSyncStatus: 'disabled_local_first'
    };
  }

  dispose() {
    this.listeners.clear();
  }
}

export function createPrivacyManager(options = {}) {
  return new PrivacyManager(options);
}

