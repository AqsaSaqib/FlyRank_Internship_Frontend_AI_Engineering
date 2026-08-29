import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateName,
  validateEmail,
  validateNotificationPreference,
  validateSettingsForm,
  VALID_NOTIFICATION_PREFERENCES
} from '../js/validation.js';

import { initSettingsForm } from '../js/settingsForm.js';
import { appState } from '../js/state.js';

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
        'email@111.222.333.44444',
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
    it('should fail when preference is empty or missing', () => {
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
        assert.deepEqual(validateNotificationPreference(option), { isValid: true, error: null });
      }
    });
  });

  describe('Composite Form Validation (validateSettingsForm)', () => {
    it('should return errors for all fields when form is empty', () => {
      const result = validateSettingsForm({});
      assert.equal(result.isValid, false);
      assert.equal(result.errors.name, 'Name is required.');
      assert.equal(result.errors.email, 'Email is required.');
      assert.equal(result.errors.notificationPreference, 'Please select a notification preference.');
    });

    it('should detect individual field failures', () => {
      const result = validateSettingsForm({
        name: 'A', // invalid (too short)
        email: 'alex@flyrank.ai', // valid
        notificationPreference: 'all' // valid
      });

      assert.equal(result.isValid, false);
      assert.equal(result.errors.name, 'Name must be at least 2 characters.');
      assert.equal(result.errors.email, undefined);
      assert.equal(result.errors.notificationPreference, undefined);
    });

    it('should detect invalid email with valid name and pref', () => {
      const result = validateSettingsForm({
        name: 'Alex Sterling',
        email: 'not-an-email',
        notificationPreference: 'all'
      });

      assert.equal(result.isValid, false);
      assert.equal(result.errors.name, undefined);
      assert.equal(result.errors.email, 'Please enter a valid email address.');
      assert.equal(result.errors.notificationPreference, undefined);
    });

    it('should pass when all fields are valid', () => {
      const result = validateSettingsForm({
        name: 'Alex Sterling',
        email: 'alex.sterling@flyrank.ai',
        notificationPreference: 'important'
      });

      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });
  });
});

