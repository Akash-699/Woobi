# Woobi — Unified Enterprise & Administrative Settings Redesign
## Complete Research & Development (R&D) Proposal


---

## Executive Summary

Following managerial guidance from Joy Arnold J, this Research & Development (R&D) proposal establishes the architectural blueprint for upgrading the **Settings module of Woobi** directly within the existing application codebase (`modules/settings/` and `index.html`). **No separate external admin dashboard is required.**

Instead, Woobi's internal Settings suite will be transformed from a basic client-only menu into a unified, **role-aware enterprise configuration portal**. 

When a standard user or intern accesses Settings, they experience a streamlined, elegant personal preferences hub (3D Studio themes, avatar customization, personal notifications, WebGL performance tuning). When an **Administrator or Manager** logs in, Woobi's Settings dynamically unlocks administrative controls: **Role & Permission Management (RBAC)**, **Staff & Intern Attendance/Shift Policies**, **Task & Project Workflow Rules**, **Enterprise Security & 2FA**, and **SaaS Integrations (Slack, GitHub, Google Calendar)**.

This document details the existing limitations, benchmarks modern SaaS paradigms (Linear, ClickUp, Jira, Slack, Rippling), defines the information architecture, provides clear UI wireframes, outlines strict monorepo boundary compliance per `CONTRIBUTING.md`, and supplies a phased engineering roadmap.

---

## 1. Existing Woobi Settings Audit & Limitations

### 1.1 Current Architecture Review
In the current Woobi Phase 9 codebase, settings are partitioned into five submodules under `modules/settings/`:
1. `account/`: Profile attributes (display name, email, avatar), basic subscription tiers, and local sign-out.
2. `appearance/`: Light/dark/high-contrast modes, font scale, 3D Studio themes (`luxury-cream`, `nordic-minimal`, `warm-terracotta`), and lighting presets (`editorial_soft`, `warm_atelier`).
3. `privacy/`: Local consent toggles (analytics, error reporting), cache clearance, and raw JSON export.
4. `notifications/`: Daily outfit reminder schedule (time, recurrence) and browser notification permissions.
5. `performance/`: Three.js graphics presets (shadows, reflection quality, frame rate optimization).

### 1.2 Administrative Deficiencies in the Current Implementation
While the existing modular code is well-structured for individual client preferences, it cannot support Troyz Solutions' organizational management needs:

| Requirement Area | Current Woobi State | Deficiency for Administrators |
| :--- | :--- | :--- |
| **User Hierarchy & RBAC** | Single authenticated user profile | No role scoping. Admins cannot configure roles (Admin, Reviewer, Contributor, Intern) or set granular permissions. |
| **Attendance & Shifts** | None | Administrators have no interface in Woobi to set team office hours, late grace periods (e.g., 15 mins). |
| **Task & Work Deck Workflows** | Hardcoded logic | No administrative controls to customize task statuses (Backlog → In Review → Merged), priority tags, or required PR review checklists. |
| **Security & Governance** | Basic password storage | No enforced Two-Factor Authentication (2FA), no idle session timeouts, and no audit trail of who changed project settings. |
| **Integrations** | Isolated local-first app | No interface to configure webhook triggers, manage API tokens, or connect company tools like Slack or GitHub. |
| **UX & Navigation** | Flat list in mobile view | Settings items are stacked without search, breadcrumbs, or a persistent dirty-state ("Unsaved changes") warning. |

---

## 2. Professional SaaS Benchmarking: How Modern Platforms Solve This

Rather than building a detached secondary dashboard, leading modern enterprise platforms embed administrative power directly inside the main application's settings suite:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   HOW TOP SAAS APPS EMBED ADMIN IN SETTINGS                      │
├─────────────────┬──────────────────────┬─────────────────────────────────────────┤
│ Platform        │ Architecture         │ In-App Administration Pattern           │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Linear          │ In-App Settings View │ Sidebar splits "My Account" vs          │
│                 │                      │ "Workspace" (Admins see Teams, API,     │
│                 │                      │ Workflows & Security in same UI).       │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Slack           │ In-App Preferences   │ Personal prefs for all users; Workspace │
│                 │ & Admin Console      │ settings expand dynamically for Admins. │
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ ClickUp         │ Unified Settings     │ Role-aware visibility: Admins get Space │
│                 │ Sidebar              │ settings, custom statuses & permissions.│
├─────────────────┼──────────────────────┼─────────────────────────────────────────┤
│ Rippling        │ Unified Portal       │ Single navigation with deep policy      │
│                 │                      │ controls (Time & Attendance, Shifts).   │
└─────────────────┴──────────────────────┴─────────────────────────────────────────┘
```

### Key Innovations Adopted for Woobi:
1. **Dynamic Role-Based Menu Rendering**: A single, clean Settings modal/screen. If the logged-in user is an `Admin` or `Manager`, an **"Administration"** tab section automatically appears below **"Personal Settings"**.
2. **Instant Search (`Ctrl+K` / Search Input)**: Allows admins to quickly type "grace period" or "2FA" to jump straight to the relevant setting.
3. **Dirty State Safety Bar**: Prevents accidental misconfiguration by displaying an explicit `[ Discard ] [ Save Changes ]` prompt whenever settings are modified.

---

## 3. Proposed Information Architecture & Navigation

We propose a modern **segmented two-pane navigation structure** for Woobi's Settings screen:

```
Woobi Settings Screen
│
├── 👤 PERSONAL SETTINGS (Visible to all users)
│   ├── 1. Profile & Account (Name, avatar, password, personal 2FA)
│   ├── 2. 3D Studio & Appearance (Themes, lighting presets, font scale)
│   ├── 3. Daily Reminders & Alerts (Outfit reminders, web push, quiet hours)
│   ├── 4. Graphics & Performance (Shadows, reflection passes, FPS cap)
│   └── 5. Data & Privacy (Local cache, data download, consent)
│
└── 🛡️ WORKSPACE ADMINISTRATION (Visible only to Admin / Manager accounts)
    ├── 6. Team & Roles (RBAC) (Invite members, assign roles: Admin, Reviewer, Intern)
    ├── 7. Attendance & Shifts (Working hours, 15-min grace period, shift policies)
    ├── 8. Tasks & Project Rules (Work Deck ticket statuses, PR review requirements)
    ├── 9. Security & Compliance (Enforce 2FA, session timeout, audit activity log)
    └── 10. Integrations & API (Slack bot notifications, GitHub webhooks, API keys)
