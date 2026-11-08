/**
 * WOOBI FIREBASE SETUP — Copy this file to firebase-config.js and supply Web configuration locally.
 * Provider enablement, authorized domains and live sign-in still need checking.
 *
 * Leave this value null while reviewing the three UI designs. Form validation,
 * password visibility, auth-screen switching and design interactions work
 * locally. Login, registration and reset emails require a Firebase project.
 * The "Firebase setup pending" message is expected until then; it is not a
 * successful login and does not create a session.
 *
 * SETUP WHEN THE TEAM PROVIDES A PROJECT:
 * 1. Open https://console.firebase.google.com/ and select the team's project.
 * 2. Project overview > Add app > Web (</>) > register "Woobi Web".
 * 3. Project settings > General > Your apps > Web app > SDK setup > Config.
 *    Copy the exact Web configuration object supplied by Firebase.
 * 4. Authentication > Sign-in method: enable Google, choose the support email,
 *    and save. Also enable Email/Password for email login and registration.
 * 5. Authentication > Settings > Authorized domains: add localhost for the
 *    local preview and the actual website domain when deploying. Enter only
 *    the hostname, with no protocol, port or path.
 * 6. Replace null below with that configuration object, for example:
 *
 *    window.WOOBI_FIREBASE_CONFIG = {
 *      apiKey: "COPY_FROM_FIREBASE",
 *      authDomain: "COPY_FROM_FIREBASE",
 *      projectId: "COPY_FROM_FIREBASE",
 *      storageBucket: "COPY_FROM_FIREBASE",
 *      messagingSenderId: "COPY_FROM_FIREBASE",
 *      appId: "COPY_FROM_FIREBASE"
 *    };
 *
 * 7. Start the site with npm start, then open http://localhost:5050/login/.
 *    All three designs load this shared file; only configure it once.
 * 8. Follow TESTING.md for local UI checks and live authentication checks.
 *
 * Do not put Admin SDK credentials, service account keys, private keys, OAuth
 * client secrets, or account passwords here. Only Web client config belongs
 * in this browser-loaded file. Follow the team's policy for committing config.
 *
 * A separate test Firebase project may be used if the team permits it. Label
 * it as a test project and replace its config with the team's before release.
 * Android uses a separate app registration and native Google sign-in setup;
 * this Web configuration alone does not implement Android authentication.
 * Homepage session handling, logout and data authorization still need final
 * integration; the existing static homepage is publicly accessible.
 *
 * Official docs:
 * https://firebase.google.com/docs/web/setup
 * https://firebase.google.com/docs/auth/web/google-signin
 */
window.WOOBI_FIREBASE_CONFIG = null;

// Code-only handoff: keep false until the team provisions Firestore, reviews
// and deploys firestore.rules, and verifies the profile flow. No panel changes
// or database writes are performed by adding this disabled feature.
window.WOOBI_USER_PROFILES_ENABLED = false;
