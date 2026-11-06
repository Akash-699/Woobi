/**
 * Woobi - Settings Module
 * account/index.js - Public Interface & Factory
 */

import {
  ACCOUNT_EVENTS,
  SUBSCRIPTION_PLANS,
  DEFAULT_PROFILE,
  AccountContract
} from './AccountContract.js';
import { AccountManager, createAccountManager } from './AccountManager.js';

export {
  ACCOUNT_EVENTS,
  SUBSCRIPTION_PLANS,
  DEFAULT_PROFILE,
  AccountContract,
  AccountManager,
  createAccountManager
};

if (typeof window !== 'undefined') {
  window.WoobiAccountSettings = {
    ACCOUNT_EVENTS,
    SUBSCRIPTION_PLANS,
    DEFAULT_PROFILE,
    AccountContract,
    AccountManager,
    createAccountManager
  };
}

