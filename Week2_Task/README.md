# FlyRank Frontend AI Engineering — Week 2 Task

## Overview

This repository contains the deliverables for the **Week 2 Assignment** of the FlyRank Frontend AI Engineering Internship. The assignment focuses on comparing AI-assisted engineering workflows across two iterations of developing an interactive **Settings Dashboard**:

1. **Round 1 (`round-1-vague`)**: Generation of a baseline settings form using a high-level, underspecified prompt.
2. **Round 2 (`round-2-detailed`)**: Iterative improvement and implementation of a modern, multi-section Settings Dashboard using a precise, requirement-driven prompt.

---

## Purpose of the AI Engineering Workflow Exercise

The goal of this exercise is to evaluate how prompt precision, explicit architectural boundaries, and rigorous testing affect AI-generated frontend deliverables. 

Key insights explored:
- **Specification Depth vs. Output Quality**: Vague prompts produce minimal prototypes with missed edge cases and basic accessibility; detailed prompts produce robust, scalable, production-grade applications.
- **Dependency Control**: Transitioning from framework-heavy setups with bloated lockfiles to clean, zero-runtime-dependency vanilla JavaScript.
- **Verification-Driven Development**: Introducing automated testing, design token consistency, and accessibility standards to prevent regressions.

---

## Iteration Breakdown: Round 1 vs. Round 2

### Round 1: Vague Prompt (`round-1-vague`)
- **Prompt Style**: Generic request for a simple settings form.
- **Architecture**: React + Vite application with `lucide-react` icons and committed `node_modules` dependencies.
- **Scope**: Single-card form containing only three basic inputs (Name, Email, Password).
- **Limitations**:
  - No client-side validation logic or regex checking.
  - Missing field-level error messages and accessible `aria-invalid` / `aria-describedby` attributes.
  - No responsive sidebar, session controls, 2FA states, or theme persistence.
  - Zero automated tests.

