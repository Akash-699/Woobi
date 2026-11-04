/**
 * Woobi - Settings Module
 * AccountManager.js - User Profile Controller, Subscription Tier & Session Management
 */

import {
  ACCOUNT_EVENTS,
  SUBSCRIPTION_PLANS,
  DEFAULT_PROFILE,
  AccountContract
} from './AccountContract.js';

export class AccountManager {
  constructor(coreStore = null, options = {}) {
    this.coreStore = coreStore;
    this.options = Object.assign({
      storageKey: 'woobi_account_profile_v1',
      legacyStorageKey: 'seren_account_profile',
      sessionKey: 'woobi_auth_session'
    }, options);

    this.profile = { ...DEFAULT_PROFILE };
    this.listeners = new Map();

    this.loadProfile();
    this.syncWithCoreStore();
  }

  loadProfile() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.options.storageKey) ||
                  localStorage.getItem(this.options.legacyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.profile = Object.assign(this.profile, parsed);
        }
      }
    } catch (e) {
      console.warn('AccountManager: failed to load stored profile', e);
    }
  }

  saveProfile() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.profile);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.legacyStorageKey, data);
    } catch (e) {
      console.warn('AccountManager: failed to persist profile', e);
    }
  }

  syncWithCoreStore() {
    if (!this.coreStore || typeof this.coreStore.getState !== 'function') return;
    const coreState = this.coreStore.getState();
    if (coreState.isPremium !== undefined) {
      this.profile.isPremium = !!coreState.isPremium;
    }
    if (coreState.currentPlan !== undefined) {
      this.profile.plan = coreState.currentPlan;
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
          console.error(`AccountManager error [${event}]:`, e);
        }
      });
    }
  }

  getProfile() {
    return { ...this.profile };
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  updateProfile(updates = {}) {
    if (updates.name !== undefined) {
      const trimmed = String(updates.name).trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        const error = new Error('Name must be between 2 and 50 characters');
        this.emit(ACCOUNT_EVENTS.ERROR, { error, field: 'name' });
        return { success: false, error: error.message };
      }
      this.profile.name = trimmed;
      this.profile.avatarInitial = trimmed.charAt(0).toUpperCase();
    }

    if (updates.email !== undefined) {
      const trimmedEmail = String(updates.email).trim().toLowerCase();
      if (!this.validateEmail(trimmedEmail)) {
        const error = new Error('Invalid email address format');
        this.emit(ACCOUNT_EVENTS.ERROR, { error, field: 'email' });
        return { success: false, error: error.message };
      }
      this.profile.email = trimmedEmail;
    }

    this.saveProfile();
    const result = this.getProfile();

    this.emit(ACCOUNT_EVENTS.PROFILE_UPDATED, { profile: result });
    return { success: true, profile: result };
  }

  getPlan() {
    return this.profile.plan;
  }

  isPremium() {
    return this.profile.isPremium;
  }

  upgradePlan(planType) {
    if (!Object.values(SUBSCRIPTION_PLANS).includes(planType)) {
      const error = new Error(`Unknown subscription plan: ${planType}`);
      this.emit(ACCOUNT_EVENTS.ERROR, { error });
      return { success: false, error: error.message };
    }

    const previousPlan = this.profile.plan;
    this.profile.plan = planType;
    this.profile.isPremium = planType !== SUBSCRIPTION_PLANS.FREE;

    // Sync to core store if available
    if (this.coreStore && typeof this.coreStore.setState === 'function') {
      this.coreStore.setState({
        currentPlan: this.profile.plan,
        isPremium: this.profile.isPremium
      });
    }

    this.saveProfile();

    const payload = {
      plan: this.profile.plan,
      isPremium: this.profile.isPremium,
      previousPlan
    };

    this.emit(ACCOUNT_EVENTS.PLAN_CHANGED, payload);
    return { success: true, ...payload };
  }

  signOut() {
    // Safely clear active session token without wiping user data
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.options.sessionKey);
      } catch (e) {
        console.warn('AccountManager: error removing session', e);
      }
    }

    this.emit(ACCOUNT_EVENTS.SIGN_OUT, { userId: this.profile.id, email: this.profile.email });
    return { success: true, message: 'User successfully signed out' };
  }

  deleteAccountData(confirmationToken) {
    if (confirmationToken !== 'CONFIRM_DELETE') {
      const error = new Error('Explicit confirmation token "CONFIRM_DELETE" required to delete account data');
      this.emit(ACCOUNT_EVENTS.ERROR, { error });
      return { success: false, error: error.message };
    }

    // Reset profile to default
    this.profile = { ...DEFAULT_PROFILE };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.options.storageKey);
        localStorage.removeItem(this.options.legacyStorageKey);
        localStorage.removeItem(this.options.sessionKey);
      } catch (e) {
        console.warn('AccountManager: error removing storage items', e);
      }
    }

    if (this.coreStore && typeof this.coreStore.setState === 'function') {
      this.coreStore.setState({
        isPremium: false,
        currentPlan: SUBSCRIPTION_PLANS.FREE
      });
    }

    this.emit(ACCOUNT_EVENTS.DATA_DELETED, { success: true });
    return { success: true, message: 'Account data deleted and reset to default' };
  }

  dispose() {
    this.listeners.clear();
    this.coreStore = null;
  }
}

export function createAccountManager(coreStore = null, options = {}) {
  return new AccountManager(coreStore, options);
}

