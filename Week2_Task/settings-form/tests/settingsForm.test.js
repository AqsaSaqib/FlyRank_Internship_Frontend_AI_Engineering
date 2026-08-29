/**
 * tests/settingsForm.test.js
 *
 * Automated tests using Node.js built-in `node:test` and `node:assert/strict`.
 * Run with: npm test (or node --test tests/settingsForm.test.js)
 *
 * Test Suites:
 *   1. validateName
 *   2. validateEmail
 *   3. validateUsername
 *   4. validatePassword
 *   5. validatePasswordChange
 *   6. evaluatePasswordStrength
 *   7. validateSelect (theme, notifications, visibility, language, timezone, date & time formats)
 *   8. validateProfileSection
 *   9. validateAccountSection
 *  10. validatePrivacySection
 *  11. validatePreferencesSection
 *  12. validateSettingsForm (Full form)
 *  13. AppState (State management & persistence)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Pure validation logic and constants
import {
  validateName,
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordChange,
  validateSelect,
  evaluatePasswordStrength,
  validateProfileSection,
  validateAccountSection,
  validatePrivacySection,
  validatePreferencesSection,
  validateSettingsForm,
  THEME_OPTIONS,
  NOTIFICATION_OPTIONS,
  VISIBILITY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  PASSWORD_MIN_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../js/validation.js';

// Reactive state store
import { appState } from '../js/state.js';

// ── 1. Name Validation ─────────────────────────────────────────────────────

describe('validateName', () => {
  it('rejects empty string', () => {
    const r = validateName('');
    assert.equal(r.valid, false);
    assert.match(r.message, /required/i);
  });

  it('rejects null and undefined', () => {
    assert.equal(validateName(null).valid, false);
    assert.equal(validateName(undefined).valid, false);
  });

  it('rejects whitespace-only string', () => {
    const r = validateName('   ');
    assert.equal(r.valid, false);
  });

  it('rejects single character', () => {
    const r = validateName('J');
    assert.equal(r.valid, false);
    assert.match(r.message, /2 characters/i);
  });

  it('rejects name exceeding 80 characters', () => {
    const longName = 'A'.repeat(81);
    const r = validateName(longName);
    assert.equal(r.valid, false);
    assert.match(r.message, /cannot exceed 80/i);
  });

  it('accepts minimum 2 characters', () => {
    const r = validateName('Jo');
    assert.equal(r.valid, true);
    assert.equal(r.message, '');
  });

  it('accepts full name with spaces and special characters', () => {
    assert.equal(validateName('Jane Doe-Smith').valid, true);
    assert.equal(validateName("O'Connor").valid, true);
  });

  it('accepts trimmed name with leading/trailing spaces', () => {
    const r = validateName('  Jane Doe  ');
    assert.equal(r.valid, true);
  });
});

// ── 2. Email Validation ────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('rejects empty string, null, and undefined', () => {
    assert.equal(validateEmail('').valid, false);
    assert.equal(validateEmail(null).valid, false);
    assert.equal(validateEmail(undefined).valid, false);
  });

  it('rejects string without @ symbol', () => {
    const r = validateEmail('invalidemail.com');
    assert.equal(r.valid, false);
    assert.match(r.message, /valid email/i);
  });

  it('rejects email missing domain or user part', () => {
    assert.equal(validateEmail('user@').valid, false);
    assert.equal(validateEmail('@domain.com').valid, false);
    assert.equal(validateEmail('user@domain').valid, false);
  });

  it('rejects email containing internal spaces', () => {
    assert.equal(validateEmail('user name@domain.com').valid, false);
  });

  it('accepts standard valid emails', () => {
    assert.equal(validateEmail('jane.doe@flyrank.io').valid, true);
    assert.equal(validateEmail('user+filter@example.co.uk').valid, true);
    assert.equal(validateEmail('first_last@sub.domain.org').valid, true);
  });

  it('accepts valid email with leading/trailing whitespace (trimmed)', () => {
    assert.equal(validateEmail('  jane@flyrank.io  ').valid, true);
  });
});

// ── 3. Username Validation ─────────────────────────────────────────────────

describe('validateUsername', () => {
  it('rejects empty, null, and undefined', () => {
    assert.equal(validateUsername('').valid, false);
    assert.equal(validateUsername(null).valid, false);
    assert.equal(validateUsername(undefined).valid, false);
  });

  it(`rejects username shorter than ${USERNAME_MIN_LENGTH} characters`, () => {
    const r = validateUsername('ab');
    assert.equal(r.valid, false);
    assert.match(r.message, /at least 3 characters/i);
  });

  it(`rejects username longer than ${USERNAME_MAX_LENGTH} characters`, () => {
    const r = validateUsername('a'.repeat(USERNAME_MAX_LENGTH + 1));
    assert.equal(r.valid, false);
    assert.match(r.message, /cannot exceed 20/i);
  });

  it('rejects invalid characters (spaces, dashes, dots, symbols)', () => {
    assert.equal(validateUsername('jane-doe').valid, false);
    assert.equal(validateUsername('jane.doe').valid, false);
    assert.equal(validateUsername('jane doe').valid, false);
    assert.equal(validateUsername('jane@doe').valid, false);
  });

  it('accepts alphanumeric characters and underscores', () => {
    assert.equal(validateUsername('janedoe').valid, true);
    assert.equal(validateUsername('jane_doe_99').valid, true);
    assert.equal(validateUsername('user_123').valid, true);
  });
});

// ── 4. Password Validation (Optional Profile Context) ──────────────────────

describe('validatePassword', () => {
  it('accepts empty/null/undefined in optional context', () => {
    assert.equal(validatePassword('').valid, true);
    assert.equal(validatePassword(null).valid, true);
    assert.equal(validatePassword(undefined).valid, true);
  });

  it(`rejects password shorter than ${PASSWORD_MIN_LENGTH} characters`, () => {
    const r = validatePassword('short');
    assert.equal(r.valid, false);
    assert.match(r.message, /at least 8 characters/i);
  });

  it('accepts password of exactly 8 characters or more', () => {
    assert.equal(validatePassword('12345678').valid, true);
    assert.equal(validatePassword('Super$ecurePassw0rd!').valid, true);
  });
});

// ── 5. Password Change Validation ──────────────────────────────────────────

describe('validatePasswordChange', () => {
  it('fails when current password is empty', () => {
    const r = validatePasswordChange('', 'NewPass123!', 'NewPass123!');
    assert.equal(r.valid, false);
    assert.ok('currentPassword' in r.errors);
  });

  it('fails when new password is shorter than 8 characters', () => {
    const r = validatePasswordChange('OldPass123!', 'short', 'short');
    assert.equal(r.valid, false);
    assert.ok('newPassword' in r.errors);
  });

  it('fails when new password is identical to current password', () => {
    const r = validatePasswordChange('SamePass123!', 'SamePass123!', 'SamePass123!');
    assert.equal(r.valid, false);
    assert.match(r.errors.newPassword, /must be different/i);
  });

  it('fails when confirmation does not match new password', () => {
    const r = validatePasswordChange('OldPass123!', 'NewPass123!', 'DifferentPass123!');
    assert.equal(r.valid, false);
    assert.match(r.errors.confirmPassword, /does not match/i);
  });

  it('passes when current password, new password (>=8) and matching confirmation are provided', () => {
    const r = validatePasswordChange('OldPass123!', 'NewSecretPass99!', 'NewSecretPass99!');
    assert.equal(r.valid, true);
    assert.deepEqual(r.errors, {});
  });
});

// ── 6. Password Strength Evaluation ────────────────────────────────────────

describe('evaluatePasswordStrength', () => {
  it('returns score 0 for empty password', () => {
    const r = evaluatePasswordStrength('');
    assert.equal(r.score, 0);
    assert.equal(r.label, '');
  });

  it('returns score 1 (Weak) for very simple password', () => {
    const r = evaluatePasswordStrength('abc');
    assert.equal(r.score, 1);
    assert.equal(r.label, 'Weak');
  });

  it('returns moderate score >= 2 for medium complexity', () => {
    const r = evaluatePasswordStrength('password123');
    assert.ok(r.score >= 2);
  });

  it('returns score 4 (Strong) for high complexity password', () => {
    const r = evaluatePasswordStrength('Str0ng!Pass#2026');
    assert.equal(r.score, 4);
    assert.equal(r.label, 'Strong');
  });
});

// ── 7. Select & Enum Validation ────────────────────────────────────────────

describe('validateSelect Options', () => {
  it('validates theme options', () => {
    THEME_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, THEME_OPTIONS, 'Theme').valid, true);
    });
    assert.equal(validateSelect('invalid-theme', THEME_OPTIONS, 'Theme').valid, false);
    assert.equal(validateSelect('', THEME_OPTIONS, 'Theme').valid, false);
  });

  it('validates notification frequency options', () => {
    NOTIFICATION_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, NOTIFICATION_OPTIONS, 'Notifications').valid, true);
    });
    assert.equal(validateSelect('hourly', NOTIFICATION_OPTIONS, 'Notifications').valid, false);
  });

  it('validates privacy visibility options', () => {
    VISIBILITY_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, VISIBILITY_OPTIONS, 'Visibility').valid, true);
    });
    assert.equal(validateSelect('hidden', VISIBILITY_OPTIONS, 'Visibility').valid, false);
  });

  it('validates language options', () => {
    LANGUAGE_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, LANGUAGE_OPTIONS, 'Language').valid, true);
    });
    assert.equal(validateSelect('xx', LANGUAGE_OPTIONS, 'Language').valid, false);
  });

  it('validates timezone options', () => {
    TIMEZONE_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, TIMEZONE_OPTIONS, 'Timezone').valid, true);
    });
    assert.equal(validateSelect('Mars/Olympus', TIMEZONE_OPTIONS, 'Timezone').valid, false);
  });

  it('validates date and time formats', () => {
    DATE_FORMAT_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, DATE_FORMAT_OPTIONS, 'Date format').valid, true);
    });
    TIME_FORMAT_OPTIONS.forEach(opt => {
      assert.equal(validateSelect(opt, TIME_FORMAT_OPTIONS, 'Time format').valid, true);
    });
  });
});

// ── 8. Section Validators ──────────────────────────────────────────────────

describe('Section Validators', () => {
  it('validateProfileSection verifies name and email', () => {
    const valid = validateProfileSection({ name: 'Jane Doe', email: 'jane@flyrank.io' });
    assert.equal(valid.valid, true);

    const invalid = validateProfileSection({ name: '', email: 'not-an-email' });
    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.name);
    assert.ok(invalid.errors.email);
  });

  it('validateAccountSection verifies username, language, and timezone', () => {
    const valid = validateAccountSection({ username: 'janedoe', language: 'en', timezone: 'UTC' });
    assert.equal(valid.valid, true);

    const invalid = validateAccountSection({ username: 'j', language: 'invalid', timezone: 'invalid' });
    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.username);
    assert.ok(invalid.errors.language);
    assert.ok(invalid.errors.timezone);
  });

  it('validatePrivacySection verifies profile visibility', () => {
    const valid = validatePrivacySection({ profileVisibility: 'public' });
    assert.equal(valid.valid, true);

    const invalid = validatePrivacySection({ profileVisibility: 'invalid' });
    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors.profileVisibility);
  });

  it('validatePreferencesSection verifies regional settings', () => {
    const valid = validatePreferencesSection({
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
    });
    assert.equal(valid.valid, true);

    const invalid = validatePreferencesSection({
      language: 'bad',
      timezone: 'bad',
      dateFormat: 'bad',
      timeFormat: 'bad',
    });
    assert.equal(invalid.valid, false);
    assert.equal(Object.keys(invalid.errors).length, 4);
  });
});

// ── 9. validateSettingsForm (Full Payload) ─────────────────────────────────

describe('validateSettingsForm', () => {
  const fullValid = {
    name: 'Jane Doe',
    email: 'jane@flyrank.io',
    password: '',
    theme: 'system',
    notifications: 'important',
    username: 'janedoe',
  };

  it('passes on valid comprehensive payload', () => {
    const r = validateSettingsForm(fullValid);
    assert.equal(r.valid, true);
    assert.deepEqual(r.errors, {});
  });

  it('catches multiple simultaneous validation errors', () => {
    const r = validateSettingsForm({
      name: '',
      email: 'bad-email',
      password: '123',
      theme: 'neon',
      notifications: 'daily',
      username: 'x',
    });
    assert.equal(r.valid, false);
    assert.ok(Object.keys(r.errors).length >= 5);
  });
});

// ── 10. AppState Reactive Store ────────────────────────────────────────────

describe('appState Store', () => {
  it('provides complete defaults across all 7 sections', () => {
    assert.ok(appState.get('profile.name'));
    assert.ok(appState.get('account.username'));
    assert.ok(Array.isArray(appState.get('security.sessions')));
    assert.ok(appState.get('notifications.frequency'));
    assert.ok(appState.get('appearance.theme'));
    assert.ok(appState.get('privacy.profileVisibility'));
    assert.ok(appState.get('preferences.dateFormat'));
  });

  it('sets and gets deep values using dot notation', () => {
    appState.set('profile.title', 'Principal Architect');
    assert.equal(appState.get('profile.title'), 'Principal Architect');
  });

  it('notifies subscribers on state modification', () => {
    let notifiedPath = null;
    let notifiedVal = null;

    const unsub = appState.subscribe((path, val) => {
      notifiedPath = path;
      notifiedVal = val;
    });

    appState.set('appearance.theme', 'dark');
    unsub();

    assert.equal(notifiedPath, 'appearance.theme');
    assert.equal(notifiedVal, 'dark');
  });

  it('handles terminating other sessions', () => {
    const remaining = appState.terminateOtherSessions();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].current, true);
  });

  it('handles 2FA toggle updates', () => {
    appState.toggleTwoFactor(true);
    assert.equal(appState.get('security.twoFactorEnabled'), true);

    appState.toggleTwoFactor(false);
    assert.equal(appState.get('security.twoFactorEnabled'), false);
  });

  it('exports sanitized JSON without sensitive password field', () => {
    appState.set('security.password', 'super-secret-pw');
    const json = appState.exportJSON();
    const parsed = JSON.parse(json);
    assert.ok(!parsed.security || !parsed.security.password);
  });

  it('returns an isolated deep clone snapshot', () => {
    const snap = appState.snapshot();
    snap.profile.name = 'Tampered Direct Name';
    assert.notEqual(appState.get('profile.name'), 'Tampered Direct Name');
  });
});
