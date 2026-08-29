/**
 * validation.js — Pure, side-effect-free validation functions.
 *
 * All functions return: { valid: boolean, message: string }
 * These are exported for both DOM use and automated testing.
 */

// ── Constants ──────────────────────────────────────────────────────────────

export const THEME_OPTIONS                  = ['light', 'dark', 'system'];
export const NOTIFICATION_OPTIONS            = ['all', 'important', 'none'];
export const NOTIFICATION_FREQUENCY_OPTIONS  = ['all', 'important', 'none'];
export const VISIBILITY_OPTIONS              = ['public', 'contacts', 'private'];
export const LANGUAGE_OPTIONS                = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
export const TIMEZONE_OPTIONS                = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Karachi',
];
export const DATE_FORMAT_OPTIONS             = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'];
export const TIME_FORMAT_OPTIONS             = ['12h', '24h'];
export const START_PAGE_OPTIONS              = ['profile', 'account', 'security', 'notifications', 'appearance', 'privacy', 'preferences'];

export const PASSWORD_MIN_LENGTH             = 8;
export const USERNAME_MIN_LENGTH             = 3;
export const USERNAME_MAX_LENGTH             = 20;

// RFC-5322 inspired practical email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Username regex: alphanumeric and underscore, 3-20 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ── Individual field validators ────────────────────────────────────────────

/**
 * Validate profile full name.
 * Required, minimum 2 characters.
 */
export function validateName(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: 'Full name is required.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, message: 'Full name must be at least 2 characters long.' };
  }
  if (trimmed.length > 80) {
    return { valid: false, message: 'Full name cannot exceed 80 characters.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate email address.
 * Required, must match RFC-style pattern.
 */
export function validateEmail(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address (e.g. user@example.com).' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate username.
 * Required, 3–20 characters, alphanumeric & underscores only.
 */
export function validateUsername(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: 'Username is required.' };
  }
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return { valid: false, message: `Username must be at least ${USERNAME_MIN_LENGTH} characters long.` };
  }
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return { valid: false, message: `Username cannot exceed ${USERNAME_MAX_LENGTH} characters.` };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate new password (optional field in quick profile update).
 * Optional — if provided, must be at least PASSWORD_MIN_LENGTH characters.
 */
export function validatePassword(value) {
  const raw = value ?? '';
  if (!raw) {
    // Empty means "not changing password" — valid
    return { valid: true, message: '' };
  }
  if (raw.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }
  return { valid: true, message: '' };
}

/**
 * Validate password change form.
 * Checks current password presence, new password length, and confirmation matching.
 */
export function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
  const errors = {};

  const curr = (currentPassword ?? '').trim();
  const next = newPassword ?? '';
  const conf = confirmPassword ?? '';

  if (!curr) {
    errors.currentPassword = 'Current password is required to set a new password.';
  }

  if (!next) {
    errors.newPassword = 'New password is required.';
  } else if (next.length < PASSWORD_MIN_LENGTH) {
    errors.newPassword = `New password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  } else if (curr && curr === next) {
    errors.newPassword = 'New password must be different from current password.';
  }

  if (!conf) {
    errors.confirmPassword = 'Please confirm your new password.';
  } else if (next && conf !== next) {
    errors.confirmPassword = 'Password confirmation does not match.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate a select/enum field against an allowed list.
 * Required — value must be non-empty and in the allowed set.
 */
export function validateSelect(value, allowedOptions, fieldLabel = 'This field') {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: `${fieldLabel} is required.` };
  }
  if (!allowedOptions.includes(trimmed)) {
    return { valid: false, message: `${fieldLabel} has an invalid selection.` };
  }
  return { valid: true, message: '' };
}

/**
 * Evaluate password strength score (0–4).
 * Returns { score: number, label: string }
 */
export function evaluatePasswordStrength(password) {
  if (!password) return { score: 0, label: '' };

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password))  score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(4, Math.max(1, Math.ceil((score / 5) * 4)));
  const labels = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  return { score: clamped, label: labels[clamped] };
}

// ── Section Validators ─────────────────────────────────────────────────────

/**
 * Validate Profile Section data
 */
export function validateProfileSection(data) {
  const errors = {};
  const nameResult = validateName(data.name);
  const emailResult = validateEmail(data.email);

  if (!nameResult.valid) errors.name = nameResult.message;
  if (!emailResult.valid) errors.email = emailResult.message;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Account Section data
 */
export function validateAccountSection(data) {
  const errors = {};
  const userResult = validateUsername(data.username);
  const langResult = validateSelect(data.language, LANGUAGE_OPTIONS, 'Language');
  const tzResult = validateSelect(data.timezone, TIMEZONE_OPTIONS, 'Timezone');

  if (!userResult.valid) errors.username = userResult.message;
  if (!langResult.valid) errors.language = langResult.message;
  if (!tzResult.valid) errors.timezone = tzResult.message;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Privacy Section data
 */
export function validatePrivacySection(data) {
  const errors = {};
  const visResult = validateSelect(data.profileVisibility, VISIBILITY_OPTIONS, 'Profile visibility');
  if (!visResult.valid) errors.profileVisibility = visResult.message;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Preferences Section data
 */
export function validatePreferencesSection(data) {
  const errors = {};
  const langResult = validateSelect(data.language, LANGUAGE_OPTIONS, 'Primary language');
  const tzResult = validateSelect(data.timezone, TIMEZONE_OPTIONS, 'Timezone');
  const dateResult = validateSelect(data.dateFormat, DATE_FORMAT_OPTIONS, 'Date format');
  const timeResult = validateSelect(data.timeFormat, TIME_FORMAT_OPTIONS, 'Time format');

  if (!langResult.valid) errors.language = langResult.message;
  if (!tzResult.valid) errors.timezone = tzResult.message;
  if (!dateResult.valid) errors.dateFormat = dateResult.message;
  if (!timeResult.valid) errors.timeFormat = timeResult.message;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate full settings payload (across legacy and new keys).
 */
export function validateSettingsForm(data) {
  const errors = {};

  const nameResult     = validateName(data.name);
  const emailResult    = validateEmail(data.email);
  const passwordResult = validatePassword(data.password);
  const themeResult    = validateSelect(data.theme, THEME_OPTIONS, 'Theme preference');
  const notifResult    = validateSelect(data.notifications ?? data.frequency, NOTIFICATION_OPTIONS, 'Notification preference');

  if (!nameResult.valid)     errors.name          = nameResult.message;
  if (!emailResult.valid)    errors.email         = emailResult.message;
  if (!passwordResult.valid) errors.password      = passwordResult.message;
  if (!themeResult.valid)    errors.theme         = themeResult.message;
  if (!notifResult.valid)    errors.notifications = notifResult.message;

  if (data.username !== undefined) {
    const userResult = validateUsername(data.username);
    if (!userResult.valid) errors.username = userResult.message;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
