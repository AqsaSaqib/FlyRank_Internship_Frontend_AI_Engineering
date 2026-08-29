/* ==========================================================================
   APP INITIALIZATION & CORE ORCHESTRATION
   ========================================================================== */

import { appState } from './state.js';
import { toast } from './toast.js';
import { modal } from './modal.js';
import { initSearch } from './search.js';

import { initProfileTab } from './tabs/profile.js';
import { initAppearanceTab } from './tabs/appearance.js';
import { initSecurityTab } from './tabs/security.js';
import { initNotificationsTab } from './tabs/notifications.js';
import { initAIPreferencesTab } from './tabs/aiPreferences.js';
import { initAPIKeysTab } from './tabs/apiKeys.js';
import { initBillingTab } from './tabs/billing.js';
import { initDataManagementTab } from './tabs/dataManagement.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Tab Controllers
  initProfileTab();
  initAppearanceTab();
  initSecurityTab();
  initNotificationsTab();
  initAIPreferencesTab();
  initAPIKeysTab();
  initBillingTab();
  initDataManagementTab();

  // 2. Tab Navigation Router
  const navBtns = document.querySelectorAll('.nav-item-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const sidebar = document.getElementById('settings-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

  const switchTab = (tabId) => {
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    window.location.hash = tabId;

    // Close mobile drawer if open
    if (sidebar && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
    }

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile Menu Handlers
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('mobile-open');
      if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show');
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('mobile-open');
      sidebarBackdrop.classList.remove('show');
    });
  }

  // Handle Hash routing on load
  const initialHash = window.location.hash.replace('#', '') || 'profile';
  switchTab(initialHash);

  // 3. Search Engine Integration
  initSearch((selectedSetting) => {
    switchTab(selectedSetting.tab);
    setTimeout(() => {
      const el = document.querySelector(selectedSetting.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'box-shadow 300ms ease, transform 300ms ease';
        el.style.boxShadow = '0 0 0 4px var(--accent-primary), 0 8px 24px var(--accent-glow)';
        el.style.transform = 'scale(1.01)';
        setTimeout(() => {
          el.style.boxShadow = '';
          el.style.transform = '';
        }, 1600);
      }
    }, 150);
  });

  // 4. Dirty State & Floating Unsaved Changes Bar
  const unsavedBar = document.getElementById('unsaved-changes-bar');
  const saveChangesBtn = document.getElementById('save-changes-btn');
  const discardChangesBtn = document.getElementById('discard-changes-btn');

  appState.onDirtyChange((isDirty) => {
    if (unsavedBar) {
      unsavedBar.classList.toggle('visible', isDirty);
    }
  });

  const handleSave = () => {
    const success = appState.saveToStorage();
    if (success) {
      toast.success('Changes Saved', 'Your dashboard settings have been persisted.');
    } else {
      toast.error('Save Failed', 'Could not write settings to storage.');
    }
  };

  const handleDiscard = () => {
    appState.discardChanges();
    toast.info('Changes Reverted', 'Restored to previously saved settings.');
  };

  if (saveChangesBtn) saveChangesBtn.addEventListener('click', handleSave);
  if (discardChangesBtn) discardChangesBtn.addEventListener('click', handleDiscard);

  // Ctrl+S / Cmd+S Global Shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (appState.isDirty()) {
        handleSave();
      } else {
        toast.info('All Saved', 'No unsaved modifications.');
      }
    }
  });

  // 5. Modal Close Trigger Bindings
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      modal.close(modalId);
    });
  });

  // 6. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
