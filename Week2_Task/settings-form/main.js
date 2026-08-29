/**
 * main.js — Entry point. Boots the settings form on DOMContentLoaded.
 */

import './css/variables.css';
import './css/base.css';
import './css/components.css';
import './css/responsive.css';

import { initSettingsForm } from './js/settingsForm.js';

document.addEventListener('DOMContentLoaded', () => {
  initSettingsForm();
});
