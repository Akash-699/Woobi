/**
 * Woobi Core Errors - Global Error Handler
 * Intercepts uncaught exceptions and unhandled promise rejections without crashing the UI.
 */

export class GlobalErrorHandler {
  constructor() {
    this.errorLogs = [];
    this.maxLogs = 50;
    this.listeners = new Set();
    this.lastToastTime = 0;

    this._installHandlers();
  }

  _installHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'UNCAUGHT_EXCEPTION',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: Date.now()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'UNHANDLED_REJECTION',
        message: event.reason ? (event.reason.message || String(event.reason)) : 'Promise rejected',
        error: event.reason,
        timestamp: Date.now()
      });
    });
  }

  captureError(errorInfo) {
    console.error('[Woobi GlobalError]', errorInfo);

    // Keep ring buffer
    this.errorLogs.push(errorInfo);
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }

    // Mirror to window.studioErrorLogs for backward compatibility
    if (typeof window !== 'undefined') {
      window.studioErrorLogs = window.studioErrorLogs || [];
      window.studioErrorLogs.push(`${errorInfo.message} at ${errorInfo.filename || 'unknown'}:${errorInfo.lineno || 0}`);
    }

    // Rate-limited non-intrusive notification
    const now = Date.now();
    if (now - this.lastToastTime > 5000 && typeof window !== 'undefined' && window.showToast) {
      this.lastToastTime = now;
      // Show user-friendly notice without technical stack trace
      window.showToast('Notice: An interaction error occurred. We saved your place.', 'info', 3000);
    }

    // Notify listeners
    this.listeners.forEach(fn => {
      try { fn(errorInfo); } catch (e) { /* ignore listener crashes */ }
    });
  }

  onError(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getLogs() {
    return [...this.errorLogs];
  }

  clearLogs() {
    this.errorLogs = [];
    if (typeof window !== 'undefined') {
      window.studioErrorLogs = [];
    }
  }
}

export const globalErrorHandler = new GlobalErrorHandler();

if (typeof window !== 'undefined') {
  window.GlobalErrorHandler = GlobalErrorHandler;
  window.globalErrorHandler = globalErrorHandler;
}

export default globalErrorHandler;
