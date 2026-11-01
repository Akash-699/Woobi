# Account Settings Module (`modules/settings/account`)

The **Account Settings Module** manages user profile information, subscription tier state (Free, Monthly, Annual), safe session sign-out, and destructive account data resets with explicit authorization tokens.

## Architecture

- **`AccountContract.js`**: Profile schema, subscription plan constants (`free`, `monthly`, `annual`), and event names (`account:profile_updated`, `account:plan_changed`, `account:sign_out`, `account:data_deleted`).
- **`AccountManager.js`**: Core controller validating name/email inputs, synchronizing subscription tiers with the central Core Store, and providing safe session resets.
- **`index.js`**: Public export interface and `window.WoobiAccountSettings` global registration.

## Usage

```javascript
import { createAccountManager } from './modules/settings/account/index.js';

const account = createAccountManager(coreStore);

// Get profile
const profile = account.getProfile();

// Update profile with validation
account.updateProfile({ name: 'Suriya R', email: 'suriya.r@example.com' });

// Upgrade plan
account.upgradePlan('monthly');
```

