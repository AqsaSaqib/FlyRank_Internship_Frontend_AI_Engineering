/**
 * validation.js — Pure, side-effect-free validation functions.
 *
 * All functions return: { valid: boolean, message: string }
 * These are exported for both DOM use and automated testing.
 */

// ── Constants ──────────────────────────────────────────────────────────────

export const THEME_OPTIONS        = ['light', 'dark', 'system'];
export const NOTIFICATION_OPTIONS = ['all', 'important', 'none'];
export const PASSWORD_MIN_LENGTH  = 8;

// RFC-5322 inspired email regex (practical subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// ── Individual field validators ────────────────────────────────────────────

/**
 * Validate profile name.
 * Required, minimum 2 characters.
 */
export function validateName(value) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: 'Name is required.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long.' };
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
 * Validate new password.
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
 * Evaluate password strength score (1–4).
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

  // Clamp to 1–4 for display
  const clamped = Math.min(4, Math.max(1, Math.ceil(score / 5 * 4)));
  const labels = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  return { score: clamped, label: labels[clamped] };
}

// ── Full form validation ───────────────────────────────────────────────────

/**
 * Validate the complete settings form payload.
 *
 * @param {object} data - { name, email, password, theme, notifications }
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateSettingsForm(data) {
  const errors = {};

  const nameResult         = validateName(data.name);
  const emailResult        = validateEmail(data.email);
  const passwordResult     = validatePassword(data.password);
  const themeResult        = validateSelect(data.theme, THEME_OPTIONS, 'Theme preference');
  const notifResult        = validateSelect(data.notifications, NOTIFICATION_OPTIONS, 'Notification preference');

  if (!nameResult.valid)     errors.name          = nameResult.message;
  if (!emailResult.valid)    errors.email         = emailResult.message;
  if (!passwordResult.valid) errors.password      = passwordResult.message;
  if (!themeResult.valid)    errors.theme         = themeResult.message;
  if (!notifResult.valid)    errors.notifications = notifResult.message;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
