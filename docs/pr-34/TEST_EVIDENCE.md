# PR 34 review evidence

Verified locally on 6 November 2026. Main baseline: `3e9a70e`.

## Automated checks

- `npm test`: 33 suites passed, zero failed; runner reports 642 verified tests.
- `npm run test:e2e`: 14 backend HTTP scenarios passed.
- `npm run validate:boundaries`: zero boundary or circular dependency violations.
- `node --check` passed for the changed app and welcome scripts, including Android copies.
- Web/Android app and welcome source parity checked; diff whitespace check passed.

## Browser lifecycle checks

Playwright used isolated mobile browser contexts. These lifecycle checks substitute a small Studio3D test double so they verify app initialization and routing independently of GPU/model downloads. They do not replace real 3D rendering or Android device acceptance.

- Core app initializes the studio exactly once with an unresolved welcome promise.
- Core app initializes the studio exactly once when the welcome script is absent.
- First-run mobile entry shows the welcome without prematurely storing completion.
- Enter Woobi records `woobi_welcome_seen=true` and opens the initialized studio.
- Returning mobile users skip the welcome after reload.
- Android-marked bundled HTML records completion and skips the welcome on reload, using an HTTP test harness rather than an Android device.
- Blocked localStorage does not prevent Enter Woobi from opening the app.
- Standalone welcome consumes the handoff marker and records completion without a duplicate introduction.
- Standalone preview remains replayable after onboarding is completed.
- Login footer opens the guest studio without requiring sign-in.

## Screenshots

Captured from the current local code at a 390 × 844 viewport. Reduced motion was enabled to capture settled layouts.

- [Welcome](welcome-mobile.png): final slogan, centered button/arrow, cream theme, red carpet, and updated spacing.
- [Login](login-mobile.png): selected playable wardrobe login and guest preview link. No credentials or personal account data are entered.

## Reviewer verification

Per the reviewer's message, the team will run Android APK/SDK builds and device testing in its own environment. Live Firebase sign-in was not exercised during these checks. The Web config remains local/ignored; the Android bundle retains its safe stub and profile persistence stays disabled.
