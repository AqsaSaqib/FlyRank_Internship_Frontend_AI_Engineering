/* ==========================================================================
   ACCESSIBLE MODAL CONTROLLER
   ========================================================================== */

class ModalController {
  constructor() {
    this.activeModal = null;
    this.previousActiveElement = null;
    if (typeof document !== 'undefined') {
      this.init();
    }
  }

  init() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal.id);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.close(e.target.id);
      }
      if (e.target.closest('[data-modal-close]')) {
        const modalEl = e.target.closest('.modal-overlay');
        if (modalEl) this.close(modalEl.id);
      }
    });
  }

  open(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;

    this.previousActiveElement = document.activeElement;
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    this.activeModal = modalEl;

    // Focus first actionable element inside modal
    const focusable = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }
  }

  close(modalId) {
    const id = modalId || (this.activeModal ? this.activeModal.id : null);
    if (!id) return;
    const modalEl = document.getElementById(id);
    if (!modalEl) return;

    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
    this.activeModal = null;

    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
    }
  }
}

export const modal = new ModalController();
