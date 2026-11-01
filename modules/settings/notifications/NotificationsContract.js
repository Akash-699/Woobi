/**
 * Woobi - Settings Module
 * NotificationsContract.js - Notification Schedule, Categories & Permission Specifications
 */

export const NOTIFICATION_EVENTS = {
  PREFERENCES_CHANGED: 'notifications:preferences_changed',
  PERMISSION_CHANGED: 'notifications:permission_changed',
  SCHEDULED: 'notifications:scheduled',
  ERROR: 'notifications:error'
};

export const NOTIFICATION_CATEGORIES = {
  MORNING_OUTFITS: 'morningOutfits',
  STREAK_REMINDERS: 'streakReminders',
  SEASONAL_LOOKBOOKS: 'seasonalLookbooks'
};

export const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const DEFAULT_NOTIFICATIONS = {
  enabled: true,
  time: '07:30',
  repeatDays: ['M', 'T', 'W', 'T', 'F'],
  categories: {
    [NOTIFICATION_CATEGORIES.MORNING_OUTFITS]: true,
    [NOTIFICATION_CATEGORIES.STREAK_REMINDERS]: true,
    [NOTIFICATION_CATEGORIES.SEASONAL_LOOKBOOKS]: false
  }
};

export const NotificationsContract = {
  name: 'NotificationSettings',
  version: '1.0.0',
  methods: [
    'getPreferences',
    'updatePreferences',
    'setEnabled',
    'setTime',
    'toggleRepeatDay',
    'setCategoryEnabled',
    'getPermissionStatus',
    'requestBrowserPermission',
    'sendLocalNudge',
    'resetPreferences',
    'on',
    'off',
    'dispose'
  ],
  events: Object.values(NOTIFICATION_EVENTS)
};

