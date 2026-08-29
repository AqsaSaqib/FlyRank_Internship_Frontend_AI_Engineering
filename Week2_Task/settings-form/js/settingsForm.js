/**
 * settingsForm.js — DOM controller for the modern FlyRank Settings Dashboard.
 *
 * Handles:
 *  - Left sidebar navigation & responsive mobile drawer
 *  - Live avatar and profile preview synchronization
 *  - Real-time field validation & password strength evaluation
 *  - Form submissions for all 7 settings sections
 *  - 2FA state management & session termination
 *  - Interactive theme switching (Light / Dark / System)
 *  - Toast alerts, feedback banners, and accessible dialogs
 */

import { appState } from './state.js';
import {
  validateName,
  validateEmail,
  validateUsername,
  validatePasswordChange,
  validateSelect,
  evaluatePasswordStrength,
  validateProfileSection,
  validateAccountSection,
  validatePrivacySection,
  validatePreferencesSection,
  THEME_OPTIONS,
  NOTIFICATION_OPTIONS,
  VISIBILITY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
} from './validation.js';

// ── Toast Utility ──────────────────────────────────────────────────────────

export function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const icons = {
    success: `<svg class="text-success" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg class="text-danger" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    info: `<svg class="text-info" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span class="toast__body">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger reflow then animate in
  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ── Banner & Field Validation Helpers ──────────────────────────────────────

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (!input) return;

  if (message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      const span = errorEl.querySelector('span');
      if (span) span.textContent = message;
      errorEl.classList.add('is-visible');
      errorEl.setAttribute('role', 'alert');
    }
  } else {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.setAttribute('aria-invalid', 'false');
    if (errorEl) {
      const span = errorEl.querySelector('span');
      if (span) span.textContent = '';
      errorEl.classList.remove('is-visible');
      errorEl.removeAttribute('role');
    }
  }
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (!input) return;

  input.classList.remove('is-invalid', 'is-valid');
  input.removeAttribute('aria-invalid');
  if (errorEl) {
    const span = errorEl.querySelector('span');
    if (span) span.textContent = '';
    errorEl.classList.remove('is-visible');
    errorEl.removeAttribute('role');
  }
}

