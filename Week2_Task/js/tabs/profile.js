/* ==========================================================================
   PROFILE & PERSONAL DETAILS TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { initSettingsForm } from '../settingsForm.js';

export function initProfileTab() {
  // Initialize the User Settings Form
  initSettingsForm({
    onSaveSuccess: (data) => {
      const p = appState.get('profile') || {};
      updateAvatarDisplay(p.avatar, p.firstName, p.lastName);
    }
  });

  const avatarInput = document.getElementById('avatar-file-input');
  const avatarDropzone = document.getElementById('avatar-dropzone');
  const avatarPreview = document.getElementById('avatar-preview-img');
  const avatarInitials = document.getElementById('avatar-initials');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  const bioInput = document.getElementById('profile-bio');
  const bioCounter = document.getElementById('bio-char-count');
  const completionFill = document.getElementById('profile-completion-fill');
  const completionText = document.getElementById('profile-completion-text');

  // Load initial values from state
  const syncFromState = () => {
    const p = appState.get('profile');
    if (!p) return;

    setVal('profile-first-name', p.firstName);
    setVal('profile-last-name', p.lastName);
    setVal('profile-username', p.username);
    setVal('profile-email', p.email);
    setVal('profile-backup-email', p.backupEmail);
    setVal('profile-phone', p.phone);
    setVal('profile-bio', p.bio);
    setVal('profile-timezone', p.timezone);
    setVal('profile-language', p.language);
    setVal('profile-job-title', p.jobTitle);
    setVal('profile-organization', p.organization);

    updateAvatarDisplay(p.avatar, p.firstName, p.lastName);
    updateBioCount();
    updateCompletionBar();
  };

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  const updateAvatarDisplay = (dataUrl, fName = '', lName = '') => {
    const initials = `${(fName || 'A')[0]}${(lName || 'S')[0]}`.toUpperCase();
    if (avatarInitials) avatarInitials.textContent = initials;

    if (dataUrl && avatarPreview) {
      avatarPreview.src = dataUrl;
      avatarPreview.style.display = 'block';
      if (avatarInitials) avatarInitials.style.display = 'none';
      if (removeAvatarBtn) removeAvatarBtn.style.display = 'inline-flex';
    } else if (avatarPreview) {
      avatarPreview.style.display = 'none';
      if (avatarInitials) avatarInitials.style.display = 'block';
      if (removeAvatarBtn) removeAvatarBtn.style.display = 'none';
    }
  };

  const updateBioCount = () => {
    if (bioInput && bioCounter) {
      const len = bioInput.value.length;
      bioCounter.textContent = `${len} / 300`;
      bioCounter.style.color = len > 280 ? 'var(--color-warning)' : 'var(--text-muted)';
    }
  };

  const updateCompletionBar = () => {
    const p = appState.get('profile') || {};
    const fields = ['firstName', 'lastName', 'username', 'email', 'bio', 'timezone', 'language', 'phone'];
    const filled = fields.filter(f => Boolean(p[f] && p[f].trim())).length;
    const pct = Math.round((filled / fields.length) * 100);

    if (completionFill) completionFill.style.width = `${pct}%`;
    if (completionText) completionText.textContent = `${pct}% Completed`;
  };

  // Avatar Upload Handlers
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File Type', 'Please upload a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum avatar size is 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      appState.set('profile.avatar', dataUrl);
      updateAvatarDisplay(dataUrl, appState.get('profile.firstName'), appState.get('profile.lastName'));
      toast.success('Avatar Updated', 'Your profile picture has been loaded.');
    };
    reader.readAsDataURL(file);
  };

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  }

  if (avatarDropzone) {
    avatarDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      avatarDropzone.classList.add('dragover');
    });
    avatarDropzone.addEventListener('dragleave', () => avatarDropzone.classList.remove('dragover'));
    avatarDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      avatarDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', () => {
      appState.set('profile.avatar', '');
      updateAvatarDisplay('', appState.get('profile.firstName'), appState.get('profile.lastName'));
      toast.info('Avatar Removed', 'Reverted to your name initials.');
    });
  }

  // Field change listeners
  const fieldMapping = [
    { id: 'profile-first-name', key: 'profile.firstName' },
    { id: 'profile-last-name', key: 'profile.lastName' },
    { id: 'profile-username', key: 'profile.username' },
    { id: 'profile-email', key: 'profile.email' },
    { id: 'profile-backup-email', key: 'profile.backupEmail' },
    { id: 'profile-phone', key: 'profile.phone' },
    { id: 'profile-bio', key: 'profile.bio' },
    { id: 'profile-timezone', key: 'profile.timezone' },
    { id: 'profile-language', key: 'profile.language' },
    { id: 'profile-job-title', key: 'profile.jobTitle' },
    { id: 'profile-organization', key: 'profile.organization' }
  ];

  fieldMapping.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        appState.set(key, e.target.value);
        if (id === 'profile-bio') updateBioCount();
        if (id === 'profile-first-name' || id === 'profile-last-name') {
          updateAvatarDisplay(appState.get('profile.avatar'), appState.get('profile.firstName'), appState.get('profile.lastName'));
        }
        updateCompletionBar();
      });
    }
  });

  // Initial Sync
  syncFromState();
  appState.subscribe((state, path) => {
    if (path.startsWith('profile') || path === '') {
      syncFromState();
    }
  });
}
