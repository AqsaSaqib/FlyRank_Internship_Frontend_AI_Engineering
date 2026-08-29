# Workflow Comparison: Round 1 (Vague) vs. Round 2 (Detailed)

## 1. Architectural and Code Differences
In `round-1-vague` (commit `c03226c`), the implementation relied on React with `lucide-react` dependencies across `src/App.jsx`, `src/main.jsx`, and `src/index.css`, introducing heavy framework overhead and committed `node_modules`. Conversely, `round-2-detailed` refactored the codebase into a modular, zero-dependency vanilla JavaScript architecture with strict separation of concerns: `js/state.js` (reactive store), `js/validation.js` (pure validators), `js/settingsForm.js` (DOM controller), and structured CSS tokens (`css/variables.css`, `css/base.css`, `css/components.css`, `css/responsive.css`).

## 2. Correctness and Feature Completeness
Round 1 provided only three bare-bones input fields with basic state and no persistence or deep routing. Round 2 expands into a complete 7-section Settings Dashboard (Profile, Account, Security, Notifications, Appearance, Privacy, Preferences) featuring sidebar navigation, live avatar sync, 2FA setup simulators, active session revocation, and multi-theme rendering (Light, Dark, System) with instant DOM updates.

## 3. Accessibility (a11y)
Round 1 lacked proper accessible associations, relying on generic `<div>` tags without focus-visible styles. Round 2 implements WCAG AA compliant standards: semantic landmarks (`<main>`, `<aside>`, `<nav>`, `<dialog>`), tablist keyboard navigation (Arrow Up/Down, Home, End), screen-reader labels (`aria-label`, `aria-selected`, `aria-controls`), explicit `<label for="...">` associations, high-contrast focus rings, and live regions (`aria-live="polite"`, `role="alert"`).

## 4. Validation and Edge Cases
Round 1 performed rudimentary checks that failed to catch malformed emails, short usernames, or password mismatches. Round 2 enforces comprehensive pure validators covering RFC-compliant emails, username constraints (`^[a-zA-Z0-9_]{3,20}$`), password strength scoring (1–4 scale), new password vs. confirmation matching, and enum validation across all dropdowns with localized field-level error messages.

## 5. Testing and Verification
Round 1 contained zero automated tests. Round 2 introduces a full unit and integration test suite using Node.js native `node:test` and `node:assert/strict` across 50 tests covering all validators, section schemas, session revocation, and state hydration, verified with `npm test` and production Vite builds.

## 6. Real AI Mistake Caught and Fixed
During the initial Round 2 transition, setting error messages via `errorEl.textContent = message` wiped out the sibling `<svg>` warning icon inside `.field-error`. This bug was caught during DOM validation and fixed by targeting `errorEl.querySelector('span')` to preserve SVG icons. Furthermore, password data was originally leaking into `localStorage`; state persistence was updated with `delete toStore.security.password` to prevent storing credentials in client-side storage.
