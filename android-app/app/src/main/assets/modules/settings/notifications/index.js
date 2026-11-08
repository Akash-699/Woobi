/**
 * Woobi - Settings Module
 * notifications/index.js - Public Interface & Factory
 */

import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  DAYS_OF_WEEK,
  DEFAULT_NOTIFICATIONS,
  NotificationsContract
} from './NotificationsContract.js';
import {
  NotificationsManager,
  createNotificationsManager
} from './NotificationsManager.js';

export {
  NOTIFICATION_EVENTS,
  NOTIFICATION_CATEGORIES,
  DAYS_OF_WEEK,
  DEFAULT_NOTIFICATIONS,
  NotificationsContract,
  NotificationsManager,
  createNotificationsManager
};

if (typeof window !== 'undefined') {
  window.WoobiNotificationSettings = {
    NOTIFICATION_EVENTS,
    NOTIFICATION_CATEGORIES,
    DAYS_OF_WEEK,
    DEFAULT_NOTIFICATIONS,
    NotificationsContract,
    NotificationsManager,
    createNotificationsManager
  };
}

