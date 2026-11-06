# Woobi login page

## First-time checkout

Run `Copy-Item modules/core/login/firebase-config.example.js modules/core/login/firebase-config.js` from
the repository root before starting the page. The example uses null config
so UI review works without Firebase. Put your team's Web client configuration
in the local `firebase-config.js` for live testing. That file is ignored by Git
under the repository's no-API-keys policy; never force-add it. The tracked
example contains all setup comments. No npm packages are required; run `npm start`.

Optional user profile persistence is prepared but **disabled**, with no Firebase
panel changes or deployments. See [USER_PROFILES.md](USER_PROFILES.md), the
[profile schema](user-profile.schema.json), and the root `firestore.rules`.

Step-by-step manual checks, expected outcomes, live Firebase tests and handoff
limitations are in [TESTING.md](TESTING.md). Setup instructions are also included
as comments in [firebase-config.example.js](firebase-config.example.js).

Open http://localhost:8085/login/ (or use the port printed by `npm start`). The login page includes floating transparent garment cutouts, pointer/touch dragging, arrow-key movement (Home resets), shuffle, pause, and reduced-motion support. The login note stays above decorations so fields remain usable. Mobile shows six of the eight pieces to avoid crowding.

See [entry and redirect behavior](../app/welcome/README.md) for the browser, welcome preview, and Android routes, plus the remaining session integration work.

The page uses a fixed viewport with no page scrolling. The note fits the remaining space with a ResizeObserver; validation messages and auth-mode changes are included in the fit. Short landscape screens use a wider card with two columns. Visual viewport resize events adjust for mobile keyboard space; very small available heights can still make the scaled form small.

This standalone page has responsive layouts, login/sign-up/reset modes, client validation, password visibility, and Firebase browser authentication calls. The main app entry point has not been replaced. Authentication requires the configuration below. The existing homepage is still publicly accessible; this page does not add access control to it.

## Connect Firebase for the browser page

1. Create or select the team's Firebase project and register a Web app.
2. Copy its public Firebase configuration into `firebase-config.js`, replacing `null` with the configuration object (`apiKey`, `authDomain`, `projectId`, `appId`, and any other supplied fields).
3. In Authentication → Sign-in method, enable Google (select a support email) and Email/Password.
4. In Authentication → Settings → Authorized domains, add `localhost` for local testing and the production domain for deployment. New projects may not include localhost automatically.
5. Run through Google login, email sign-up/login, reset email, cancellation, and provider errors with the configured project before calling authentication complete.

Only client configuration belongs here. Never provide Firebase Admin SDK credentials, service account private keys, or account passwords. The JavaScript SDK loads from Google's CDN when an authentication action is used. Fonts also require internet access.

## Android integration

The Android activity opens the bundled homepage at `file:///android_asset/index.html`, where the app welcome waits for Enter Woobi before revealing the dashboard. The login page is available separately at `file:///android_asset/login/index.html`. Its bundled copy includes the wardrobe images and a safe configuration stub; it never packages the local `firebase-config.js`. Android sign-in is still pending. For native Android Google sign-in, register `com.example.aurawardrobe` (or the agreed final application ID) in the same Firebase project, configure signing certificate fingerprints, and obtain Android app configuration and the web OAuth client ID. Implement native authentication and a deliberate session handoff before treating the login page as an access gate. Never pass passwords or tokens in URLs.

When changing the login design, copy `index.html`, `login.css`, `login.js`, `auth.js`, `auth-feedback.css`, `user-profile.js`, and the two wardrobe atlases into `android-app/app/src/main/assets/login/`. Keep the Android `firebase-config.js` stub in that directory; do not copy the local Web config.

## Review status

The playable wardrobe design is selected. A Firebase Web configuration is connected locally, but is excluded from the review branch. Provider enablement, authorized domains and live sign-in still need verification.
