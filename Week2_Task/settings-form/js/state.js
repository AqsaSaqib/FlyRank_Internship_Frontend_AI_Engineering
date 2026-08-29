/**
 * state.js — Lightweight reactive state store with localStorage persistence.
 *
 * Usage:
 *   import { appState } from './state.js';
 *   appState.get('profile.name');
 *   appState.set('profile.name', 'Alice');
 *   appState.subscribe(handler); // called with (path, value) on every set()
 */

const STORAGE_KEY = 'flyrank_settings_v2';

export const defaultState = {
  profile: {
    name: 'Jane Doe',
    email: 'jane.doe@flyrank.io',
    bio: 'Lead AI & Frontend Engineer building modern predictive interfaces.',
    title: 'Senior Frontend Engineer',
  },
  account: {
    username: 'janedoe',
    language: 'en',
    timezone: 'UTC',
    status: 'Active',
    plan: 'Pro Plan',
    memberSince: 'March 2024',
    emailVerified: true,
  },
  security: {
    password: '',
    twoFactorEnabled: false,
    backupCodesGenerated: false,
    sessions: [
      { id: 'sess_1', device: 'Chrome on macOS (Sonoma)', location: 'San Francisco, US', ip: '192.0.2.42', current: true, lastActive: 'Active now' },
      { id: 'sess_2', device: 'FlyRank Mobile (iOS 17.5)', location: 'San Francisco, US', ip: '192.0.2.98', current: false, lastActive: '2 hours ago' },
      { id: 'sess_3', device: 'Firefox on Windows 11', location: 'London, UK', ip: '198.51.100.12', current: false, lastActive: '3 days ago' },
    ],
  },
  notifications: {
    emailDigest: true,
    securityAlerts: true,
    productUpdates: false,
    communityMentions: true,
    frequency: 'important',
    pushEnabled: true,
    soundEnabled: false,
  },
  appearance: {
    theme: 'system',
    accentColor: 'indigo',
    compactMode: false,
    highContrast: false,
  },
  privacy: {
    profileVisibility: 'public',
    shareAnalytics: false,
    personalizedAds: false,
    showOnlineStatus: true,
    searchIndexing: true,
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    autoSave: true,
    startPage: 'profile',
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getByPath(obj, path) {
  if (!path) return obj;
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((acc, key) => {
    if (acc[key] == null || typeof acc[key] !== 'object') acc[key] = {};
    return acc[key];
  }, obj);
  target[last] = value;
}

function loadFromStorage() {
  try {
    const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) { /* ignore */ }
  return null;
}

function saveToStorage(data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (_) { /* ignore */ }
}

export class AppState {
  constructor(initial) {
    this._data = deepClone(initial);
    this._subscribers = [];

    // Hydrate from localStorage (skip password for security)
    const stored = loadFromStorage();
    if (stored) {
      if (stored.profile)       this._data.profile       = { ...this._data.profile,       ...stored.profile };
      if (stored.account)       this._data.account       = { ...this._data.account,       ...stored.account };
      if (stored.preferences)   this._data.preferences   = { ...this._data.preferences,   ...stored.preferences };
      if (stored.notifications) this._data.notifications = { ...this._data.notifications, ...stored.notifications };
      if (stored.appearance)    this._data.appearance    = { ...this._data.appearance,    ...stored.appearance };
      if (stored.privacy)       this._data.privacy       = { ...this._data.privacy,       ...stored.privacy };
      if (stored.security) {
        this._data.security.twoFactorEnabled = stored.security.twoFactorEnabled ?? false;
        if (Array.isArray(stored.security.sessions)) {
          this._data.security.sessions = stored.security.sessions;
        }
      }
    }
  }

  /** Get value at a dot-notated path, e.g. 'profile.name' */
  get(path) {
    return getByPath(this._data, path);
  }

  /** Set value at a dot-notated path and notify subscribers */
  set(path, value) {
    setByPath(this._data, path, value);
    this._persist();
    this._subscribers.forEach(fn => fn(path, value));
  }

  /** Terminate all sessions except current active session */
  terminateOtherSessions() {
    const currentSessions = this._data.security?.sessions || [];
    this._data.security.sessions = currentSessions.filter(s => s.current);
    this._persist();
    this._subscribers.forEach(fn => fn('security.sessions', this._data.security.sessions));
    return this._data.security.sessions;
  }

  /** Toggle 2FA status */
  toggleTwoFactor(enabled) {
    this._data.security.twoFactorEnabled = Boolean(enabled);
    this._persist();
    this._subscribers.forEach(fn => fn('security.twoFactorEnabled', this._data.security.twoFactorEnabled));
  }

  /** Subscribe to any state change */
  subscribe(fn) {
    this._subscribers.push(fn);
    return () => {
      this._subscribers = this._subscribers.filter(s => s !== fn);
    };
  }

  /** Export full state as JSON string (excluding password) */
  exportJSON() {
    const exported = deepClone(this._data);
    if (exported.security) delete exported.security.password;
    return JSON.stringify(exported, null, 2);
  }

  /** Return raw data snapshot */
  snapshot() {
    return deepClone(this._data);
  }

  /** Reset state to initial defaults */
  resetToDefaults() {
    this._data = deepClone(defaultState);
    this._persist();
    this._subscribers.forEach(fn => fn('*', this._data));
  }

  _persist() {
    const toStore = deepClone(this._data);
    if (toStore.security) delete toStore.security.password;
    saveToStorage(toStore);
  }
}

export const appState = new AppState(defaultState);
