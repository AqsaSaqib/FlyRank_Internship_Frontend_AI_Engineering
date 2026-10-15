/**
 * The safety net: no test may ever reach a real AI provider.
 *
 * vitest.setup.ts wraps the global `fetch` with `guardedFetch`. A request to
 * Anthropic or Gemini throws "Real AI API called in a test" (and is recorded
 * in `blockedAiCalls`); anything else goes to the original fetch. Tests that
 * mock /api/chat spy on `fetch` on top of this and are restored afterwards,
 * so the net is always underneath.
 */
const AI_HOSTS = /(^|\.)api\.anthropic\.com$|(^|\.)generativelanguage\.googleapis\.com$/;

/** Every blocked attempt, so a test can assert it stayed empty. */
export const blockedAiCalls: string[] = [];

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function isRealAiUrl(input: RequestInfo | URL): boolean {
  try {
    return AI_HOSTS.test(new URL(urlOf(input), "http://localhost").hostname);
  } catch {
    return false;
  }
}

export function createGuardedFetch(original: typeof fetch): typeof fetch {
  const guarded = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (isRealAiUrl(input)) {
      blockedAiCalls.push(urlOf(input));
      throw new Error(`Real AI API called in a test: ${urlOf(input)}`);
    }
    return original(input, init);
  };
  return Object.assign(guarded, { isAiSafetyNet: true as const });
}
