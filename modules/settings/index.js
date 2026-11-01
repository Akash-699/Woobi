/**
 * Woobi - Settings Module
 * index.js - Unified Public Interface, Factory & Monorepo Entry Point for Settings
 */

import {
  ACCOUNT_EVENTS,
  SUBSCRIPTION_PLANS,
  DEFAULT_PROFILE,
  AccountContract,
  AccountManager,
  createAccountManager
} from './account/index.js';

import {
  APP_THEMES,
  STUDIO_THEMES,
  LIGHTING_PRESETS,
  DEFAULT_APPEARANCE,
  APPEARANCE_EVENTS,
  AppearanceContract,
  AppearanceManager,
  createAppearanceManager
} from './appearance/index.js';

import {
  PRIVACY_EVENTS,
  DEFAULT_CONSENT,
  PrivacyContract,
  PrivacyManager,
  createPrivacyManager
} from './privacy/index.js';

import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  DAYS_OF_WEEK,
  DEFAULT_NOTIFICATIONS,
  NotificationsContract,
  NotificationsManager,
  createNotificationsManager
} from './notifications/index.js';

import {
  PERFORMANCE_PRESETS,
  SHADOW_QUALITY,
  REFLECTION_QUALITY,
  DEFAULT_PERFORMANCE,
  PERFORMANCE_EVENTS,
  PerformanceContract,
  PerformanceManager,
  createPerformanceManager
} from './performance/index.js';

/**
 * Top-Level Settings Orchestrator
 * Packages all five modular settings submodules into a cohesive suite bound to Core Store and 3D Studio
 */
export class SettingsManager {
  constructor(coreStore = null, studio3d = null, options = {}) {
    this.coreStore = coreStore;
    this.studio3d = studio3d;
    this.options = options;

    // 1. Account Settings
    this.account = createAccountManager(coreStore, options.account || {});

    // 2. Appearance Settings
    this.appearance = createAppearanceManager(studio3d, options.appearance || {});

    // 3. Privacy Settings
    this.privacy = createPrivacyManager(options.privacy || {});

    // 4. Notification Settings
    this.notifications = createNotificationsManager(options.notifications || {});

    // 5. Performance Settings
    this.performance = createPerformanceManager(studio3d, options.performance || {});

    this.bindInternalEvents();
  }

  bindInternalEvents() {
    // When account updates subscription, notify or sync
    this.account.on(ACCOUNT_EVENTS.PLAN_CHANGED, (data) => {
      if (this.coreStore && typeof this.coreStore.setState === 'function') {
        this.coreStore.setState({
          currentPlan: data.plan,
          isPremium: data.isPremium
        });
      }
    });

    // When privacy clears all data, reset all managers
    this.privacy.on(PRIVACY_EVENTS.ALL_CLEARED, () => {
      this.account.profile = { ...DEFAULT_PROFILE };
      this.appearance.resetAppearance(this.studio3d);
      this.notifications.resetPreferences();
      this.performance.resetPerformance(this.studio3d);
    });
  }

  setStudio3D(studio3d) {
    this.studio3d = studio3d;
    if (this.appearance) this.appearance.setStudio3D(studio3d);
    if (this.performance) this.performance.setStudio3D(studio3d);
  }

  setCoreStore(coreStore) {
    this.coreStore = coreStore;
    if (this.account) {
      this.account.coreStore = coreStore;
      this.account.syncWithCoreStore();
    }
  }

  resetAllSettings() {
    this.appearance.resetAppearance(this.studio3d);
    this.notifications.resetPreferences();
    this.performance.resetPerformance(this.studio3d);
    return true;
  }

  dispose() {
    if (this.account) this.account.dispose();
    if (this.appearance) this.appearance.dispose();
    if (this.privacy) this.privacy.dispose();
    if (this.notifications) this.notifications.dispose();
    if (this.performance) this.performance.dispose();
    this.coreStore = null;
    this.studio3d = null;
  }
}

export function createSettings(coreStore = null, studio3d = null, options = {}) {
  return new SettingsManager(coreStore, studio3d, options);
}

/**
 * Backward-compatible SettingsContract specification
 */
export const SettingsContract = {
  account: {
    getProfile: (manager) => (manager ? manager.account.getProfile() : DEFAULT_PROFILE),
    updateProfile: (manager, data) => (manager ? manager.account.updateProfile(data) : null),
    isPremiumUser: (manager) => (manager ? manager.account.isPremium() : false)
  },
  appearance: {
    getTheme: (manager) => (manager ? manager.appearance.getAppearance().studioTheme : 'luxury-cream'),
    setTheme: (manager, theme) => (manager ? manager.appearance.setStudioTheme(theme) : null)
  },
  notifications: {
    getPreferences: (manager) => (manager ? manager.notifications.getPreferences() : DEFAULT_NOTIFICATIONS),
    setStreakReminders: (manager, enabled) => (manager ? manager.notifications.setCategoryEnabled('streakReminders', enabled) : null)
  },
  performance: {
    getQualityLevel: (manager) => (manager ? manager.performance.getPerformanceSettings().preset : 'high'),
    setQualityLevel: (manager, level) => (manager ? manager.performance.setPreset(level) : null),
    isShadowsEnabled: (manager) => (manager ? manager.performance.getPerformanceSettings().shadows !== 'off' : true)
  }
};

// Public exports
export {
  // Account
  ACCOUNT_EVENTS,
  SUBSCRIPTION_PLANS,
  DEFAULT_PROFILE,
  AccountContract,
  AccountManager,
  createAccountManager,

  // Appearance
  APP_THEMES,
  STUDIO_THEMES,
  LIGHTING_PRESETS,
  DEFAULT_APPEARANCE,
  APPEARANCE_EVENTS,
  AppearanceContract,
  AppearanceManager,
  createAppearanceManager,

  // Privacy
  PRIVACY_EVENTS,
  DEFAULT_CONSENT,
  PrivacyContract,
  PrivacyManager,
  createPrivacyManager,

  // Notifications
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  DAYS_OF_WEEK,
  DEFAULT_NOTIFICATIONS,
  NotificationsContract,
  NotificationsManager,
  createNotificationsManager,

  // Performance
  PERFORMANCE_PRESETS,
  SHADOW_QUALITY,
  REFLECTION_QUALITY,
  DEFAULT_PERFORMANCE,
  PERFORMANCE_EVENTS,
  PerformanceContract,
  PerformanceManager,
  createPerformanceManager
};

if (typeof window !== 'undefined') {
  window.WoobiSettings = {
    SettingsManager,
    createSettings,
    SettingsContract,
    account: { AccountManager, createAccountManager, SUBSCRIPTION_PLANS, ACCOUNT_EVENTS, DEFAULT_PROFILE },
    appearance: { AppearanceManager, createAppearanceManager, APP_THEMES, STUDIO_THEMES, LIGHTING_PRESETS, APPEARANCE_EVENTS },
    privacy: { PrivacyManager, createPrivacyManager, DEFAULT_CONSENT, PRIVACY_EVENTS },
    notifications: { NotificationsManager, createNotificationsManager, NOTIFICATION_CATEGORIES, DAYS_OF_WEEK, NOTIFICATION_EVENTS },
    performance: { PerformanceManager, createPerformanceManager, PERFORMANCE_PRESETS, SHADOW_QUALITY, REFLECTION_QUALITY, PERFORMANCE_EVENTS }
  };
}

export default SettingsContract;
