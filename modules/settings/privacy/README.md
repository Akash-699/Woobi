# Privacy Settings Module (`modules/settings/privacy`)

The **Privacy Settings Module** enforces local-first data governance, consent preferences (analytics, marketing, crash reporting), granular selective cache purges, full user data JSON packaging/export, and confirmation-gated data deletion.

## Architecture

- **`PrivacyContract.js`**: Default consent schema (`analyticsConsent`, `crashReporting`, `marketingConsent`, `storageMode`), event topics, and contract method declarations.
- **`PrivacyManager.js`**: Core manager ensuring no unsupported cloud claims, providing safe data exports, and requiring `'CONFIRM_DELETE_ALL'` before destructive purges.
- **`index.js`**: Public export interface and `window.WoobiPrivacySettings` namespace binder.

## Usage

```javascript
import { createPrivacyManager } from './modules/settings/privacy/index.js';

const privacy = createPrivacyManager();

// Update consent
privacy.updateConsent({ analyticsConsent: true });

// Export all user data to JSON
const dataPackage = privacy.exportUserData();

// Granular cache clearance
privacy.clearSavedLooksCache();
```

