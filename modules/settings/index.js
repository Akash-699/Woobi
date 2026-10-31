/**
 * @module modules/settings
 * Public interface specification for Woobi Settings.
 */

export const SettingsContract = {
  account: {
    getProfile: () => {},
    updateProfile: (profileData) => {},
    isPremiumUser: () => false
  },
  
  appearance: {
    getTheme: () => 'editorial-neutral',
    setTheme: (themeName) => {}
  },
  
  notifications: {
    getPreferences: () => {},
    setStreakReminders: (enabled) => {}
  },
  
  performance: {
    getQualityLevel: () => 'high', // 'ultra' | 'high' | 'battery-saver'
    setQualityLevel: (level) => {},
    isShadowsEnabled: () => true
  }
};

export default SettingsContract;
