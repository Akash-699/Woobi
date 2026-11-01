/**
 * Woobi - Settings Module
 * NotificationsManager.js - Reminder Schedules, Categories & User-Initiated Web Notifications
 */

import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATIONS,
  NotificationsContract
} from './NotificationsContract.js';

export class NotificationsManager {
  constructor(options = {}) {
    this.options = Object.assign({
      storageKey: 'woobi_notification_settings_v1',
      legacyStorageKey: 'seren_notification_settings'
    }, options);

    this.preferences = {
      ...DEFAULT_NOTIFICATIONS,
      repeatDays: [...DEFAULT_NOTIFICATIONS.repeatDays],
      categories: { ...DEFAULT_NOTIFICATIONS.categories }
    };

    this.listeners = new Map();

    this.loadPreferences();
  }

  loadPreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.options.storageKey) ||
                  localStorage.getItem(this.options.legacyStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.preferences = Object.assign(this.preferences, parsed);
        }
      }
    } catch (e) {
      console.warn('NotificationsManager: could not read notification settings', e);
    }
  }

  savePreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = JSON.stringify(this.preferences);
      localStorage.setItem(this.options.storageKey, data);
      localStorage.setItem(this.options.legacyStorageKey, data);
    } catch (e) {
      console.warn('NotificationsManager: could not persist notification settings', e);
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
          console.error(`NotificationsManager error [${event}]:`, e);
        }
      });
    }
  }

  getPreferences() {
    return {
      ...this.preferences,
      repeatDays: [...this.preferences.repeatDays],
      categories: { ...this.preferences.categories }
    };
  }

  setEnabled(enabled) {
    this.preferences.enabled = !!enabled;
    this.savePreferences();
    this.emit(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, { preferences: this.getPreferences() });
    return true;
  }

  validateTime(timeStr) {
    if (typeof timeStr !== 'string') return false;
    const match = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    return !!match;
  }

  setTime(timeStr) {
    if (!this.validateTime(timeStr)) {
      const error = new Error(`Invalid time format '${timeStr}'. Expected HH:MM in 24-hour format.`);
      this.emit(NOTIFICATION_EVENTS.ERROR, { error, field: 'time' });
      return { success: false, error: error.message };
    }

    this.preferences.time = timeStr;
    this.savePreferences();
    this.emit(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, { preferences: this.getPreferences() });
    return { success: true, time: timeStr };
  }

  toggleRepeatDay(dayIndexOrCode, isActive) {
    const days = [...this.preferences.repeatDays];
    const code = String(dayIndexOrCode);

    const exists = days.includes(code);
    const targetState = isActive !== undefined ? !!isActive : !exists;

    if (targetState && !exists) {
      days.push(code);
    } else if (!targetState && exists) {
      const idx = days.indexOf(code);
      if (idx !== -1) days.splice(idx, 1);
    }

    this.preferences.repeatDays = days;
    this.savePreferences();
    this.emit(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, { preferences: this.getPreferences() });
    return { success: true, repeatDays: this.preferences.repeatDays };
  }

  setCategoryEnabled(category, isEnabled) {
    if (!this.preferences.categories) {
      this.preferences.categories = {};
    }

    this.preferences.categories[category] = !!isEnabled;
    this.savePreferences();
    this.emit(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, { preferences: this.getPreferences() });
    return true;
  }

  getPermissionStatus() {
    if (typeof Notification === 'undefined') {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestBrowserPermission() {
    if (typeof Notification === 'undefined') {
      const status = 'unsupported';
      this.emit(NOTIFICATION_EVENTS.PERMISSION_CHANGED, { status });
      return { success: false, status, message: 'HTML5 Web Notifications API not supported in current environment' };
    }

    try {
      const result = await Notification.requestPermission();
      this.emit(NOTIFICATION_EVENTS.PERMISSION_CHANGED, { status: result });
      return {
        success: result === 'granted',
        status: result
      };
    } catch (e) {
      this.emit(NOTIFICATION_EVENTS.ERROR, { error: e });
      return { success: false, status: 'denied', error: e.message };
    }
  }

  sendLocalNudge(title, body, options = {}) {
    if (!this.preferences.enabled) {
      return { delivered: false, reason: 'notifications_disabled' };
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      return { delivered: false, reason: 'permission_not_granted', status: permission };
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: options.icon || 'assets/icons/icon-192.png',
        tag: options.tag || 'woobi_reminder',
        silent: options.silent || false
      });

      this.emit(NOTIFICATION_EVENTS.SCHEDULED, { title, body });
      return { delivered: true, notification };
    } catch (e) {
      return { delivered: false, reason: 'delivery_error', error: e.message };
    }
  }

  resetPreferences() {
    this.preferences = {
      ...DEFAULT_NOTIFICATIONS,
      repeatDays: [...DEFAULT_NOTIFICATIONS.repeatDays],
      categories: { ...DEFAULT_NOTIFICATIONS.categories }
    };

    this.savePreferences();
    this.emit(NOTIFICATION_EVENTS.PREFERENCES_CHANGED, { preferences: this.getPreferences() });
    return true;
  }

  dispose() {
    this.listeners.clear();
  }
}

export function createNotificationsManager(options = {}) {
  return new NotificationsManager(options);
}

