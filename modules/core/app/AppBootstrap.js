/**
 * Woobi Core App - App Bootstrap
 * Orchestrates application startup, module registration, and screen entry.
 */

import { navigationRouter } from '../navigation/NavigationRouter.js';
import { store } from '../state/Store.js';

export class AppBootstrap {
  constructor() {
    this.initialized = false;
    this.initHooks = [];
  }

  registerInitHook(hookFn) {
    if (this.initialized) {
      hookFn();
    } else {
      this.initHooks.push(hookFn);
    }
  }

  start() {
    if (this.initialized) return;
    this.initialized = true;

    // Run registered initialization hooks
    this.initHooks.forEach(hook => {
      try {
        hook();
      } catch (err) {
        console.error('[Woobi AppBootstrap] Init hook error:', err);
      }
    });

    // Check URL parameters for direct screen routing
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const requestedScreen = params.get('screen');
      if (requestedScreen) {
        navigationRouter.goToScreen(requestedScreen === 'virtual-studio' ? 'today' : requestedScreen);
      } else {
        navigationRouter.goToScreen('today');
      }
    }
  }
}

export const appBootstrap = new AppBootstrap();

if (typeof window !== 'undefined') {
  window.AppBootstrap = AppBootstrap;
  window.appBootstrap = appBootstrap;
}

export default appBootstrap;
