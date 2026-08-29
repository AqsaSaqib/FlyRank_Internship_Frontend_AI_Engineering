/* ==========================================================================
   MODAL CONTROLLER ENGINE
   ========================================================================== */

class ModalController {
  constructor() {
    this.activeModal = null;
    this.initGlobalEvents();
  }

  initGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close(this.activeModal);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.close(e.target);
      }
    });
  }

  open(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!modal) return;

    modal.classList.add('show');
    this.activeModal = modal;
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      window.lucide.createIcons({ root: modal });
    }

    const firstInput = modal.querySelector('input:not([type="hidden"]), button:not([data-close-modal])');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  close(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!modal) return;

    modal.classList.remove('show');
    if (this.activeModal === modal) {
      this.activeModal = null;
    }
    document.body.style.overflow = '';
  }
}

export const modal = new ModalController();
