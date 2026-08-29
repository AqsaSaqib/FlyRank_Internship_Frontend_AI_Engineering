# Project Guidelines & Rules

## 1. Pure Validation Separation
All form validation rules must be written as pure, side-effect-free functions in `js/validation.js` returning `{ valid: boolean, message: string }`. They must not query the DOM or reference global window objects. Every validator must have corresponding unit tests in `tests/settingsForm.test.js` executed via Node's native test runner (`npm test`).

## 2. Sensitive Credential Sanitization
State persistence to `localStorage` and JSON exports via `AppState` must explicitly sanitize and strip sensitive credentials (e.g. `delete toStore.security.password`). Never serialize unhashed passwords, temporary tokens, or raw credentials to client-side web storage.

## 3. Accessible DOM Message Updates
When updating dynamic feedback messages in elements containing icon siblings (such as `.field-error` or status banners with embedded SVGs), never overwrite `element.textContent` or `element.innerHTML` on the root container. Always target a dedicated inner text element (e.g., `errorEl.querySelector('span').textContent = message`) to avoid destroying SVGs and breaking visual layout.

## 4. Design Token Rigor & Theme Contrast
Never hardcode raw hex, rgb, or hsl colors directly in component CSS rules. All surface colors, text shades, borders, and focus rings must use CSS variables defined in `css/variables.css`. Every variable must support both light mode and dark mode (`html[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`) with a minimum WCAG AA contrast ratio of 4.5:1 for body copy.