function showSuccessBanner(title = 'Settings saved successfully!', message = 'Your updates have been securely synchronized and persisted.') {
  const banner = document.getElementById('success-banner');
  if (!banner) return;

  const titleEl = document.getElementById('success-banner-title');
  const descEl = document.getElementById('success-banner-desc');
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = message;

  banner.classList.add('is-visible');
  hideErrorSummary();

  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => hideSuccessBanner(), 6000);
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideSuccessBanner() {
  const banner = document.getElementById('success-banner');
  if (!banner) return;
  clearTimeout(banner._timer);
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
  hideSuccessBanner();
  summary.focus();
  summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideErrorSummary() {
  const summary = document.getElementById('error-summary');
  if (!summary) return;
  summary.classList.remove('is-visible');
}

// ── Avatar & Profile Initials Sync ─────────────────────────────────────────

function updateAvatarInitials(name) {
  const trimmed = (name ?? '').trim();
  let initials = 'JD';
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : trimmed.substring(0, 2).toUpperCase();
  }

  ['avatar-preview', 'sidebar-avatar', 'header-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });
}

function updateProfilePreview(name, email, title) {
  const nameEl = document.getElementById('preview-name');
  const emailEl = document.getElementById('preview-email');
  const titleEl = document.getElementById('preview-title');
  const sidebarNameEl = document.getElementById('sidebar-user-name');
  const sidebarEmailEl = document.getElementById('sidebar-user-email');
  const headerNameEl = document.getElementById('header-user-name');

  if (nameEl) nameEl.textContent = name || 'Jane Doe';
  if (emailEl) emailEl.textContent = email || 'jane.doe@flyrank.io';
  if (titleEl) titleEl.textContent = title || 'Senior Frontend Engineer';
  if (sidebarNameEl) sidebarNameEl.textContent = name || 'Jane Doe';
  if (sidebarEmailEl) sidebarEmailEl.textContent = email || 'jane.doe@flyrank.io';
  if (headerNameEl) headerNameEl.textContent = name || 'Jane Doe';
}

// ── Navigation & Section Switching ─────────────────────────────────────────

export function switchSection(sectionId) {
  const targetTab = document.getElementById(`tab-${sectionId}`);
  const targetSection = document.getElementById(`section-${sectionId}`);
  if (!targetTab || !targetSection) return;

  // Deactivate all tabs & hide all sections
  document.querySelectorAll('.sidebar-nav__item').forEach(tab => {
    tab.classList.remove('is-active');
    tab.setAttribute('aria-selected', 'false');
  });

  document.querySelectorAll('.settings-section').forEach(sec => {
    sec.classList.remove('is-active');
    sec.hidden = true;
  });

  // Activate target
  targetTab.classList.add('is-active');
  targetTab.setAttribute('aria-selected', 'true');
  targetSection.hidden = false;
  targetSection.classList.add('is-active');

  // Update hash without jumping
  if (window.location.hash !== `#${sectionId}`) {
    history.replaceState(null, '', `#${sectionId}`);
  }

  // Close mobile sidebar if open
  closeMobileSidebar();

  // Scroll to top of main content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initSidebarNavigation() {
  const tabs = Array.from(document.querySelectorAll('.sidebar-nav__item'));

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const section = tab.getAttribute('data-section');
      if (section) switchSection(section);
    });

    // Keyboard navigation (Up/Down/Home/End)
    tab.addEventListener('keydown', (e) => {
      let newIndex = index;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = tabs.length - 1;
      } else {
        return;
      }
      tabs[newIndex].focus();
      const section = tabs[newIndex].getAttribute('data-section');
      if (section) switchSection(section);
    });
  });

  // Handle URL hash on initial load
  const hash = window.location.hash.replace('#', '');
  const validSections = ['profile', 'account', 'security', 'notifications', 'appearance', 'privacy', 'preferences'];
  if (hash && validSections.includes(hash)) {
    switchSection(hash);
  } else {
    const defaultStart = appState.get('preferences.startPage') || 'profile';
    switchSection(defaultStart);
  }
}

// ── Mobile Drawer Navigation ───────────────────────────────────────────────

function openMobileSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (sidebar) sidebar.classList.add('is-open');
  if (backdrop) backdrop.classList.add('is-visible');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('sidebar-toggle');

  if (sidebar) sidebar.classList.remove('is-open');
  if (backdrop) backdrop.classList.remove('is-visible');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

function initMobileDrawer() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const closeBtn = document.getElementById('sidebar-close');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMobileSidebar();
      else openMobileSidebar();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
  if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileSidebar();
    }
  });
}

// ── Theme Management ───────────────────────────────────────────────────────

export function applyTheme(theme) {
  const html = document.documentElement;
  html.setAttribute('data-theme', theme);

  // Sync radio buttons in Appearance section
  const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
  if (radio) radio.checked = true;

  // Update theme cards visual selected state
  document.querySelectorAll('.theme-card').forEach(card => {
    const cardRadio = card.querySelector('input[name="theme"]');
    if (cardRadio && cardRadio.value === theme) {
      card.classList.add('is-selected');
    } else {
      card.classList.remove('is-selected');
    }
  });

  appState.set('appearance.theme', theme);
}

function initThemeControls() {
  const initialTheme = appState.get('appearance.theme') || 'system';
  applyTheme(initialTheme);

  // Header quick theme toggle
  const headerToggle = document.getElementById('header-theme-toggle');
  if (headerToggle) {
    headerToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'system';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`Theme switched to ${next} mode`, 'info');
    });
  }

  // Theme cards radio listener
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        applyTheme(e.target.value);
      }
    });
  });

  // Listen for system theme changes if theme is set to 'system'
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const current = appState.get('appearance.theme');
      if (current === 'system') {
        applyTheme('system');
      }
    });
  }
}

