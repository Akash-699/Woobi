# Woobi — 3D Virtual Fashion Studio & Wardrobe
## Settings Module Redesign: Complete Research & Development (R&D) Proposal


## 1. Existing Woobi Settings Audit & Limitations

### 1.1 Existing Codebase Audit
In the current Woobi Phase 9 codebase, settings are divided into five submodules under `modules/settings/`:
- `account/`: Basic profile attributes (display name, email, avatar image URL), free vs. monthly subscription flag, and local session termination.
- `appearance/`: Light/dark/high-contrast UI themes, font scaling, and 3D studio architectural themes (`luxury-cream`, `nordic-minimal`, `warm-terracotta`) and lighting presets (`editorial_soft`, `warm_atelier`).
- `privacy/`: Local-first consent toggles (analytics, crash logs), cache clearance, and raw JSON export.
- `notifications/`: Daily morning outfit reminder schedule (time picker, recurrence days) and Web Notification triggers.
- `performance/`: Three.js WebGL graphics presets (shadow quality, vanity mirror reflection pass, secondary idle animations).

### 1.2 Key Limitations in Current Implementation
While the underlying modular contracts (`AccountContract`, `AppearanceContract`, etc.) are clean, the actual user experience in `index.html` has severe deficiencies:

| Functional Area | Current Woobi State | Real-World Limitation |
| :--- | :--- | :--- |
| **Information Architecture** | Flat, disconnected screens (`screen-appearance-settings`, `screen-performance-settings`) | Users must navigate back and forth between deep sub-screens. There is no unified settings dashboard. |
| **Search & Discoverability** | No search capability | Finding a specific toggle (e.g., "mirror reflection" or "daily outfit alert") requires digging through multiple nested menus. |
| **Wardrobe & Styling Controls** | Completely missing | No settings for measurement units (cm vs inches), default garment sizing, color harmony rules, occasion tags, or seasonal filters. |
| **Avatar & Fitting Preferences** | Hardcoded | Users cannot save default mannequin proportions, preferred avatar pose presets, or auto-fit camera angles. |
| **Subscription & Atelier Tier** | Static text label | No interactive subscription management, tier benefit comparison (Free vs. Pro Stylist vs. Troyz Atelier), or billing history. |
| **Data Sync & Storage** | Local-only JSON file backing | No visibility into cloud sync status, wardrobe image cache storage consumption, or selective backup/restore controls. |
| **Save State & Feedback** | Instant silent mutations | Changes apply immediately without explicit confirmation, undo support, or an "Unsaved Changes" protection drawer. |

---

## 2. Industry Benchmarking: Modern Consumer & Creative SaaS

