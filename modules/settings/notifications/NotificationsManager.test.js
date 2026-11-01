/**
 * Woobi - Settings Module
 * NotificationsManager.test.js - Unit & Integration Test Suite for Notifications Settings
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATIONS,
  NotificationsContract
} from './NotificationsContract.js';
import {
  NotificationsManager,
  createNotificationsManager
} from './NotificationsManager.js';

// Mock localStorage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// Mock Notification API
function setupMockNotification(permission = 'default') {
  let currentPermission = permission;
  globalThis.Notification = class {
    constructor(title, options) {
      this.title = title;
      this.options = options;
    }
    static get permission() {
      return currentPermission;
    }
    static async requestPermission() {
      currentPermission = 'granted';
      return currentPermission;
    }
  };
}

describe('Notification Settings Module - Specifications & Contracts', () => {
  beforeEach(() => {
    mockStorage.clear();
    delete globalThis.Notification;
  });

  it('1. should export standard notification event names', () => {
    assert.strictEqual(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, 'notifications:preferences_changed');
    assert.strictEqual(NOTIFICATION_EVENTS.PERMISSION_CHANGED, 'notifications:permission_changed');
    assert.strictEqual(NOTIFICATION_EVENTS.SCHEDULED, 'notifications:scheduled');
  });

  it('2. should export standard notification categories', () => {
    assert.strictEqual(NOTIFICATION_CATEGORIES.MORNING_OUTFITS, 'morningOutfits');
    assert.strictEqual(NOTIFICATION_CATEGORIES.STREAK_REMINDERS, 'streakReminders');
    assert.strictEqual(NOTIFICATION_CATEGORIES.SEASONAL_LOOKBOOKS, 'seasonalLookbooks');
  });

  it('3. should satisfy NotificationsContract API definition', () => {
    assert.strictEqual(NotificationsContract.name, 'NotificationSettings');
    assert.ok(Array.isArray(NotificationsContract.methods));
    assert.ok(NotificationsContract.methods.includes('setTime'));
    assert.ok(NotificationsContract.methods.includes('toggleRepeatDay'));
    assert.ok(NotificationsContract.methods.includes('requestBrowserPermission'));
    assert.ok(NotificationsContract.methods.includes('sendLocalNudge'));
  });

  it('4. should initialize with baseline morning reminder defaults', () => {
    const manager = createNotificationsManager();
    const prefs = manager.getPreferences();
    assert.strictEqual(prefs.enabled, true);
    assert.strictEqual(prefs.time, '07:30');
    assert.strictEqual(prefs.repeatDays.length, 5);
    assert.strictEqual(prefs.categories.morningOutfits, true);
  });
});

describe('Notification Settings Module - Time & Recurrence Scheduling', () => {
  beforeEach(() => {
    mockStorage.clear();
    delete globalThis.Notification;
  });

  it('5. should update reminder time with valid 24-hour time', () => {
    const manager = createNotificationsManager();
    const res = manager.setTime('08:15');
    assert.strictEqual(res.success, true);
    assert.strictEqual(manager.getPreferences().time, '08:15');
  });

  it('6. should reject invalid time strings', () => {
    const manager = createNotificationsManager();
    const res = manager.setTime('25:00');
    assert.strictEqual(res.success, false);
    assert.ok(res.error);
    assert.strictEqual(manager.getPreferences().time, '07:30');
  });

  it('7. should reject malformed time strings without colon', () => {
    const manager = createNotificationsManager();
    const res = manager.setTime('730');
    assert.strictEqual(res.success, false);
  });

  it('8. should enable/disable notifications globally', () => {
    const manager = createNotificationsManager();
    manager.setEnabled(false);
    assert.strictEqual(manager.getPreferences().enabled, false);

    manager.setEnabled(true);
    assert.strictEqual(manager.getPreferences().enabled, true);
  });

  it('9. should toggle repeat days', () => {
    const manager = createNotificationsManager();
    // Toggle Saturday on
    manager.toggleRepeatDay('S', true);
    assert.ok(manager.getPreferences().repeatDays.includes('S'));

    // Toggle Saturday off
    manager.toggleRepeatDay('S', false);
    assert.strictEqual(manager.getPreferences().repeatDays.includes('S'), false);
  });

  it('10. should enable or disable specific notification categories', () => {
    const manager = createNotificationsManager();
    manager.setCategoryEnabled(NOTIFICATION_CATEGORIES.SEASONAL_LOOKBOOKS, true);
    assert.strictEqual(manager.getPreferences().categories.seasonalLookbooks, true);

    manager.setCategoryEnabled(NOTIFICATION_CATEGORIES.STREAK_REMINDERS, false);
    assert.strictEqual(manager.getPreferences().categories.streakReminders, false);
  });
});

describe('Notification Settings Module - Permissions & Local Nudge', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('11. should return "unsupported" when Notification API is not available', () => {
    delete globalThis.Notification;
    const manager = createNotificationsManager();
    assert.strictEqual(manager.getPermissionStatus(), 'unsupported');
  });

  it('12. should return status when Notification API is available', () => {
    setupMockNotification('default');
    const manager = createNotificationsManager();
    assert.strictEqual(manager.getPermissionStatus(), 'default');
  });

  it('13. should handle user-initiated requestBrowserPermission when unsupported', async () => {
    delete globalThis.Notification;
    const manager = createNotificationsManager();
    const res = await manager.requestBrowserPermission();
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 'unsupported');
  });

  it('14. should grant permission on user gesture request', async () => {
    setupMockNotification('default');
    const manager = createNotificationsManager();
    const res = await manager.requestBrowserPermission();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'granted');
    assert.strictEqual(manager.getPermissionStatus(), 'granted');
  });

  it('15. should reject sending local nudge when notifications are disabled', () => {
    setupMockNotification('granted');
    const manager = createNotificationsManager();
    manager.setEnabled(false);

    const res = manager.sendLocalNudge('Hello', 'Test Nudge');
    assert.strictEqual(res.delivered, false);
    assert.strictEqual(res.reason, 'notifications_disabled');
  });

  it('16. should reject sending local nudge when permission is not granted', () => {
    setupMockNotification('denied');
    const manager = createNotificationsManager();

    const res = manager.sendLocalNudge('Hello', 'Test Nudge');
    assert.strictEqual(res.delivered, false);
    assert.strictEqual(res.reason, 'permission_not_granted');
  });

  it('17. should deliver local nudge when enabled and permission is granted', () => {
    setupMockNotification('granted');
    const manager = createNotificationsManager();

    const res = manager.sendLocalNudge('Your outfits are ready', 'Time to look good ✨');
    assert.strictEqual(res.delivered, true);
    assert.ok(res.notification);
    assert.strictEqual(res.notification.title, 'Your outfits are ready');
  });
});

describe('Notification Settings Module - Events, Storage & Reset', () => {
  beforeEach(() => {
    mockStorage.clear();
    delete globalThis.Notification;
  });

  it('18. should emit notifications:preferences_changed when time changes', () => {
    const manager = createNotificationsManager();
    let emitted = null;
    manager.on(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, (d) => { emitted = d; });

    manager.setTime('09:00');
    assert.ok(emitted);
    assert.strictEqual(emitted.preferences.time, '09:00');
  });

  it('19. should emit notifications:permission_changed on permission update', async () => {
    setupMockNotification('default');
    const manager = createNotificationsManager();
    let permEvent = null;
    manager.on(NOTIFICATION_EVENTS.PERMISSION_CHANGED, (d) => { permEvent = d; });

    await manager.requestBrowserPermission();
    assert.ok(permEvent);
    assert.strictEqual(permEvent.status, 'granted');
  });

  it('20. should allow unsubscribing from notification events', () => {
    const manager = createNotificationsManager();
    let count = 0;
    const unsub = manager.on(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, () => { count++; });

    manager.setTime('08:00');
    assert.strictEqual(count, 1);

    unsub();
    manager.setTime('09:00');
    assert.strictEqual(count, 1);
  });

  it('21. should persist preferences to localStorage', () => {
    const manager = createNotificationsManager();
    manager.setTime('06:45');

    const raw = mockStorage.get('woobi_notification_settings_v1');
    assert.ok(raw);
    assert.strictEqual(JSON.parse(raw).time, '06:45');
  });

  it('22. should restore preferences from localStorage on new manager', () => {
    mockStorage.set('woobi_notification_settings_v1', JSON.stringify({
      time: '08:30',
      enabled: false
    }));

    const manager = createNotificationsManager();
    assert.strictEqual(manager.getPreferences().time, '08:30');
    assert.strictEqual(manager.getPreferences().enabled, false);
  });

  it('23. should reset preferences to default via resetPreferences', () => {
    const manager = createNotificationsManager();
    manager.setTime('10:00');
    manager.setEnabled(false);

    manager.resetPreferences();
    assert.strictEqual(manager.getPreferences().time, DEFAULT_NOTIFICATIONS.time);
    assert.strictEqual(manager.getPreferences().enabled, true);
  });

  it('24. should emit notifications:scheduled when local nudge is dispatched', () => {
    setupMockNotification('granted');
    const manager = createNotificationsManager();
    let scheduledEvent = null;
    manager.on(NOTIFICATION_EVENTS.SCHEDULED, (d) => { scheduledEvent = d; });

    manager.sendLocalNudge('Daily Look', 'Ready');
    assert.ok(scheduledEvent);
    assert.strictEqual(scheduledEvent.title, 'Daily Look');
  });

  it('25. should clean up listeners on dispose', () => {
    const manager = createNotificationsManager();
    let called = false;
    manager.on(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, () => { called = true; });

    manager.dispose();
    manager.setTime('08:00');
    assert.strictEqual(called, false);
  });
});

