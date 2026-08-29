import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateName,
  validateEmail,
  validateNotificationPreference,
  evaluatePasswordStrength,
  validateSettingsForm,
  VALID_NOTIFICATION_PREFERENCES
} from '../js/validation.js';

import { appState, DEFAULT_STATE } from '../js/state.js';

describe('User Settings Form - Field Validation Rules', () => {
  describe('Name Validation (validateName)', () => {
    it('should fail when name is empty, null, or undefined', () => {
      assert.deepEqual(validateName(''), { isValid: false, error: 'Name is required.' });
      assert.deepEqual(validateName('   '), { isValid: false, error: 'Name is required.' });
      assert.deepEqual(validateName(null), { isValid: false, error: 'Name is required.' });
      assert.deepEqual(validateName(undefined), { isValid: false, error: 'Name is required.' });
    });

    it('should fail when name has fewer than 2 characters', () => {
      assert.deepEqual(validateName('A'), { isValid: false, error: 'Name must be at least 2 characters.' });
      assert.deepEqual(validateName(' x '), { isValid: false, error: 'Name must be at least 2 characters.' });
      assert.deepEqual(validateName('!'), { isValid: false, error: 'Name must be at least 2 characters.' });
    });

    it('should pass when name has 2 or more characters', () => {
      assert.deepEqual(validateName('Al'), { isValid: true, error: null });
      assert.deepEqual(validateName('Alex Sterling'), { isValid: true, error: null });
      assert.deepEqual(validateName('  Sarah Connor  '), { isValid: true, error: null });
      assert.deepEqual(validateName('François Müller'), { isValid: true, error: null });
      assert.deepEqual(validateName('李雷'), { isValid: true, error: null });
    });
  });

  describe('Email Validation (validateEmail)', () => {
    it('should fail when email is empty, null, or undefined', () => {
      assert.deepEqual(validateEmail(''), { isValid: false, error: 'Email is required.' });
      assert.deepEqual(validateEmail('   '), { isValid: false, error: 'Email is required.' });
      assert.deepEqual(validateEmail(null), { isValid: false, error: 'Email is required.' });
      assert.deepEqual(validateEmail(undefined), { isValid: false, error: 'Email is required.' });
    });

    it('should fail for invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '#@%^%#$@#$@#.com',
        '@example.com',
        'Joe Smith <email@example.com>',
        'email.example.com',
        'email@example@example.com',
        'email@example',
        'user name@domain.com',
        'user@domain..com',
        'user@.com'
      ];

      for (const email of invalidEmails) {
        const result = validateEmail(email);
        assert.equal(result.isValid, false, `Expected "${email}" to be invalid`);
        assert.equal(result.error, 'Please enter a valid email address.');
      }
    });

    it('should pass for valid email addresses', () => {
      const validEmails = [
        'alex.sterling@flyrank.ai',
        'user@example.com',
        'firstname.lastname@domain.co.uk',
        'email+tag@sub.domain.org',
        '123456@numbers.com',
        'developer_team.lead@service-mesh.internal.net'
      ];

      for (const email of validEmails) {
        const result = validateEmail(email);
        assert.equal(result.isValid, true, `Expected "${email}" to be valid`);
        assert.equal(result.error, null);
      }
    });
  });

  describe('Notification Preference Validation (validateNotificationPreference)', () => {
    it('should fail when preference is empty, null, or missing', () => {
      assert.deepEqual(validateNotificationPreference(''), { isValid: false, error: 'Please select a notification preference.' });
      assert.deepEqual(validateNotificationPreference(null), { isValid: false, error: 'Please select a notification preference.' });
      assert.deepEqual(validateNotificationPreference(undefined), { isValid: false, error: 'Please select a notification preference.' });
    });

    it('should fail when preference is not in allowed options', () => {
      assert.deepEqual(validateNotificationPreference('spam-everything'), { isValid: false, error: 'Invalid notification preference selected.' });
      assert.deepEqual(validateNotificationPreference('unknown'), { isValid: false, error: 'Invalid notification preference selected.' });
    });

    it('should pass for all valid notification preference options', () => {
      for (const option of VALID_NOTIFICATION_PREFERENCES) {
        const result = validateNotificationPreference(option);
        assert.equal(result.isValid, true, `Expected "${option}" to be valid`);
        assert.equal(result.error, null);
      }
    });
  });

  describe('Password Strength Evaluation (evaluatePasswordStrength)', () => {
    it('should calculate strength score accurately', () => {
      const weak = evaluatePasswordStrength('abc');
      assert.equal(weak.length, false);
      assert.equal(weak.uppercase, false);
      assert.equal(weak.number, false);
      assert.equal(weak.special, false);

      const strong = evaluatePasswordStrength('P@ssw0rd2026!');
      assert.equal(strong.length, true);
      assert.equal(strong.uppercase, true);
      assert.equal(strong.lowercase, true);
      assert.equal(strong.number, true);
      assert.equal(strong.special, true);
      assert.equal(strong.score, 5);
    });
  });

  describe('Full Form Validation (validateSettingsForm)', () => {
    it('should validate complete valid form data', () => {
      const validData = {
        name: 'Alex Sterling',
        email: 'alex.sterling@flyrank.ai',
        notificationPreference: 'realtime'
      };

      const result = validateSettingsForm(validData);
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });

    it('should collect multiple errors on invalid form data', () => {
      const invalidData = {
        name: 'A',
        email: 'invalid-email',
        notificationPreference: 'invalid-pref'
      };

      const result = validateSettingsForm(invalidData);
      assert.equal(result.isValid, false);
      assert.equal(result.errors.name, 'Name must be at least 2 characters.');
      assert.equal(result.errors.email, 'Please enter a valid email address.');
      assert.equal(result.errors.notificationPreference, 'Invalid notification preference selected.');
    });
  });
});

describe('Reactive State Store (appState)', () => {
  beforeEach(() => {
    appState.resetToDefaults();
  });

  it('should get default profile state', () => {
    const name = appState.get('profile.name');
    assert.equal(name, 'Alex Sterling');
    const email = appState.get('profile.email');
    assert.equal(email, 'alex.sterling@flyrank.ai');
  });

  it('should update dot-notated state and notify subscriber', () => {
    let notifiedPath = null;
    let notifiedVal = null;

    const unsubscribe = appState.subscribe((state, path, val) => {
      notifiedPath = path;
      notifiedVal = val;
    });

    appState.set('profile.name', 'Jordan Vance');
    assert.equal(appState.get('profile.name'), 'Jordan Vance');
    assert.equal(notifiedPath, 'profile.name');
    assert.equal(notifiedVal, 'Jordan Vance');

    unsubscribe();
  });

  it('should export and import JSON correctly', () => {
    appState.set('appearance.theme', 'light');
    const exported = appState.exportJSON();
    assert.ok(typeof exported === 'string');

    appState.resetToDefaults();
    assert.equal(appState.get('appearance.theme'), 'dark');

    const res = appState.importJSON(exported);
    assert.equal(res.success, true);
    assert.equal(appState.get('appearance.theme'), 'light');
  });
});
