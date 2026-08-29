/* ==========================================================================
   API KEYS & WEBHOOKS TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export function initAPIKeysTab() {
  const keysContainer = document.getElementById('api-keys-list-container');
  const openNewKeyModalBtn = document.getElementById('open-create-key-modal');
  const createKeyForm = document.getElementById('create-key-form');
  const newKeyNameInput = document.getElementById('new-key-name');

  const webhookUrlInput = document.getElementById('webhook-url-input');
  const testWebhookBtn = document.getElementById('test-webhook-btn');
  const webhookLog = document.getElementById('webhook-log-output');

  // Render API Keys
  const renderKeys = () => {
    if (!keysContainer) return;
    const keys = appState.get('apiKeys') || [];

    if (keys.length === 0) {
      keysContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: var(--font-sm);">
          No active API keys. Click "Generate New Key" to create one.
        </div>
      `;
      return;
    }

    keysContainer.innerHTML = keys.map(k => `
      <div class="api-key-item" data-id="${k.id}">
        <div class="api-key-meta">
          <div class="api-key-label">${k.name}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <code class="api-key-val" id="key-val-${k.id}">${k.maskedKey}</code>
            <button class="btn btn-icon btn-sm toggle-reveal-btn" data-id="${k.id}" title="Reveal / Mask Key">
              <i data-lucide="eye" style="width:14px;height:14px;"></i>
            </button>
          </div>
          <div style="font-size: var(--font-xs); color: var(--text-muted); margin-top: 4px;">
            Created: ${k.created} • Last active: ${k.lastUsed}
          </div>
        </div>
        <div class="api-key-actions">
          <button class="btn btn-outline btn-sm copy-key-btn" data-id="${k.id}">
            <i data-lucide="copy" style="width:14px;height:14px;"></i>
            Copy
          </button>
          <button class="btn btn-danger-outline btn-sm delete-key-btn" data-id="${k.id}">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons({ root: keysContainer });
    }

    // Attach Event Listeners
    keysContainer.querySelectorAll('.copy-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const k = (appState.get('apiKeys') || []).find(item => item.id === id);
        if (k) {
          navigator.clipboard.writeText(k.key);
          toast.success('Key Copied', 'API secret copied to clipboard.');
        }
      });
    });

    keysContainer.querySelectorAll('.toggle-reveal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const k = (appState.get('apiKeys') || []).find(item => item.id === id);
        const codeEl = document.getElementById(`key-val-${id}`);
        const icon = btn.querySelector('i') || btn.querySelector('svg');
        if (k && codeEl) {
          const isMasked = codeEl.textContent.includes('••••');
          codeEl.textContent = isMasked ? k.key : k.maskedKey;
          if (icon) {
            icon.setAttribute('data-lucide', isMasked ? 'eye-off' : 'eye');
            if (window.lucide) window.lucide.createIcons({ root: btn });
          }
        }
      });
    });

    keysContainer.querySelectorAll('.delete-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const updated = (appState.get('apiKeys') || []).filter(item => item.id !== id);
        appState.set('apiKeys', updated, true);
        renderKeys();
        toast.info('API Key Revoked', 'The key has been invalidated immediately.');
      });
    });
  };

  // Generate New Key Modal
  if (openNewKeyModalBtn) {
    openNewKeyModalBtn.addEventListener('click', () => {
      if (newKeyNameInput) newKeyNameInput.value = '';
      modal.open('modal-create-key');
    });
  }

  if (createKeyForm) {
    createKeyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = newKeyNameInput ? newKeyNameInput.value.trim() : '';
      if (!name) {
        toast.error('Missing Name', 'Please provide a descriptive name for this key.');
        return;
      }

      // Generate random crypto key
      const randHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const fullKey = `sk-live-${randHex}`;
      const maskedKey = `sk-live-••••••••••••••••${randHex.slice(-4)}`;

      const newKeyObj = {
        id: `key_${Date.now()}`,
        name: name,
        key: fullKey,
        maskedKey: maskedKey,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never'
      };

      const keys = appState.get('apiKeys') || [];
      keys.unshift(newKeyObj);
      appState.set('apiKeys', keys, true);

      modal.close('modal-create-key');
      renderKeys();
      toast.success('Key Generated', `Created API key "${name}".`);
    });
  }

  // Webhooks
  if (webhookUrlInput) {
    webhookUrlInput.value = appState.get('webhooks.url') || '';
    webhookUrlInput.addEventListener('change', (e) => {
      appState.set('webhooks.url', e.target.value);
    });
  }

  if (testWebhookBtn) {
    testWebhookBtn.addEventListener('click', () => {
      const url = webhookUrlInput ? webhookUrlInput.value : '';
      if (!url) {
        toast.error('Missing URL', 'Please enter a valid webhook endpoint URL.');
        return;
      }

      testWebhookBtn.disabled = true;
      testWebhookBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width:14px;height:14px;"></i> Sending Ping...';
      if (window.lucide) window.lucide.createIcons({ root: testWebhookBtn });

      setTimeout(() => {
        testWebhookBtn.disabled = false;
        testWebhookBtn.innerHTML = '<i data-lucide="zap" style="width:14px;height:14px;"></i> Send Test Event';
        if (window.lucide) window.lucide.createIcons({ root: testWebhookBtn });

        const timestamp = new Date().toLocaleTimeString();
        if (webhookLog) {
          webhookLog.textContent = `[${timestamp}] POST ${url} -> 200 OK (Latency: 48ms)\nPayload: { "event": "model.completed", "status": "success", "id": "evt_test_${Date.now().toString(36)}" }`;
        }
        toast.success('Webhook Delivered', 'Test event sent with status 200 OK (48ms).');
      }, 700);
    });
  }

  // Initial Sync
  renderKeys();
  appState.subscribe((state, path) => {
    if (path.startsWith('apiKeys') || path === '') {
      renderKeys();
    }
  });
}
