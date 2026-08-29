/* ==========================================================================
   GLOBAL SETTINGS FUZZY SEARCH ENGINE
   ========================================================================== */

export const SETTINGS_INDEX = [
  // Profile
  { id: 'profile-avatar', tab: 'profile', title: 'Profile Avatar & Photo', desc: 'Upload, crop, or remove account picture', target: '#avatar-section' },
  { id: 'profile-name', tab: 'profile', title: 'Full Name & Display Name', desc: 'First and last name used across workspace', target: '#profile-fullname-group' },
  { id: 'profile-handle', tab: 'profile', title: 'Username & Handle', desc: 'Unique handle @username for mentions', target: '#profile-username-group' },
  { id: 'profile-email', tab: 'profile', title: 'Primary & Backup Email', desc: 'Work and personal email addresses', target: '#profile-email-group' },
  { id: 'profile-bio', tab: 'profile', title: 'Bio & Personal Summary', desc: 'Short bio displayed on team directory', target: '#profile-bio-group' },
  { id: 'profile-timezone', tab: 'profile', title: 'Timezone & Language', desc: 'Regional localization and timestamp formatting', target: '#profile-locale-group' },

  // Appearance
  { id: 'theme-mode', tab: 'appearance', title: 'Theme Mode (Dark / Light / System)', desc: 'Toggle light mode, sleek dark mode, or OS sync', target: '#theme-mode-section' },
  { id: 'accent-color', tab: 'appearance', title: 'Accent Color Palette', desc: 'Choose brand accent (Indigo, Emerald, Violet, Rose, Amber, Cyan)', target: '#accent-color-section' },
  { id: 'ui-density', tab: 'appearance', title: 'UI Layout Density', desc: 'Switch between Compact, Default, or Comfortable spacing', target: '#ui-density-section' },
  { id: 'font-scale', tab: 'appearance', title: 'Font Size Scaling', desc: 'Adjust text size multiplier across the dashboard', target: '#font-scale-section' },
  { id: 'motion-settings', tab: 'appearance', title: 'Reduced Motion & Animations', desc: 'Disable transitions and animations for accessibility', target: '#motion-settings-section' },

  // Security
  { id: 'sec-password', tab: 'security', title: 'Change Password & Strength Meter', desc: 'Update account password with dynamic security evaluator', target: '#password-change-section' },
  { id: 'sec-2fa', tab: 'security', title: 'Two-Factor Authentication (2FA)', desc: 'Enable Authenticator app TOTP verification', target: '#two-factor-section' },
  { id: 'sec-sessions', tab: 'security', title: 'Active Sessions & Devices', desc: 'Inspect active browser sessions and revoke remote devices', target: '#sessions-section' },

  // Notifications
  { id: 'notif-matrix', tab: 'notifications', title: 'Notification Channels Matrix', desc: 'Configure Email, Push, In-App, and SMS alerts', target: '#notif-matrix-section' },
  { id: 'notif-quiet', tab: 'notifications', title: 'Quiet Hours Scheduler', desc: 'Mute non-critical notifications during focus or sleep hours', target: '#quiet-hours-section' },

  // AI Preferences
  { id: 'ai-model', tab: 'ai', title: 'Default AI Model Selection', desc: 'Switch default LLM (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5)', target: '#ai-model-section' },
  { id: 'ai-temp', tab: 'ai', title: 'Inference Temperature Slider', desc: 'Adjust AI model creativity vs deterministic precision', target: '#ai-temp-section' },
  { id: 'ai-tokens', tab: 'ai', title: 'Max Output Tokens Limit', desc: 'Configure maximum response token budget (512 - 8192)', target: '#ai-tokens-section' },
  { id: 'ai-prompt', tab: 'ai', title: 'System Prompt & Custom Instructions', desc: 'Persona and behavior rules for AI responses', target: '#ai-prompt-section' },
  { id: 'ai-features', tab: 'ai', title: 'Web Grounding & Code Execution', desc: 'Enable live web browsing and sandboxed code running', target: '#ai-features-section' },

  // API Keys
  { id: 'api-keys', tab: 'apiKeys', title: 'API Key Management', desc: 'Generate, copy, reveal, and revoke Secret API keys', target: '#api-keys-section' },
  { id: 'api-webhooks', tab: 'apiKeys', title: 'Webhooks & Event Delivery', desc: 'Configure endpoint URL and test incoming ping payload', target: '#webhooks-section' },

  // Billing
  { id: 'billing-plan', tab: 'billing', title: 'Subscription Plan & Upgrade', desc: 'Manage Starter, Pro, and Enterprise plan tiers', target: '#billing-plan-section' },
  { id: 'billing-usage', tab: 'billing', title: 'Resource & Credit Usage', desc: 'Track API token quotas, cloud storage, and team seats', target: '#billing-usage-section' },
  { id: 'billing-card', tab: 'billing', title: 'Payment Method & Invoices', desc: 'Update credit card and download historical PDF receipts', target: '#billing-payment-section' },

  // Data & Danger
  { id: 'data-export', tab: 'danger', title: 'Export Account Data (JSON)', desc: 'Download a complete JSON snapshot of all preferences', target: '#data-export-section' },
  { id: 'data-import', tab: 'danger', title: 'Import Configuration Backup', desc: 'Upload a settings JSON file to restore preferences', target: '#data-import-section' },
  { id: 'danger-reset', tab: 'danger', title: 'Factory Reset to Defaults', desc: 'Reset all dashboard settings back to factory default values', target: '#danger-reset-section' },
  { id: 'danger-delete', tab: 'danger', title: 'Delete Account Permanently', desc: 'Purge user workspace and all connected data', target: '#danger-delete-section' }
];

