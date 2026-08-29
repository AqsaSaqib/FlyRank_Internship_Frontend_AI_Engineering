/* ==========================================================================
   DATA MANAGEMENT & PRIVACY TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export function initDataManagementTab() {
  const exportBtn = document.getElementById('export-all-data-btn');
  const headerExportBtn = document.getElementById('export-settings-btn');
  const importFileInput = document.getElementById('import-data-file-input');
  const importTriggerBtn = document.getElementById('import-data-btn');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const resetAllBtn = document.getElementById('reset-all-settings-btn');
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-account-btn');
  const deleteConfirmInput = document.getElementById('delete-confirm-input');

  const handleExport = () => {
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
    toast.success('Export Complete', 'Settings configuration backup downloaded.');
  };

  if (exportBtn) exportBtn.addEventListener('click', handleExport);
  if (headerExportBtn) headerExportBtn.addEventListener('click', handleExport);

  // Import JSON configuration
  if (importTriggerBtn && importFileInput) {
    importTriggerBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = appState.importJSON(event.target.result);
        if (result.success) {
          toast.success('Import Successful', 'Application settings updated from backup.');
        } else {
          toast.error('Import Failed', `Invalid JSON backup file: ${result.error}`);
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear local storage cache
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
      toast.success('Cache Cleared', 'Temporary workspace cache has been purged.');
    });
  }

  // Reset all to defaults
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all preferences to default factory settings?')) {
        appState.resetToDefaults();
        toast.warning('Settings Reset', 'All configurations have been restored to defaults.');
      }
    });
  }

  // Delete account modal flow
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      if (deleteConfirmInput) deleteConfirmInput.value = '';
      if (confirmDeleteBtn) confirmDeleteBtn.disabled = true;
      modal.open('modal-delete-account');
    });
  }

  if (deleteConfirmInput && confirmDeleteBtn) {
    deleteConfirmInput.addEventListener('input', (e) => {
      confirmDeleteBtn.disabled = e.target.value.trim() !== 'DELETE';
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      modal.close('modal-delete-account');
      appState.resetToDefaults();
      toast.error('Account Terminated', 'Workspace data wiped and logged out.');
    });
  }
}
