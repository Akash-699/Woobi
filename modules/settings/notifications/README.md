# Notification Settings Module (`modules/settings/notifications`)

The **Notification Settings Module** manages daily morning styling nudge schedules, day-of-week recurrence rules, notification categories, and user-initiated HTML5 Web Notification permissions.

## Architecture

- **`NotificationsContract.js`**: Supported notification categories (`morningOutfits`, `streakReminders`, `seasonalLookbooks`), default schedules (07:30 AM on weekdays), and event definitions.
- **`NotificationsManager.js`**: Controls schedule updates, 24-hr time validation, user-gesture-only permission requests, and graceful degradation on unsupported mobile WebViews.
- **`index.js`**: Public export interface and `window.WoobiNotificationSettings` namespace binder.

## Usage

```javascript
import { createNotificationsManager } from './modules/settings/notifications/index.js';

const notifications = createNotificationsManager();

// Set reminder time
notifications.setTime('08:00');

// Toggle day recurrence
notifications.toggleRepeatDay('S', true);

// Request browser permission explicitly on user button click
const result = await notifications.requestBrowserPermission();
```

