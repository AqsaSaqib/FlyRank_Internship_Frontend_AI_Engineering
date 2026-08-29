/* ==========================================================================
   CENTRALIZED STATE MANAGEMENT & PERSISTENCE
   ========================================================================== */

const STORAGE_KEY = 'flyrank_app_settings_v1';

export const DEFAULT_SETTINGS = {
  profile: {
    avatar: '',
    initials: 'AS',
    name: 'Alex Sterling',
    firstName: 'Alex',
    lastName: 'Sterling',
    username: 'alexsterling',
    email: 'alex.sterling@flyrank.ai',
    notificationPreference: 'all',
    backupEmail: 'alex.personal@gmail.com',
    phone: '+1 (555) 234-5678',
    bio: 'Lead Frontend & AI Engineer designing intuitive human-AI interfaces.',
    timezone: 'America/New_York',
    language: 'en-US',
    jobTitle: 'Senior Frontend AI Engineer',
    organization: 'FlyRank Technologies'
  },
  appearance: {
    theme: 'dark', // 'light' | 'dark' | 'system'
    accent: 'indigo', // 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan'
    density: 'default', // 'compact' | 'default' | 'comfortable'
    fontScale: 1.0,
    reduceMotion: false,
    highContrast: false
  },
  security: {
    twoFactorEnabled: true,
    requirePasswordOnChange: true,
    sessionTimeoutMinutes: 60,
    activeSessions: [
      { id: 'sess_1', device: 'Windows 11 (Chrome 128)', ip: '192.168.1.104', location: 'New York, US', current: true, time: 'Active now' },
      { id: 'sess_2', device: 'iPhone 15 Pro (Safari 17)', ip: '172.56.21.9', location: 'New York, US', current: false, time: '2 hours ago' },
      { id: 'sess_3', device: 'MacBook Pro (Firefox 125)', ip: '108.45.19.12', location: 'Boston, US', current: false, time: '3 days ago' }
    ]
  },
  notifications: {
    channels: {
      productUpdates: { email: true, push: true, inapp: true, sms: false },
      securityAlerts: { email: true, push: true, inapp: true, sms: true },
      teamMentions: { email: true, push: true, inapp: true, sms: false },
      analyticsDigest: { email: true, push: false, inapp: true, sms: false },
      marketing: { email: false, push: false, inapp: false, sms: false }
    },
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00'
    }
  },
  aiPreferences: {
    defaultModel: 'claude-3-5-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are an elite AI developer assistant. Provide concise, clean, and modern code snippets with explanatory commentary.',
    webGrounding: true,
    codeInterpreter: true,
    streamingResponse: true
  },
  apiKeys: [
    { id: 'key_1', name: 'Production Frontend App', key: 'sk-live-94a821e90b4cf288d3e91a0c', maskedKey: 'sk-live-••••••••••••••••1a0c', created: '2026-05-12', lastUsed: '2 mins ago' },
    { id: 'key_2', name: 'Staging CI/CD Pipeline', key: 'sk-test-47f201bca942ee7710c85b12', maskedKey: 'sk-test-••••••••••••••••5b12', created: '2026-07-04', lastUsed: '1 day ago' }
  ],
  webhooks: {
    url: 'https://api.flyrank.ai/v1/webhooks/incoming',
    events: ['model.completed', 'billing.invoice_created'],
    secretKey: 'whsec_983df829a3e21190bcfa49'
  },
  billing: {
    currentPlan: 'pro', // 'starter' | 'pro' | 'enterprise'
    billingCycle: 'monthly',
    cardBrand: 'visa',
    cardLast4: '4242',
    cardExpiry: '09/28',
    usage: {
      apiTokens: 64, // percentage
      storage: 38,
      seats: 3
    }
  },
  privacy: {
    telemetry: true,
    cookieConsent: true,
    publicProfile: true
  }
};

class StateStore {
  constructor() {
    this.savedState = this.loadFromStorage();
    this.currentState = JSON.parse(JSON.stringify(this.savedState));
    this.listeners = new Set();
    this.dirtyListeners = new Set();
    this.isDirtyState = false;
  }

  loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (serialized) {
          return JSON.parse(serialized);
        }
      }
    } catch (e) {
      console.warn('Could not read settings from localStorage, using defaults', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  saveToStorage() {
    try {
      this.savedState = JSON.parse(JSON.stringify(this.currentState));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedState));
      }
      this.setDirty(false);
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
      return false;
    }
  }

  discardChanges() {
    this.currentState = JSON.parse(JSON.stringify(this.savedState));
    this.setDirty(false);
    this.notifyListeners();
  }

  resetToDefaults() {
    this.currentState = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.saveToStorage();
  }

  get(path) {
    const parts = path.split('.');
    let curr = this.currentState;
    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  set(path, value, autoSave = false) {
    const parts = path.split('.');
    let curr = this.currentState;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;

    if (autoSave) {
      this.saveToStorage();
    } else {
      this.checkDirty();
    }
    this.notifyListeners(path);
  }

  checkDirty() {
    const isDifferent = JSON.stringify(this.savedState) !== JSON.stringify(this.currentState);
    this.setDirty(isDifferent);
  }

  setDirty(dirty) {
    if (this.isDirtyState !== dirty) {
      this.isDirtyState = dirty;
      this.dirtyListeners.forEach(fn => fn(dirty));
    }
  }

  isDirty() {
    return this.isDirtyState;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onDirtyChange(callback) {
    this.dirtyListeners.add(callback);
    return () => this.dirtyListeners.delete(callback);
  }

  notifyListeners(changedPath = '') {
    this.listeners.forEach(fn => fn(this.currentState, changedPath));
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      // Validate basic structure
      if (typeof parsed === 'object' && parsed !== null) {
        this.currentState = { ...DEFAULT_SETTINGS, ...parsed };
        this.saveToStorage();
        return { success: true };
      }
      return { success: false, error: 'Invalid configuration format' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  exportJSON() {
    return JSON.stringify(this.currentState, null, 2);
  }
}

export const appState = new StateStore();
