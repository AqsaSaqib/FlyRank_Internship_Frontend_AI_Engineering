/**
 * settingsForm.js — DOM controller for the Settings Form.
 *
 * Responsibilities:
 *  - Bind to form elements
 *  - Run per-field validation on blur
 *  - Run full validation on submit
 *  - Show / hide field errors and error summary
 *  - Handle success state (banner + toast)
 *  - Update avatar initials live
 *  - Show password strength meter
 *  - Persist dirty values to appState
 */

import { appState } from './state.js';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateSelect,
  evaluatePasswordStrength,
  validateSettingsForm,
  THEME_OPTIONS,
  NOTIFICATION_OPTIONS,
} from './validation.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function $(selector, root = document) {
  return root.querySelector(selector);
}

function setError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (!input || !errorEl) return;

  // Target the inner <span> to preserve the SVG icon sibling
  const textSpan = errorEl.querySelector('span');

  if (message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `${fieldId}-error`);
    if (textSpan) textSpan.textContent = message;
    errorEl.classList.add('is-visible');
    errorEl.setAttribute('role', 'alert');
  } else {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
    if (textSpan) textSpan.textContent = '';
    errorEl.classList.remove('is-visible');
    errorEl.removeAttribute('role');
  }
}

function clearError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (!input || !errorEl) return;
  const textSpan = errorEl.querySelector('span');
  input.classList.remove('is-invalid', 'is-valid');
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
  if (textSpan) textSpan.textContent = '';
  errorEl.classList.remove('is-visible');
  errorEl.removeAttribute('role');
}

function getFormData() {
  return {
    name:          (document.getElementById('field-name')?.value ?? '').trim(),
    email:         (document.getElementById('field-email')?.value ?? '').trim(),
    password:      (document.getElementById('field-password')?.value ?? ''),
    theme:         (document.getElementById('field-theme')?.value ?? '').trim(),
    notifications: (document.getElementById('field-notifications')?.value ?? '').trim(),
  };
}

// ── Success / Error Banner ─────────────────────────────────────────────────

function showSuccessBanner() {
  const banner = document.getElementById('success-banner');
  if (!banner) return;
  banner.classList.add('is-visible');
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');

  // Auto-hide after 6 s
  const timer = setTimeout(() => hideSuccessBanner(), 6000);
  banner._autoHideTimer = timer;

  // Scroll into view
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideSuccessBanner() {
  const banner = document.getElementById('success-banner');
  if (!banner) return;
  clearTimeout(banner._autoHideTimer);
  banner.classList.remove('is-visible');
}

function showErrorSummary(errors) {
  const summary = document.getElementById('error-summary');
  if (!summary) return;
  const list = summary.querySelector('.error-summary__list');
  if (!list) return;

  list.innerHTML = '';
  Object.values(errors).forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  });

  summary.classList.add('is-visible');
  summary.setAttribute('role', 'alert');
  summary.setAttribute('tabindex', '-1');
  summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  summary.focus();
}

function hideErrorSummary() {
  const summary = document.getElementById('error-summary');
  if (!summary) return;
  summary.classList.remove('is-visible');
  summary.removeAttribute('role');
}

// ── Password Strength Meter ────────────────────────────────────────────────

function updateStrengthMeter(password) {
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (!fill || !label) return;

  if (!password) {
    fill.style.width = '0%';
    fill.removeAttribute('data-strength');
    label.textContent = '';
    return;
  }

  const { score, label: strengthLabel } = evaluatePasswordStrength(password);
  fill.setAttribute('data-strength', score);
  label.textContent = `Strength: ${strengthLabel}`;
}

// ── Avatar Initials ────────────────────────────────────────────────────────

function updateAvatar(name) {
  const avatar = document.getElementById('avatar-preview');
  if (!avatar) return;
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    avatar.textContent = '?';
    return;
  }
  const parts = trimmed.split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : trimmed.substring(0, 2).toUpperCase();
  avatar.textContent = initials;
}

function updateProfilePreview(name, email) {
  const previewName = document.getElementById('preview-name');
  const previewEmail = document.getElementById('preview-email');
  if (previewName) previewName.textContent = name || 'Your Name';
  if (previewEmail) previewEmail.textContent = email || 'your@email.com';
}

// ── Password Visibility Toggle ─────────────────────────────────────────────

function initPasswordToggle() {
  const toggleBtn = document.getElementById('password-toggle');
  const passwordInput = document.getElementById('field-password');
  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    toggleBtn.innerHTML = isPassword
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
}

// ── Per-field Blur Validation ──────────────────────────────────────────────

