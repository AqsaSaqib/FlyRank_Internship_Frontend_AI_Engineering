/* ==========================================================================
   AI & MODEL PREFERENCES TAB CONTROLLER
   ========================================================================== */

import { appState } from '../state.js';
import { toast } from '../toast.js';

export function initAIPreferencesTab() {
  const modelCards = document.querySelectorAll('.ai-model-card');
  const tempSlider = document.getElementById('ai-temp-slider');
  const tempValBadge = document.getElementById('ai-temp-val');
  const tempGaugeDesc = document.getElementById('ai-temp-desc');

  const tokensSlider = document.getElementById('ai-tokens-slider');
  const tokensValBadge = document.getElementById('ai-tokens-val');

  const systemPromptInput = document.getElementById('ai-system-prompt');
  const promptCharCount = document.getElementById('prompt-char-count');

  const toggleWebGrounding = document.getElementById('toggle-web-grounding');
  const toggleCodeInterpreter = document.getElementById('toggle-code-interpreter');
  const toggleStreaming = document.getElementById('toggle-streaming');

  const syncFromState = () => {
    const ai = appState.get('aiPreferences') || {};

    // Active Model Card
    modelCards.forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-model-id') === ai.defaultModel);
    });

    // Temperature
    const temp = ai.temperature !== undefined ? ai.temperature : 0.7;
    if (tempSlider) tempSlider.value = temp;
    if (tempValBadge) tempValBadge.textContent = Number(temp).toFixed(2);
    updateTempDescription(temp);

    // Tokens
    const tokens = ai.maxTokens || 4096;
    if (tokensSlider) tokensSlider.value = tokens;
    if (tokensValBadge) tokensValBadge.textContent = `${tokens.toLocaleString()} tokens`;

    // System Prompt
    if (systemPromptInput) {
      systemPromptInput.value = ai.systemPrompt || '';
      updatePromptCounter();
    }

    // Toggles
    if (toggleWebGrounding) toggleWebGrounding.checked = Boolean(ai.webGrounding);
    if (toggleCodeInterpreter) toggleCodeInterpreter.checked = Boolean(ai.codeInterpreter);
    if (toggleStreaming) toggleStreaming.checked = Boolean(ai.streamingResponse);
  };

  const updateTempDescription = (temp) => {
    if (!tempGaugeDesc) return;
    if (temp <= 0.3) {
      tempGaugeDesc.textContent = 'Precise & Code-Exact (Low randomness)';
    } else if (temp <= 0.7) {
      tempGaugeDesc.textContent = 'Balanced & Conversational (Optimal for pair programming)';
    } else {
      tempGaugeDesc.textContent = 'Creative & Exploratory (High variation)';
    }
  };

  const updatePromptCounter = () => {
    if (systemPromptInput && promptCharCount) {
      promptCharCount.textContent = `${systemPromptInput.value.length} characters`;
    }
  };

  // Event Listeners
  modelCards.forEach(card => {
    card.addEventListener('click', () => {
      const modelId = card.getAttribute('data-model-id');
      appState.set('aiPreferences.defaultModel', modelId);
      modelCards.forEach(c => c.classList.toggle('active', c.getAttribute('data-model-id') === modelId));
      toast.info('Default Model Changed', `Primary model set to ${card.querySelector('.ai-model-name').textContent}.`);
    });
  });

  if (tempSlider) {
    tempSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (tempValBadge) tempValBadge.textContent = val.toFixed(2);
      updateTempDescription(val);
      appState.set('aiPreferences.temperature', val);
    });
  }

  if (tokensSlider) {
    tokensSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (tokensValBadge) tokensValBadge.textContent = `${val.toLocaleString()} tokens`;
      appState.set('aiPreferences.maxTokens', val);
    });
  }

  if (systemPromptInput) {
    systemPromptInput.addEventListener('input', (e) => {
      appState.set('aiPreferences.systemPrompt', e.target.value);
      updatePromptCounter();
    });
  }

  // Preset Template Chips
  document.querySelectorAll('[data-prompt-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-prompt-preset');
      const presets = {
        developer: 'You are an elite senior software architect. Provide clean, modular, and performant code following best practices.',
        debugger: 'You are a meticulous bug diagnostic agent. Focus on edge-cases, memory leaks, and race condition prevention.',
        creative: 'You are an innovative product designer and tech visionary. Generate imaginative solutions and rich interactive UI ideas.'
      };
      if (presets[preset] && systemPromptInput) {
        systemPromptInput.value = presets[preset];
        appState.set('aiPreferences.systemPrompt', presets[preset]);
        updatePromptCounter();
        toast.info('Template Applied', `Loaded "${preset}" system instructions.`);
      }
    });
  });

  if (toggleWebGrounding) {
    toggleWebGrounding.addEventListener('change', (e) => appState.set('aiPreferences.webGrounding', e.target.checked));
  }
  if (toggleCodeInterpreter) {
    toggleCodeInterpreter.addEventListener('change', (e) => appState.set('aiPreferences.codeInterpreter', e.target.checked));
  }
  if (toggleStreaming) {
    toggleStreaming.addEventListener('change', (e) => appState.set('aiPreferences.streamingResponse', e.target.checked));
  }

  // Initial Sync
  syncFromState();
  appState.subscribe((state, path) => {
    if (path.startsWith('aiPreferences') || path === '') {
      syncFromState();
    }
  });
}
