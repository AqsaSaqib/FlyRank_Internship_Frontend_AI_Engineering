/* ==========================================================================
   FORM VALIDATION UTILITIES
   ========================================================================== */

export const NOTIFICATION_PREFERENCE_OPTIONS = [
  { value: 'all', label: 'All Notifications (Email, Push, In-App)' },
  { value: 'important', label: 'Important Only (Security & Account)' },
  { value: 'mentions', label: 'Mentions & Direct Alerts Only' },
  { value: 'none', label: 'Do Not Disturb (Mute All)' }
];

export const VALID_NOTIFICATION_PREFERENCES = NOTIFICATION_PREFERENCE_OPTIONS.map(opt => opt.value);

/**
 * Validates a user's display / full name.
 * Requirements: Required and at least 2 characters (excluding leading/trailing whitespace).
 * @param {string} name
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateName(name) {
  if (name === undefined || name === null) {
    return { isValid: false, error: 'Name is required.' };
  }

  const trimmed = typeof name === 'string' ? name.trim() : String(name).trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Name is required.' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters.' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates an email address.
 * Requirements: Required and standard valid email format.
 * @param {string} email
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateEmail(email) {
  if (email === undefined || email === null) {
    return { isValid: false, error: 'Email is required.' };
  }

  const trimmed = typeof email === 'string' ? email.trim() : String(email).trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required.' };
  }

  // Standard web form email regex with alphabetical top-level domain
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates the notification preference selection.
 * Requirements: Required and must match an allowed value.
 * @param {string} preference
 * @param {string[]} [allowedOptions]
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateNotificationPreference(preference, allowedOptions = VALID_NOTIFICATION_PREFERENCES) {
  if (preference === undefined || preference === null) {
    return { isValid: false, error: 'Please select a notification preference.' };
  }

  const trimmed = typeof preference === 'string' ? preference.trim() : String(preference).trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Please select a notification preference.' };
  }

  if (!allowedOptions.includes(trimmed)) {
    return { isValid: false, error: 'Invalid notification preference selected.' };
  }

  return { isValid: true, error: null };
}

/**
 * Validates the complete settings form data.
 * @param {{ name?: string, email?: string, notificationPreference?: string }} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateSettingsForm(data = {}) {
  const errors = {};

  const nameResult = validateName(data.name);
  if (!nameResult.isValid && nameResult.error) {
    errors.name = nameResult.error;
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid && emailResult.error) {
    errors.email = emailResult.error;
  }

  const prefResult = validateNotificationPreference(data.notificationPreference);
  if (!prefResult.isValid && prefResult.error) {
    errors.notificationPreference = prefResult.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
