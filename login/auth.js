(() => {
  const $ = id => document.getElementById(id);
  let mode = 'login', busy = false, firebasePromise;
  const config = window.WOOBI_FIREBASE_CONFIG;
  const copy = window.WOOBI_AUTH_COPY || {};
  const feedback = document.createElement('dialog');
  feedback.className = 'feedback-dialog' + (location.pathname.endsWith('model-3.html') ? ' feedback-atelier' : '');
  feedback.setAttribute('role', 'alertdialog');
  feedback.setAttribute('aria-labelledby', 'feedback-title');
  feedback.setAttribute('aria-describedby', 'feedback-description');
  feedback.innerHTML = '<button class="feedback-close" type="button" aria-label="Close message">×</button><div class="feedback-icon" aria-hidden="true">!</div><p class="feedback-eyebrow">WOOBI · YOUR WARDROBE</p><h2 id="feedback-title"></h2><p id="feedback-description"></p><button class="feedback-action" type="button" autofocus>Try again</button>';
  document.body.append(feedback);
  let returnFocus;
  let actionTrigger;
  let afterFeedback;
  const closeFeedback = () => feedback.close();
  feedback.querySelector('.feedback-close').addEventListener('click', closeFeedback);
  feedback.querySelector('.feedback-action').addEventListener('click', closeFeedback);
  feedback.addEventListener('close', () => {
    const continuation = afterFeedback;
    afterFeedback = null;
    if (continuation) { continuation(); return; }
    if (returnFocus?.isConnected && !returnFocus.disabled) returnFocus.focus({ preventScroll: true });
  });
  function showFeedback(text, success = false, target = document.activeElement, title) {
    afterFeedback = null;
    returnFocus = target;
    feedback.classList.toggle('feedback-success', success);
    feedback.querySelector('.feedback-icon').textContent = success ? '✓' : '!';
    $('feedback-title').textContent = title || (success ? 'Check your inbox.' : 'Unable to continue.');
    $('feedback-description').textContent = text;
    feedback.querySelector('.feedback-action').textContent = success ? 'Got it' : 'Try again';
    if (!feedback.open) feedback.showModal();
  }
  $('config-note').hidden = !!config;
  function message(text, success = false, title) {
    $('status').textContent = text;
    $('status').className = 'status' + (success ? ' success' : '');
    $('status').hidden = !text;
    if (text) showFeedback(text, success, actionTrigger || document.activeElement, title);
  }
  function setMode(next) {
    mode = next;
    $('form-title').textContent = mode === 'login' ? (copy.loginTitle || 'Welcome back.') : mode === 'signup' ? 'Make it yours.' : 'A fresh start.';
    $('form-intro').textContent = mode === 'login' ? (copy.loginIntro || 'Your wardrobe is waiting. Let’s make it a good day.') : mode === 'signup' ? 'A wardrobe you love. A style that feels like you.' : 'We’ll email you a link to reset your password.';
    $('password-field').hidden = mode === 'reset';
    $('forgot').hidden = mode !== 'login';
    $('social-section').hidden = mode === 'reset';
    $('password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    $('submit-label').textContent = mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link';
    $('switch-prompt').textContent = mode === 'login' ? 'New to Woobi?' : 'Already have an account?';
    $('switch-mode').textContent = mode === 'login' ? 'Create an account ↗' : 'Back to login ↗';
    ['email', 'password'].forEach(id => { $(id).removeAttribute('aria-invalid'); $(id + '-error').textContent = ''; });
    message('');
  }
  async function firebase() {
    if (!config || !config.apiKey || !config.projectId || !config.authDomain) throw { code: 'setup-pending' };
    if (location.protocol === 'file:') throw { code: 'native-required' };
    if (!firebasePromise) firebasePromise = (async () => {
      const [appSDK, authSDK] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js')
      ]);
      const app = appSDK.getApps().length ? appSDK.getApp() : appSDK.initializeApp(config);
      return { app, sdk: authSDK, auth: authSDK.getAuth(app) };
    })().catch(error => { firebasePromise = undefined; throw error; });
    return firebasePromise;
  }
  async function finishLogin(user) {
    if (window.WOOBI_USER_PROFILES_ENABLED === true) {
      let timeout;
      try {
        await Promise.race([
          (async () => {
            const { app } = await firebase();
            const { saveUserProfile } = await import('./user-profile.js');
            await saveUserProfile(app, user);
          })(),
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error('Profile save timed out.')), 8000);
          })
        ]);
      } catch {
        // Authentication succeeded. A profile-storage issue must not be
        // presented as an incorrect password or force another account signup.
        message('You’re signed in, but your profile could not be saved yet. You can continue to your wardrobe and try signing in again later.', false, 'Signed in. Profile save pending.');
        feedback.querySelector('.feedback-action').textContent = 'Continue to wardrobe';
        afterFeedback = () => location.assign('../index.html');
        return;
      } finally { clearTimeout(timeout); }
    }
    location.assign('../index.html');
  }
  function explain(error) {
    const messages = {
      'setup-pending': 'Sign-in will be available once Woobi’s Firebase project is connected. This preview does not create a session.',
      'native-required': 'Google sign-in for the Android app needs its native authentication connection.',
      'auth/invalid-credential': 'Your email or password is incorrect. Please try again.',
      'auth/wrong-password': 'Your email or password is incorrect. Please try again.',
      'auth/user-not-found': 'Your email or password is incorrect. Please try again.',
      'auth/invalid-email': 'Enter a valid email address and try again.',
      'auth/user-disabled': 'This account is unavailable. Please contact the Woobi team for help.',
      'auth/email-already-in-use': 'An account already uses this email. Try logging in.',
      'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please wait a little and try again.',
      'auth/popup-closed-by-user': 'Google sign-in was closed. You can try again when you’re ready.',
      'auth/popup-blocked': 'Allow the Google sign-in popup in your browser, then try again.',
      'auth/unauthorized-domain': 'This domain needs to be authorized in Woobi’s Firebase settings.',
      'auth/operation-not-allowed': 'This sign-in method needs to be enabled in Firebase.',
      'auth/network-request-failed': 'Check your internet connection and try again.'
    };
    const setupError = ['setup-pending', 'native-required', 'auth/unauthorized-domain',
      'auth/operation-not-allowed', 'auth/invalid-api-key', 'auth/configuration-not-found'].includes(error.code);
    const fallback = setupError ? 'Authentication needs to be configured by the Woobi team before you can sign in.'
      : !navigator.onLine ? 'Check your internet connection and try again.'
      : 'We couldn’t complete that request. Please try again.';
    message(messages[error.code] || fallback, false, setupError ? 'Sign-in isn’t ready yet.' : undefined);
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    actionTrigger = document.activeElement;
    const authButtons = document.querySelectorAll('#auth-form button, #google, #switch-mode');
    authButtons.forEach(button => button.disabled = true);
    $('auth-form').setAttribute('aria-busy', 'true');
    message('');
    try { await action(); } catch (error) { explain(error); }
    finally {
      busy = false;
      authButtons.forEach(button => button.disabled = false);
      $('auth-form').removeAttribute('aria-busy');
      actionTrigger = null;
    }
  }
  $('toggle-password').onclick = () => {
    const show = $('password').type === 'password';
    $('password').type = show ? 'text' : 'password';
    $('toggle-password').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    $('toggle-password').setAttribute('aria-pressed', String(show));
  };
  $('forgot').onclick = () => setMode('reset');
  $('switch-mode').onclick = () => setMode(mode === 'login' ? 'signup' : 'login');
  $('auth-form').onsubmit = event => {
    event.preventDefault();
    let firstInvalid;
    const email = $('email').value.trim(), password = $('password').value;
    const errors = {
      email: !email ? 'Enter your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address.' : '',
      password: mode === 'reset' ? '' : !password ? 'Enter your password.' : mode === 'signup' && password.length < 6 ? 'Use at least 6 characters.' : ''
    };
    Object.entries(errors).forEach(([id, error]) => {
      $(id + '-error').textContent = error;
      $(id).setAttribute('aria-invalid', String(!!error));
      if (error && !firstInvalid) firstInvalid = $(id);
    });
    if (firstInvalid) {
      message('');
      showFeedback(Object.values(errors).filter(Boolean).join(' '), false, firstInvalid, 'Check your details.');
      return;
    }
    run(async () => {
      const { sdk, auth } = await firebase();
      if (mode === 'reset') {
        await sdk.sendPasswordResetEmail(auth, email);
        message('If an account exists for this email, you’ll receive a password reset link.', true);
      } else {
        const result = await (mode === 'signup' ? sdk.createUserWithEmailAndPassword : sdk.signInWithEmailAndPassword)(auth, email, password);
        await finishLogin(result.user);
      }
    });
  };
  $('google').onclick = () => run(async () => {
    const { sdk, auth } = await firebase();
    const provider = new sdk.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await sdk.signInWithPopup(auth, provider);
    await finishLogin(result.user);
  });
  setMode('login');
})();
