/* ==========================================================================
   SECURITY & AUTHENTICATION TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export function initSecurityTab() {
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const updatePasswordBtn = document.getElementById('update-password-btn');

  const strengthBars = document.getElementById('password-strength-bars');
  const strengthLabel = document.getElementById('password-strength-text');

  const reqLength = document.getElementById('req-length');
  const reqUpper = document.getElementById('req-upper');
  const reqNumber = document.getElementById('req-number');
  const reqSpecial = document.getElementById('req-special');

  const twoFactorToggle = document.getElementById('toggle-two-factor');
  const twoFactorStatusBadge = document.getElementById('two-factor-status-badge');
  const sessionsContainer = document.getElementById('active-sessions-list');
  const revokeAllSessionsBtn = document.getElementById('revoke-all-sessions-btn');

  // 2FA Modal Elements
  const verify2FABtn = document.getElementById('verify-2fa-btn');
  const code2FAInput = document.getElementById('totp-input');

  // Password Strength Evaluation
  const evaluatePassword = (password) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    if (checks.length) score++;
    if (checks.upper) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    // Update Checklist UI
    updateReqItem(reqLength, checks.length);
    updateReqItem(reqUpper, checks.upper);
    updateReqItem(reqNumber, checks.number);
    updateReqItem(reqSpecial, checks.special);

    // Update Bars UI
    if (!strengthBars) return;
    strengthBars.className = 'strength-bars';

    if (!password) {
      if (strengthLabel) strengthLabel.textContent = 'Password Strength';
      return;
    }

    if (score <= 1) {
      strengthBars.classList.add('weak');
      if (strengthLabel) strengthLabel.textContent = 'Weak Password';
    } else if (score === 2) {
      strengthBars.classList.add('fair');
      if (strengthLabel) strengthLabel.textContent = 'Fair Password';
    } else if (score === 3) {
      strengthBars.classList.add('good');
      if (strengthLabel) strengthLabel.textContent = 'Good Password';
    } else if (score === 4) {
      strengthBars.classList.add('strong');
      if (strengthLabel) strengthLabel.textContent = 'Very Strong Password';
    }
  };

  const updateReqItem = (el, isMet) => {
    if (!el) return;
    el.classList.toggle('met', isMet);
    const icon = el.querySelector('i') || el.querySelector('svg');
    if (icon) {
      icon.setAttribute('data-lucide', isMet ? 'check' : 'circle');
      if (window.lucide) window.lucide.createIcons({ root: el });
    }
  };

  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', (e) => evaluatePassword(e.target.value));
  }

  // Update Password Submit
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', () => {
      const curr = currentPasswordInput ? currentPasswordInput.value : '';
      const nw = newPasswordInput ? newPasswordInput.value : '';
      const conf = confirmPasswordInput ? confirmPasswordInput.value : '';

      if (!curr) {
        toast.error('Missing Password', 'Please enter your current password.');
        return;
      }
      if (nw.length < 8) {
        toast.error('Weak Password', 'New password must be at least 8 characters long.');
        return;
      }
      if (nw !== conf) {
        toast.error('Mismatch', 'New password and confirmation do not match.');
        return;
      }

      toast.success('Password Updated', 'Your account password has been changed securely.');
      if (currentPasswordInput) currentPasswordInput.value = '';
      if (newPasswordInput) newPasswordInput.value = '';
      if (confirmPasswordInput) confirmPasswordInput.value = '';
      evaluatePassword('');
    });
  }

  // Two-Factor Authentication
  const sync2FAUI = () => {
    const is2FA = appState.get('security.twoFactorEnabled');
    if (twoFactorToggle) twoFactorToggle.checked = Boolean(is2FA);
    if (twoFactorStatusBadge) {
      twoFactorStatusBadge.className = is2FA ? 'badge badge-success' : 'badge badge-warning';
      twoFactorStatusBadge.textContent = is2FA ? '2FA Enabled' : '2FA Disabled';
    }
  };

  if (twoFactorToggle) {
    twoFactorToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        modal.open('modal-2fa-setup');
      } else {
        appState.set('security.twoFactorEnabled', false, true);
        sync2FAUI();
        toast.warning('2FA Disabled', 'Two-Factor Authentication is now turned off.');
      }
    });
  }

  if (verify2FABtn) {
    verify2FABtn.addEventListener('click', () => {
      const code = code2FAInput ? code2FAInput.value.trim() : '';
      if (code.length < 6) {
        toast.error('Invalid Code', 'Please enter a valid 6-digit authentication code.');
        return;
      }
      appState.set('security.twoFactorEnabled', true, true);
      sync2FAUI();
      modal.close('modal-2fa-setup');
      if (code2FAInput) code2FAInput.value = '';
      toast.success('2FA Activated', 'Two-Factor Authentication is now protecting your account.');
    });
  }

  // Active Sessions
  const renderSessions = () => {
    if (!sessionsContainer) return;
    const sessions = appState.get('security.activeSessions') || [];

    sessionsContainer.innerHTML = sessions.map(sess => `
      <div class="session-card" id="${sess.id}">
        <div class="session-info">
          <div class="session-icon">
            <i data-lucide="${sess.device.includes('iPhone') ? 'smartphone' : 'laptop'}" style="width:18px;height:18px;"></i>
          </div>
          <div>
            <div style="font-weight: 700; font-size: var(--font-sm); color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              ${sess.device}
              ${sess.current ? '<span class="badge badge-success">This Device</span>' : ''}
            </div>
            <div style="font-size: var(--font-xs); color: var(--text-muted);">
              ${sess.ip} • ${sess.location} • ${sess.time}
            </div>
          </div>
        </div>
        ${!sess.current ? `
          <button class="btn btn-outline btn-sm revoke-session-btn" data-id="${sess.id}">
            <i data-lucide="log-out" style="width:14px;height:14px;"></i>
            Revoke
          </button>
        ` : ''}
      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons({ root: sessionsContainer });
    }

    sessionsContainer.querySelectorAll('.revoke-session-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const updated = (appState.get('security.activeSessions') || []).filter(s => s.id !== id);
        appState.set('security.activeSessions', updated, true);
        renderSessions();
        toast.info('Session Revoked', 'The selected device has been logged out.');
      });
    });
  };

  if (revokeAllSessionsBtn) {
    revokeAllSessionsBtn.addEventListener('click', () => {
      const currentOnly = (appState.get('security.activeSessions') || []).filter(s => s.current);
      appState.set('security.activeSessions', currentOnly, true);
      renderSessions();
      toast.success('Sessions Cleared', 'All other devices have been logged out.');
    });
  }

  // Initial Sync
  sync2FAUI();
  renderSessions();
  appState.subscribe((state, path) => {
    if (path.startsWith('security') || path === '') {
      sync2FAUI();
      renderSessions();
    }
  });
}