describe('User Settings Form Controller - DOM & Lifecycle Integration', () => {
  // Helper to create mock DOM structure in Node environment
  function createMockDOM() {
    function createMockElement(id, tagName = 'div') {
      const classList = new Set();
      const attrs = {};
      const elListeners = {};

      return {
        id,
        tagName: tagName.toUpperCase(),
        value: '',
        textContent: '',
        innerHTML: '',
        disabled: false,
        style: {},
        classList: {
          add: (cls) => classList.add(cls),
          remove: (cls) => classList.delete(cls),
          contains: (cls) => classList.has(cls),
          toggle: (cls, force) => {
            if (force === undefined) {
              if (classList.has(cls)) classList.delete(cls);
              else classList.add(cls);
            } else if (force) classList.add(cls);
            else classList.delete(cls);
          }
        },
        setAttribute: (k, v) => { attrs[k] = String(v); },
        getAttribute: (k) => attrs[k] || null,
        removeAttribute: (k) => { delete attrs[k]; },
        closest: (sel) => {
          if (sel === '.form-group') return groupMap[id] || null;
          return null;
        },
        addEventListener: (event, handler) => {
          if (!elListeners[event]) elListeners[event] = [];
          elListeners[event].push(handler);
        },
        removeEventListener: (event, handler) => {
          if (!elListeners[event]) return;
          elListeners[event] = elListeners[event].filter(h => h !== handler);
        },
        appendChild: (child) => {
          child.parentElement = this;
          return child;
        },
        removeChild: (child) => {
          child.parentElement = null;
          return child;
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        focus: () => { focusedElement = id; },
        _trigger: (event, eventObj = {}) => {
          if (elListeners[event]) {
            elListeners[event].forEach(fn => fn(eventObj));
          }
        }
      };
    }

    let focusedElement = null;
    const form = createMockElement('user-settings-form', 'form');
    const nameInput = createMockElement('settings-name', 'input');
    const emailInput = createMockElement('settings-email', 'input');
    const prefSelect = createMockElement('settings-notification-pref', 'select');
    const submitBtn = createMockElement('settings-save-btn', 'button');
    const alertBanner = createMockElement('settings-form-alert', 'div');

    const nameError = createMockElement('settings-name-error', 'span');
    const emailError = createMockElement('settings-email-error', 'span');
    const prefError = createMockElement('settings-pref-error', 'span');

    const groupName = createMockElement('group-settings-name', 'div');
    const groupEmail = createMockElement('group-settings-email', 'div');
    const groupPref = createMockElement('group-settings-pref', 'div');

    const groupMap = {
      'settings-name': groupName,
      'settings-email': groupEmail,
      'settings-notification-pref': groupPref
    };

    const elementMap = {
      'user-settings-form': form,
      'settings-name': nameInput,
      'settings-email': emailInput,
      'settings-notification-pref': prefSelect,
      'settings-save-btn': submitBtn,
      'settings-form-alert': alertBanner,
      'settings-name-error': nameError,
      'settings-email-error': emailError,
      'settings-pref-error': prefError
    };

    const body = createMockElement('body', 'body');
    body.appendChild = (child) => child;
    body.removeChild = (child) => child;

    global.document = {
      getElementById: (id) => elementMap[id] || null,
      createElement: (tag) => createMockElement(`dyn_${Math.random()}`, tag),
      body
    };

    return {
      elements: elementMap,
      getFocusedElement: () => focusedElement
    };
  }

  it('should initialize form fields from initial state', () => {
    const { elements } = createMockDOM();
    const controller = initSettingsForm({ formElement: elements['user-settings-form'], asyncDelayMs: 0 });

    assert.ok(controller);
    assert.equal(elements['settings-name'].value, 'Alex Sterling');
    assert.equal(elements['settings-email'].value, 'alex.sterling@flyrank.ai');
    assert.equal(elements['settings-notification-pref'].value, 'all');
  });

  it('should display field errors, focus first invalid input, and prevent submission when inputs are invalid', async () => {
    const { elements, getFocusedElement } = createMockDOM();
    const controller = initSettingsForm({ formElement: elements['user-settings-form'], asyncDelayMs: 0 });

    // Set invalid inputs
    elements['settings-name'].value = 'A'; // too short
    elements['settings-email'].value = 'invalid-email'; // bad format
    elements['settings-notification-pref'].value = ''; // empty

    let prevented = false;
    const submitEvent = {
      preventDefault: () => { prevented = true; }
    };

    const result = await controller.handleSubmit(submitEvent);

    assert.equal(result, false);
    assert.equal(prevented, true);

    // Verify accessible error states
    assert.equal(elements['settings-name'].getAttribute('aria-invalid'), 'true');
    assert.equal(elements['settings-name-error'].textContent, 'Name must be at least 2 characters.');

    assert.equal(elements['settings-email'].getAttribute('aria-invalid'), 'true');
    assert.equal(elements['settings-email-error'].textContent, 'Please enter a valid email address.');

    assert.equal(elements['settings-notification-pref'].getAttribute('aria-invalid'), 'true');
    assert.equal(elements['settings-pref-error'].textContent, 'Please select a notification preference.');

    assert.equal(elements['settings-form-alert'].textContent, 'Please correct the validation errors above.');
    assert.equal(getFocusedElement(), 'settings-name');
  });

  it('should validate field on blur event', () => {
    const { elements } = createMockDOM();
    initSettingsForm({ formElement: elements['user-settings-form'], asyncDelayMs: 0 });

    elements['settings-email'].value = 'bad-email';
    elements['settings-email']._trigger('blur');

    assert.equal(elements['settings-email'].getAttribute('aria-invalid'), 'true');
    assert.equal(elements['settings-email-error'].textContent, 'Please enter a valid email address.');
  });

  it('should clear validation error when user types valid input after an error', () => {
    const { elements } = createMockDOM();
    initSettingsForm({ formElement: elements['user-settings-form'], asyncDelayMs: 0 });

    // Simulate previous error state
    elements['settings-name'].value = 'A';
    elements['settings-name']._trigger('blur');
    assert.equal(elements['settings-name'].getAttribute('aria-invalid'), 'true');

    // User types valid name
    elements['settings-name'].value = 'Alex Sterling';
    elements['settings-name']._trigger('input');

    assert.equal(elements['settings-name'].getAttribute('aria-invalid'), 'false');
    assert.equal(elements['settings-name-error'].textContent, '');
  });

  it('should handle successful submission and loading state transition', async () => {
    const { elements } = createMockDOM();
    let savedData = null;

    const controller = initSettingsForm({
      formElement: elements['user-settings-form'],
      asyncDelayMs: 10,
      onSaveSuccess: (data) => {
        savedData = data;
      }
    });

    elements['settings-name'].value = 'Elena Rostova';
    elements['settings-email'].value = 'elena.rostova@flyrank.ai';
    elements['settings-notification-pref'].value = 'important';

    const submitEvent = {
      preventDefault: () => {}
    };

    const submitPromise = controller.handleSubmit(submitEvent);

    // Verify loading state while in-flight
    assert.equal(elements['user-settings-form'].getAttribute('aria-busy'), 'true');
    assert.equal(elements['settings-save-btn'].disabled, true);
    assert.equal(elements['settings-name'].disabled, true);
    assert.equal(elements['settings-email'].disabled, true);
    assert.equal(elements['settings-notification-pref'].disabled, true);

    const success = await submitPromise;

    assert.equal(success, true);
    assert.equal(elements['user-settings-form'].getAttribute('aria-busy'), 'false');
    assert.equal(elements['settings-save-btn'].disabled, false);
    assert.equal(elements['settings-name'].disabled, false);
    assert.equal(elements['settings-email'].disabled, false);
    assert.equal(elements['settings-notification-pref'].disabled, false);
    assert.equal(elements['settings-form-alert'].textContent, '✓ User settings saved successfully.');
    assert.deepEqual(savedData, {
      name: 'Elena Rostova',
      email: 'elena.rostova@flyrank.ai',
      notificationPreference: 'important'
    });

    // Verify state store was updated
    assert.equal(appState.get('profile.name'), 'Elena Rostova');
    assert.equal(appState.get('profile.firstName'), 'Elena');
    assert.equal(appState.get('profile.lastName'), 'Rostova');
    assert.equal(appState.get('profile.email'), 'elena.rostova@flyrank.ai');
    assert.equal(appState.get('profile.notificationPreference'), 'important');
  });

  it('should handle submission errors gracefully', async () => {
    const { elements } = createMockDOM();
    let caughtError = null;

    // Temporarily simulate storage failure
    const originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('Storage quota exceeded'); }
    };

    try {
      const controller = initSettingsForm({
        formElement: elements['user-settings-form'],
        asyncDelayMs: 0,
        onSaveError: (err) => { caughtError = err; }
      });

      elements['settings-name'].value = 'Alex Sterling';
      elements['settings-email'].value = 'alex.sterling@flyrank.ai';
      elements['settings-notification-pref'].value = 'all';

      const success = await controller.handleSubmit({ preventDefault: () => {} });

      assert.equal(success, false);
      assert.equal(elements['user-settings-form'].getAttribute('aria-busy'), 'false');
      assert.ok(elements['settings-form-alert'].textContent.includes('Error saving settings'));
      assert.ok(caughtError);
    } finally {
      global.localStorage = originalLocalStorage;
    }
  });
});