// ── Password Visibility & Strength ─────────────────────────────────────────

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
      btn.innerHTML = isPass
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  });

  const newPassInput = document.getElementById('field-new-password');
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');

  if (newPassInput && fill && label) {
    newPassInput.addEventListener('input', () => {
      const val = newPassInput.value;
      if (!val) {
        fill.style.width = '0%';
        fill.removeAttribute('data-strength');
        label.textContent = '';
        return;
      }
      const { score, label: strengthLabel } = evaluatePasswordStrength(val);
      fill.setAttribute('data-strength', score);
      label.textContent = `Strength: ${strengthLabel}`;
    });
  }
}

// ── Active Sessions & 2FA Rendering ────────────────────────────────────────

function renderActiveSessions() {
  const container = document.getElementById('sessions-list');
  if (!container) return;

  const sessions = appState.get('security.sessions') || [];
  container.innerHTML = '';

  sessions.forEach(sess => {
    const li = document.createElement('li');
    li.className = 'session-item';
    li.innerHTML = `
      <div class="session-item__left">
        <div class="session-item__icon" aria-hidden="true">
          ${sess.device.toLowerCase().includes('mobile') || sess.device.toLowerCase().includes('ios')
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
          }
        </div>
        <div>
          <p class="session-item__device">
            ${sess.device}
            ${sess.current ? '<span class="badge badge--success badge--sm">Current Device</span>' : ''}
          </p>
          <p class="session-item__meta">${sess.location} • IP: ${sess.ip} • ${sess.lastActive}</p>
        </div>
      </div>
      ${!sess.current ? `<span class="badge badge--neutral badge--sm">Signed in</span>` : ''}
    `;
    container.appendChild(li);
  });
}

function update2FAUI(enabled) {
  const switch2FA = document.getElementById('switch-2fa');
  const details = document.getElementById('twofactor-details');
  const sidebarBadge = document.getElementById('sidebar-2fa-badge');
  const statusBadge = document.getElementById('twofactor-status-badge');

  if (switch2FA) {
    switch2FA.checked = enabled;
    switch2FA.setAttribute('aria-checked', String(enabled));
  }

  if (details) details.hidden = !enabled;

  if (sidebarBadge) {
    sidebarBadge.textContent = enabled ? '2FA On' : '2FA Off';
    sidebarBadge.className = `badge badge--sm ${enabled ? 'badge--success' : 'badge--neutral'}`;
  }

  if (statusBadge) {
    statusBadge.textContent = enabled ? 'Enabled' : 'Disabled';
    statusBadge.className = `badge ${enabled ? 'badge--success' : 'badge--neutral'}`;
  }
}

