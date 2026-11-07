# Module 3: Settings (`modules/settings`)

## Responsibility
The **Settings** module encapsulates all user-facing settings, personal account preferences, application appearance (including real-time 3D Studio themes and lighting setups), local-first data privacy and export, notification schedules, and Three.js client performance tuning.

## Architectural Submodules

1. **`account/`**
   - User profile management (name, email, avatar), subscription plans (Free, Monthly, Annual), Core Store synchronization, and safe session sign-out behavior.
   - Core API: `AccountManager`, `createAccountManager`, `SUBSCRIPTION_PLANS`, `ACCOUNT_EVENTS`, `DEFAULT_PROFILE`.

2. **`appearance/`**
   - Light/dark application themes, font scaling, high-contrast accessibility, and real-time 3D Studio architectural themes (`luxury-cream`, `nordic-minimal`, `warm-terracotta`) and lighting presets (`editorial_soft`, `warm_atelier`, etc.).
   - Core API: `AppearanceManager`, `createAppearanceManager`, `APP_THEMES`, `STUDIO_THEMES`, `LIGHTING_PRESETS`.

3. **`privacy/`**
   - Local-first consent controls (analytics, crash reporting, marketing), full JSON user data packaging/export, and confirmation-gated cache clearance without false cloud sync claims.
   - Core API: `PrivacyManager`, `createPrivacyManager`, `DEFAULT_CONSENT`, `PRIVACY_EVENTS`.

4. **`notifications/`**
   - Daily morning outfit reminder schedules (time, day recurrence), notification category toggles, and user-initiated HTML5 Web Notification permission requests with graceful mobile WebView degradation.
   - Core API: `NotificationsManager`, `createNotificationsManager`, `NOTIFICATION_CATEGORIES`, `DAYS_OF_WEEK`.

5. **`performance/`**
   - WebGL graphics fidelity presets (High, Medium, Low, Battery Saver, Auto), shadow resolution toggles, vanity mirror reflection pass controls, and secondary idle motion dynamics without disrupting wardrobe or camera interactions.
   - Core API: `PerformanceManager`, `createPerformanceManager`, `PERFORMANCE_PRESETS`, `SHADOW_QUALITY`, `REFLECTION_QUALITY`.

## Public Interface Contract
The module exposes its public API through `index.js`, which exports all submodules and a unified `SettingsManager` orchestrator, as well as `window.WoobiSettings` for browser applications.

## UI Design & Presentation Architecture
The settings user interface is designed in alignment with Woobi's luxury fashion editorial aesthetic (`tokens.css`):
- **Visual Palette**: Warm organic tones (`--bg-board: #F8F7F4`, `--bg-phone: #FAF9F6`, `--olive-primary: #52634B`, `--olive-soft: rgba(82, 99, 75, 0.12)`).
- **Typography**: Display serif (`DM Serif Display`) for screen titles and Plus Jakarta Sans for UI labels and subheadings.
- **Iconography**: Scalable, clean SVG icons (`stroke-width: 2`, `currentColor`) replacing legacy emojis across all landing and subpage menu items.
- **Card-Based Component Layout**: Section cards (`.settings-section-card`, `.settings-card-group`) with subtle borders, elevation shadows, and touch-optimized interactive row targets (`.settings-item-row`, `.settings-toggle-row`).
- **Responsive Adaptability**: Full fluid compatibility across mobile viewports (360px–480px), tablet screens (768px–1024px), and centered desktop application frames.

