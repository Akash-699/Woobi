/**
 * Woobi - Settings Module
 * PrivacyManager.test.js - Unit & Integration Test Suite for Privacy Settings
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PRIVACY_EVENTS,
  DEFAULT_CONSENT,
  PrivacyContract
} from './PrivacyContract.js';
import { PrivacyManager, createPrivacyManager } from './PrivacyManager.js';

// Mock localStorage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (i) => Array.from(mockStorage.keys())[i] || null
};

describe('Privacy Settings Module - Specifications & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('1. should export standard privacy event names', () => {
    assert.strictEqual(PRIVACY_EVENTS.CONSENT_CHANGED, 'privacy:consent_changed');
    assert.strictEqual(PRIVACY_EVENTS.DATA_EXPORTED, 'privacy:data_exported');
    assert.strictEqual(PRIVACY_EVENTS.CACHE_CLEARED, 'privacy:cache_cleared');
    assert.strictEqual(PRIVACY_EVENTS.ALL_CLEARED, 'privacy:all_cleared');
  });

  it('2. should export default privacy consent configuration', () => {
    assert.strictEqual(DEFAULT_CONSENT.analyticsConsent, false);
    assert.strictEqual(DEFAULT_CONSENT.marketingConsent, false);
    assert.strictEqual(DEFAULT_CONSENT.crashReporting, true);
    assert.strictEqual(DEFAULT_CONSENT.storageMode, 'local_only');
  });

  it('3. should satisfy PrivacyContract API definition', () => {
    assert.strictEqual(PrivacyContract.name, 'PrivacySettings');
    assert.ok(Array.isArray(PrivacyContract.methods));
    assert.ok(PrivacyContract.methods.includes('getConsent'));
    assert.ok(PrivacyContract.methods.includes('updateConsent'));
    assert.ok(PrivacyContract.methods.includes('exportUserData'));
    assert.ok(PrivacyContract.methods.includes('clearSavedLooksCache'));
    assert.ok(PrivacyContract.methods.includes('clearAvatarPreferencesCache'));
    assert.ok(PrivacyContract.methods.includes('clearAllLocalData'));
  });

  it('4. should initialize with default consent preferences', () => {
    const manager = createPrivacyManager();
    const consent = manager.getConsent();
    assert.strictEqual(consent.analyticsConsent, false);
    assert.strictEqual(consent.crashReporting, true);
  });
});

describe('Privacy Settings Module - Consent Management', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('5. should toggle analytics consent', () => {
    const manager = createPrivacyManager();
    const res = manager.updateConsent({ analyticsConsent: true });
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getConsent().analyticsConsent, true);
  });

  it('6. should toggle marketing consent', () => {
    const manager = createPrivacyManager();
    manager.updateConsent({ marketingConsent: true });
    assert.strictEqual(manager.getConsent().marketingConsent, true);
  });

  it('7. should toggle crash reporting', () => {
    const manager = createPrivacyManager();
    manager.updateConsent({ crashReporting: false });
    assert.strictEqual(manager.getConsent().crashReporting, false);
  });

  it('8. should update multiple consent flags simultaneously', () => {
    const manager = createPrivacyManager();
    manager.updateConsent({
      analyticsConsent: true,
      marketingConsent: true,
      personalizedStyling: false
    });
    const c = manager.getConsent();
    assert.strictEqual(c.analyticsConsent, true);
    assert.strictEqual(c.marketingConsent, true);
    assert.strictEqual(c.personalizedStyling, false);
  });
});

describe('Privacy Settings Module - User Data Export', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('9. should package local profile, saved looks, and wardrobe data into clean export', () => {
    mockStorage.set('woobi_account_profile_v1', JSON.stringify({ name: 'Export User' }));
    mockStorage.set('woobi_saved_looks_v1', JSON.stringify([{ id: 'look_1' }]));
    mockStorage.set('woobi_wardrobe_items_v1', JSON.stringify([{ id: 'item_1' }]));

    const manager = createPrivacyManager({ appVersion: '2.0.0' });
    const exported = manager.exportUserData();

    assert.ok(exported.meta);
    assert.strictEqual(exported.meta.product, 'Woobi Fashion Monorepo');
    assert.strictEqual(exported.meta.version, '2.0.0');
    assert.strictEqual(exported.profile.name, 'Export User');
    assert.strictEqual(exported.savedLooks.length, 1);
    assert.strictEqual(exported.wardrobeItems.length, 1);
  });

  it('10. should emit privacy:data_exported event upon export', () => {
    const manager = createPrivacyManager();
    let emitted = null;
    manager.on(PRIVACY_EVENTS.DATA_EXPORTED, (data) => {
      emitted = data;
    });

    manager.exportUserData();
    assert.ok(emitted);
    assert.ok(emitted.timestamp);
  });

  it('11. should accurately report local-first storage mode without false cloud claims', () => {
    const manager = createPrivacyManager();
    const exported = manager.exportUserData();
    assert.strictEqual(exported.meta.storageArchitecture, 'local_first_client');
  });
});

describe('Privacy Settings Module - Granular Cache Purging & Deletion Safety', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('12. should clear saved looks cache selectively while leaving profile intact', () => {
    mockStorage.set('woobi_saved_looks_v1', JSON.stringify([{ id: 'look_1' }]));
    mockStorage.set('woobi_account_profile_v1', JSON.stringify({ name: 'Keep Me' }));

    const manager = createPrivacyManager();
    const res = manager.clearSavedLooksCache();

    assert.strictEqual(res.success, true);
    assert.strictEqual(localStorage.getItem('woobi_saved_looks_v1'), null);
    assert.notStrictEqual(localStorage.getItem('woobi_account_profile_v1'), null);
  });

  it('13. should clear avatar preferences cache selectively', () => {
    mockStorage.set('seren_avatar_prefs', JSON.stringify({ skinTone: '#FFF' }));
    mockStorage.set('woobi_wardrobe_items_v1', JSON.stringify([{ id: 'g1' }]));

    const manager = createPrivacyManager();
    const res = manager.clearAvatarPreferencesCache();

    assert.strictEqual(res.success, true);
    assert.strictEqual(localStorage.getItem('seren_avatar_prefs'), null);
    assert.notStrictEqual(localStorage.getItem('woobi_wardrobe_items_v1'), null);
  });

  it('14. should reject clearing all local data without explicit token', () => {
    const manager = createPrivacyManager();
    const res = manager.clearAllLocalData('invalid_confirmation');

    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('CONFIRM_DELETE_ALL'));
  });

  it('15. should purge all local application keys with CONFIRM_DELETE_ALL token', () => {
    mockStorage.set('woobi_account_profile_v1', 'profile_data');
    mockStorage.set('woobi_appearance_settings_v1', 'theme_data');
    mockStorage.set('woobi_saved_looks_v1', 'looks_data');
    mockStorage.set('woobi_auth_session', 'active_session');

    const manager = createPrivacyManager();
    const res = manager.clearAllLocalData('CONFIRM_DELETE_ALL');

    assert.strictEqual(res.success, true);
    assert.strictEqual(localStorage.getItem('woobi_account_profile_v1'), null);
    assert.strictEqual(localStorage.getItem('woobi_appearance_settings_v1'), null);
    assert.strictEqual(localStorage.getItem('woobi_saved_looks_v1'), null);
    assert.strictEqual(localStorage.getItem('woobi_auth_session'), null);
  });

  it('16. should emit privacy:cache_cleared event on selective cache wipe', () => {
    const manager = createPrivacyManager();
    let clearData = null;
    manager.on(PRIVACY_EVENTS.CACHE_CLEARED, (d) => { clearData = d; });

    manager.clearSavedLooksCache();
    assert.ok(clearData);
    assert.strictEqual(clearData.cache, 'saved_looks');
  });

  it('17. should emit privacy:all_cleared event on full wipe', () => {
    const manager = createPrivacyManager();
    let allData = null;
    manager.on(PRIVACY_EVENTS.ALL_CLEARED, (d) => { allData = d; });

    manager.clearAllLocalData('CONFIRM_DELETE_ALL');
    assert.ok(allData);
    assert.strictEqual(allData.success, true);
  });
});

describe('Privacy Settings Module - Diagnostics, Storage & Cleanup', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('18. should provide storage diagnostics overview', () => {
    mockStorage.set('key1', 'abc');
    mockStorage.set('key2', 'def');

    const manager = createPrivacyManager();
    const diag = manager.getStorageDiagnostics();

    assert.strictEqual(diag.totalKeys, 2);
    assert.ok(diag.estimatedBytes > 0);
    assert.strictEqual(diag.storageMode, 'client_local_only');
    assert.strictEqual(diag.cloudSyncStatus, 'disabled_local_first');
  });

  it('19. should emit privacy:consent_changed event on consent change', () => {
    const manager = createPrivacyManager();
    let consentEvent = null;
    manager.on(PRIVACY_EVENTS.CONSENT_CHANGED, (d) => { consentEvent = d; });

    manager.updateConsent({ analyticsConsent: true });
    assert.ok(consentEvent);
    assert.strictEqual(consentEvent.consent.analyticsConsent, true);
  });

  it('20. should allow unsubscribing from privacy events', () => {
    const manager = createPrivacyManager();
    let count = 0;
    const unsub = manager.on(PRIVACY_EVENTS.CONSENT_CHANGED, () => { count++; });

    manager.updateConsent({ analyticsConsent: true });
    assert.strictEqual(count, 1);

    unsub();
    manager.updateConsent({ analyticsConsent: false });
    assert.strictEqual(count, 1);
  });

  it('21. should persist consent changes in localStorage', () => {
    const manager = createPrivacyManager();
    manager.updateConsent({ marketingConsent: true });

    const raw = mockStorage.get('woobi_privacy_settings_v1');
    assert.ok(raw);
    assert.strictEqual(JSON.parse(raw).marketingConsent, true);
  });

  it('22. should restore consent settings from localStorage on new manager', () => {
    mockStorage.set('woobi_privacy_settings_v1', JSON.stringify({
      analyticsConsent: true,
      crashReporting: false
    }));

    const manager = createPrivacyManager();
    const consent = manager.getConsent();
    assert.strictEqual(consent.analyticsConsent, true);
    assert.strictEqual(consent.crashReporting, false);
  });

  it('23. should handle empty localStorage in export gracefully', () => {
    const manager = createPrivacyManager();
    const exported = manager.exportUserData();
    assert.strictEqual(exported.profile, null);
    assert.deepStrictEqual(exported.savedLooks, []);
  });

  it('24. should reset consent to default on full data purge', () => {
    const manager = createPrivacyManager();
    manager.updateConsent({ analyticsConsent: true });
    manager.clearAllLocalData('CONFIRM_DELETE_ALL');

    assert.strictEqual(manager.getConsent().analyticsConsent, false);
  });

  it('25. should clean up listeners on dispose', () => {
    const manager = createPrivacyManager();
    let called = false;
    manager.on(PRIVACY_EVENTS.CONSENT_CHANGED, () => { called = true; });

    manager.dispose();
    manager.updateConsent({ analyticsConsent: true });
    assert.strictEqual(called, false);
  });
});