To design a world-class settings experience for Woobi, we analyzed leading mobile and creative design platforms:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   BENCHMARKING FASHION & CREATIVE APPS                           │
├─────────────────┬──────────────────────┬─────────────────────────────────────────┤
│ Platform        │ Navigation Model     │ Standout Settings Features              │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Apple iOS /     │ Categorized Sections │ Grouped cards, instant search, clear    │
│ iPadOS Settings │ with leading icons   │ iconography, clear sub-labels.          │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Figma / Spline  │ Tabbed Modal Panel   │ Canvas rendering quality, GPU toggles,  │
│ 3D Design       │                      │ memory usage, keyboard shortcuts.       │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ ASOS / Farfetch │ Preference Center    │ Size preferences, measurement units,    │
│ Fashion Apps    │                      │ occasion alerts, visual style profiles. │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Canva Pro       │ Creative Account Hub │ Brand kits, color palettes, export      │
│                 │                      │ resolution, subscription tier perks.    │
└─────────────────┴──────────────────────┴─────────────────────────────────────────┘
```

### Key Takeaways for Woobi:
1. **Grouped Card Architecture**: Settings should be organized into clearly labeled visual groups (Account, Wardrobe, 3D Studio, Notifications, Storage).
2. **Interactive Live Previews**: Changing a 3D studio theme or lighting preset in Settings should show an instant visual thumbnail preview before saving.
3. **In-Settings Quick Search**: A prominent search bar at the top allows users to type keywords like *"shadows"*, *"cm"*, *"streak"*, or *"avatar"* to jump directly to that toggle.

---

## 3. Proposed Information Architecture & Navigation

We propose restructuring Woobi's Settings into **six intuitive categories**, accessible via a unified tabbed/grouped view:

```
Woobi Settings Suite
│
├── 1. 👤 Account & Membership
│   ├── User Profile (Display name, email, avatar photo)
│   ├── Subscription Tiers (Free Explorer, Woobi Pro Stylist, Troyz Atelier)
│   └── Security & Login (Password update, linked social accounts, active sessions)
│
├── 2. 👗 Wardrobe & Styling Preferences
│   ├── Measurement System (Metric: cm/kg vs. Imperial: inches/lbs)
│   ├── Default Garment Sizes (Tops: S/M/L, Bottoms: 30/32/34, Shoes: EU/US)
│   ├── Style Profile & Personas (Casual, Formal, Streetwear, Minimalist, Avant-Garde)
│   └── Recommendation Rules (Color harmony strictness, weather-aware outfit suggestions)
│
├── 3. 🎨 3D Studio & Dressing Room
│   ├── Architectural Studio Themes (Luxury Cream, Nordic Minimal, Warm Terracotta)
│   ├── Studio Lighting Presets (Editorial Soft, Warm Atelier, Golden Hour, Runway Bright)
│   ├── Camera & Navigation Controls (Orbit sensitivity, auto-frame avatar, default camera angle)
│   └── Mannequin & Stage Display (Floor texture, pedestal visibility, ambient shadows)
│
├── 4. 🧍 Avatar & Virtual Fitting
│   ├── Default Presentation & Mannequin Base (Female / Male / Neutral mannequin)
│   ├── Fitting Proportions (Default shoulder width, waist ratio, height scale)
│   └── Try-On Visual Guides (Garment layer order, collision guides, snap-to-body)
│
├── 5. 🔔 Notifications & Daily Routine
│   ├── Daily Outfit Reminder (Custom time picker, e.g., 08:00 AM, recurrence days)
│   ├── Daily Outfit Streak Alerts (Keep your daily styling habit active)
│   └── Weather & Seasonal Suggestions (Morning outfit recommendations based on local climate)
│
└── 6. ⚡ Performance, Storage & Privacy
    ├── WebGL Graphics Fidelity (Ultra, Balanced, Battery Saver presets)
    ├── Advanced 3D Toggles (Vanity mirror reflections, shadow map resolution, FPS limiter)
    ├── Storage & Cache Management (Local wardrobe cache size, clear 3D textures cache)
    └── Cloud Sync & Data Export (Sync status, export wardrobe library as JSON/CSV)
