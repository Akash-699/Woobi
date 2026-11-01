/**
 * Woobi Core Shared UI - Toast Service
 * Provides non-blocking, luxury editorial toast notifications.
 */

class ToastService {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (typeof document === 'undefined') return;
    this.container = document.getElementById('woobiToastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'woobiToastContainer';
      this.container.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', durationMs = 3000) {
    if (typeof document === 'undefined') {
      console.log(`[Toast ${type}]: ${message}`);
      return;
    }
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `woobi-toast woobi-toast-${type}`;
    toast.style.cssText = `
      background: rgba(29, 32, 28, 0.94);
      color: #FAF9F6;
      font-family: var(--font-sans, -apple-system, sans-serif);
      font-size: 13px;
      font-weight: 500;
      padding: 10px 18px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
      backdrop-filter: blur(8px);
      letter-spacing: 0.01em;
      opacity: 0;
      transform: translateY(12px) scale(0.96);
      transition: all 0.26s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      max-width: 90vw;
      text-align: center;
    `;
    toast.textContent = message;

    this.container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    });

    // Auto dismiss
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px) scale(0.96)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, durationMs);
  }

  success(msg, dur) { this.show(msg, 'success', dur); }
  error(msg, dur) { this.show(msg, 'error', dur); }
  info(msg, dur) { this.show(msg, 'info', dur); }
}

export const toastService = new ToastService();

// Backward compatibility bridge for global window access
if (typeof window !== 'undefined') {
  window.ToastService = ToastService;
  window.showToast = (msg, type, dur) => toastService.show(msg, type, dur);
}

export default toastService;
