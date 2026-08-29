/* ==========================================================================
   USER SETTINGS FORM CONTROLLER
   ========================================================================== */

import { appState } from './state.js';
import { toast } from './toast.js';
import { validateName, validateEmail, validateNotificationPreference, validateSettingsForm } from './validation.js';

/**
 * Controller to manage user settings form lifecycle, validation, accessibility, and persistence.
 * @param {Object} [options]
 * @param {HTMLFormElement} [options.formElement]
 * @param {Function} [options.onSaveSuccess]
 * @param {Function} [options.onSaveError]
 * @param {number} [options.asyncDelayMs=500]
 */
export function initSettingsForm(options = {}) {
  const form = options.formElement || document.getElementById('user-settings-form');
  if (!form) return null;

  const nameInput = document.getElementById('settings-name');
  const emailInput = document.getElementById('settings-email');
  const prefSelect = document.getElementById('settings-notification-pref');
  const submitBtn = document.getElementById('settings-save-btn');
  const alertBanner = document.getElementById('settings-form-alert');

  const nameError = document.getElementById('settings-name-error');
  const emailError = document.getElementById('settings-email-error');
  const prefError = document.getElementById('settings-pref-error');

  const asyncDelayMs = options.asyncDelayMs !== undefined ? options.asyncDelayMs : 500;
  let isSubmitting = false;

  /**
   * Updates an individual field's validation UI state.
   */
  const setFieldError = (inputEl, errorEl, errorMessage) => {
    if (!inputEl) return;
    const formGroup = inputEl.closest('.form-group');

    if (errorMessage) {
      if (formGroup) formGroup.classList.add('has-error');
      inputEl.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'flex';
        inputEl.setAttribute('aria-describedby', errorEl.id);
      }
    } else {
      if (formGroup) formGroup.classList.remove('has-error');
      inputEl.setAttribute('aria-invalid', 'false');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
    }
  };

  /**
   * Clears all validation errors from the form.
   */
  const clearAllErrors = () => {
    setFieldError(nameInput, nameError, null);
    setFieldError(emailInput, emailError, null);
    setFieldError(prefSelect, prefError, null);
    if (alertBanner) {
      alertBanner.className = 'form-status-alert';
      alertBanner.textContent = '';
      alertBanner.style.display = 'none';
    }
  };

  /**
   * Displays a form-level status alert (success, error, info).
   */
  const setStatusAlert = (type, message) => {
    if (!alertBanner) return;
    if (!message) {
      alertBanner.style.display = 'none';
      alertBanner.className = 'form-status-alert';
      alertBanner.textContent = '';
      return;
    }

    alertBanner.className = `form-status-alert alert-${type}`;
    alertBanner.textContent = message;
    alertBanner.style.display = 'flex';
  };

  /**
   * Syncs form values from current appState.
   */
  const syncFromState = () => {
    const profile = appState.get('profile') || {};

    if (nameInput) {
      const storedName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Alex Sterling';
      nameInput.value = storedName;
    }

    if (emailInput) {
      emailInput.value = profile.email || 'alex.sterling@flyrank.ai';
    }

    if (prefSelect) {
      prefSelect.value = profile.notificationPreference || 'all';
    }

    clearAllErrors();
  };

  // Real-time & blur field validation handlers
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const res = validateName(nameInput.value);
      // If valid or user is editing away from an error, update state
      if (nameInput.getAttribute('aria-invalid') === 'true') {
        setFieldError(nameInput, nameError, res.isValid ? null : res.error);
      }
      appState.set('profile.name', nameInput.value);
    });

    nameInput.addEventListener('blur', () => {
      const res = validateName(nameInput.value);
      setFieldError(nameInput, nameError, res.isValid ? null : res.error);
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (emailInput.getAttribute('aria-invalid') === 'true') {
        const res = validateEmail(emailInput.value);
        setFieldError(emailInput, emailError, res.isValid ? null : res.error);
      }
      appState.set('profile.email', emailInput.value);
    });

    emailInput.addEventListener('blur', () => {
      const res = validateEmail(emailInput.value);
      setFieldError(emailInput, emailError, res.isValid ? null : res.error);
    });
  }

  if (prefSelect) {
    prefSelect.addEventListener('change', () => {
      const res = validateNotificationPreference(prefSelect.value);
      setFieldError(prefSelect, prefError, res.isValid ? null : res.error);
      appState.set('profile.notificationPreference', prefSelect.value);
    });
  }

  /**
   * Sets loading/submitting state on the form controls and submit button.
   */
  const setLoadingState = (loading) => {
    isSubmitting = loading;
    form.setAttribute('aria-busy', loading ? 'true' : 'false');

    if (nameInput) nameInput.disabled = loading;
    if (emailInput) emailInput.disabled = loading;
    if (prefSelect) prefSelect.disabled = loading;

    if (submitBtn) {
      submitBtn.disabled = loading;
      if (loading) {
        submitBtn.innerHTML = `
          <svg class="btn-spinner spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <span>Saving...</span>
        `;
      } else {
        submitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Changes</span>
        `;
      }
    }
  };

  /**
   * Form submission handler.
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const formData = {
      name: nameInput ? nameInput.value : '',
      email: emailInput ? emailInput.value : '',
      notificationPreference: prefSelect ? prefSelect.value : ''
    };

    // 1. Validate all fields
    const validation = validateSettingsForm(formData);

    setFieldError(nameInput, nameError, validation.errors.name || null);
    setFieldError(emailInput, emailError, validation.errors.email || null);
    setFieldError(prefSelect, prefError, validation.errors.notificationPreference || null);

    if (!validation.isValid) {
      setStatusAlert('error', 'Please correct the validation errors above.');
      toast.error('Validation Failed', 'Please resolve all required field errors.');

      // Focus first invalid field for keyboard & screen reader accessibility
      if (validation.errors.name && nameInput) {
        nameInput.focus();
      } else if (validation.errors.email && emailInput) {
        emailInput.focus();
      } else if (validation.errors.notificationPreference && prefSelect) {
        prefSelect.focus();
      }
      return false;
    }

    // 2. Begin submission loading state
    setLoadingState(true);
    setStatusAlert('info', 'Saving your settings...');

    try {
      // Realistic async persist delay
      if (asyncDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, asyncDelayMs));
      }

      // Persist fields into appState
      const trimmedName = formData.name.trim();
      const parts = trimmedName.split(/\s+/);
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';

      appState.set('profile.name', trimmedName);
      appState.set('profile.firstName', fName);
      appState.set('profile.lastName', lName);
      appState.set('profile.email', formData.email.trim());
      appState.set('profile.notificationPreference', formData.notificationPreference);

      const saved = appState.saveToStorage();

      if (!saved) {
        throw new Error('Failed to write settings to local storage.');
      }

      // 3. Success state
      setLoadingState(false);
      setStatusAlert('success', '✓ User settings saved successfully.');
      toast.success('Settings Saved', 'Your user preferences have been updated.');

      if (submitBtn) {
        submitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Saved!</span>
        `;
        setTimeout(() => {
          if (!isSubmitting && submitBtn) {
            submitBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>Save Changes</span>
            `;
          }
        }, 2000);
      }

      if (typeof options.onSaveSuccess === 'function') {
        options.onSaveSuccess(formData);
      }

      return true;
    } catch (err) {
      setLoadingState(false);
      setStatusAlert('error', `Error saving settings: ${err.message || 'Unknown error'}`);
      toast.error('Save Failed', err.message || 'Could not save settings.');

      if (typeof options.onSaveError === 'function') {
        options.onSaveError(err);
      }

      return false;
    }
  };

  form.addEventListener('submit', handleSubmit);

  // Initial Sync from State Store
  syncFromState();
  const unsubscribe = appState.subscribe((state, path) => {
    if (path.startsWith('profile') || path === '') {
      syncFromState();
    }
  });

  return {
    form,
    syncFromState,
    handleSubmit,
    setFieldError,
    clearAllErrors,
    destroy: () => {
      form.removeEventListener('submit', handleSubmit);
      unsubscribe();
    }
  };
}
