/**
 * Woobi Core Platform - Platform Detector & Bridge
 * Detects device form factors, WebGL capabilities, and interfaces with Android native host.
 */

export class PlatformDetector {
  static isMobile() {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }

  static hasTouch() {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static hasWebGL() {
    if (typeof window === 'undefined') return true;
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  static getAndroidPackageId() {
    return 'com.example.aurawardrobe'; // Preserved canonical Android package ID
  }

  static isAndroidWebView() {
    if (typeof window === 'undefined') return false;
    return !!(window.AndroidBridge || window.Android || /wv|Android.*Version\/[0-9.]+/i.test(navigator.userAgent));
  }

  static sendToNative(action, payload = {}) {
    if (this.isAndroidWebView() && window.AndroidBridge && typeof window.AndroidBridge.postMessage === 'function') {
      try {
        window.AndroidBridge.postMessage(JSON.stringify({ action, payload }));
        return true;
      } catch (e) {
        console.warn('[PlatformDetector] Failed sending to AndroidBridge:', e);
      }
    }
    return false;
  }
}

export default PlatformDetector;
