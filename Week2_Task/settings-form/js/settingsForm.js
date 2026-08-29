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
  const form = options.formElement || (typeof document !== 'undefined' ? document.getElementById('user-settings-form') : null);
  if (!form) return null;

  const nameInput = document.getElementById('settings-name');
  const emailInput = document.getElementById('settings-email');
  const prefSelect = document.getElementById('settings-notification-pref');
  const jobTitleInput = document.getElementById('profile-job-title');
  const timezoneSelect = document.getElementById('profile-timezone');
  const bioInput = document.getElementById('profile-bio');

  const submitBtn = document.getElementById('settings-save-btn');
  const resetBtn = document.getElementById('settings-reset-btn');
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

    if (nameInput) nameInput.value = profile.name || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (prefSelect) prefSelect.value = profile.notificationPreference || 'realtime';
    if (jobTitleInput) jobTitleInput.value = profile.jobTitle || '';
    if (timezoneSelect) timezoneSelect.value = profile.timezone || 'UTC-08:00';
    if (bioInput) bioInput.value = profile.bio || '';

    clearAllErrors();
  };

  // Real-time validation listeners on blur
  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      const res = validateName(nameInput.value);
      setFieldError(nameInput, nameError, res.isValid ? null : res.error);
    });
    nameInput.addEventListener('input', () => {
      if (nameInput.getAttribute('aria-invalid') === 'true') {
        const res = validateName(nameInput.value);
        setFieldError(nameInput, nameError, res.isValid ? null : res.error);
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const res = validateEmail(emailInput.value);
      setFieldError(emailInput, emailError, res.isValid ? null : res.error);
    });
    emailInput.addEventListener('input', () => {
      if (emailInput.getAttribute('aria-invalid') === 'true') {
        const res = validateEmail(emailInput.value);
        setFieldError(emailInput, emailError, res.isValid ? null : res.error);
      }
    });
  }

  if (prefSelect) {
    prefSelect.addEventListener('change', () => {
      const res = validateNotificationPreference(prefSelect.value);
      setFieldError(prefSelect, prefError, res.isValid ? null : res.error);
    });
  }

  // Handle Reset to stored state
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      syncFromState();
      toast.info('Form Reset', 'Restored unsaved profile values.');
    });
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = {
      name: nameInput ? nameInput.value : '',
      email: emailInput ? emailInput.value : '',
      notificationPreference: prefSelect ? prefSelect.value : '',
      jobTitle: jobTitleInput ? jobTitleInput.value.trim() : '',
      timezone: timezoneSelect ? timezoneSelect.value : 'UTC-08:00',
      bio: bioInput ? bioInput.value.trim() : ''
    };

    // Run Full Form Validation
    const validation = validateSettingsForm(formData);

    if (!validation.isValid) {
      setFieldError(nameInput, nameError, validation.errors.name || null);
      setFieldError(emailInput, emailError, validation.errors.email || null);
      setFieldError(prefSelect, prefError, validation.errors.notificationPreference || null);

      // Focus first failing field
      if (validation.errors.name && nameInput) nameInput.focus();
      else if (validation.errors.email && emailInput) emailInput.focus();
      else if (validation.errors.notificationPreference && prefSelect) prefSelect.focus();

      setStatusAlert('error', 'Please correct the highlighted form errors before saving.');
      toast.error('Validation Failed', 'Please review required fields.');

      if (options.onSaveError) {
        options.onSaveError(validation.errors);
      }
      return;
    }

    // Begin Submission UI State
    isSubmitting = true;
    clearAllErrors();

    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Save Settings';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="spinner"></div> Saving...`;
    }

    try {
      // Simulate network / async persistence delay
      if (asyncDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, asyncDelayMs));
      }

      // Persist to central reactive state
      appState.set('profile', {
        ...appState.get('profile'),
        ...formData
      }, true);

      setStatusAlert('success', 'Profile and user settings saved successfully.');
      toast.success('Settings Saved', 'Your preferences have been synchronized.');

      if (options.onSaveSuccess) {
        options.onSaveSuccess(formData);
      }
    } catch (err) {
      console.error('Settings save error:', err);
      setStatusAlert('error', 'An unexpected error occurred while saving your settings.');
      toast.error('Save Error', 'Failed to synchronize preferences.');

      if (options.onSaveError) {
        options.onSaveError(err);
      }
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  });

  // Initial Sync from State
  syncFromState();

  // Listen to external state changes
  const unsubscribe = appState.subscribe((state, path) => {
    if (path.startsWith('profile') || path === '') {
      syncFromState();
    }
  });

  return {
    syncFromState,
    clearAllErrors,
    validate: () => validateSettingsForm({
      name: nameInput ? nameInput.value : '',
      email: emailInput ? emailInput.value : '',
      notificationPreference: prefSelect ? prefSelect.value : ''
    }),
    destroy: () => unsubscribe()
  };
}