function initSecurityActions() {
  renderActiveSessions();

  const is2FA = appState.get('security.twoFactorEnabled') || false;
  update2FAUI(is2FA);

  // Terminate other sessions
  const logoutBtn = document.getElementById('btn-logout-other-sessions');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      appState.terminateOtherSessions();
      renderActiveSessions();
      showToast('All other browser sessions terminated successfully.', 'success');
    });
  }

  // 2FA Switch & Modal
  const switch2FA = document.getElementById('switch-2fa');
  const modal2FA = document.getElementById('modal-2fa');
  const close2FABtn = document.getElementById('modal-2fa-close');
  const cancel2FABtn = document.getElementById('btn-cancel-2fa');
  const confirm2FABtn = document.getElementById('btn-confirm-2fa');
  const codeInput = document.getElementById('field-2fa-code');

  if (switch2FA) {
    switch2FA.addEventListener('change', () => {
      if (switch2FA.checked) {
        if (modal2FA && typeof modal2FA.showModal === 'function') {
          modal2FA.showModal();
          if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
          }
        }
      } else {
        appState.toggleTwoFactor(false);
        update2FAUI(false);
        showToast('Two-Factor Authentication has been disabled.', 'info');
      }
    });
  }

  const closeModal = () => {
    if (modal2FA && typeof modal2FA.close === 'function') {
      modal2FA.close();
    }
    // Revert switch if closed without confirming
    const currentStatus = appState.get('security.twoFactorEnabled') || false;
    update2FAUI(currentStatus);
  };

  if (close2FABtn) close2FABtn.addEventListener('click', closeModal);
  if (cancel2FABtn) cancel2FABtn.addEventListener('click', closeModal);

  if (confirm2FABtn) {
    confirm2FABtn.addEventListener('click', () => {
      const code = (codeInput?.value || '').trim();
      if (code.length < 6) {
        showToast('Please enter a 6-digit confirmation code.', 'error');
        return;
      }
      appState.toggleTwoFactor(true);
      update2FAUI(true);
      if (modal2FA && typeof modal2FA.close === 'function') modal2FA.close();
      showToast('Two-Factor Authentication is now active!', 'success');
      showSuccessBanner('2FA Activated', 'Your account is now secured with authenticator-based verification.');
    });
  }

  // Danger zone deactivate modal
  const deactBtn = document.getElementById('btn-deactivate-account');
  const modalDeact = document.getElementById('modal-deactivate');
  const closeDeactBtn = document.getElementById('modal-deactivate-close');
  const cancelDeactBtn = document.getElementById('btn-cancel-deactivate');
  const confirmDeactBtn = document.getElementById('btn-confirm-deactivate');

  if (deactBtn && modalDeact) {
    deactBtn.addEventListener('click', () => modalDeact.showModal());
    closeDeactBtn?.addEventListener('click', () => modalDeact.close());
    cancelDeactBtn?.addEventListener('click', () => modalDeact.close());
    confirmDeactBtn?.addEventListener('click', () => {
      modalDeact.close();
      showToast('Deactivation request simulated. Your account remains intact in demo mode.', 'info');
    });
  }
}

// ── Section Forms Submission & Validation ──────────────────────────────────

function simulateButtonLoading(btn, initialText = 'Save', loadingText = 'Saving…') {
  btn.disabled = true;
  btn.classList.add('is-loading');
  const textSpan = btn.querySelector('.btn-text');
  if (textSpan) textSpan.textContent = loadingText;

  return () => {
    btn.disabled = false;
    btn.classList.remove('is-loading');
    if (textSpan) textSpan.textContent = initialText;
  };
}

function initProfileForm() {
  const form = document.getElementById('form-profile');
  const nameInput = document.getElementById('field-name');
  const emailInput = document.getElementById('field-email');
  const titleInput = document.getElementById('field-title');
  const bioInput = document.getElementById('field-bio');
  const submitBtn = document.getElementById('btn-save-profile');

  if (!form) return;

  // Live input sync
  nameInput?.addEventListener('input', () => {
    updateAvatarInitials(nameInput.value);
    updateProfilePreview(nameInput.value, emailInput?.value, titleInput?.value);
  });
  emailInput?.addEventListener('input', () => {
    updateProfilePreview(nameInput?.value, emailInput.value, titleInput?.value);
  });
  titleInput?.addEventListener('input', () => {
    updateProfilePreview(nameInput?.value, emailInput?.value, titleInput.value);
  });

  // Blur validation
  nameInput?.addEventListener('blur', () => {
    const res = validateName(nameInput.value);
    setFieldError('field-name', res.valid ? '' : res.message);
  });
  emailInput?.addEventListener('blur', () => {
    const res = validateEmail(emailInput.value);
    setFieldError('field-email', res.valid ? '' : res.message);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorSummary();

    const data = {
      name: (nameInput?.value || '').trim(),
      email: (emailInput?.value || '').trim(),
      title: (titleInput?.value || '').trim(),
      bio: (bioInput?.value || '').trim(),
    };

    const { valid, errors } = validateProfileSection(data);
    if (!valid) {
      if (errors.name) setFieldError('field-name', errors.name);
      if (errors.email) setFieldError('field-email', errors.email);
      showErrorSummary(errors);
      return;
    }

    const resetBtn = simulateButtonLoading(submitBtn, 'Save Profile');
    await new Promise(r => setTimeout(r, 600));

    appState.set('profile.name', data.name);
    appState.set('profile.email', data.email);
    appState.set('profile.title', data.title);
    appState.set('profile.bio', data.bio);

    resetBtn();
    clearFieldError('field-name');
    clearFieldError('field-email');
    showSuccessBanner('Profile Saved', 'Your public persona and display information have been updated.');
    showToast('Profile information updated.', 'success');
  });
}