### Round 2: Detailed Prompt (`round-2-detailed`)
- **Prompt Style**: Detailed technical specification with layout guidelines, visual color constraints, accessibility requirements, validation rules, and automated test mandates.
- **Architecture**: Modular Vanilla JavaScript (ES modules) with pure CSS design tokens and zero external frontend runtime dependencies.
- **Scope**: Full 7-section Settings Dashboard with responsive sidebar navigation and live state synchronization.
- **Enhancements**:
  - Pure validation engine in [`js/validation.js`](file:///d:/FlyRank_Internship_Frontend_AI_Engineering/Week2_Task/settings-form/js/validation.js) covering edge cases and regex formats.
  - Deep reactive state store in [`js/state.js`](file:///d:/FlyRank_Internship_Frontend_AI_Engineering/Week2_Task/settings-form/js/state.js) with `localStorage` persistence and credential sanitization.
  - 50 unit and integration tests using Node's native test runner (`node --test`).

### Key Differences Summary

| Area | Round 1 (`round-1-vague`) | Round 2 (`round-2-detailed`) |
| :--- | :--- | :--- |
| **Architecture** | React + external icon dependencies | Zero-dependency Vanilla JS ES modules |
| **Navigation** | Single un-tabbed page | Left sidebar + mobile off-canvas drawer |
| **Sections** | 1 basic card (Profile only) | 7 dedicated sections (Profile, Account, Security, Notifications, Appearance, Privacy, Preferences) |
| **Theme Support** | Basic static styling | Dynamic Light, Dark, and System theme engine |
| **Validation** | Basic browser fallback | RFC email, username regex, password strength meter, password match, select enums |
| **Security Features** | None | Simulated TOTP 2FA modal, active sessions list, "Log out other sessions" action |
| **Accessibility (a11y)** | Generic divs, no focus rings | Full WCAG AA compliance, semantic HTML5, keyboard navigation (`tablist`), live regions |
| **Testing** | 0 tests | 50 automated tests (10 suites, 100% passing) |

---

## Features Implemented in the Settings Dashboard

The dashboard consists of 7 modular settings sections:

1. **Profile**:
   - Full Name (required, min 2 characters, max 80 characters).
   - Email Address (RFC-compliant format validation).
   - Professional Role/Title and Public Bio.
   - Live avatar initials and profile card synchronization.

2. **Account**:
   - Username handle validation (`@username`, 3–20 alphanumeric/underscore characters).
   - Account Language and Timezone selection.
   - Membership overview status badge (Active • Pro Plan, Email Verified).
   - Account deactivation confirmation modal dialog.

3. **Security**:
   - Current password validation and new password strength meter (1–4 score: Weak, Fair, Good, Strong).
   - New password vs. confirmation matching check.
   - Two-Factor Authentication (2FA) switch with simulated TOTP QR setup modal and manual entry key.
   - Active device sessions list with device icons, IP, location, and "Log Out All Other Sessions" action.

4. **Notifications**:
   - Global delivery frequency selector (All, Important Only, None).
   - Granular email subscription toggles: Security Alerts, Product Updates, Weekly Digest, and Team Mentions.
   - Browser push notifications and sound alerts switches.

5. **Appearance**:
   - Interactive Theme selector cards: Light, Dark, and System Default.
   - Instant root DOM styling (`data-theme="light|dark|system"`).
   - Header quick theme toggle button.
   - Layout density modes: Compact Density and High Contrast toggles.

6. **Privacy & Data Governance**:
   - Profile visibility selection (Public, Team/Contacts, Private).
   - Anonymous telemetry and personalized AI recommendations switches.
   - Online activity status and search engine indexing toggles.

7. **Preferences**:
   - Regional Language and Timezone selectors.
   - Date display format (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`).
   - Time display format (`12h` AM/PM vs. `24h`).
   - Auto-save drafts toggle and default landing section selector.
   - Export Settings configuration as formatted JSON.

---

## Validation, Accessibility & Edge Cases

### Validation & Edge Cases Handled
- **Empty & Whitespace Inputs**: Blocked with immediate user feedback.
- **Email Patterns**: Validated against practical RFC-5322 regex.
- **Username Constraints**: Enforced 3–20 character limits and alphanumeric + underscore rules.
- **Password Strength & Matching**: Minimum 8 characters; enforces difference between current and new passwords; verifies password confirmation.
- **Select / Enum Integrity**: Validated against whitelist arrays for themes, languages, timezones, and frequencies.
- **Sanitized State Persistence**: Unhashed passwords and raw credentials are never persisted to `localStorage` or exported via JSON.

### Accessibility (a11y)
- **Semantic Structure**: Semantic HTML5 elements (`<header>`, `<aside>`, `<nav>`, `<main>`, `<section>`, `<dialog>`).
- **Form Controls**: Explicit `<label for="...">` associations for every input, select, and textarea.
- **Keyboard Navigation**:
  - Tablist navigation via Arrow Up, Arrow Down, Home, and End keys.
  - Focusable interactive elements with high-contrast `:focus-visible` rings.
  - Modal dialogs with Escape key dismissal and focus trapping.
- **Screen Reader Support**: Accessible ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `role="status"`, `role="alert"`) and live regions (`aria-live="polite"`).

---

## Testing & Quality Verification

Automated testing is built with Node.js built-in test runner (`node:test` and `node:assert/strict`):

```bash
npm test
```

### Test Suite Summary:
- **Suites**: 10
- **Total Tests**: 50
- **Passing**: 50 (100%)
- **Failing**: 0

### Production Build:
Production bundling is handled by Vite:

```bash
npm run build
```

---

## Git Branches

- **`round-1-vague`**: Contains the baseline, vague-prompt iteration (React-based implementation).
- **`round-2-detailed`**: Contains the complete, refined, multi-section Settings Dashboard (Vanilla JS + CSS tokens).

---

## How to Run Locally

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm

### Installation & Development
1. Navigate to the `settings-form` directory:
   ```bash
   cd Week2_Task/settings-form
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Run the automated test suite:
   ```bash
   npm test
   ```
5. Create a production build:
   ```bash
   npm run build
   ```

---

## Technologies & Tools

- **Frontend Core**: Vanilla HTML5, CSS3, ES Modules (JavaScript)
- **Styling System**: Pure CSS with Custom Properties (Design Tokens), Flexbox, CSS Grid
- **Build Tool**: Vite 6
- **Test Runner**: Node.js Native Test Runner (`node:test`, `node:assert/strict`)
- **Version Control**: Git & GitHub

---

## Related Documentation

- [`WORKFLOW.md`](file:///d:/FlyRank_Internship_Frontend_AI_Engineering/Week2_Task/WORKFLOW.md): Detailed comparative analysis between Round 1 and Round 2, including file differences, code review effort, and real AI mistakes caught and resolved.
- [`CLAUDE.md`](file:///d:/FlyRank_Internship_Frontend_AI_Engineering/Week2_Task/CLAUDE.md): Project-specific engineering rules, validation standards, state sanitization policies, and token guidelines.