```

---

## 4. Detailed Woobi Functional Configurations

### 4.1 Wardrobe & Styling Engine Preferences
- **Measurement Units**: Switch seamlessly between Metric (`cm`, `kg`) and Imperial (`inches`, `lbs`). Automatically converts garment dimension tags.
- **Smart Outfit Algorithm Rules**:
  - *Color Harmony Mode*: Strict (Monochrome / Analogous / Complementary) vs Relaxed (Creative / Experimental).
  - *Occasion Filtering*: Set default occasion tags (Workplace, Weekend Casual, Evening Dinner, Gym/Athletic).
  - *Weather Integration*: Toggle weather-informed suggestions (e.g., automatically recommend jackets/cardigans when local temperature drops below 18°C).

### 4.2 3D Studio & Dressing Room Configurations
- **Theme Selection**: Live preview tiles for `luxury-cream`, `nordic-minimal`, and `warm-terracotta` with real-time material swapping.
- **Lighting Controls**: Switch key, fill, and rim light presets (`editorial_soft`, `warm_atelier`, `golden_hour`, `runway_bright`) with an intensity slider.
- **Camera Ergonomics**: Configurable auto-rotation speed, gesture touch sensitivity (mobile zoom/pan), and default zoom level (full-body vs waist-up).

### 4.3 Graphics Performance & Battery Saver
- **Performance Presets**:
  - *Ultra*: 60 FPS, High-res shadow maps (2048x2048), dynamic mirror reflection pass, anti-aliasing enabled.
  - *Balanced (Default)*: 60 FPS, medium shadows (1024x1024), simplified reflection pass.
  - *Battery Saver*: 30 FPS cap, shadows disabled, planar reflections disabled, low-power WebGL mode for extended battery life on mobile devices.
- **Texture Cache Manager**: Displays live local storage consumption (e.g., `42.5 MB of 3D garment textures cached`) with a single-click "Clear Cache" button that preserves user wardrobe data.

### 4.4 Account & Membership Plans
- **Tier Structure**:
  - *Free Explorer*: Up to 50 wardrobe items, standard 3D studio, default avatar.
  - *Woobi Pro*: Unlimited wardrobe items, custom color harmony engine, all lighting presets, high-res export.
  - *Troyz Atelier*: Exclusive digital fabrics, personalized 3D avatar scan import, early access to new 3D stage environments.

---

## 5. UI/UX Design System & Interactive Wireframes

### 5.1 UX Design Highlights
1. **Unified Master-Detail Layout**: Clean tabbed sidebar on desktop/tablet, fluid bottom-sheet navigation on mobile.
2. **Live In-Settings Search**: Interactive search bar with instant keyword matching (e.g., typing *"mirror"* filters the view directly to the 3D reflection toggle).
3. **Floating Dirty-State Bar**: When any setting is adjusted, a non-intrusive bottom drawer appears:  
   `[ ⚠️ Unsaved Changes ] ────────────────────── [ Discard ] [ Save Settings ]`
4. **Visual Thumbnail Selectors**: Visual cards for 3D Studio themes, lighting presets, and avatar types rather than boring plain dropdowns.

### 5.2 UI Wireframe: Woobi Unified Settings Screen

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ WOOBI ── Settings & Preferences                                   [ Search settings... (Ctrl+K) ]  [✕] │
├──────────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ SETTINGS CATEGORIES      │ 3D Studio & Dressing Room                                                   │
│                          │ ─────────────────────────────────────────────────────────────────────────── │
│  👤 Account & Plans      │ Architectural Studio Theme                                                  │
│  👗 Wardrobe & Styling   │ Choose the aesthetic environment for your 3D dressing room.                 │
│ >🎨 3D Studio & Stage    │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐            │
│  🧍 Avatar & Fitting     │ │ [✓] Luxury Cream │  │ [ ] Nordic Minimal│ │ [ ] Terracotta   │            │
│  🔔 Daily Reminders      │ │ (Warm Atelier)   │  │ (Clean Marble)   │  │ (Rich Earth)     │            │
│  ⚡ Graphics & Storage   │ └──────────────────┘  └──────────────────┘  └──────────────────┘            │
│                          │                                                                             │
│                          │ Studio Lighting Preset                                                      │
│                          │ (•) Editorial Soft    ( ) Warm Atelier    ( ) Golden Hour   ( ) Runway      │
│                          │ Lighting Intensity: [ ───────────●───── ] 1.2x                              │
│                          │                                                                             │
│                          │ ─────────────────────────────────────────────────────────────────────────── │
│                          │ Vanity Mirror & Reflection Quality                                          │
│                          │ [x] Enable real-time vanity mirror reflection pass                          │
│                          │ Reflection Fidelity: [ High (Real-time WebGL)              ▼ ]              │
│                          │                                                                             │
│                          │ Camera & Controls                                                           │
│                          │ [x] Auto-frame avatar on garment change                                     │
│                          │ Touch Gesture Sensitivity: [ ────────●───────── ] Medium                    │
├──────────────────────────┴─────────────────────────────────────────────────────────────────────────────┤
│ [!] You have unsaved changes in Studio Settings               [ Discard Changes ]   [ Save Settings ]  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 UI Wireframe: Wardrobe & Styling Preferences Tab

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Settings  ›  Wardrobe & Styling Preferences                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Measurement Units & Sizes                                                                              │
│ Unit Standard:           (•) Metric (cm, kg)              ( ) Imperial (inches, lbs)                   │
│ Default Tops Size:       [ M (Medium - 38-40)       ▼ ]                                                │
│ Default Bottoms Size:    [ 32 (Waist)               ▼ ]                                                │
│                                                                                                        │
│ ────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ Smart Styling & Color Harmony Rules                                                                    │
│ Color Matching Strictness:                                                                             │
│ ( ) Conservative (Monochrome & Neutrals)                                                               │
│ (•) Balanced (Analogous & Triadic Harmony - Recommended)                                               │
│ ( ) Adventurous (High-contrast Complementary & Experimental)                                           │
│                                                                                                        │
│ [x] Enable Weather-Aware Outfit Recommendations (uses local temperature for layer suggestions)        │
│                                                                                                        │
│ ────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ Daily Morning Reminder & Streak                                                                        │
│ [x] Remind me to plan my outfit every morning at: [ 08:00 AM ▼ ]                                       │
│ Active Days: [M] [T] [W] [T] [F] [S] [S]                                                               │
│                                                        [ Revert to Defaults ]   [ Save Preferences ]   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Feasibility & Modular Architecture

### 6.1 Architectural Boundary Compliance
Per Troyz Solutions' monorepo commandments (`CONTRIBUTING.md`):
1. **Public Interface Access**: External callers interact solely with `modules/settings/index.js` via the unified `SettingsManager` orchestrator.
2. **Browser-to-Backend Boundary**: Settings persistence uses REST API endpoints via `ApiClient`. No direct database imports.
3. **Zero Circular Dependencies**: Data flows cleanly: `Settings UI` → `Core Store` → `3D Studio Event Hub`.
4. **Validation Check**: Verified passing with zero boundary violations via `scripts/validation/validate-boundaries.ps1`.

### 6.2 Proposed Directory Architecture for `modules/settings/`
```
modules/settings/
├── index.js                           # Unified SettingsManager Orchestrator & Public API
├── index.test.js                      # Master Unit Test Suite
├── README.md                          # Settings Domain Documentation
│
├── account/                           # User profile, subscription plans, auth state
│   ├── AccountManager.js
│   ├── AccountContract.js
│   └── AccountManager.test.js
│
├── wardrobe/                          # NEW: Measurement units, sizing, style preferences
│   ├── WardrobeSettingsManager.js
│   ├── WardrobeSettingsContract.js
│   └── WardrobeSettingsManager.test.js
│
├── appearance/                        # 3D themes, studio lighting presets, UI theme
│   ├── AppearanceManager.js
│   ├── AppearanceContract.js
│   └── AppearanceManager.test.js
│
├── avatar/                            # NEW: Default mannequin, fitting guides, proportions
│   ├── AvatarSettingsManager.js
│   ├── AvatarSettingsContract.js
│   └── AvatarSettingsManager.test.js
│
├── notifications/                     # Daily outfit reminder, weather alerts, streak
│   ├── NotificationsManager.js
│   ├── NotificationsContract.js
│   └── NotificationsManager.test.js
│
└── performance/                       # WebGL graphics, shadows, texture cache management
    ├── PerformanceManager.js
    ├── PerformanceContract.js
    └── PerformanceManager.test.js