function initAccountForm() {
  const form = document.getElementById('form-account');
  const userInput = document.getElementById('field-username');
  const langSelect = document.getElementById('field-account-language');
  const tzSelect = document.getElementById('field-account-timezone');
  const submitBtn = document.getElementById('btn-save-account');

  if (!form) return;

  userInput?.addEventListener('blur', () => {
    const res = validateUsername(userInput.value);
    setFieldError('field-username', res.valid ? '' : res.message);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorSummary();

    const data = {
      username: (userInput?.value || '').trim(),
      language: langSelect?.value || 'en',
      timezone: tzSelect?.value || 'UTC',
    };

    const { valid, errors } = validateAccountSection(data);
    if (!valid) {
      if (errors.username) setFieldError('field-username', errors.username);
      if (errors.language) setFieldError('field-account-language', errors.language);
      if (errors.timezone) setFieldError('field-account-timezone', errors.timezone);
      showErrorSummary(errors);
      return;
    }

    const resetBtn = simulateButtonLoading(submitBtn, 'Save Account');
    await new Promise(r => setTimeout(r, 600));

    appState.set('account.username', data.username);
    appState.set('account.language', data.language);
    appState.set('account.timezone', data.timezone);

    resetBtn();
    clearFieldError('field-username');
    showSuccessBanner('Account Updated', 'Your username handle and localized region preferences were saved.');
    showToast('Account details saved.', 'success');
  });
}

function initSecurityForm() {
  const form = document.getElementById('form-security-password');
  const currPass = document.getElementById('field-current-password');
  const newPass = document.getElementById('field-new-password');
  const confPass = document.getElementById('field-confirm-password');
  const submitBtn = document.getElementById('btn-update-password');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorSummary();

    const { valid, errors } = validatePasswordChange(
      currPass?.value,
      newPass?.value,
      confPass?.value
    );

    if (!valid) {
      if (errors.currentPassword) setFieldError('field-current-password', errors.currentPassword);
      if (errors.newPassword)     setFieldError('field-new-password', errors.newPassword);
      if (errors.confirmPassword) setFieldError('field-confirm-password', errors.confirmPassword);
      showErrorSummary(errors);
      return;
    }

    const resetBtn = simulateButtonLoading(submitBtn, 'Update Password', 'Updating…');
    await new Promise(r => setTimeout(r, 800));

    // Clear password fields
    if (currPass) currPass.value = '';
    if (newPass)  newPass.value = '';
    if (confPass) confPass.value = '';

    const fill = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    if (fill) fill.style.width = '0%';
    if (label) label.textContent = '';

    clearFieldError('field-current-password');
    clearFieldError('field-new-password');
    clearFieldError('field-confirm-password');

    resetBtn();
    showSuccessBanner('Password Updated', 'Your security password has been changed successfully.');
    showToast('Password updated securely.', 'success');
  });
}

