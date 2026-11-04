import { AppBootstrap, appBootstrap } from './app/AppBootstrap.js';
import { NavigationRouter, navigationRouter } from './navigation/NavigationRouter.js';
import { Store, store } from './state/Store.js';
import { StreakState, streakState, createStreakState, STREAK_EVENTS } from './state/StreakState.js';
import {
  ClothingCaptureState,
  clothingCaptureState,
  createClothingCaptureState,
  CLOTHING_CATEGORIES,
  CATEGORY_LIMITS,
  TOTAL_LIMIT,
  CATEGORY_METADATA,
  CAPTURE_EVENTS
} from './state/ClothingCaptureState.js';
import { toastService } from './shared-ui/ToastService.js';
import { modalService } from './shared-ui/ModalService.js';
import { GlobalErrorHandler, globalErrorHandler } from './errors/GlobalErrorHandler.js';
import { ErrorBoundary3D } from './errors/ErrorBoundary3D.js';
import { PlatformDetector } from './platform/PlatformDetector.js';

export {
  AppBootstrap,
  appBootstrap,
  NavigationRouter,
  navigationRouter,
  Store,
  store,
  StreakState,
  streakState,
  createStreakState,
  STREAK_EVENTS,
  ClothingCaptureState,
  clothingCaptureState,
  createClothingCaptureState,
  CLOTHING_CATEGORIES,
  CATEGORY_LIMITS,
  TOTAL_LIMIT,
  CATEGORY_METADATA,
  CAPTURE_EVENTS,
  toastService,
  modalService,
  GlobalErrorHandler,
  globalErrorHandler,
  ErrorBoundary3D,
  PlatformDetector
};

export const CoreContract = {
  // App Lifecycle
  bootstrapApp: (hook) => {
    if (hook) appBootstrap.registerInitHook(hook);
    appBootstrap.start();
  },
  
  // Navigation
  navigation: {
    goToScreen: (screenId) => navigationRouter.goToScreen(screenId),
    getCurrentScreen: () => navigationRouter.getCurrentScreen(),
    toggleWardrobeSheet: (open) => modalService.toggle('modalWardrobeSheet', open)
  },
  
  // State Management
  state: {
    getStore: () => store,
    getState: () => store.getState(),
    subscribe: (listener) => store.subscribe(listener),
    setState: (partial) => store.setState(partial)
  },

  // Daily Outfit Streak & Memories Engine
  streak: streakState,

  // Clothing Capture & Silhouette Digitization Engine
  clothingCapture: clothingCaptureState,
  
  // Shared UI & Design System
  ui: {
    showToast: (message, type, duration) => toastService.show(message, type, duration),
    openModal: (modalId) => modalService.open(modalId),
    closeModal: (modalId) => modalService.close(modalId),
    toggleModal: (modalId, force) => modalService.toggle(modalId, force)
  },
  
  // Error Boundary & Recovery
  errors: {
    handleGlobalError: (error, context) => globalErrorHandler.captureError({ error, ...context }),
    create3DErrorBoundary: (canvasElement, options) => new ErrorBoundary3D(canvasElement, options)
  },
  
  // Platform & Environment
  platform: {
    isMobile: () => PlatformDetector.isMobile(),
    hasTouch: () => PlatformDetector.hasTouch(),
    hasWebGL: () => PlatformDetector.hasWebGL(),
    getAndroidPackageId: () => PlatformDetector.getAndroidPackageId(),
    isAndroidWebView: () => PlatformDetector.isAndroidWebView(),
    sendToNative: (action, payload) => PlatformDetector.sendToNative(action, payload)
  }
};

if (typeof window !== 'undefined') {
  window.WoobiCore = CoreContract;
}

export default CoreContract;

