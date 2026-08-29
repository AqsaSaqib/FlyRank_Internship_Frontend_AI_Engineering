/* ==========================================================================
   NOTIFICATIONS TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';

export function initNotificationsTab() {
  const emailDigestToggle = document.getElementById('email-digest-toggle');
  const inAppAlertsToggle = document.getElementById('in-app-alerts-toggle');
  const securityAlertsToggle = document.getElementById('security-alerts-toggle');
  const marketingUpdatesToggle = document.getElementById('marketing-updates-toggle');
  const webhookFailuresToggle = document.getElementById('webhook-failures-toggle');
  const quietStartInput = document.getElementById('quiet-hours-start');
  const quietEndInput = document.getElementById('quiet-hours-end');
  const saveNotificationsBtn = document.getElementById('save-notifications-btn');

  const syncNotificationsUI = () => {
    const notifs = appState.get('notifications') || {};

    if (emailDigestToggle) emailDigestToggle.checked = Boolean(notifs.emailDigest);
    if (inAppAlertsToggle) inAppAlertsToggle.checked = Boolean(notifs.inAppAlerts);
    if (securityAlertsToggle) securityAlertsToggle.checked = Boolean(notifs.securityAlerts);
    if (marketingUpdatesToggle) marketingUpdatesToggle.checked = Boolean(notifs.marketingUpdates);
    if (webhookFailuresToggle) webhookFailuresToggle.checked = Boolean(notifs.webhookFailures);
    if (quietStartInput) quietStartInput.value = notifs.quietHoursStart || '22:00';
    if (quietEndInput) quietEndInput.value = notifs.quietHoursEnd || '07:00';
  };

  const bindToggle = (inputEl, stateKey) => {
    if (!inputEl) return;
    inputEl.addEventListener('change', (e) => {
      appState.set(`notifications.${stateKey}`, e.target.checked, true);
    });
  };

  bindToggle(emailDigestToggle, 'emailDigest');
  bindToggle(inAppAlertsToggle, 'inAppAlerts');
  bindToggle(securityAlertsToggle, 'securityAlerts');
  bindToggle(marketingUpdatesToggle, 'marketingUpdates');
  bindToggle(webhookFailuresToggle, 'webhookFailures');

  if (quietStartInput) {
    quietStartInput.addEventListener('change', (e) => {
      appState.set('notifications.quietHoursStart', e.target.value, true);
    });
  }

  if (quietEndInput) {
    quietEndInput.addEventListener('change', (e) => {
      appState.set('notifications.quietHoursEnd', e.target.value, true);
    });
  }

  if (saveNotificationsBtn) {
    saveNotificationsBtn.addEventListener('click', () => {
      toast.success('Preferences Saved', 'Your notification settings have been updated.');
    });
  }

  syncNotificationsUI();
  appState.subscribe((state, path) => {
    if (path.startsWith('notifications') || path === '') {
      syncNotificationsUI();
    }
  });
}