```

---

## 4. Role-Based Access Control (RBAC) & Permission Matrix

To ensure proper governance between managers, developers, and interns at Troyz Solutions, Woobi will implement a role-based permission system:

### 4.1 Defined System Roles
1. **Repository Owner / Super Admin (`role:owner`)**: Full authority over organization billing, repository ownership, and master security.
2. **Administrator / Manager (`role:admin`)**: (e.g., `@joyarnold21`) Can configure attendance rules, task workflows, approve leave, and manage integrations.
3. **Designated Reviewer / Team Lead (`role:reviewer`)**: Can review Work Deck tickets, override punches for their squad, and assign tasks.
4. **Contributor / Developer (`role:contributor`)**: Full access to 3D studio, wardrobe features, personal tasks, and standard attendance clock-in.
5. **Intern (`role:intern`)**: Supervised access to assigned tasks, standard attendance clock-in, and personal preferences.

### 4.2 Woobi Administrative Permission Matrix

| Capability String | Super Admin | Administrator | Reviewer / Lead | Contributor | Intern |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `settings:personal:edit` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin:access_panel` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:attendance:configure` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:attendance:override` | ✅ | ✅ | ✅ (Squad only)| ❌ | ❌ |
| `admin:tasks:workflow_edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:roles:assign` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:security:enforce_2fa`| ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:audit:view_logs` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `admin:integrations:manage` | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 5. Attendance, Tasks & Shift Configurations

### 5.1 Staff & Intern Attendance Policies
Directly configured within Woobi's Admin Settings tab:
- **Core Shift Hours**: Default `09:30 AM` – `06:30 PM`.
- **Late Grace Period**: Configurable tolerance (default `15 minutes`). Punch-ins between 09:30 and 09:45 are flagged as "Within Grace"; after 09:45 are logged as "Late Arrival".
- **Half-Day Cutoff**: Working under `4 hours` automatically logged as half-day.
- **Corporate Network Verification**:
  - Optional IP Whitelisting for corporate Wi-Fi punch-in verification.

### 5.2 Task & Work Deck Configurations
- **Ticket Workflow Stages**: Admins can customize stage tags (`Backlog`, `In Progress`, `Under Review`, `Merged`, `Deployed`).
- **PR & Merge Policy Enforcement**: Require designated reviewer approval (`@joyarnold21`) and green CI before tasks are marked completed.
- **Sprint & Milestone Durations**: Set weekly or bi-weekly sprint boundaries for intern task assignments.

---

## 6. Security, Notifications & Integrations

### 6.1 Enterprise Security Controls
- **Mandatory 2FA Enforcement**: When enabled by an Admin, all contributors and interns must configure TOTP (Google Authenticator) upon login.
- **Session Timeout Policy**: Configurable idle timeout (e.g., auto-logout after 30 minutes of inactivity).
- **Administrative Audit Trail**: Timestamped JSON records logging who made changes to attendance rules, role assignments, or project settings.

### 6.2 Multi-Channel Notifications
- **In-App Toast & Badges**: Real-time notifications for task assignments, PR approvals, and shift reminders.
- **Slack Webhook Integration**: Automated notifications to `#woobi-dev` or `#announcements` when:
  - An intern clocks in late or requests leave.
  - A new Work Deck PR is ready for review.
- **GitHub Sync**: Webhook listener to update task status when a pull request is merged to `main`.

---

## 7. UI/UX Wireframe & Design Recommendations

