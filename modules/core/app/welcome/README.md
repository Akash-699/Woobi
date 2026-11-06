# App entry and redirect behavior

Run `npm start` and use the printed port (8085 by default).

| Entry or action | Current behavior |
| --- | --- |
| Browser `/` or `/index.html`, viewport at most 700px wide | Shows the red-carpet welcome on first use. Returning users open the dashboard directly. Enter Woobi waits for the entrance and studio preparation, then reveals Today in the same document. |
| Browser homepage, wider than 700px | Opens the existing dashboard directly. |
| `/login/` or `/login/index.html` | Opens the selected playable wardrobe login. Successful email login, signup, or Google popup sign-in navigates to `../index.html`, resolving to `/index.html`. |
| Login footer: Explore your wardrobe | Navigates to the same homepage for public UI review without signing in. |
| Password reset or failed/cancelled sign-in | Stays on the login page and shows feedback. |
| `/modules/core/app/welcome/index.html` | Standalone welcome preview. Enter Woobi replaces the current history entry with `/?welcome=entered`. The homepage consumes and removes the marker to avoid a second welcome. |
| Android activity launch | Opens `file:///android_asset/index.html`; `data-android-app` enables first-run welcome at every viewport width. Returning users open the dashboard directly. Enter Woobi reveals the bundled dashboard in place. |
| Android `file:///android_asset/welcome/index.html` | Standalone preview replaces the current entry with `../index.html?welcome=entered`; the bundled homepage consumes the marker. |
| Android `file:///android_asset/login/index.html` | Separate login preview; browser Firebase authentication is deliberately blocked for the file origin. Its footer opens the bundled homepage. |

The `welcome=entered` parameter only controls the introduction. It is not an authentication or authorization signal. Completing Enter Woobi stores `woobi_welcome_seen=true` in localStorage for that browser origin or WebView. Normal app reloads then skip the welcome. Merely opening the welcome does not mark it complete. If storage is blocked, entry still works but the welcome can repeat. Clearing site/app storage resets onboarding. The standalone preview always remains replayable; its redirect records completion on the destination origin too.

Core app initialization runs at DOM readiness, and studio preparation starts independently of the welcome animation. A slow or unfinished welcome cannot block app boot. Preparation waits for asset loading, with a five-second escape for optional assets, and pauses rendering behind the open welcome. Enter Woobi waits for the decorative entrance and studio readiness before revealing the dashboard and resuming rendering. Reduced-motion preferences skip decorative motion; the dialog requires Enter Woobi and does not dismiss through Escape.

The welcome displays “Discover the art of being you” and a centered Enter Woobi button. The entrance reveals the welcome elements first, the button second, and the red carpet last. Its cream background, gold details, and tapered carpet are shared with the Android copy.

## Firebase and session status

Firebase Web configuration has been added in the local working environment and is intentionally ignored by Git. Reviewers must create their own `modules/core/login/firebase-config.js` from the tracked example and supply approved Web configuration. The Android bundle retains a safe null configuration stub.

The login calls Firebase email/password signup and login, Google popup sign-in, and password reset. Live provider/domain checks and complete sign-in journeys must be verified against the configured project. Adding Web configuration does not implement native Android sign-in or homepage session restoration/logout.

The homepage remains publicly accessible. Connecting signed-out routing, homepage auth-state display/restoration, logout, and trusted data authorization is remaining integration work. Native Android authentication needs its own app registration and session handoff. Never put passwords or tokens in redirect URLs.

Optional Firestore profile persistence is disabled. The schema, allowlisted profile writer, and proposed rules are included for review; rules are not deployed by this change. Review the rules alongside existing policies before enabling them.

## Source and bundled copies

Welcome source files live here; Android copies live in `android-app/app/src/main/assets/welcome/`. Keep the HTML, CSS, and JavaScript copies aligned. Login source lives in `modules/core/login/`, with its Android copy in `android-app/app/src/main/assets/login/`; retain the safe Android config when copying updates.