function initNotificationsForm() {
  const form = document.getElementById('form-notifications');
  const freqSelect = document.getElementById('field-notifications-freq');
  const secSwitch = document.getElementById('switch-notif-security');
  const prodSwitch = document.getElementById('switch-notif-product');
  const digSwitch = document.getElementById('switch-notif-digest');
  const mentSwitch = document.getElementById('switch-notif-mentions');
  const pushSwitch = document.getElementById('switch-notif-push');
  const soundSwitch = document.getElementById('switch-notif-sound');
  const submitBtn = document.getElementById('btn-save-notifications');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorSummary();

    const freqRes = validateSelect(freqSelect?.value, NOTIFICATION_OPTIONS, 'Notification frequency');
    if (!freqRes.valid) {
      setFieldError('field-notifications-freq', freqRes.message);
      showErrorSummary({ frequency: freqRes.message });
      return;
    }

    const resetBtn = simulateButtonLoading(submitBtn, 'Save Notifications');
    await new Promise(r => setTimeout(r, 600));

    appState.set('notifications.frequency', freqSelect.value);
    appState.set('notifications.securityAlerts', secSwitch?.checked ?? true);
    appState.set('notifications.productUpdates', prodSwitch?.checked ?? false);
    appState.set('notifications.emailDigest', digSwitch?.checked ?? true);
    appState.set('notifications.communityMentions', mentSwitch?.checked ?? true);
    appState.set('notifications.pushEnabled', pushSwitch?.checked ?? true);
    appState.set('notifications.soundEnabled', soundSwitch?.checked ?? false);

    resetBtn();
    clearFieldError('field-notifications-freq');
    showSuccessBanner('Notification Settings Saved', 'Your communication channel preferences have been saved.');
    showToast('Notification preferences updated.', 'success');
  });
}

function initAppearanceForm() {
  const form = document.getElementById('form-appearance');
  const compactSwitch = document.getElementById('switch-compact-mode');
  const contrastSwitch = document.getElementById('switch-high-contrast');
  const submitBtn = document.getElementById('btn-save-appearance');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const checkedRadio = document.querySelector('input[name="theme"]:checked');
    const selectedTheme = checkedRadio?.value || 'system';

    const resetBtn = simulateButtonLoading(submitBtn, 'Save Appearance');
    await new Promise(r => setTimeout(r, 500));

    applyTheme(selectedTheme);
    appState.set('appearance.compactMode', compactSwitch?.checked ?? false);
    appState.set('appearance.highContrast', contrastSwitch?.checked ?? false);

    resetBtn();
    showSuccessBanner('Appearance Updated', `Visual theme set to ${selectedTheme}.`);
    showToast('Appearance preferences saved.', 'success');
  });
}

function initPrivacyForm() {
  const form = document.getElementById('form-privacy');
  const visSelect = document.getElementById('field-profile-visibility');
  const analyticsSwitch = document.getElementById('switch-privacy-analytics');
  const aiSwitch = document.getElementById('switch-privacy-ai');
  const statusSwitch = document.getElementById('switch-privacy-status');
  const searchSwitch = document.getElementById('switch-privacy-search');
  const submitBtn = document.getElementById('btn-save-privacy');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorSummary();

    const data = {
      profileVisibility: visSelect?.value || 'public',
    };

    const { valid, errors } = validatePrivacySection(data);
    if (!valid) {
      setFieldError('field-profile-visibility', errors.profileVisibility);
      showErrorSummary(errors);
      return;
    }

    const resetBtn = simulateButtonLoading(submitBtn, 'Save Privacy');
    await new Promise(r => setTimeout(r, 600));

    appState.set('privacy.profileVisibility', data.profileVisibility);
    appState.set('privacy.shareAnalytics', analyticsSwitch?.checked ?? false);
    appState.set('privacy.personalizedAds', aiSwitch?.checked ?? true);
    appState.set('privacy.showOnlineStatus', statusSwitch?.checked ?? true);
    appState.set('privacy.searchIndexing', searchSwitch?.checked ?? true);

    resetBtn();
    clearFieldError('field-profile-visibility');
    showSuccessBanner('Privacy Preferences Saved', 'Your telemetry and profile visibility controls are updated.');
    showToast('Privacy rules saved.', 'success');
  });
}

