/* ==========================================================================
   PROFILE & IDENTITY TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { initSettingsForm } from '../settingsForm.js';

export function initProfileTab() {
  const avatarInitialsEl = document.getElementById('profile-avatar-initials');
  const avatarImgEl = document.getElementById('profile-avatar-img');
  const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  const avatarFileInput = document.getElementById('avatar-file-input');

  const updateAvatarUI = () => {
    const profile = appState.get('profile') || {};
    const name = profile.name || 'Alex Sterling';
    const avatarUrl = profile.avatarUrl;

    const parts = name.trim().split(/\s+/);
    let initials = 'AS';
    if (parts.length >= 2) {
      initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, 2).toUpperCase();
    }

    if (avatarInitialsEl) avatarInitialsEl.textContent = initials;

    if (avatarUrl && avatarImgEl) {
      avatarImgEl.src = avatarUrl;
      avatarImgEl.style.display = 'block';
      if (avatarInitialsEl) avatarInitialsEl.style.display = 'none';
      if (removeAvatarBtn) removeAvatarBtn.style.display = 'inline-flex';
    } else {
      if (avatarImgEl) avatarImgEl.style.display = 'none';
      if (avatarInitialsEl) avatarInitialsEl.style.display = 'block';
      if (removeAvatarBtn) removeAvatarBtn.style.display = 'none';
    }
  };

  if (uploadAvatarBtn && avatarFileInput) {
    uploadAvatarBtn.addEventListener('click', () => avatarFileInput.click());
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Invalid File', 'Please select an image file (PNG, JPG, SVG).');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('File Too Large', 'Avatar image must be under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        appState.set('profile.avatarUrl', dataUrl, true);
        updateAvatarUI();
        toast.success('Avatar Updated', 'Your profile picture has been updated.');
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', () => {
      appState.set('profile.avatarUrl', '', true);
      updateAvatarUI();
      toast.info('Avatar Removed', 'Profile avatar reset to initials.');
    });
  }

  // Initialize Core Settings Form Controller
  initSettingsForm();

  // Initial Avatar Setup & Subscription
  updateAvatarUI();
  appState.subscribe((state, path) => {
    if (path.startsWith('profile') || path === '') {
      updateAvatarUI();
    }
  });
}