```

---

## 7. Phased Implementation Roadmap

Implementation will be executed across four non-breaking phases mapped to Work Deck tickets:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        WOOBI SETTINGS IMPLEMENTATION ROADMAP                           │
├─────────────────┬──────────────────────────────────┬──────────────┬────────────────────┤
│ Phase           │ Scope & Deliverables             │ Duration     │ Target Branch      │
├─────────────────┼──────────────────────────────────┼──────────────┼────────────────────┤
│ Phase 1:        │ • Modern unified Settings Modal  │ 2-3 Days     │ feature/WD-401-    │
│ Navigation &    │ • Category sidebar & mobile tabs │              │ settings-ui-core   │
│ In-App Search   │ • In-settings search bar (Ctrl+K)│              │                    │
│                 │ • Unsaved Changes safety drawer  │              │                    │
├─────────────────┼──────────────────────────────────┼──────────────┼────────────────────┤
│ Phase 2:        │ • WardrobeSettings submodule     │ 3 Days       │ feature/WD-402-    │
│ Wardrobe &      │ • Metric/Imperial toggle logic   │              │ wardrobe-styling   │
│ Styling Rules   │ • Color harmony rules integration│              │                    │
│                 │ • Occasion tag preference system │              │                    │
├─────────────────┼──────────────────────────────────┼──────────────┼────────────────────┤
│ Phase 3:        │ • 3D studio live visual previews │ 3 Days       │ feature/WD-403-    │
│ 3D Studio &     │ • Golden Hour lighting preset    │              │ studio-avatar-cfg  │
│ Avatar Settings │ • Avatar mannequin base toggles  │              │                    │
│                 │ • Camera sensitivity controls    │              │                    │
├─────────────────┼──────────────────────────────────┼──────────────┼────────────────────┤
│ Phase 4:        │ • Texture cache usage viewer     │ 2 Days       │ feature/WD-404-    │
│ Storage, Sync & │ • Selective cache clearance      │              │ storage-sync-perf  │
│ Performance     │ • Cloud sync status indicator    │              │                    │
│                 │ • Subscription tier modal preview│              │                    │
└─────────────────┴──────────────────────────────────┴──────────────┴────────────────────┘
```


