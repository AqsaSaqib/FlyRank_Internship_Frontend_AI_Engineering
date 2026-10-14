/**
 * The chat's error contract, shared by the route handler and the UI.
 *
 * Every failure the server reports has the same JSON shape, whether it's an
 * HTTP error before streaming (the response body) or an error in the middle
 * of a stream (the stream's `errorText`):
 *
 *   { "error": "Human sentence.", "code": "rate_limited", "retryAfter": 12 }
 *
 * The client runs whatever it got through `parseChatError`, so a code always
 * comes out, even for errors the server never saw (offline, a dropped
 * connection, a proxy's HTML error page).
 */

export const CHAT_ERROR_CODES = [
  // 400s: the request itself is wrong; retrying the same thing won't help.
  "empty_input",
  "invalid_request",
  "too_long",
  // Upstream / transport: usually temporary, so these offer Retry.
  "rate_limited",
  // The provider's quota (e.g. Gemini free tier) is used up; waiting seconds won't help.
  "quota_exceeded",
  "overloaded",
  "network",
  "offline",
  "unknown",
] as const;

export type ChatErrorCode = (typeof CHAT_ERROR_CODES)[number];

/** What the server sends. `retryAfter` is in seconds. */
export type ChatErrorPayload = { error: string; code: ChatErrorCode; retryAfter?: number };

/** What the UI renders. */
export type ChatErrorInfo = {
  code: ChatErrorCode;
  /** The server's message, when it wrote one for users. */
  message?: string;
  /** Seconds to wait before retrying (rate limits). */
  retryAfter?: number;
};

const isCode = (value: unknown): value is ChatErrorCode => CHAT_ERROR_CODES.includes(value as ChatErrorCode);

/** Parse the `{ error, code, retryAfter }` JSON, or return null for anything else. */
export function parseErrorPayload(text: string): ChatErrorPayload | null {
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === "object" && "code" in value && isCode(value.code)) {
      const v = value as Record<string, unknown>;
      return {
        code: value.code,
        error: typeof v.error === "string" ? v.error : "",
        ...(typeof v.retryAfter === "number" && v.retryAfter > 0 && { retryAfter: Math.ceil(v.retryAfter) }),
      };
    }
  } catch {
    // Not JSON.
  }
  return null;
}

/**
 * Turn the `error` from `useChat` into a code the UI can design for.
 *
 * `useChat` hands us one of:
 *   - an APICallError for non-2xx responses (message = response body, plus statusCode)
 *   - an Error whose message is the stream's errorText (a mid-stream failure)
 *   - a TypeError from fetch / the stream reader (offline, connection dropped)
 */
export function parseChatError(error: Error, online = true): ChatErrorInfo {
  if (!online) return { code: "offline" };

  const payload = parseErrorPayload(error.message);
  if (payload) return { code: payload.code, message: payload.error || undefined, retryAfter: payload.retryAfter };

  const status = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : undefined;
  if (status === 429) return { code: "rate_limited" };
  if (status === 503 || status === 529) return { code: "overloaded" };
  if (status === 400) return { code: "invalid_request" };

  // Browsers word these differently: "Failed to fetch" (Chrome), "Load failed"
  // (Safari), "NetworkError when attempting to fetch resource" (Firefox), and
  // "network error" / "Error in input stream" when a stream is cut off.
  if (
    error.name === "TypeError" ||
    /failed to fetch|load failed|network ?error|input stream|terminated|connection/i.test(error.message)
  ) {
    return { code: "network" };
  }
  return { code: "unknown" };
}

/** Codes where sending the same request again can succeed. */
export const isRetryable = (code: ChatErrorCode) =>
  code !== "empty_input" && code !== "invalid_request" && code !== "too_long";
