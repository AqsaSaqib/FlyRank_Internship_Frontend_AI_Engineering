/**
 * tests/settingsForm.test.js
 *
 * Automated tests using Node's built-in `node:test` and `node:assert`.
 * Run with: node --test tests/settingsForm.test.js
 *
 * Tests cover:
 *   - validateName
 *   - validateEmail
 *   - validatePassword
 *   - validateSelect
 *   - evaluatePasswordStrength
 *   - validateSettingsForm (full form)
 *   - AppState (state store)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import the pure validation functions
import {
  validateName,
  validateEmail,
  validatePassword,
  validateSelect,
  evaluatePasswordStrength,
  validateSettingsForm,
  THEME_OPTIONS,
  NOTIFICATION_OPTIONS,
  PASSWORD_MIN_LENGTH,
} from '../js/validation.js';

// Import the state store (uses a localStorage stub below)
import { appState } from '../js/state.js';

// ── Name Validation ────────────────────────────────────────────────────────

describe('validateName', () => {
  it('rejects empty string', () => {
    const r = validateName('');
    assert.equal(r.valid, false);
    assert.ok(r.message.length > 0);
  });

  it('rejects null', () => {
    const r = validateName(null);
    assert.equal(r.valid, false);
  });

  it('rejects undefined', () => {
    const r = validateName(undefined);
    assert.equal(r.valid, false);
  });

  it('rejects whitespace-only string', () => {
    const r = validateName('   ');
    assert.equal(r.valid, false);
  });

  it('rejects single character', () => {
    const r = validateName('A');
    assert.equal(r.valid, false);
    assert.match(r.message, /2 characters/i);
  });

  it('accepts two characters', () => {
    const r = validateName('Jo');
    assert.equal(r.valid, true);
    assert.equal(r.message, '');
  });

  it('accepts full name with spaces', () => {
    const r = validateName('Jane Smith');
    assert.equal(r.valid, true);
  });

  it('accepts name with leading/trailing whitespace (trimmed)', () => {
    const r = validateName('  Alice  ');
    assert.equal(r.valid, true);
  });
});

// ── Email Validation ───────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('rejects empty string', () => {
    const r = validateEmail('');
    assert.equal(r.valid, false);
    assert.match(r.message, /required/i);
  });

  it('rejects null', () => {
    const r = validateEmail(null);
    assert.equal(r.valid, false);
  });

  it('rejects undefined', () => {
    const r = validateEmail(undefined);
    assert.equal(r.valid, false);
  });

  it('rejects string without @', () => {
    const r = validateEmail('notanemail');
    assert.equal(r.valid, false);
    assert.match(r.message, /valid email/i);
  });

  it('rejects email with no domain', () => {
    const r = validateEmail('user@');
    assert.equal(r.valid, false);
  });

  it('rejects email with no TLD', () => {
    const r = validateEmail('user@domain');
    assert.equal(r.valid, false);
  });

  it('rejects email with spaces', () => {
    const r = validateEmail('user @example.com');
    assert.equal(r.valid, false);
  });

  it('accepts a standard email', () => {
    const r = validateEmail('user@example.com');
    assert.equal(r.valid, true);
    assert.equal(r.message, '');
  });

  it('accepts email with subdomain', () => {
    const r = validateEmail('name@mail.example.co.uk');
    assert.equal(r.valid, true);
  });

  it('accepts email with plus sign', () => {
    const r = validateEmail('user+tag@example.com');
    assert.equal(r.valid, true);
  });

  it('accepts email with dots in local part', () => {
    const r = validateEmail('first.last@example.com');
    assert.equal(r.valid, true);
  });

  it('accepts email with leading/trailing whitespace (trimmed)', () => {
    const r = validateEmail('  user@example.com  ');
    assert.equal(r.valid, true);
  });
});

// ── Password Validation ────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('accepts empty password (optional field)', () => {
    const r = validatePassword('');
    assert.equal(r.valid, true);
  });

  it('accepts null password (optional field)', () => {
    const r = validatePassword(null);
    assert.equal(r.valid, true);
  });

  it('accepts undefined password (optional field)', () => {
    const r = validatePassword(undefined);
    assert.equal(r.valid, true);
  });

  it(`rejects password shorter than ${PASSWORD_MIN_LENGTH} chars`, () => {
    const r = validatePassword('abc');
    assert.equal(r.valid, false);
    assert.match(r.message, /8 characters/i);
  });

  it(`rejects password of exactly ${PASSWORD_MIN_LENGTH - 1} chars`, () => {
    const r = validatePassword('a'.repeat(PASSWORD_MIN_LENGTH - 1));
    assert.equal(r.valid, false);
  });

  it(`accepts password of exactly ${PASSWORD_MIN_LENGTH} chars`, () => {
    const r = validatePassword('a'.repeat(PASSWORD_MIN_LENGTH));
    assert.equal(r.valid, true);
  });

  it('accepts a strong password', () => {
    const r = validatePassword('Str0ng!Pass#2024');
    assert.equal(r.valid, true);
  });
});

// ── Select Validation ──────────────────────────────────────────────────────

describe('validateSelect (theme)', () => {
  it('rejects empty string', () => {
    const r = validateSelect('', THEME_OPTIONS, 'Theme preference');
    assert.equal(r.valid, false);
    assert.match(r.message, /required/i);
  });

  it('rejects invalid option', () => {
    const r = validateSelect('solarized', THEME_OPTIONS, 'Theme preference');
    assert.equal(r.valid, false);
    assert.match(r.message, /invalid/i);
  });

  it('accepts "light"', () => {
    const r = validateSelect('light', THEME_OPTIONS, 'Theme preference');
    assert.equal(r.valid, true);
  });

  it('accepts "dark"', () => {
    const r = validateSelect('dark', THEME_OPTIONS, 'Theme preference');
    assert.equal(r.valid, true);
  });

  it('accepts "system"', () => {
    const r = validateSelect('system', THEME_OPTIONS, 'Theme preference');
    assert.equal(r.valid, true);
  });
});

describe('validateSelect (notifications)', () => {
  it('rejects empty string', () => {
    const r = validateSelect('', NOTIFICATION_OPTIONS, 'Notification preference');
    assert.equal(r.valid, false);
  });

  it('rejects unknown value', () => {
    const r = validateSelect('weekly', NOTIFICATION_OPTIONS, 'Notification preference');
    assert.equal(r.valid, false);
  });

  it('accepts "all"', () => {
    const r = validateSelect('all', NOTIFICATION_OPTIONS, 'Notification preference');
    assert.equal(r.valid, true);
  });

  it('accepts "important"', () => {
    const r = validateSelect('important', NOTIFICATION_OPTIONS, 'Notification preference');
    assert.equal(r.valid, true);
  });

  it('accepts "none"', () => {
    const r = validateSelect('none', NOTIFICATION_OPTIONS, 'Notification preference');
    assert.equal(r.valid, true);
  });
});

// ── Password Strength ──────────────────────────────────────────────────────

describe('evaluatePasswordStrength', () => {
  it('returns score 0 for empty password', () => {
    const r = evaluatePasswordStrength('');
    assert.equal(r.score, 0);
    assert.equal(r.label, '');
  });

  it('returns score 1 (Weak) for very short/simple password', () => {
    const r = evaluatePasswordStrength('abc');
    assert.equal(r.score, 1);
    assert.equal(r.label, 'Weak');
  });

  it('returns score >= 2 for moderate password', () => {
    const r = evaluatePasswordStrength('password1');
    assert.ok(r.score >= 2);
  });

  it('returns score 4 (Strong) for complex password', () => {
    const r = evaluatePasswordStrength('Str0ng!Pass#2024');
    assert.equal(r.score, 4);
    assert.equal(r.label, 'Strong');
  });

  it('score is always 0 or between 1 and 4', () => {
    const passwords = ['', 'a', 'password', 'P@ssw0rd!', 'Correct-Horse-Battery-Staple!99'];
    passwords.forEach(pw => {
      const { score } = evaluatePasswordStrength(pw);
      assert.ok(score === 0 || (score >= 1 && score <= 4), `Score ${score} out of range for "${pw}"`);
    });
  });
});

// ── Full Form Validation ───────────────────────────────────────────────────

describe('validateSettingsForm', () => {
  const validData = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: '',
    theme: 'system',
    notifications: 'important',
  };

  it('passes with all valid data (no password)', () => {
    const r = validateSettingsForm(validData);
    assert.equal(r.valid, true);
    assert.deepEqual(r.errors, {});
  });

  it('passes with all valid data including a strong password', () => {
    const r = validateSettingsForm({ ...validData, password: 'Str0ng!Pass' });
    assert.equal(r.valid, true);
  });

  it('fails with empty name', () => {
    const r = validateSettingsForm({ ...validData, name: '' });
    assert.equal(r.valid, false);
    assert.ok('name' in r.errors);
  });

  it('fails with single-char name', () => {
    const r = validateSettingsForm({ ...validData, name: 'X' });
    assert.equal(r.valid, false);
    assert.ok('name' in r.errors);
  });

  it('fails with empty email', () => {
    const r = validateSettingsForm({ ...validData, email: '' });
    assert.equal(r.valid, false);
    assert.ok('email' in r.errors);
  });

  it('fails with malformed email', () => {
    const r = validateSettingsForm({ ...validData, email: 'not-an-email' });
    assert.equal(r.valid, false);
    assert.ok('email' in r.errors);
  });

  it('fails with short password (if provided)', () => {
    const r = validateSettingsForm({ ...validData, password: 'abc' });
    assert.equal(r.valid, false);
    assert.ok('password' in r.errors);
  });

  it('fails with invalid theme value', () => {
    const r = validateSettingsForm({ ...validData, theme: 'solarized' });
    assert.equal(r.valid, false);
    assert.ok('theme' in r.errors);
  });

  it('fails with invalid notification value', () => {
    const r = validateSettingsForm({ ...validData, notifications: 'urgent' });
    assert.equal(r.valid, false);
    assert.ok('notifications' in r.errors);
  });

  it('collects multiple errors simultaneously', () => {
    const r = validateSettingsForm({
      name: '',
      email: 'bad-email',
      password: 'short',
      theme: 'bad',
      notifications: 'bad',
    });
    assert.equal(r.valid, false);
    assert.ok(Object.keys(r.errors).length >= 4);
  });

  it('errors object is empty when form is valid', () => {
    const r = validateSettingsForm(validData);
    assert.equal(Object.keys(r.errors).length, 0);
  });
});

// ── Reactive State Store ───────────────────────────────────────────────────

describe('appState', () => {
  it('provides default profile state', () => {
    const name  = appState.get('profile.name');
    const email = appState.get('profile.email');
    // After hydration from localStorage (or defaults), these should be strings
    assert.equal(typeof name,  'string');
    assert.equal(typeof email, 'string');
  });

  it('sets and gets a value via dot notation', () => {
    appState.set('profile.name', 'Test User');
    assert.equal(appState.get('profile.name'), 'Test User');
  });

  it('notifies subscribers on set', () => {
    let notified = false;
    let receivedPath = null;
    let receivedValue = null;

    const unsub = appState.subscribe((path, value) => {
      notified = true;
      receivedPath = path;
      receivedValue = value;
    });

    appState.set('preferences.theme', 'dark');
    unsub();

    assert.equal(notified, true);
    assert.equal(receivedPath, 'preferences.theme');
    assert.equal(receivedValue, 'dark');
  });

  it('unsubscribing stops notifications', () => {
    let count = 0;
    const unsub = appState.subscribe(() => { count++; });
    unsub();
    appState.set('profile.name', 'Nobody');
    assert.equal(count, 0);
  });

  it('returns a snapshot without modifying internal state', () => {
    appState.set('profile.name', 'Snapshot Test');
    const snap = appState.snapshot();
    snap.profile.name = 'Modified';
    assert.equal(appState.get('profile.name'), 'Snapshot Test');
  });

  it('exports JSON without password field', () => {
    appState.set('security.password', 'secret123');
    const json = appState.exportJSON();
    const parsed = JSON.parse(json);
    assert.ok(!parsed.security || !parsed.security.password);
  });

  it('supports nested preferences', () => {
    appState.set('preferences.notifications', 'all');
    assert.equal(appState.get('preferences.notifications'), 'all');
  });
});
