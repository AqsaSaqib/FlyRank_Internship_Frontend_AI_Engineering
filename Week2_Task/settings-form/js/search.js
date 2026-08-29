/* ==========================================================================
   GLOBAL FUZZY SEARCH INDEXER & CONTROLLER
   ========================================================================== */

export const SETTINGS_SEARCH_INDEX = [
  { tab: 'profile', title: 'Display Name', sub: 'Profile & Identity', selector: '#settings-name', keywords: 'name alex sterling user identity full name' },
  { tab: 'profile', title: 'Email Address', sub: 'Profile & Identity', selector: '#settings-email', keywords: 'email contact address mail notifications' },
  { tab: 'profile', title: 'Job Title & Role', sub: 'Profile & Identity', selector: '#profile-job-title', keywords: 'job role profession title engineer' },
  { tab: 'profile', title: 'Timezone', sub: 'Profile & Identity', selector: '#profile-timezone', keywords: 'timezone utc clock time location region' },
  { tab: 'profile', title: 'Notification Preference', sub: 'Profile & Identity', selector: '#settings-notification-pref', keywords: 'notification alert digest frequency email delivery' },
  { tab: 'profile', title: 'Bio & Overview', sub: 'Profile & Identity', selector: '#profile-bio', keywords: 'bio summary profile description' },
  { tab: 'appearance', title: 'Theme (Dark / Light / System)', sub: 'Appearance & Theme', selector: '#theme-selector-group', keywords: 'theme dark mode light mode system styling colors ui' },
  { tab: 'appearance', title: 'Accent Color', sub: 'Appearance & Theme', selector: '#accent-color-picker', keywords: 'accent color indigo violet emerald cyan rose amber brand' },
  { tab: 'appearance', title: 'Interface Density', sub: 'Appearance & Theme', selector: '#ui-density-select', keywords: 'density compact default comfortable spacing layout' },
  { tab: 'appearance', title: 'Reduced Motion', sub: 'Appearance & Theme', selector: '#reduced-motion-toggle', keywords: 'animations motion accessibility disable transitions' },
  { tab: 'security', title: 'Change Password', sub: 'Security & 2FA', selector: '#current-password-input', keywords: 'password change credentials auth secret update' },
  { tab: 'security', title: 'Two-Factor Authentication (2FA)', sub: 'Security & 2FA', selector: '#two-factor-toggle', keywords: '2fa two factor authenticator otp totp security protection' },
  { tab: 'security', title: 'Active Sessions', sub: 'Security & 2FA', selector: '#active-sessions-container', keywords: 'sessions devices logged in logout revoke ip location' },
  { tab: 'notifications', title: 'Email & In-App Alerts', sub: 'Notifications', selector: '#email-digest-toggle', keywords: 'notifications email push alerts digest marketing webhook' },
  { tab: 'aiPreferences', title: 'Default LLM Model', sub: 'AI Preferences', selector: '#ai-model-selector', keywords: 'ai llm model gemini claude gpt openai anthropic google' },
  { tab: 'aiPreferences', title: 'Temperature & Sampling', sub: 'AI Preferences', selector: '#ai-temperature-slider', keywords: 'temperature sampling randomness creativity ai parameters' },
  { tab: 'aiPreferences', title: 'System Prompt Instructions', sub: 'AI Preferences', selector: '#ai-system-prompt', keywords: 'system prompt context instructions persona system message' },
  { tab: 'apiKeys', title: 'API Keys & Tokens', sub: 'API & Integrations', selector: '#generate-api-key-btn', keywords: 'api key tokens secret developer rest sdk' },
  { tab: 'dataManagement', title: 'Export Account Data', sub: 'Data & Privacy', selector: '#export-all-data-btn', keywords: 'export download backup json csv data privacy' },
  { tab: 'dataManagement', title: 'Clear Local Cache', sub: 'Data & Privacy', selector: '#clear-cache-btn', keywords: 'cache storage wipe clear reset' },
  { tab: 'dataManagement', title: 'Delete Account', sub: 'Danger Zone', selector: '#delete-account-btn', keywords: 'delete account cancel terminate danger zone' }
];

export function initGlobalSearch() {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!searchInput || !dropdown) return;

  let selectedIndex = -1;

  const performSearch = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const matches = SETTINGS_SEARCH_INDEX.filter(item => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
      );
    });

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: var(--font-xs);">
          No matching settings found for "<strong>${escapeHtml(query)}</strong>"
        </div>
      `;
      dropdown.style.display = 'block';
      return;
    }

    selectedIndex = 0;
    dropdown.innerHTML = matches.map((item, idx) => `
      <div class="search-result-item ${idx === 0 ? 'highlighted' : ''}" data-index="${idx}" data-tab="${item.tab}" data-selector="${item.selector}">
        <div class="search-result-info">
          <div class="search-result-title">${highlightQuery(item.title, q)}</div>
          <div class="search-result-sub">${item.sub}</div>
        </div>
        <i data-lucide="arrow-up-right" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
      </div>
    `).join('');

    dropdown.style.display = 'block';
    if (window.lucide) {
      window.lucide.createIcons({ root: dropdown });
    }

    dropdown.querySelectorAll('.search-result-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        navigateToResult(itemEl.getAttribute('data-tab'), itemEl.getAttribute('data-selector'));
      });
    });
  };

  const navigateToResult = (tabName, selector) => {
    dropdown.style.display = 'none';
    searchInput.value = '';
    searchInput.blur();

    const tabBtn = document.querySelector(`.nav-item-btn[data-tab="${tabName}"]`);
    if (tabBtn) tabBtn.click();

    setTimeout(() => {
      const targetEl = document.querySelector(selector);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.focus();
        targetEl.classList.add('pulse-focus');
        setTimeout(() => targetEl.classList.remove('pulse-focus'), 1500);
      }
    }, 150);
  };

  const highlightQuery = (text, q) => {
    const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--accent-light); color: var(--accent-primary); border-radius: 2px;">$1</mark>');
  };

  const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  searchInput.addEventListener('input', (e) => performSearch(e.target.value));

  searchInput.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.search-result-item');
    if (!items.length || dropdown.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  const updateHighlight = (items) => {
    items.forEach((it, i) => {
      it.classList.toggle('highlighted', i === selectedIndex);
    });
  };

  // Close search dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Global Ctrl + K / Cmd + K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}
