/* ==========================================================================
   APPEARANCE & THEME CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';

export function initAppearanceTab() {
  const themeCards = document.querySelectorAll('.theme-card-option');
  const swatches = document.querySelectorAll('.swatch-btn');
  const densityBtns = document.querySelectorAll('[data-density-val]');
  const fontScaleSlider = document.getElementById('font-scale-slider');
  const fontScaleValue = document.getElementById('font-scale-value');
  const reduceMotionToggle = document.getElementById('toggle-reduce-motion');
  const highContrastToggle = document.getElementById('toggle-high-contrast');

  const mediaQueryDark = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (theme) => {
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = mediaQueryDark.matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    themeCards.forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-theme-val') === theme);
    });
  };

  const applyAccent = (accent) => {
    document.documentElement.setAttribute('data-accent', accent);
    swatches.forEach(sw => {
      sw.classList.toggle('active', sw.getAttribute('data-accent-val') === accent);
    });
  };

  const applyDensity = (density) => {
    document.documentElement.setAttribute('data-density', density);
    densityBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-density-val') === density);
    });
  };

  const applyFontScale = (scale) => {
    document.documentElement.style.setProperty('--font-scale', scale);
    if (fontScaleSlider) fontScaleSlider.value = scale;
    if (fontScaleValue) fontScaleValue.textContent = `${Math.round(scale * 100)}%`;
  };

  const applyAccessibility = (reduceMotion, highContrast) => {
    document.documentElement.setAttribute('data-reduced-motion', reduceMotion ? 'true' : 'false');
    if (reduceMotionToggle) reduceMotionToggle.checked = reduceMotion;
    if (highContrastToggle) highContrastToggle.checked = highContrast;
  };

  // Sync with State
  const syncFromState = () => {
    const a = appState.get('appearance') || {};
    applyTheme(a.theme || 'dark');
    applyAccent(a.accent || 'indigo');
    applyDensity(a.density || 'default');
    applyFontScale(a.fontScale || 1.0);
    applyAccessibility(Boolean(a.reduceMotion), Boolean(a.highContrast));
  };

  // Event Listeners
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme-val');
      appState.set('appearance.theme', theme);
      applyTheme(theme);
      toast.info('Theme Updated', `Switched theme to ${theme}.`);
    });
  });

  mediaQueryDark.addEventListener('change', () => {
    if (appState.get('appearance.theme') === 'system') {
      applyTheme('system');
    }
  });

  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      const accent = sw.getAttribute('data-accent-val');
      appState.set('appearance.accent', accent);
      applyAccent(accent);
    });
  });

  densityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const density = btn.getAttribute('data-density-val');
      appState.set('appearance.density', density);
      applyDensity(density);
    });
  });

  if (fontScaleSlider) {
    fontScaleSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      appState.set('appearance.fontScale', scale);
      applyFontScale(scale);
    });
  }

  if (reduceMotionToggle) {
    reduceMotionToggle.addEventListener('change', (e) => {
      appState.set('appearance.reduceMotion', e.target.checked);
      applyAccessibility(e.target.checked, appState.get('appearance.highContrast'));
    });
  }

  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', (e) => {
      appState.set('appearance.highContrast', e.target.checked);
      applyAccessibility(appState.get('appearance.reduceMotion'), e.target.checked);
    });
  }

  // Initial Sync
  syncFromState();
  appState.subscribe((state, path) => {
    if (path.startsWith('appearance') || path === '') {
      syncFromState();
    }
  });
}