### 7.1 Proposed Settings Layout (Two-Column Responsive Master-Detail)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ WOOBI ── App Settings                                             [ Search settings... (Ctrl+K) ]  [✕] │
├──────────────────────────┬─────────────────────────────────────────────────────────────────────────────┤
│ PERSONAL SETTINGS        │ Workspace Administration  ›  Attendance & Shifts                            │
│  Profile & Account       │ ─────────────────────────────────────────────────────────────────────────── │
│  3D Studio & Appearance  │ Shift Schedule & Office Hours                                               │
│  Daily Reminders         │ Configure standard office hours and arrival tolerance for team members.     │
│  Graphics & Performance  │                                                                             │
│  Data & Privacy          │ Working Hours                                                               │
│                          │ ┌───────────────────────┐         ┌───────────────────────┐                 │
│ ──────────────────────── │ │ Shift Start: 09:30 AM │   to    │ Shift End:   06:30 PM │                 │
│ WORKSPACE ADMIN [Admin]  │ └───────────────────────┘         └───────────────────────┘                 │
│  Team & Roles [RBAC]     │                                                                             │
│ >Attendance & Shifts     │ Late Arrival Grace Period                                                   │
│  Task Workflows          │ [ 15 minutes                     ▼ ]                                        │
│  Security & 2FA          │ Auto-mark half-day if check-in is later than 10:30 AM                       │
│  Audit Activity Logs     │                                                                             │
│  Integrations & API      │ ─────────────────────────────────────────────────────────────────────────── │
│                          │ Corporate Gateway IP Whitelist (Optional)                                   │
│                          │ [x] Restrict punch-in verification to corporate IP ranges                   │
│                          │ Allowed IPs: [ 106.51.72.10, 182.74.88.2                                  ] │
│                          │                                                                             │
├──────────────────────────┴─────────────────────────────────────────────────────────────────────────────┤
│ [!] Unsaved Changes Detected                                   [ Discard Changes ]   [ Save Settings ] │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

*Note: For standard users and interns, the `WORKSPACE ADMIN` section is automatically hidden based on the user's role token.*

---

## 8. Technical Feasibility & Modular Monorepo Architecture

### 8.1 Zero-Violation Monorepo Boundary Compliance
To strictly respect Troyz Solutions' architecture guidelines in `CONTRIBUTING.md`:
1. All public access continues through `modules/settings/index.js`.
2. UI components inside `index.html` or `app.js` will interact through the centralized `WoobiSettings` orchestrator.
3. Administrative backend persistence uses verified endpoints in `modules/backend/api/` with token validation.
4. Verified with `scripts/validation/validate-boundaries.ps1` (0 boundary violations).

### 8.2 Proposed Structure for `modules/settings/`
```
modules/settings/
├── index.js                           # Top-level Orchestrator & Public API
├── index.test.js                      # Master Unit Test Suite
├── README.md                          # Submodule Documentation
│
├── personal/                          # Standard User Preferences
│   ├── account/                       # Profile, avatar, password
│   ├── appearance/                    # 3D themes, studio lighting presets
│   ├── notifications/                 # Daily outfit reminders, quiet hours
│   ├── performance/                   # WebGL graphics fidelity
│   └── privacy/                       # Consent, cache clear, export
│
├── admin/                             # Administrative Submodules (Role-Gated)
│   ├── rbac/                          # Role definition & permission checks
│   ├── attendance/                    # Shift hours, grace period, shift policies
│   ├── workflows/                     # Task status rules & PR checks
│   ├── security/                      # 2FA enforcement & audit logging
│   └── integrations/                  # Slack, GitHub webhooks, API tokens
│
└── contracts/                         # Contracts & Data Validations
    ├── SettingsContract.js
    ├── RbacContract.js
    └── AttendancePolicyContract.js
```

---

## 9. Phased Implementation Roadmap

Implementation will proceed across 4 non-breaking phases aligned with Work Deck tickets:

| Phase | Milestone Scope | Estimated Time | Target Branch |
| :--- | :--- | :--- | :--- |
| **Phase 1: Navigation & Personal Hub** | Modernize Settings UI with two-column layout, add search (`Ctrl+K`), and create Unsaved Changes bar. | 3 Days | `feature/WD-401-settings-navigation` |
| **Phase 2: RBAC & Role Gating** | Implement role tokens (`admin`, `reviewer`, `intern`), permission checks, and conditionally render the Admin section. | 3 Days | `feature/WD-402-settings-rbac` |
| **Phase 3: Attendance & Task Rules** | Build Attendance Policy manager (shift hours, 15-min grace, shift rules) and Task Workflow editor. | 4 Days | `feature/WD-403-attendance-workflows` |
| **Phase 4: Security, Audit & Integrations** | Add 2FA toggle, audit log viewer, and Slack/GitHub webhook settings. | 4 Days | `feature/WD-404-security-integrations` |

### Testing & Verification Rules:
- Unit tests written for every new manager (`*.test.js`).
- Complete validation via `scripts/validation/validate-boundaries.ps1`.
- All PRs reviewed and merged by designated reviewers (`@joyarnold21`).

