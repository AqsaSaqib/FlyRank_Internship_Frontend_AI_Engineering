/**
 * Server side of the chat's error contract (see lib/chat/errors.ts): turns
 * anything that can go wrong upstream into a clean `{ error, code,
 * retryAfter }` payload.
 *
 * Only messages written here reach the browser. Provider messages, request
 * bodies, stack traces and headers stay in the server log.
 */
import "server-only";

import { APICallError, InvalidToolInputError, NoSuchToolError, RetryError } from "ai";

import type { ChatErrorCode, ChatErrorPayload } from "@/lib/chat/errors";
import { ToolFailure } from "@/lib/ai/tools";

const MESSAGES: Record<ChatErrorCode, string> = {
  empty_input: "Type a message first.",
  invalid_request: "The conversation couldn't be read. Try starting a new chat.",
  too_long: "That message is too long.",
  rate_limited: "Too many requests right now.",
  overloaded: "The AI model is busy right now.",
  network: "The connection to the AI provider dropped.",
  offline: "You're offline.",
  unknown: "Something went wrong on our side.",
};

export function errorPayload(code: ChatErrorCode, extra: Partial<ChatErrorPayload> = {}): ChatErrorPayload {
  return { error: MESSAGES[code], code, ...extra };
}

/** A JSON error response in the contract's shape, with Retry-After when known. */
export function errorResponse(status: number, payload: ChatErrorPayload) {
  return Response.json(payload, {
    status,
    headers: payload.retryAfter ? { "Retry-After": String(payload.retryAfter) } : undefined,
  });
}

/**
 * Map an upstream error to a public payload. `RetryError` (the SDK gave up
 * after its automatic retries) is unwrapped to the last real error.
 */
export function toPublicError(error: unknown): ChatErrorPayload {
  const cause = RetryError.isInstance(error) ? error.lastError : error;

  if (APICallError.isInstance(cause)) {
    const status = cause.statusCode;
    if (status === 429) return errorPayload("rate_limited", { retryAfter: retryAfterSeconds(cause.responseHeaders) });
    if (status === 503 || status === 529 || isOverloadedBody(cause.responseBody)) return errorPayload("overloaded");
    // No status at all: the request never got an HTTP answer (DNS, reset, timeout).
    if (status == null) return errorPayload("network");
  }
  if (isNetworkError(cause)) return errorPayload("network");
  return errorPayload("unknown");
}

const INVALID_TOOL_INPUT = "The assistant sent inputs the tool couldn't accept.";

/**
 * The stream's `onError`: what the browser sees for any error while streaming.
 *
 * Tool errors become the tool card's `errorText`, so they stay plain
 * sentences. Everything else is a stream-level failure and is sent as the
 * JSON payload, which the client parses into a ChatError.
 */
export function streamErrorText(error: unknown): string {
  if (error instanceof ToolFailure) return error.message;
  if (NoSuchToolError.isInstance(error)) return "The assistant tried to use a tool that doesn't exist.";
  if (InvalidToolInputError.isInstance(error)) return INVALID_TOOL_INPUT;
  // A failed tool call's error, already stringified by the SDK (e.g. the
  // tool-output-error after invalid input). It may quote parser internals.
  if (typeof error === "string") {
    logServerError("tool error", error, "unknown");
    return /InvalidToolInput|Invalid input for tool/.test(error) ? INVALID_TOOL_INPUT : "The tool couldn't finish.";
  }

  const payload = toPublicError(error);
  logServerError("stream error", error, payload.code);
  return JSON.stringify(payload);
}

/** One line per failure: name, status and code. Enough to debug, nothing secret. */
export function logServerError(where: string, error: unknown, code: ChatErrorCode) {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  const name = cause instanceof Error ? cause.name : typeof cause;
  const status = APICallError.isInstance(cause) ? ` status=${cause.statusCode ?? "none"}` : "";
  const text = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
  const message = text ? ` "${text.slice(0, 200)}"` : "";
  console.error(`[chat] ${where}: ${name}${status} code=${code}${message}`);
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** `Retry-After` is either seconds or an HTTP date. Anthropic also sends it on 429s. */
function retryAfterSeconds(headers: Record<string, string> | undefined): number | undefined {
  const raw = headers?.["retry-after"] ?? headers?.["Retry-After"];
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds));
  const date = Date.parse(raw);
  return Number.isNaN(date) ? undefined : Math.max(1, Math.ceil((date - Date.now()) / 1000));
}

/** Anthropic reports overload as `overloaded_error`, sometimes mid-stream with no 529 status. */
function isOverloadedBody(body: string | undefined) {
  return !!body && /overloaded/i.test(body);
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === "TimeoutError" || error.name === "AbortError") return true;
  const code = (error as { cause?: { code?: unknown } }).cause?.code;
  return (
    (typeof code === "string" && /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR)/.test(code)) ||
    /fetch failed|network|socket hang up|timed? ?out/i.test(error.message)
  );
}
