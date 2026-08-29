/* ==========================================================================
   MAIN APPLICATION BOOTSTRAP & NAVIGATION CONTROLLER
   ========================================================================== */

import { initProfileTab } from './tabs/profile.js';
import { initAppearanceTab } from './tabs/appearance.js';
import { initSecurityTab } from './tabs/security.js';
import { initNotificationsTab } from './tabs/notifications.js';
import { initAIPreferencesTab } from './tabs/aiPreferences.js';
import { initAPIKeysTab } from './tabs/apiKeys.js';
import { initDataManagementTab } from './tabs/dataManagement.js';
import { initGlobalSearch } from './search.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Tab Navigation Switching
  const navButtons = document.querySelectorAll('.nav-item-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const sidebar = document.getElementById('settings-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const mobileToggle = document.getElementById('mobile-menu-toggle');

  const switchTab = (tabName) => {
    if (!tabName) return;

    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    tabPanes.forEach(pane => {
      const isTarget = pane.id === `tab-${tabName}`;
      pane.classList.toggle('active', isTarget);
    });

    // Close mobile drawer on tab select
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }

    // Refresh icons inside active pane
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Mobile Drawer Toggle
  if (mobileToggle && sidebar && backdrop) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      backdrop.classList.toggle('active', isOpen);
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }

  // 3. Initialize All Feature Modules
  initProfileTab();
  initAppearanceTab();
  initSecurityTab();
  initNotificationsTab();
  initAIPreferencesTab();
  initAPIKeysTab();
  initDataManagementTab();
  initGlobalSearch();
});
