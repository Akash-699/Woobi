# Woobi login design previews

## First-time checkout

Run `Copy-Item login/firebase-config.example.js login/firebase-config.js` from
the repository root before starting the preview. The example uses null config
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

Review all three: http://localhost:5050/login/index.html. Design 3: http://localhost:5050/login/model-3.html — an espresso and ivory atelier, arched form, existing linen cutout, decorative curtain reveal, reduced-motion support, and a fixed viewport layout. Validation and mode changes refit the form automatically.

Model 3 includes custom SVG embroidery vines, flowers and stitched borders. The entrance reveals the page branding, editorial copy, form and styling detail in sequence, followed by the curtains. The footer's Replay entrance button restarts it. Reduced-motion preferences skip the entrance and hide the replay control.

Preview: http://localhost:5050/login/model-1.html (start the existing server with `npm start`).

Playful wardrobe preview: http://localhost:5050/login/model-2.html. Includes floating transparent garment cutouts, pointer/touch dragging, arrow-key movement (Home resets), shuffle, pause, and reduced-motion support. The login note stays above decorations so fields remain usable. Mobile shows six of the eight pieces to avoid crowding.

Model 2 uses a fixed viewport with no page scrolling. The note fits the remaining space with a ResizeObserver; validation messages and auth-mode changes are included in the fit. Short landscape screens use a wider card with two columns. Visual viewport resize events adjust for mobile keyboard space; very small available heights can still make the scaled form small.

This standalone design has responsive layouts, login/sign-up/reset modes, client validation, password visibility, and Firebase browser authentication calls. It is a review option; the main app entry point has not been replaced. Authentication requires the configuration below. The existing homepage is still publicly accessible; this preview does not add access control to it.

## Connect Firebase for the browser preview

1. Create or select the team's Firebase project and register a Web app.
2. Copy its public Firebase configuration into `firebase-config.js`, replacing `null` with the configuration object (`apiKey`, `authDomain`, `projectId`, `appId`, and any other supplied fields).
3. In Authentication → Sign-in method, enable Google (select a support email) and Email/Password.
4. In Authentication → Settings → Authorized domains, add `localhost` for this preview and the production domain for deployment. New projects may not include localhost automatically.
5. Run through Google login, email sign-up/login, reset email, cancellation, and provider errors with the configured project before calling authentication complete.

Only client configuration belongs here. Never provide Firebase Admin SDK credentials, service account private keys, or account passwords. The JavaScript SDK loads from Google's CDN when an authentication action is used. Fonts also require internet access.

## Android integration

The current Android activity loads a separate HTML asset in a WebView. These preview files are not yet copied into that bundle. For native Android Google sign-in, register `com.example.aurawardrobe` (or the agreed final application ID) in the same Firebase project, configure the signing certificate fingerprints, and obtain the Android `google-services.json` and web OAuth client ID. Implement native authentication and a deliberate session handoff before integrating the selected design; do not load browser Google OAuth directly inside the embedded WebView. Never pass passwords or tokens in URLs.

## Review status

All three design previews are implemented. Final selection is pending project manager review. A Firebase Web configuration is connected locally, but is excluded from the review branch. Provider enablement, authorized domains and live sign-in still need verification. No Android build was run for these web previews.
