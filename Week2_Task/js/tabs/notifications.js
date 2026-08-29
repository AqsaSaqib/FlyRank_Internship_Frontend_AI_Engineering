/* ==========================================================================
   NOTIFICATIONS & ALERTS TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';

export function initNotificationsTab() {
  const quietHoursToggle = document.getElementById('toggle-quiet-hours');
  const quietStartInput = document.getElementById('quiet-start-time');
  const quietEndInput = document.getElementById('quiet-end-time');
  const quietHoursInputs = document.getElementById('quiet-hours-controls');

  const syncFromState = () => {
    const notifs = appState.get('notifications') || {};
    const channels = notifs.channels || {};

    // Sync all matrix checkboxes
    Object.keys(channels).forEach(category => {
      const perms = channels[category];
      Object.keys(perms).forEach(channelType => {
        const cb = document.querySelector(`input[data-notif-cat="${category}"][data-notif-type="${channelType}"]`);
        if (cb) {
          cb.checked = Boolean(perms[channelType]);
        }
      });
    });

    // Quiet Hours
    const quiet = notifs.quietHours || {};
    if (quietHoursToggle) quietHoursToggle.checked = Boolean(quiet.enabled);
    if (quietStartInput && quiet.startTime) quietStartInput.value = quiet.startTime;
    if (quietEndInput && quiet.endTime) quietEndInput.value = quiet.endTime;
    if (quietHoursInputs) {
      quietHoursInputs.style.opacity = quiet.enabled ? '1' : '0.4';
      quietHoursInputs.style.pointerEvents = quiet.enabled ? 'auto' : 'none';
    }
  };

  // Matrix Checkbox Change Listeners
  document.querySelectorAll('input[data-notif-cat]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const cat = e.target.getAttribute('data-notif-cat');
      const type = e.target.getAttribute('data-notif-type');
      appState.set(`notifications.channels.${cat}.${type}`, e.target.checked);
    });
  });

  // Quiet Hours Listeners
  if (quietHoursToggle) {
    quietHoursToggle.addEventListener('change', (e) => {
      appState.set('notifications.quietHours.enabled', e.target.checked);
      if (quietHoursInputs) {
        quietHoursInputs.style.opacity = e.target.checked ? '1' : '0.4';
        quietHoursInputs.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      }
      toast.info(e.target.checked ? 'Quiet Hours Enabled' : 'Quiet Hours Disabled', 'Your notification schedule has been adjusted.');
    });
  }

  if (quietStartInput) {
    quietStartInput.addEventListener('change', (e) => {
      appState.set('notifications.quietHours.startTime', e.target.value);
    });
  }

  if (quietEndInput) {
    quietEndInput.addEventListener('change', (e) => {
      appState.set('notifications.quietHours.endTime', e.target.value);
    });
  }

  // Quick Action: Enable All / Mute All
  const enableAllBtn = document.getElementById('enable-all-notifs-btn');
  const muteAllBtn = document.getElementById('mute-all-notifs-btn');

  if (enableAllBtn) {
    enableAllBtn.addEventListener('click', () => {
      const channels = appState.get('notifications.channels') || {};
      Object.keys(channels).forEach(cat => {
        Object.keys(channels[cat]).forEach(type => {
          appState.set(`notifications.channels.${cat}.${type}`, true);
        });
      });
      syncFromState();
      toast.success('All Notifications Enabled', 'You will receive all alerts across all channels.');
    });
  }

  if (muteAllBtn) {
    muteAllBtn.addEventListener('click', () => {
      const channels = appState.get('notifications.channels') || {};
      Object.keys(channels).forEach(cat => {
        if (cat !== 'securityAlerts') {
          Object.keys(channels[cat]).forEach(type => {
            appState.set(`notifications.channels.${cat}.${type}`, false);
          });
        }
      });
      syncFromState();
      toast.info('Non-critical Alerts Muted', 'Security alerts remain active for your protection.');
    });
  }

  // Initial Sync
  syncFromState();
  appState.subscribe((state, path) => {
    if (path.startsWith('notifications') || path === '') {
      syncFromState();
    }
  });
}
