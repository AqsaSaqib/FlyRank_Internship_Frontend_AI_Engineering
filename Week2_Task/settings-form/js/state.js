/**
 * state.js — Lightweight reactive state store with localStorage persistence.
 *
 * Usage:
 *   import { appState } from './state.js';
 *   appState.get('profile.name');
 *   appState.set('profile.name', 'Alice');
 *   appState.subscribe(handler);   // called with (path, value) on every set()
 */

const STORAGE_KEY = 'flyrank_settings_v2';

const defaultState = {
  profile: {
    name: '',
    email: '',
  },
  security: {
    password: '',
  },
  preferences: {
    theme: 'system',
    notifications: 'important',
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getByPath(obj, path) {
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
      const parsed = JSON.parse(raw);
      return parsed;
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

class AppState {
  constructor(initial) {
    this._data = deepClone(initial);
    this._subscribers = [];

    // Hydrate from localStorage (skip password for security)
    const stored = loadFromStorage();
    if (stored) {
      if (stored.profile)      this._data.profile      = { ...this._data.profile,      ...stored.profile };
      if (stored.preferences)  this._data.preferences  = { ...this._data.preferences,  ...stored.preferences };
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

  _persist() {
    const toStore = deepClone(this._data);
    if (toStore.security) delete toStore.security.password;
    saveToStorage(toStore);
  }
}

export const appState = new AppState(defaultState);
