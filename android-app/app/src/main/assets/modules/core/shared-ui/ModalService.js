/**
 * Woobi Core Shared UI - Modal Service
 * Handles accessible modal dialogs and bottom wardrobe drawer sheets.
 */

class ModalService {
  open(modalId) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  close(modalId) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  toggle(modalId, forceState) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const shouldOpen = typeof forceState === 'boolean' ? forceState : modal.classList.contains('hidden');
    if (shouldOpen) {
      this.open(modalId);
    } else {
      this.close(modalId);
    }
  }
}

export const modalService = new ModalService();

if (typeof window !== 'undefined') {
  window.ModalService = ModalService;
  window.modalService = modalService;
}

export default modalService;