function initPreferencesForm() {
  const form = document.getElementById('form-preferences');
  const langSelect = document.getElementById('field-pref-language');
  const tzSelect = document.getElementById('field-pref-timezone');
  const dateSelect = document.getElementById('field-pref-dateformat');
  const timeSelect = document.getElementById('field-pref-timeformat');
  const startSelect = document.getElementById('field-pref-startpage');
  const autoSaveSwitch = document.getElementById('switch-pref-autosave');
  const submitBtn = document.getElementById('btn-save-preferences');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideErrorSummary();

    const data = {
      language: langSelect?.value || 'en',
      timezone: tzSelect?.value || 'UTC',
      dateFormat: dateSelect?.value || 'YYYY-MM-DD',
      timeFormat: timeSelect?.value || '24h',
      startPage: startSelect?.value || 'profile',
    };

    const { valid, errors } = validatePreferencesSection(data);
    if (!valid) {
      if (errors.language)   setFieldError('field-pref-language', errors.language);
      if (errors.timezone)   setFieldError('field-pref-timezone', errors.timezone);
      if (errors.dateFormat) setFieldError('field-pref-dateformat', errors.dateFormat);
      if (errors.timeFormat) setFieldError('field-pref-timeformat', errors.timeFormat);
      showErrorSummary(errors);
      return;
    }

    const resetBtn = simulateButtonLoading(submitBtn, 'Save Preferences');
    await new Promise(r => setTimeout(r, 600));

    appState.set('preferences.language', data.language);
    appState.set('preferences.timezone', data.timezone);
    appState.set('preferences.dateFormat', data.dateFormat);
    appState.set('preferences.timeFormat', data.timeFormat);
    appState.set('preferences.startPage', data.startPage);
    appState.set('preferences.autoSave', autoSaveSwitch?.checked ?? true);

    resetBtn();
    ['field-pref-language', 'field-pref-timezone', 'field-pref-dateformat', 'field-pref-timeformat'].forEach(clearFieldError);
    showSuccessBanner('Preferences Saved', 'Application defaults and regional formats have been updated.');
    showToast('Application preferences saved.', 'success');
  });
}

// ── State Hydration ────────────────────────────────────────────────────────

