/**
 * Woobi - Settings Module
 * AccountManager.test.js - Unit & Integration Test Suite for Account Settings
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  ACCOUNT_EVENTS,
  SUBSCRIPTION_PLANS,
  DEFAULT_PROFILE,
  AccountContract
} from './AccountContract.js';
import { AccountManager, createAccountManager } from './AccountManager.js';

// Mock localStorage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

function createMockCoreStore(initial = {}) {
  let state = {
    isPremium: false,
    currentPlan: 'free',
    ...initial
  };
  return {
    getState: () => ({ ...state }),
    setState: (partial) => { state = Object.assign(state, partial); }
  };
}

describe('Account Settings Module - Specifications & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('1. should export standard subscription plan constants', () => {
    assert.strictEqual(SUBSCRIPTION_PLANS.FREE, 'free');
    assert.strictEqual(SUBSCRIPTION_PLANS.MONTHLY, 'monthly');
    assert.strictEqual(SUBSCRIPTION_PLANS.ANNUAL, 'annual');
  });

  it('2. should export standard account event names', () => {
    assert.strictEqual(ACCOUNT_EVENTS.PROFILE_UPDATED, 'account:profile_updated');
    assert.strictEqual(ACCOUNT_EVENTS.PLAN_CHANGED, 'account:plan_changed');
    assert.strictEqual(ACCOUNT_EVENTS.SIGN_OUT, 'account:sign_out');
    assert.strictEqual(ACCOUNT_EVENTS.DATA_DELETED, 'account:data_deleted');
  });

  it('3. should satisfy AccountContract API definition', () => {
    assert.strictEqual(AccountContract.name, 'AccountSettings');
    assert.ok(Array.isArray(AccountContract.methods));
    assert.ok(AccountContract.methods.includes('getProfile'));
    assert.ok(AccountContract.methods.includes('updateProfile'));
    assert.ok(AccountContract.methods.includes('upgradePlan'));
    assert.ok(AccountContract.methods.includes('signOut'));
    assert.ok(AccountContract.methods.includes('deleteAccountData'));
  });

  it('4. should initialize profile with baseline defaults', () => {
    const manager = createAccountManager();
    const profile = manager.getProfile();
    assert.strictEqual(profile.name, DEFAULT_PROFILE.name);
    assert.strictEqual(profile.email, DEFAULT_PROFILE.email);
    assert.strictEqual(profile.plan, DEFAULT_PROFILE.plan);
    assert.strictEqual(profile.isPremium, false);
  });
});

describe('Account Settings Module - Profile Editing & Validation', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('5. should update user name and update avatar initial', () => {
    const manager = createAccountManager();
    const res = manager.updateProfile({ name: 'Alex Astra' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getProfile().name, 'Alex Astra');
    assert.strictEqual(manager.getProfile().avatarInitial, 'A');
  });

  it('6. should reject names shorter than 2 characters', () => {
    const manager = createAccountManager();
    const res = manager.updateProfile({ name: 'A' });
    assert.strictEqual(res.success, false);
    assert.ok(res.error);
    assert.strictEqual(manager.getProfile().name, DEFAULT_PROFILE.name);
  });

  it('7. should reject names exceeding 50 characters', () => {
    const manager = createAccountManager();
    const longName = 'A'.repeat(51);
    const res = manager.updateProfile({ name: longName });
    assert.strictEqual(res.success, false);
  });

  it('8. should update user email with valid address', () => {
    const manager = createAccountManager();
    const res = manager.updateProfile({ email: 'alex.astra@fashion.com' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getProfile().email, 'alex.astra@fashion.com');
  });

  it('9. should reject malformed email addresses', () => {
    const manager = createAccountManager();
    const res = manager.updateProfile({ email: 'not-an-email' });
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('format'));
  });

  it('10. should allow updating both name and email simultaneously', () => {
    const manager = createAccountManager();
    const res = manager.updateProfile({ name: 'Elena Rostova', email: 'elena@vogue.fr' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getProfile().name, 'Elena Rostova');
    assert.strictEqual(manager.getProfile().email, 'elena@vogue.fr');
    assert.strictEqual(manager.getProfile().avatarInitial, 'E');
  });
});

describe('Account Settings Module - Subscriptions & Core Store Sync', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('11. should upgrade plan to monthly and mark isPremium', () => {
    const manager = createAccountManager();
    const res = manager.upgradePlan(SUBSCRIPTION_PLANS.MONTHLY);
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getPlan(), 'monthly');
    assert.strictEqual(manager.isPremium(), true);
  });

  it('12. should upgrade plan to annual and mark isPremium', () => {
    const manager = createAccountManager();
    const res = manager.upgradePlan(SUBSCRIPTION_PLANS.ANNUAL);
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getPlan(), 'annual');
    assert.strictEqual(manager.isPremium(), true);
  });

  it('13. should reject invalid subscription plan types', () => {
    const manager = createAccountManager();
    const res = manager.upgradePlan('lifetime_vip');
    assert.strictEqual(res.success, false);
    assert.ok(res.error);
  });

  it('14. should synchronize upgraded plan with Core Store state', () => {
    const coreStore = createMockCoreStore();
    const manager = createAccountManager(coreStore);

    manager.upgradePlan(SUBSCRIPTION_PLANS.MONTHLY);
    assert.strictEqual(coreStore.getState().currentPlan, 'monthly');
    assert.strictEqual(coreStore.getState().isPremium, true);
  });

  it('15. should load initial subscription status from Core Store if present', () => {
    const coreStore = createMockCoreStore({ isPremium: true, currentPlan: 'annual' });
    const manager = createAccountManager(coreStore);

    assert.strictEqual(manager.getPlan(), 'annual');
    assert.strictEqual(manager.isPremium(), true);
  });
});

describe('Account Settings Module - Session & Deletion Safety', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('16. should sign out safely and remove session token', () => {
    mockStorage.set('woobi_auth_session', 'token_xyz_active');
    const manager = createAccountManager();

    const res = manager.signOut();
    assert.strictEqual(res.success, true);
    assert.strictEqual(localStorage.getItem('woobi_auth_session'), null);
  });

  it('17. should preserve user profile data when signing out', () => {
    const manager = createAccountManager();
    manager.updateProfile({ name: 'Persistent User' });
    manager.signOut();

    assert.strictEqual(manager.getProfile().name, 'Persistent User');
  });

  it('18. should reject account deletion without confirmation token', () => {
    const manager = createAccountManager();
    const res = manager.deleteAccountData('wrong_token');
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes('CONFIRM_DELETE'));
  });

  it('19. should reset profile and clear local caches on confirmed deletion', () => {
    const coreStore = createMockCoreStore({ isPremium: true });
    const manager = createAccountManager(coreStore);
    manager.updateProfile({ name: 'To Be Deleted' });

    const res = manager.deleteAccountData('CONFIRM_DELETE');
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getProfile().name, DEFAULT_PROFILE.name);
    assert.strictEqual(manager.isPremium(), false);
    assert.strictEqual(coreStore.getState().isPremium, false);
  });
});

describe('Account Settings Module - Events, Persistence & Disposal', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('20. should emit account:profile_updated event on update', () => {
    const manager = createAccountManager();
    let eventData = null;
    manager.on(ACCOUNT_EVENTS.PROFILE_UPDATED, (data) => {
      eventData = data;
    });

    manager.updateProfile({ name: 'Taylor Ward' });
    assert.ok(eventData);
    assert.strictEqual(eventData.profile.name, 'Taylor Ward');
  });

  it('21. should emit account:plan_changed event on plan change', () => {
    const manager = createAccountManager();
    let planData = null;
    manager.on(ACCOUNT_EVENTS.PLAN_CHANGED, (data) => {
      planData = data;
    });

    manager.upgradePlan(SUBSCRIPTION_PLANS.ANNUAL);
    assert.ok(planData);
    assert.strictEqual(planData.plan, 'annual');
    assert.strictEqual(planData.isPremium, true);
  });

  it('22. should allow unsubscribing from account events', () => {
    const manager = createAccountManager();
    let count = 0;
    const unsub = manager.on(ACCOUNT_EVENTS.PROFILE_UPDATED, () => { count++; });

    manager.updateProfile({ name: 'User 1' });
    assert.strictEqual(count, 1);

    unsub();
    manager.updateProfile({ name: 'User 2' });
    assert.strictEqual(count, 1);
  });

  it('23. should persist profile changes to localStorage', () => {
    const manager = createAccountManager();
    manager.updateProfile({ name: 'Stored User', email: 'stored@woobi.com' });

    const raw = mockStorage.get('woobi_account_profile_v1');
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.name, 'Stored User');
    assert.strictEqual(parsed.email, 'stored@woobi.com');
  });

  it('24. should restore profile from localStorage on new instance', () => {
    mockStorage.set('woobi_account_profile_v1', JSON.stringify({
      name: 'Restored Profile',
      email: 'restored@woobi.com'
    }));

    const manager = createAccountManager();
    assert.strictEqual(manager.getProfile().name, 'Restored Profile');
    assert.strictEqual(manager.getProfile().email, 'restored@woobi.com');
  });

  it('25. should clean up listeners and references on dispose', () => {
    const manager = createAccountManager(createMockCoreStore());
    manager.dispose();
    assert.strictEqual(manager.coreStore, null);
  });
});
