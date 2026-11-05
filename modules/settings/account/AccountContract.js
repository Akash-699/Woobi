/**
 * Woobi - Settings Module
 * AccountContract.js - Account Interface Specifications, Profile Schema & Events
 */

export const ACCOUNT_EVENTS = {
  PROFILE_UPDATED: 'account:profile_updated',
  PLAN_CHANGED: 'account:plan_changed',
  SIGN_OUT: 'account:sign_out',
  DATA_DELETED: 'account:data_deleted',
  ERROR: 'account:error'
};

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  MONTHLY: 'monthly',
  ANNUAL: 'annual'
};

export const DEFAULT_PROFILE = {
  id: 'usr_suriya_01',
  name: 'Suriya',
  email: 'suriya@example.com',
  avatarInitial: 'S',
  plan: SUBSCRIPTION_PLANS.FREE,
  isPremium: false,
  memberSince: '2026-01-15'
};

export const AccountContract = {
  name: 'AccountSettings',
  version: '1.0.0',
  methods: [
    'getProfile',
    'updateProfile',
    'getPlan',
    'isPremium',
    'upgradePlan',
    'signOut',
    'deleteAccountData',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(ACCOUNT_EVENTS)
};