function initFieldValidation() {
  // Name
  const nameInput = document.getElementById('field-name');
  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      const result = validateName(nameInput.value);
      setError('field-name', result.valid ? '' : result.message);
    });
    nameInput.addEventListener('input', () => {
      updateAvatar(nameInput.value);
      updateProfilePreview(nameInput.value.trim(), document.getElementById('field-email')?.value?.trim());
      appState.set('profile.name', nameInput.value.trim());
    });
  }

  // Email
  const emailInput = document.getElementById('field-email');
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const result = validateEmail(emailInput.value);
      setError('field-email', result.valid ? '' : result.message);
    });
    emailInput.addEventListener('input', () => {
      updateProfilePreview(document.getElementById('field-name')?.value?.trim(), emailInput.value.trim());
      appState.set('profile.email', emailInput.value.trim());
    });
  }

  // Password
  const passwordInput = document.getElementById('field-password');
  if (passwordInput) {
    passwordInput.addEventListener('blur', () => {
      const result = validatePassword(passwordInput.value);
      setError('field-password', result.valid ? '' : result.message);
    });
    passwordInput.addEventListener('input', () => {
      updateStrengthMeter(passwordInput.value);
    });
  }

  // Theme
  const themeSelect = document.getElementById('field-theme');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      const result = validateSelect(themeSelect.value, THEME_OPTIONS, 'Theme preference');
      setError('field-theme', result.valid ? '' : result.message);
      appState.set('preferences.theme', themeSelect.value);
    });
  }

  // Notifications
  const notifSelect = document.getElementById('field-notifications');
  if (notifSelect) {
    notifSelect.addEventListener('change', () => {
      const result = validateSelect(notifSelect.value, NOTIFICATION_OPTIONS, 'Notification preference');
      setError('field-notifications', result.valid ? '' : result.message);
      appState.set('preferences.notifications', notifSelect.value);
    });
  }
}

// ── Form Submission ────────────────────────────────────────────────────────

function initFormSubmission() {
  const form = document.getElementById('settings-form');
  const submitBtn = document.getElementById('submit-btn');
  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideSuccessBanner();
    hideErrorSummary();

    // Clear existing validation states
    ['field-name', 'field-email', 'field-password', 'field-theme', 'field-notifications']
      .forEach(id => clearError(id));

    const data = getFormData();
    const { valid, errors } = validateSettingsForm(data);

    if (!valid) {
      // Show individual field errors
      Object.entries(errors).forEach(([field, message]) => {
        const idMap = {
          name:          'field-name',
          email:         'field-email',
          password:      'field-password',
          theme:         'field-theme',
          notifications: 'field-notifications',
        };
        if (idMap[field]) setError(idMap[field], message);
      });
      showErrorSummary(errors);
      return;
    }

    // Simulate async save
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.querySelector('.btn-text').textContent = 'Saving…';

    await new Promise(resolve => setTimeout(resolve, 900));

    // Persist to state (never store password)
    appState.set('profile.name', data.name);
    appState.set('profile.email', data.email);
    appState.set('preferences.theme', data.theme);
    appState.set('preferences.notifications', data.notifications);

    // Clear password field after save
    const passwordInput = document.getElementById('field-password');
    if (passwordInput) {
      passwordInput.value = '';
      updateStrengthMeter('');
      clearError('field-password');
    }

    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
    submitBtn.querySelector('.btn-text').textContent = 'Save Settings';

    showSuccessBanner();
  });
}

// ── Hydrate Form from State ────────────────────────────────────────────────

function hydrateForm() {
  const name  = appState.get('profile.name');
  const email = appState.get('profile.email');
  const theme = appState.get('preferences.theme');
  const notif = appState.get('preferences.notifications');

  const nameInput  = document.getElementById('field-name');
  const emailInput = document.getElementById('field-email');
  const themeSelect = document.getElementById('field-theme');
  const notifSelect = document.getElementById('field-notifications');

  if (nameInput  && name)  nameInput.value  = name;
  if (emailInput && email) emailInput.value = email;
  if (themeSelect && theme) themeSelect.value = theme;
  if (notifSelect && notif) notifSelect.value = notif;

  updateAvatar(name);
  updateProfilePreview(name, email);
}

// ── Close success banner button ────────────────────────────────────────────

function initBannerClose() {
  const closeBtn = document.getElementById('success-banner-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideSuccessBanner);
  }
}

// ── Public Init ───────────────────────────────────────────────────────────

export function initSettingsForm() {
  hydrateForm();
  initFieldValidation();
  initPasswordToggle();
  initFormSubmission();
  initBannerClose();
}