export function initSearch(onSelectSetting) {
  const searchInput = document.getElementById('global-search-input');
  const searchDropdown = document.getElementById('search-results-dropdown');
  if (!searchInput || !searchDropdown) return;

  let selectedIndex = -1;
  let currentResults = [];

  const performSearch = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      searchDropdown.classList.remove('show');
      searchDropdown.innerHTML = '';
      currentResults = [];
      selectedIndex = -1;
      return;
    }

    currentResults = SETTINGS_INDEX.filter(item => {
      return item.title.toLowerCase().includes(q) ||
             item.desc.toLowerCase().includes(q) ||
             item.tab.toLowerCase().includes(q);
    });

    if (currentResults.length === 0) {
      searchDropdown.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: var(--font-xs);">
          No settings found matching "${query}"
        </div>
      `;
      searchDropdown.classList.add('show');
      return;
    }

    searchDropdown.innerHTML = currentResults.map((item, idx) => `
      <div class="search-result-item ${idx === 0 ? 'highlighted' : ''}" data-idx="${idx}">
        <div>
          <div class="search-result-title">${highlightMatch(item.title, q)}</div>
          <div class="search-result-desc">${highlightMatch(item.desc, q)}</div>
        </div>
        <span class="search-result-tag">${item.tab.toUpperCase()}</span>
      </div>
    `).join('');

    selectedIndex = 0;
    searchDropdown.classList.add('show');
  };

  const highlightMatch = (text, query) => {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--accent-primary-light); color: var(--accent-primary); font-weight:700; border-radius:2px; padding:0 2px;">$1</mark>');
  };

  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const selectItem = (item) => {
    if (!item) return;
    searchDropdown.classList.remove('show');
    searchInput.value = '';
    onSelectSetting(item);
  };

  searchInput.addEventListener('input', (e) => performSearch(e.target.value));

  searchInput.addEventListener('keydown', (e) => {
    if (!searchDropdown.classList.contains('show') || currentResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % currentResults.length;
      updateHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
      updateHighlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
        selectItem(currentResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      searchDropdown.classList.remove('show');
    }
  });

  const updateHighlight = () => {
    const items = searchDropdown.querySelectorAll('.search-result-item');
    items.forEach((el, idx) => {
      el.classList.toggle('highlighted', idx === selectedIndex);
      if (idx === selectedIndex) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  };

  searchDropdown.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.search-result-item');
    if (itemEl) {
      const idx = parseInt(itemEl.getAttribute('data-idx'), 10);
      selectItem(currentResults[idx]);
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.remove('show');
    }
  });

  // Global Ctrl+K or Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}
