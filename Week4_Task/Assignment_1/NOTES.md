# NOTES: What shadcn/Radix handles that my version missed

**What I compared**

- **My components:** `playground/Modal.tsx` and `playground/Tabs.tsx`, committed before shadcn was installed.
- **shadcn components:** `components/ui/dialog.tsx` and `components/ui/tabs.tsx`.
- **Radix primitives behind them** (read in `node_modules/@radix-ui/*/dist/index.mjs`):
  - `react-dialog`, `react-focus-scope`, `react-focus-guards`, `react-dismissable-layer`, `react-portal`
  - `react-tabs`, `react-roving-focus`
  - the packages `aria-hidden` and `react-remove-scroll`

**(tested)** means I reproduced the gap in the browser on `/playground`. The other items come from
reading the code.

---

## Modal vs shadcn Dialog

### 1. The background is not hidden from screen readers (tested)

- **Mine:** only adds `aria-modal="true"`. With the modal open, `<main>` has no `aria-hidden`.
- **shadcn/Radix:** `DialogContent` in `react-dialog` calls `hideOthers()` from the `aria-hidden` package.
  It puts `aria-hidden="true"` on everything outside the dialog. `<main>` got it when I opened the
  shadcn dialog.
- **Why it matters:** some screen readers, for example VoiceOver on Mac and iPhone, don't fully
  respect `aria-modal`. A blind user can still move their reading cursor out of the modal and into
  the page behind it.

### 2. The focus trap breaks after a mouse click (tested)

- **Mine:** the trap is only an `onKeyDown` on the dialog, and it only fixes Tab at the first and last
  element. Clicking the dark backdrop moves focus to `<body>`. After that:
  - Escape does nothing, because the key press no longer reaches the dialog.
  - Shift+Tab goes to the "Open modal" button behind the backdrop.
- **shadcn/Radix:**
  - `FocusScope` listens to `focusin` and `focusout` on the whole document. If focus goes outside,
    it moves focus back inside.
  - `DismissableLayer` sets `pointer-events: none` on `<body>`, so clicks outside can't steal focus.
  - `DismissableLayer` also listens for Escape on the whole document.
  - `FocusGuards` adds two invisible focusable spans at the start and end of the page.
- **Why it matters:** many people use the mouse and keyboard together. One click and the modal loses
  its keyboard support.

### 3. Hidden buttons inside the modal break the Tab loop (tested)

- **Mine:** `getFocusableElements()` uses `querySelectorAll`, which also finds buttons that are hidden.
  I put a hidden button at the end of the modal. Pressing Tab on **Subscribe** then did not wrap to
  the first field. Focus left the modal and went to the "HTML" tab on the page.
- **shadcn/Radix:** `FocusScope` skips `hidden` and `disabled` elements, and uses `checkVisibility()`
  to find the first and last elements that are actually visible.
- **Why it matters:** real modals often have collapsed sections or conditional fields. Keyboard users
  would fall out of the modal into a page they can't see.

### 4. No portal (tested)

- **Mine:** the modal renders inside `<main>`, right where `<Modal>` is used.
- **shadcn/Radix:** `DialogContent` is wrapped in `DialogPortal`, which uses `ReactDOM.createPortal` to
  render it directly inside `<body>`.
- **Why it matters:** if a parent element has `transform`, `overflow: hidden` or a `z-index`, my modal
  can get cut off or appear behind other content. The portal is also what lets Radix hide `<main>`
  (gap 1).

### 5. No scroll lock (tested)

- **Mine:** the page behind the modal can still scroll. `body` has `overflow: visible`.
- **shadcn/Radix:** `DialogOverlay` uses `RemoveScroll` from `react-remove-scroll`, which sets
  `overflow: hidden` on `<body>` while the dialog is open.
- **Why it matters:** on phones, scrolling the modal scrolls the page behind it, and zoom or
  magnifier users lose their place.

### 6. Nested modals: one Escape closes all of them (from the code)

- **Mine:** Escape is handled in the dialog's `onKeyDown`, and the event keeps bubbling up. If a
  `<Modal>` is opened inside another `<Modal>`, one Escape calls both `onClose` functions.
- **shadcn/Radix:** `DismissableLayer` keeps a stack of open layers, and only the top one reacts to
  Escape. `FocusScope` pauses the outer trap while the inner one is open.
- **Why it matters:** in a "Delete? → Are you sure?" flow, Escape should close only the confirmation,
  not the whole form underneath.

---

## Tabs vs shadcn Tabs

### 7. Alt+ArrowLeft is blocked (tested)

- **Mine:** `handleKeyDown` only checks `event.key`. On a tab, **Alt+ArrowLeft** (the browser's
  "Back" shortcut) switched the tab and was blocked with `preventDefault()`.
- **shadcn/Radix:** `RovingFocusGroupItem` in `react-roving-focus` ignores the key when Alt, Ctrl,
  Shift or Meta is held.
- **Why it matters:** keyboard users depend on browser shortcuts, and a component should not take
  them over.

### 8. No right-to-left (RTL) support (from the code)

- **Mine:** ArrowRight always goes to the next tab.
- **shadcn/Radix:** `Tabs` reads the text direction, and `getDirectionAwareKey()` in
  `react-roving-focus` swaps the left and right arrows when `dir="rtl"`.
- **Why it matters:** in Urdu or Arabic pages the tabs run right to left, so with my version
  ArrowRight moves focus in the wrong direction.

### 9. No vertical tabs or disabled tabs (from the code)

- **Mine:** horizontal only, and there's no way to disable a tab.
- **shadcn/Radix:**
  - `orientation="vertical"` switches to ArrowUp and ArrowDown and sets `aria-orientation`.
  - Disabled tabs are skipped by the arrow keys.
- **Why it matters:** settings pages often use vertical tabs, and screen readers need
  `aria-orientation` to announce which arrow keys to use.

---

## What my version already does the same way

Checked with the keyboard on `/playground`:

- **Tabs:**
  - roles and ARIA links (`aria-selected`, `aria-controls`, `aria-labelledby`)
  - roving tabindex
  - arrow keys wrap around, and Home/End work
  - automatic activation
  - Tab moves into the panel
- **Modal:**
  - focus moves into the modal on open
  - Tab and Shift+Tab loop inside (as long as focus stays inside)
  - Escape closes it
  - focus goes back to the "Open modal" button on close

**Not checked in the browser:** the shadcn dialog's focus return. The browser pane was hidden during
testing, so the closing animation never finished. According to the source, `react-dialog` calls
`triggerRef.current.focus()` when the dialog closes.