export function hydrateAllForms() {
  // Profile
  const name = appState.get('profile.name') || 'Jane Doe';
  const email = appState.get('profile.email') || 'jane.doe@flyrank.io';
  const title = appState.get('profile.title') || 'Senior Frontend Engineer';
  const bio = appState.get('profile.bio') || '';

  const nameInput = document.getElementById('field-name');
  const emailInput = document.getElementById('field-email');
  const titleInput = document.getElementById('field-title');
  const bioInput = document.getElementById('field-bio');

  if (nameInput) nameInput.value = name;
  if (emailInput) emailInput.value = email;
  if (titleInput) titleInput.value = title;
  if (bioInput) bioInput.value = bio;

  updateAvatarInitials(name);
  updateProfilePreview(name, email, title);

  // Account
  const username = appState.get('account.username') || 'janedoe';
  const accLang = appState.get('account.language') || 'en';
  const accTz = appState.get('account.timezone') || 'UTC';

  const userInput = document.getElementById('field-username');
  const accLangSelect = document.getElementById('field-account-language');
  const accTzSelect = document.getElementById('field-account-timezone');

  if (userInput) userInput.value = username;
  if (accLangSelect) accLangSelect.value = accLang;
  if (accTzSelect) accTzSelect.value = accTz;

  // Notifications
  const notifFreq = appState.get('notifications.frequency') || 'important';
  const notifFreqSelect = document.getElementById('field-notifications-freq');
  if (notifFreqSelect) notifFreqSelect.value = notifFreq;

  const secSwitch = document.getElementById('switch-notif-security');
  const prodSwitch = document.getElementById('switch-notif-product');
  const digSwitch = document.getElementById('switch-notif-digest');
  const mentSwitch = document.getElementById('switch-notif-mentions');
  const pushSwitch = document.getElementById('switch-notif-push');
  const soundSwitch = document.getElementById('switch-notif-sound');

  if (secSwitch) secSwitch.checked = appState.get('notifications.securityAlerts') ?? true;
  if (prodSwitch) prodSwitch.checked = appState.get('notifications.productUpdates') ?? false;
  if (digSwitch) digSwitch.checked = appState.get('notifications.emailDigest') ?? true;
  if (mentSwitch) mentSwitch.checked = appState.get('notifications.communityMentions') ?? true;
  if (pushSwitch) pushSwitch.checked = appState.get('notifications.pushEnabled') ?? true;
  if (soundSwitch) soundSwitch.checked = appState.get('notifications.soundEnabled') ?? false;

  // Appearance
  const theme = appState.get('appearance.theme') || 'system';
  applyTheme(theme);

  // Privacy
  const vis = appState.get('privacy.profileVisibility') || 'public';
  const visSelect = document.getElementById('field-profile-visibility');
  if (visSelect) visSelect.value = vis;

  const analyticsSwitch = document.getElementById('switch-privacy-analytics');
  const aiSwitch = document.getElementById('switch-privacy-ai');
  const statusSwitch = document.getElementById('switch-privacy-status');
  const searchSwitch = document.getElementById('switch-privacy-search');

  if (analyticsSwitch) analyticsSwitch.checked = appState.get('privacy.shareAnalytics') ?? false;
  if (aiSwitch) aiSwitch.checked = appState.get('privacy.personalizedAds') ?? true;
  if (statusSwitch) statusSwitch.checked = appState.get('privacy.showOnlineStatus') ?? true;
  if (searchSwitch) searchSwitch.checked = appState.get('privacy.searchIndexing') ?? true;

  // Preferences
  const prefLang = appState.get('preferences.language') || 'en';
  const prefTz = appState.get('preferences.timezone') || 'UTC';
  const prefDate = appState.get('preferences.dateFormat') || 'YYYY-MM-DD';
  const prefTime = appState.get('preferences.timeFormat') || '24h';
  const prefStart = appState.get('preferences.startPage') || 'profile';

  const prefLangSelect = document.getElementById('field-pref-language');
  const prefTzSelect = document.getElementById('field-pref-timezone');
  const prefDateSelect = document.getElementById('field-pref-dateformat');
  const prefTimeSelect = document.getElementById('field-pref-timeformat');
  const prefStartSelect = document.getElementById('field-pref-startpage');
  const autoSaveSwitch = document.getElementById('switch-pref-autosave');

  if (prefLangSelect) prefLangSelect.value = prefLang;
  if (prefTzSelect) prefTzSelect.value = prefTz;
  if (prefDateSelect) prefDateSelect.value = prefDate;
  if (prefTimeSelect) prefTimeSelect.value = prefTime;
  if (prefStartSelect) prefStartSelect.value = prefStart;
  if (autoSaveSwitch) autoSaveSwitch.checked = appState.get('preferences.autoSave') ?? true;
}

function initFooterActions() {
  const exportBtn = document.getElementById('btn-export-json');
  const resetBtn = document.getElementById('btn-reset-settings');
  const successClose = document.getElementById('success-banner-close');
  const errorClose = document.getElementById('error-summary-close');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = appState.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flyrank-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings configuration exported.', 'info');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to default configuration?')) {
        appState.resetToDefaults();
        hydrateAllForms();
        showToast('Settings reset to default values.', 'info');
      }
    });
  }

  if (successClose) successClose.addEventListener('click', hideSuccessBanner);
  if (errorClose) errorClose.addEventListener('click', hideErrorSummary);
}

// ── Master Init ────────────────────────────────────────────────────────────

export function initSettingsForm() {
  hydrateAllForms();
  initSidebarNavigation();
  initMobileDrawer();
  initThemeControls();
  initPasswordToggles();
  initSecurityActions();
  initProfileForm();
  initAccountForm();
  initSecurityForm();
  initNotificationsForm();
  initAppearanceForm();
  initPrivacyForm();
  initPreferencesForm();
  initFooterActions();
}
