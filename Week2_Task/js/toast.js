/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    this.container = container;
  }

  show({ type = 'success', title = 'Success', message = '', duration = 4000, action = null }) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '<i data-lucide="check-circle-2" class="w-5 h-5"></i>',
      warning: '<i data-lucide="alert-triangle" class="w-5 h-5"></i>',
      danger: '<i data-lucide="x-circle" class="w-5 h-5"></i>',
      info: '<i data-lucide="info" class="w-5 h-5"></i>'
    };

    toast.innerHTML = `
      <div class="toast-icon-wrap">${iconMap[type] || iconMap.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: toast });
    }

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    this.container.appendChild(toast);
    return { dismiss };
  }

  success(title, message, duration = 4000) {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title, message, duration = 5000) {
    return this.show({ type: 'danger', title, message, duration });
  }

  warning(title, message, duration = 4500) {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title, message, duration = 4000) {
    return this.show({ type: 'info', title, message, duration });
  }
}

export const toast = new ToastManager();
