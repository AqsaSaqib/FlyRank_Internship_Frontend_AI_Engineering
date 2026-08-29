/* ==========================================================================
   DATA MANAGEMENT & DANGER ZONE TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export function initDataManagementTab() {
  const exportBtn = document.getElementById('export-settings-btn');
  const importInput = document.getElementById('import-settings-file');
  const factoryResetBtn = document.getElementById('open-factory-reset-modal');
  const confirmResetBtn = document.getElementById('confirm-factory-reset-btn');

  const deleteAccountBtn = document.getElementById('open-delete-account-modal');
  const deleteConfirmInput = document.getElementById('delete-confirm-input');
  const confirmDeleteBtn = document.getElementById('confirm-delete-account-btn');

  // Export JSON
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = appState.exportJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `flyrank-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Settings Exported', 'Configuration backup downloaded as JSON.');
    });
  }

  // Import JSON
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const res = appState.importJSON(event.target.result);
        if (res.success) {
          toast.success('Settings Restored', 'Configuration loaded and applied successfully.');
        } else {
          toast.error('Import Failed', res.error || 'Could not parse JSON file.');
        }
        importInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Factory Reset
  if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', () => modal.open('modal-factory-reset'));
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      appState.resetToDefaults();
      modal.close('modal-factory-reset');
      toast.warning('Reset Complete', 'All settings restored to factory defaults.');
    });
  }

  // Delete Account
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      if (deleteConfirmInput) deleteConfirmInput.value = '';
      if (confirmDeleteBtn) confirmDeleteBtn.disabled = true;
      modal.open('modal-delete-account');
    });
  }

  if (deleteConfirmInput && confirmDeleteBtn) {
    deleteConfirmInput.addEventListener('input', (e) => {
      const username = appState.get('profile.username') || 'alexsterling';
      const typed = e.target.value.trim();
      confirmDeleteBtn.disabled = !(typed === username || typed === 'DELETE');
    });

    confirmDeleteBtn.addEventListener('click', () => {
      modal.close('modal-delete-account');
      localStorage.clear();
      appState.resetToDefaults();
      toast.error('Account Deleted', 'Workspace session closed and data purged.');
    });
  }
}
