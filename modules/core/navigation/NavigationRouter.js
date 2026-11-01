/**
 * Woobi Core Navigation - Navigation Router
 * Manages screen routing, bottom navigation tabs, and screen entry lifecycle hooks.
 */

export class NavigationRouter {
  constructor() {
    this.currentScreen = 'today';
    this.history = [];
    this.listeners = new Set();
    this.screenHooks = new Map();

    this.navMapping = {
      'today': 'today',
      'outfit-details': 'today',
      'swap-item': 'today',
      'outfit-ready': 'today',
      'preparing-outfits': 'today',
      'ai-stylist': 'today',
      'custom-builder': 'today',
      'photo-access': 'today',
      'not-enough-items': 'today',
      'outfit-feedback': 'today',
      'weekly-planning': 'today',
      'virtual-studio': 'today',

      'wardrobe': 'wardrobe',
      'review-item': 'wardrobe',
      'add-wardrobe': 'wardrobe',
      'empty-wardrobe': 'wardrobe',
      'upload-failed': 'wardrobe',
      'crop-photo': 'wardrobe',
      'edit-item': 'wardrobe',

      'saved': 'saved',
      'offline-mode': 'saved',

      'profile': 'profile',
      'wear-history': 'profile',
      'premium': 'profile',
      'manage-subscription': 'profile',
      'reminders': 'profile',
      'appearance-settings': 'profile',
      'performance-settings': 'profile',
      'account-privacy': 'profile',
      'help-support': 'profile',
      'delete-account': 'profile',
      'new-password': 'profile'
    };
  }

  registerScreenHook(screenId, callback) {
    if (!this.screenHooks.has(screenId)) {
      this.screenHooks.set(screenId, []);
    }
    this.screenHooks.get(screenId).push(callback);
  }

  onNavigate(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  goToScreen(screenId) {
    const prevScreen = this.currentScreen;
    this.currentScreen = screenId;
    this.history.push(screenId);

    if (typeof document !== 'undefined') {
      // Synchronize debug screen selector dropdown if present
      const select = document.getElementById('screenSelect');
      if (select && select.value !== screenId) {
        select.value = screenId;
      }

      // Hide all phone screens
      document.querySelectorAll('.phone-screen').forEach(el => el.classList.remove('active'));

      // Show target screen
      const target = document.getElementById(`screen-${screenId}`);
      if (target) {
        target.classList.add('active');
      }

      // Update Bottom Nav active tab indicator
      this.updateBottomNav(screenId);

      // Scroll phone screen container to top
      const container = document.getElementById('phoneScreenContainer');
      if (container) container.scrollTop = 0;
    }

    // Execute registered screen entry hooks
    const hooks = this.screenHooks.get(screenId);
    if (hooks) {
      hooks.forEach(fn => fn(screenId, prevScreen));
    }

    // Notify listeners
    this.listeners.forEach(fn => fn(screenId, prevScreen));
  }

  updateBottomNav(screenId) {
    if (typeof document === 'undefined') return;
    const targetTab = this.navMapping[screenId] || 'today';
    document.querySelectorAll('.phone-bottom-nav .nav-tab').forEach(btn => {
      const isMatch = btn.textContent.toLowerCase().includes(targetTab);
      btn.classList.toggle('active', isMatch);
    });
  }

  getCurrentScreen() {
    return this.currentScreen;
  }
}

export const navigationRouter = new NavigationRouter();

// Backward compatibility bridge
if (typeof window !== 'undefined') {
  window.NavigationRouter = NavigationRouter;
  window.navigationRouter = navigationRouter;
  if (!window.app) window.app = {};
  const origGoToScreen = window.app.goToScreen;
  window.app.goToScreen = (screenId) => {
    navigationRouter.goToScreen(screenId);
    if (typeof origGoToScreen === 'function') origGoToScreen(screenId);
  };
}

export default navigationRouter;
