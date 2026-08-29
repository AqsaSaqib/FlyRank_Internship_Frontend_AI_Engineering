/* ==========================================================================
   VALIDATION ENGINE
   ========================================================================== */

export const VALID_NOTIFICATION_PREFERENCES = ['realtime', 'daily', 'weekly', 'never'];

/**
 * Validates full name.
 * Rule: Required, non-empty, at least 2 characters.
 * @param {string} name
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateName(name) {
  if (name === null || name === undefined) {
    return { isValid: false, error: 'Name is required.' };
  }
  const trimmed = String(name).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters.' };
  }
  return { isValid: true, error: null };
}

/**
 * Validates email address format.
 * Rule: Required, non-empty, valid RFC-compliant structure.
 * @param {string} email
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateEmail(email) {
  if (email === null || email === undefined) {
    return { isValid: false, error: 'Email is required.' };
  }
  const trimmed = String(email).trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required.' };
  }

  // Strict email regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed) || trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates notification preference.
 * Rule: Required, must be in VALID_NOTIFICATION_PREFERENCES list.
 * @param {string} preference
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateNotificationPreference(preference) {
  if (preference === null || preference === undefined || String(preference).trim() === '') {
    return { isValid: false, error: 'Please select a notification preference.' };
  }
  if (!VALID_NOTIFICATION_PREFERENCES.includes(preference)) {
    return { isValid: false, error: 'Invalid notification preference selected.' };
  }
  return { isValid: true, error: null };
}

/**
 * Evaluates password strength criteria.
 * @param {string} password
 * @returns {{ score: number, length: boolean, uppercase: boolean, lowercase: boolean, number: boolean, special: boolean }}
 */
export function evaluatePasswordStrength(password) {
  const pwd = password || '';
  const checks = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd)
  };

  let passed = 0;
  if (checks.length) passed++;
  if (checks.uppercase) passed++;
  if (checks.lowercase) passed++;
  if (checks.number) passed++;
  if (checks.special) passed++;

  return {
    ...checks,
    score: passed // 0 - 5
  };
}

/**
 * Validates full User Settings Form payload.
 * @param {Object} formData
 * @param {string} formData.name
 * @param {string} formData.email
 * @param {string} formData.notificationPreference
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateSettingsForm(formData = {}) {
  const errors = {};

  const nameResult = validateName(formData.name);
  if (!nameResult.isValid) {
    errors.name = nameResult.error;
  }

  const emailResult = validateEmail(formData.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
  }

  const prefResult = validateNotificationPreference(formData.notificationPreference);
  if (!prefResult.isValid) {
    errors.notificationPreference = prefResult.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
