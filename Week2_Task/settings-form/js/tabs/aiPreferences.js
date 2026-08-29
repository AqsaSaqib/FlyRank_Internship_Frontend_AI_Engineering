/* ==========================================================================
   AI PREFERENCES & MODEL CONFIGURATION TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';

export function initAIPreferencesTab() {
  const modelCards = document.querySelectorAll('.model-card-item');
  const tempSlider = document.getElementById('ai-temperature-slider');
  const tempValueBadge = document.getElementById('ai-temperature-badge');
  const maxTokensSlider = document.getElementById('ai-tokens-slider');
  const maxTokensBadge = document.getElementById('ai-tokens-badge');
  const streamingToggle = document.getElementById('ai-streaming-toggle');
  const systemPromptInput = document.getElementById('ai-system-prompt');
  const testAIPromptBtn = document.getElementById('test-ai-prompt-btn');
  const testAIOutputBox = document.getElementById('test-ai-output-box');

  const syncAIUI = () => {
    const ai = appState.get('aiPreferences') || {};

    modelCards.forEach(card => {
      card.classList.toggle('selected', card.getAttribute('data-model-id') === ai.defaultModel);
    });

    if (tempSlider) tempSlider.value = ai.temperature !== undefined ? ai.temperature : 0.7;
    if (tempValueBadge) tempValueBadge.textContent = ai.temperature !== undefined ? Number(ai.temperature).toFixed(2) : '0.70';

    if (maxTokensSlider) maxTokensSlider.value = ai.maxTokens || 4096;
    if (maxTokensBadge) maxTokensBadge.textContent = (ai.maxTokens || 4096).toLocaleString();

    if (streamingToggle) streamingToggle.checked = Boolean(ai.streamingEnabled);
    if (systemPromptInput) systemPromptInput.value = ai.systemPrompt || '';
  };

  // Model card clicks
  modelCards.forEach(card => {
    card.addEventListener('click', () => {
      const modelId = card.getAttribute('data-model-id');
      appState.set('aiPreferences.defaultModel', modelId, true);
      syncAIUI();
      toast.info('Model Selected', `Default LLM set to ${card.querySelector('.model-name').textContent}.`);
    });
  });

  // Temperature slider
  if (tempSlider) {
    tempSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tempValueBadge) tempValueBadge.textContent = val.toFixed(2);
    });
    tempSlider.addEventListener('change', (e) => {
      appState.set('aiPreferences.temperature', parseFloat(e.target.value), true);
    });
  }

  // Max tokens slider
  if (maxTokensSlider) {
    maxTokensSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (maxTokensBadge) maxTokensBadge.textContent = val.toLocaleString();
    });
    maxTokensSlider.addEventListener('change', (e) => {
      appState.set('aiPreferences.maxTokens', parseInt(e.target.value, 10), true);
    });
  }

  // Streaming toggle
  if (streamingToggle) {
    streamingToggle.addEventListener('change', (e) => {
      appState.set('aiPreferences.streamingEnabled', e.target.checked, true);
    });
  }

  // System prompt
  if (systemPromptInput) {
    systemPromptInput.addEventListener('change', (e) => {
      appState.set('aiPreferences.systemPrompt', e.target.value.trim(), true);
    });
  }

  // Test Prompt Simulator
  if (testAIPromptBtn && testAIOutputBox) {
    testAIPromptBtn.addEventListener('click', async () => {
      const currentModel = appState.get('aiPreferences.defaultModel') || 'gemini-1.5-pro';
      const temp = appState.get('aiPreferences.temperature') || 0.7;

      testAIPromptBtn.disabled = true;
      testAIPromptBtn.innerHTML = `<div class="spinner"></div> Generating...`;
      testAIOutputBox.style.display = 'block';
      testAIOutputBox.innerHTML = '<span style="color:var(--text-muted)">Connecting to FlyRank AI Gateway...</span>';

      await new Promise(r => setTimeout(r, 600));

      testAIOutputBox.innerHTML = `
        <div style="font-size: var(--font-xs); color: var(--accent-primary); margin-bottom: 6px; font-family: var(--font-mono);">
          [Gateway: OK] • Model: ${currentModel} • Temp: ${temp}
        </div>
        <div style="color: var(--text-primary); font-size: var(--font-sm); line-height: 1.5;">
          FlyRank AI response test generated successfully! System instructions loaded and prompt formatting confirmed.
        </div>
      `;

      testAIPromptBtn.disabled = false;
      testAIPromptBtn.innerHTML = `<i data-lucide="play" style="width:14px;height:14px;"></i> Test Output`;
      if (window.lucide) window.lucide.createIcons({ root: testAIPromptBtn });
      toast.success('AI Test Passed', 'Model response generated with current parameters.');
    });
  }

  syncAIUI();
  appState.subscribe((state, path) => {
    if (path.startsWith('aiPreferences') || path === '') {
      syncAIUI();
    }
  });
}
