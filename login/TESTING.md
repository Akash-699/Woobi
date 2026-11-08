# Woobi login testing and handoff

Firebase Web configuration has been supplied locally but is excluded from Git.
Provider settings, authorized domains and live authentication still need verification. All three
pages use the shared Firebase calls in `auth.js`. Record each result as Pass, Fail,
or Blocked; do not mark an
authentication test Pass when it only displays the setup-pending message.

## 1. Start the local website

1. Open a terminal in the Woobi-1 repository root.
   On a fresh checkout, first run
   `Copy-Item login/firebase-config.example.js login/firebase-config.js`.
2. Run `npm start` (Node.js is required; no npm dependencies need installing).
3. Open http://localhost:5050/login/index.html.
4. If port 5050 is already in use by this project's server, use the running
   preview instead of starting a second copy.
5. Follow each preview link. Do not double-click HTML files to test Google
   authentication: use the HTTP localhost address.

## 2. Test local validation (and the unconfigured fallback)

Repeat these checks on Model 1, Model 2 and Model 3:

| Action | Expected result |
| --- | --- |
| Submit an empty login form | An accessible “Check your details” pop-up appears with a summary. Inline field errors remain visible. Close the pop-up to focus the first invalid field. |
| Enter `invalid-email` and any password, then submit | An email-format error appears. No redirect occurs. |
| Enter `tester@example.com`, leave password empty, submit | A password-required error appears. |
| Type a sample password and press the eye button twice | Text becomes visible, then masked; its value stays unchanged. |
| Select Create an account | The heading and action change to registration. |
| Register using a valid-format email and a password shorter than six characters | The password-length error appears. |
| Select Back to login | The page returns to login. |
| Select Forgot password | The email-only reset form appears; password and Google controls are hidden. |
| Submit the reset form without an email | An email-required error appears. |
| With config temporarily set to null, submit otherwise-valid login, sign-up or reset details | A clear Firebase setup-pending message appears. No account, email or session is created. Restore the configuration afterward. |
| With config temporarily set to null, select Continue with Google | The setup-pending message appears. Google login does not start without config. Restore the configuration afterward. |

Validation and authentication feedback appear in a shared modal pop-up on all
three designs. Check the close button, primary dismiss button, and Escape key.
Tab navigation should stay inside the modal while it is open, and focus should
return to the relevant field or initiating control after dismissal. Live reset
success uses the same dialog with a success icon and “Check your inbox” heading.
These pop-ups supplement the inline field errors and status messages.

Use invented sample values for these local checks. Never use a real password
to test the unconfigured preview.

## 3. Test responsive layouts and accessibility

1. Open browser developer tools and enable the responsive/device toolbar.
2. Check 320 × 568, 390 × 844, 768 × 1024, 1440 × 900, and landscape 812 × 375.
3. At each size, confirm the input fields and primary action remain visible,
   labels do not overlap, text stays readable, and there is no horizontal overflow.
4. Models 2 and 3 should fit the viewport without page scrolling. Model 1 may
   scroll on a short screen; its scrollbar is visually hidden.
5. Display validation errors and the setup-pending message, and check the layout
   again. Test login, registration and reset states.
6. On a real phone, focus each input to open the keyboard. Check that the
   focused field and submit action remain usable. Record any overly small text
   caused by fitting a very short available viewport.
7. Use Tab/Shift+Tab and Enter to navigate and submit; check visible focus and
   sensible navigation order. Confirm errors are announced with a screen reader.
8. Enable the device's reduced-motion preference and reload. Decorative
   animation should stop; forms must remain visible and usable.

## 4. Test design-specific behavior

- Model 1: the studio image and model's face should stay correctly framed;
  branding must contrast with the image.
- Model 2: drag clothing with a mouse and touch. Focus a piece and use arrow
  keys; Home resets its position. Try Shuffle and Pause/Resume. The form stays
  above the clothes. Eight pieces exist; six are shown on mobile.
- Model 3: watch the branding, embroidery, page elements and curtains reveal;
  then press Replay entrance. Decorative layers must not block fields. With
  reduced motion enabled, the entrance is skipped and replay is hidden.
- Model 3 on a wide screen: the wardrobe image crossfades through eight items
  every 4.2 seconds. Check Pause/Play and Next. Automatic cycling stops when
  the browser tab is hidden, the panel is hidden at a smaller breakpoint, or
  reduced motion is enabled. Next remains available for manual changes.
- Open the comparison page and confirm all three links lead to the right design.

## 5. Configure Firebase later

Follow the commented instructions in `firebase-config.js`. The project owner
must provide a Firebase Web app configuration, enable Google and Email/Password,
and authorize localhost. All three previews share this configuration.

No database is required for these basic authentication checks. Storing wardrobe
data later requires its own data model and server-enforced authorization rules.

## 6. Test real authentication after configuration

Use a dedicated test account. Repeat the following on all three designs:

1. **Registration:** create an email/password account. Confirm it appears in
   Firebase Console > Authentication > Users and that the homepage opens.
2. **Email login:** open a fresh private browser session and sign in using that
   account. Confirm the homepage opens after Firebase reports success.
3. **Wrong password:** try an incorrect password. Expect an error and no redirect.
4. **Duplicate email:** try registering the existing email. Expect a useful error.
5. **Password reset:** request a reset email for the test account. Check inbox
   and spam, use the Firebase-hosted reset link, choose a new password, then
   confirm the new password logs in and the old password fails.
6. **Google:** select Continue with Google, choose a test Google account, and
   confirm it appears in Firebase Authentication and the homepage opens.
7. **Cancellation:** close the Google popup. Expect cancellation feedback and
   an enabled retry button.
8. **Network failure:** use developer tools to go offline, try email login, and
   check feedback. Restore network access and confirm retry works.
9. **Consistency:** confirm the same account works through each design.

Provider responses can depend on Firebase's email-enumeration protection and
password policy. Report what you actually observe; never log passwords or tokens.

## 7. Checks pending final website integration

These are NOT implemented by the standalone login pages and must be completed
before describing the website authentication as finished:

- Read Firebase auth state on the homepage, display the signed-in user, and
  handle session restoration on refresh.
- Implement logout and confirm the session is cleared.
- Choose the approved design as the main login entry point, and define where
  signed-out users should be sent.
- Protect private data using backend verification or Firebase Security Rules.
  A client-side redirect alone does not protect data.
- Register and integrate native Android authentication separately if in scope.

The current static homepage remains publicly accessible. A successful redirect
from the preview does not establish any server-side protection of it.

## Suggested task submission note

> Three responsive login design previews are available for review. They share
> form validation and prepared Firebase authentication calls. Firebase Web app
> configuration is local and excluded from Git. Provider/domain setup and live
> Google login, email/password login, registration and reset-email tests still
> need verification. Final
> design selection, website session/logout integration and Android integration
> are pending. Setup comments and manual testing instructions are included.

Attach screenshots of each design on desktop/mobile and a small table showing
the test, environment, expected result, actual result and Pass/Fail/Blocked.
