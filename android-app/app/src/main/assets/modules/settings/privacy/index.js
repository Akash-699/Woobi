/**
 * Woobi - Settings Module
 * privacy/index.js - Public Interface & Factory
 */

import {
  PRIVACY_EVENTS,
  DEFAULT_CONSENT,
  PrivacyContract
} from './PrivacyContract.js';
import { PrivacyManager, createPrivacyManager } from './PrivacyManager.js';

export {
  PRIVACY_EVENTS,
  DEFAULT_CONSENT,
  PrivacyContract,
  PrivacyManager,
  createPrivacyManager
};

if (typeof window !== 'undefined') {
  window.WoobiPrivacySettings = {
    PRIVACY_EVENTS,
    DEFAULT_CONSENT,
    PrivacyContract,
    PrivacyManager,
    createPrivacyManager
  };
}

