/* ==========================================================================
   API KEYS & INTEGRATIONS TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export function initAPIKeysTab() {
  const container = document.getElementById('api-keys-container');
  const openModalBtn = document.getElementById('generate-api-key-btn');
  const confirmCreateBtn = document.getElementById('confirm-create-key-btn');
  const keyNameInput = document.getElementById('new-key-name-input');

  const renderKeys = () => {
    if (!container) return;
    const keys = appState.get('apiKeys') || [];

    if (keys.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: var(--font-sm);">
          No active API keys found. Generate a key to connect external services.
        </div>
      `;
      return;
    }

    container.innerHTML = keys.map(key => `
      <div class="api-key-item" id="${key.id}">
        <div>
          <div style="font-weight: 700; font-size: var(--font-sm); color: var(--text-primary); margin-bottom: 4px;">
            ${escapeHtml(key.name)}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="api-key-code">${escapeHtml(key.prefix)}</span>
            <span style="font-size: var(--font-xs); color: var(--text-muted);">
              Created: ${key.created} • Last used: ${key.lastUsed}
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-outline btn-sm copy-key-btn" data-prefix="${key.prefix}" title="Copy Key">
            <i data-lucide="copy" style="width:14px;height:14px;"></i>
            Copy
          </button>
          <button class="btn btn-outline btn-sm revoke-key-btn" data-id="${key.id}" style="color: var(--status-danger);" title="Revoke Key">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            Revoke
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }

    // Attach button listeners
    container.querySelectorAll('.copy-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prefix = btn.getAttribute('data-prefix');
        navigator.clipboard.writeText(prefix).then(() => {
          toast.success('Copied', 'API Key token copied to clipboard.');
        }).catch(() => {
          toast.info('Copied', `Token: ${prefix}`);
        });
      });
    });

    container.querySelectorAll('.revoke-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const updated = (appState.get('apiKeys') || []).filter(k => k.id !== id);
        appState.set('apiKeys', updated, true);
        renderKeys();
        toast.warning('Key Revoked', 'The API key has been permanently deactivated.');
      });
    });
  };

  const escapeHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      if (keyNameInput) keyNameInput.value = '';
      modal.open('modal-generate-key');
    });
  }

  if (confirmCreateBtn) {
    confirmCreateBtn.addEventListener('click', () => {
      const name = keyNameInput ? keyNameInput.value.trim() : '';
      if (!name) {
        toast.error('Missing Name', 'Please provide a descriptive name for the API key.');
        return;
      }

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const newKey = {
        id: `key_${Date.now()}`,
        name,
        prefix: `flk_live_${randomSuffix}...`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Just now'
      };

      const existing = appState.get('apiKeys') || [];
      appState.set('apiKeys', [newKey, ...existing], true);
      renderKeys();
      modal.close('modal-generate-key');
      toast.success('Key Generated', `API Key "${name}" created successfully.`);
    });
  }

  renderKeys();
  appState.subscribe((state, path) => {
    if (path.startsWith('apiKeys') || path === '') {
      renderKeys();
    }
  });
}
