/* ==========================================================================
   REACTIVE STATE STORE WITH LOCALSTORAGE PERSISTENCE
   ========================================================================== */

const STORAGE_KEY = 'flyrank_app_settings_v1';

export const DEFAULT_STATE = {
  profile: {
    name: 'Alex Sterling',
    email: 'alex.sterling@flyrank.ai',
    jobTitle: 'Principal AI Systems Engineer',
    timezone: 'UTC-08:00',
    bio: 'Building scalable autonomous agent frameworks and frontier web interfaces.',
    avatarUrl: '',
    notificationPreference: 'realtime'
  },
  appearance: {
    theme: 'dark', // 'dark' | 'light' | 'system'
    accent: 'indigo', // 'indigo' | 'violet' | 'emerald' | 'cyan' | 'rose' | 'amber'
    density: 'default', // 'compact' | 'default' | 'comfortable'
    reducedMotion: false,
    fontSize: 16
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMins: 30,
    activeSessions: [
      { id: 'sess_1', device: 'Chrome on MacOS (Silicon)', ip: '192.168.1.104', location: 'San Francisco, US', current: true, time: 'Active now' },
      { id: 'sess_2', device: 'FlyRank CLI on Ubuntu 24.04', ip: '10.0.4.82', location: 'US-West Datacenter', current: false, time: '2 hours ago' },
      { id: 'sess_3', device: 'Mobile Safari on iPhone 15 Pro', ip: '172.56.21.90', location: 'San Jose, US', current: false, time: 'Yesterday' }
    ]
  },
  notifications: {
    emailDigest: true,
    inAppAlerts: true,
    securityAlerts: true,
    marketingUpdates: false,
    webhookFailures: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  },
  aiPreferences: {
    defaultModel: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.95,
    streamingEnabled: true,
    systemPrompt: 'You are an expert AI software architect and assistant. Provide structured, production-ready solutions.'
  },
  apiKeys: [
    { id: 'key_1', name: 'Production Backend Server', prefix: 'flk_live_89a...', created: '2026-06-15', lastUsed: '2 mins ago' },
    { id: 'key_2', name: 'CI/CD Automated Testing', prefix: 'flk_test_42b...', created: '2026-07-01', lastUsed: '4 hours ago' }
  ]
};

class AppStateStore {
  constructor() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.subscribers = new Set();
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    this.loadFromStorage();
  }

  /**
   * Loads persisted state from localStorage.
   */
  loadFromStorage() {
    if (!this.isBrowser) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      }
    } catch (e) {
      console.warn('Could not load stored state:', e);
    }
  }

  /**
   * Saves current state to localStorage.
   */
  saveToStorage() {
    if (!this.isBrowser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not persist state:', e);
    }
  }

  /**
   * Retrieves a value at the specified dot-notated path.
   * @param {string} [path='']
   * @returns {*}
   */
  get(path = '') {
    if (!path) return this.state;
    const parts = path.split('.');
    let curr = this.state;
    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  /**
   * Sets a value at dot-notated path and notifies listeners.
   * @param {string} path
   * @param {*} value
   * @param {boolean} [persist=true]
   */
  set(path, value, persist = true) {
    if (!path) return;
    const parts = path.split('.');
    let curr = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in curr) || typeof curr[part] !== 'object') {
        curr[part] = {};
      }
      curr = curr[part];
    }
    curr[parts[parts.length - 1]] = value;

    if (persist) {
      this.saveToStorage();
    }
    this.notify(path, value);
  }

  /**
   * Subscribes a listener to state updates.
   * @param {Function} callback (state, path, value) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notifies all registered subscribers.
   */
  notify(path, value) {
    for (const sub of this.subscribers) {
      try {
        sub(this.state, path, value);
      } catch (err) {
        console.error('Subscriber notification error:', err);
      }
    }
  }

  /**
   * Resets all settings to original factory defaults.
   */
  resetToDefaults() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveToStorage();
    this.notify('', this.state);
  }

  /**
   * Exports full state as JSON string.
   */
  exportJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Imports state from JSON string.
   */
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.state = this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), parsed);
      this.saveToStorage();
      this.notify('', this.state);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        if (!Array.isArray(source[key])) {
          Object.assign(source[key], this._deepMerge(target[key], source[key]));
        } else {
          target[key] = source[key];
        }
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

export const appState = new AppStateStore();
