/* ==========================================================================
   APPEARANCE & THEME TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';

export function initAppearanceTab() {
  const themeOptions = document.querySelectorAll('.theme-card-option');
  const accentButtons = document.querySelectorAll('.color-dot-btn');
  const densitySelect = document.getElementById('ui-density-select');
  const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeBadge = document.getElementById('font-size-badge');

  /**
   * Applies active appearance attributes to HTML document root.
   */
  const applyThemeToDOM = () => {
    const appearance = appState.get('appearance') || {};
    const root = document.documentElement;

    let effectiveTheme = appearance.theme;
    if (effectiveTheme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-accent', appearance.accent || 'indigo');
    root.setAttribute('data-density', appearance.density || 'default');

    if (appearance.fontSize) {
      root.style.fontSize = `${appearance.fontSize}px`;
    }

    // Update UI controls
    themeOptions.forEach(opt => {
      opt.classList.toggle('selected', opt.getAttribute('data-theme-value') === appearance.theme);
    });

    accentButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-accent-value') === appearance.accent);
    });

    if (densitySelect) densitySelect.value = appearance.density || 'default';
    if (reducedMotionToggle) reducedMotionToggle.checked = Boolean(appearance.reducedMotion);
    if (fontSizeSlider) fontSizeSlider.value = appearance.fontSize || 16;
    if (fontSizeBadge) fontSizeBadge.textContent = `${appearance.fontSize || 16}px`;
  };

  // Theme card click listeners
  themeOptions.forEach(card => {
    card.addEventListener('click', () => {
      const selectedTheme = card.getAttribute('data-theme-value');
      appState.set('appearance.theme', selectedTheme, true);
      applyThemeToDOM();
      toast.info('Theme Updated', `Theme set to ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}.`);
    });
  });

  // Accent button click listeners
  accentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const accent = btn.getAttribute('data-accent-value');
      appState.set('appearance.accent', accent, true);
      applyThemeToDOM();
      toast.info('Accent Updated', `Accent color changed to ${accent.charAt(0).toUpperCase() + accent.slice(1)}.`);
    });
  });

  // Density selector
  if (densitySelect) {
    densitySelect.addEventListener('change', (e) => {
      appState.set('appearance.density', e.target.value, true);
      applyThemeToDOM();
    });
  }

  // Reduced motion
  if (reducedMotionToggle) {
    reducedMotionToggle.addEventListener('change', (e) => {
      appState.set('appearance.reducedMotion', e.target.checked, true);
      document.body.classList.toggle('reduced-motion', e.target.checked);
    });
  }

  // Font size slider
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', (e) => {
      const size = Number(e.target.value);
      if (fontSizeBadge) fontSizeBadge.textContent = `${size}px`;
      document.documentElement.style.fontSize = `${size}px`;
    });

    fontSizeSlider.addEventListener('change', (e) => {
      appState.set('appearance.fontSize', Number(e.target.value), true);
    });
  }

  // Initial Sync
  applyThemeToDOM();

  // Listen for system theme changes if set to system
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (appState.get('appearance.theme') === 'system') {
        applyThemeToDOM();
      }
    });
  }

  appState.subscribe((state, path) => {
    if (path.startsWith('appearance') || path === '') {
      applyThemeToDOM();
    }
  });
}
