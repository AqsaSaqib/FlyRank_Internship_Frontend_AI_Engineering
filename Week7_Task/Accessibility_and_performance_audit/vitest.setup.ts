import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { createGuardedFetch } from "./test/ai-safety-net";

/* -------------------------------------------------------------------------- */
/* Never talk to a real model                                                  */
/* -------------------------------------------------------------------------- */

// No keys in tests, whatever is in the shell or .env.local: the route must pick the mock.
delete process.env.ANTHROPIC_API_KEY;
delete process.env.GEMINI_API_KEY;
process.env.CHAT_PROVIDER = "mock";
// The tools fake a database round-trip; tests don't need to wait for it.
process.env.DEVLOG_TOOL_LATENCY_MS = "0";

// Any request to Anthropic or Gemini throws "Real AI API called in a test".
globalThis.fetch = createGuardedFetch(globalThis.fetch);

/* -------------------------------------------------------------------------- */
/* React Testing Library                                                      */
/* -------------------------------------------------------------------------- */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (typeof window !== "undefined") window.localStorage.clear();
});

/* -------------------------------------------------------------------------- */
/* jsdom polyfills for browser APIs the components use                         */
/* -------------------------------------------------------------------------- */

if (typeof window !== "undefined") {
  // Theme script / reduced motion checks.
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }

  // useStickToBottom and the tool cards' height morph observe size changes.
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver ??= class extends NoopObserver {
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;

  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
  Element.prototype.scrollTo ??= function scrollTo() {};

  // The Copy button. userEvent.setup() swaps in its own stub; this covers render-only tests.
  if (!navigator.clipboard) {
    let clipboardText = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          clipboardText = text;
        },
        readText: async () => clipboardText,
      },
    });
  }
}
