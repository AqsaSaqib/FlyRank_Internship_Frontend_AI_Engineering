import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai";
import { z } from "zod";

import { GENERATION, LIMITS, MODEL_IDS, getModel, getProvider, systemPrompt } from "@/lib/ai/config";
import { errorPayload, errorResponse, logServerError, streamErrorText, toPublicError } from "@/lib/ai/errors";
import { checkRateLimit, clientIdFrom, rateLimitEnabled } from "@/lib/ai/rate-limit";
import { readSabotage, sabotageBody, sabotageModel, sabotageResponse } from "@/lib/ai/sabotage";
import { TOOL_APPROVAL, TOOL_ERROR_MODES, createDevLogTools } from "@/lib/ai/tools";
import { todayIso } from "@/lib/devlog/entries";
import { messageText, type DevLogUIMessage } from "@/lib/chat/types";

/**
 * Vercel stops the function after this many seconds. A long answer plus a
 * tool round-trip fits comfortably; `TIMEOUT_MS` below ends the model call a
 * little earlier so the user gets a readable error instead of a cut
 * connection.
 */
export const maxDuration = 60;
const TIMEOUT_MS = (maxDuration - 5) * 1000;

/**
 * Largest request body read at all (characters). Only the last
 * `LIMITS.maxMessages` messages reach the model, but the whole body is
 * parsed first, so a huge one is refused before it costs CPU.
 */
const MAX_BODY_CHARS = 1_000_000;

/** `useChat`'s DefaultChatTransport also sends `id`, `trigger` and `messageId`; they're ignored. */
const RequestBody = z.object({
  messages: z.array(z.unknown()).min(1),
  toolErrorMode: z.enum(TOOL_ERROR_MODES).optional(),
});

/**
 * POST /api/chat
 *
 * Body: { messages: UIMessage[], toolErrorMode? } from `useChat`.
 * Response: the AI SDK UI message stream (SSE): text, reasoning and typed
 * tool parts, the same whichever provider answers (Claude, Gemini or the mock).
 *
 * Errors (see lib/chat/errors.ts for the contract):
 *   before streaming → HTTP 4xx/5xx with JSON { error, code, retryAfter? }
 *   while streaming  → the stream's error part, whose text is that same JSON
 *
 * Tools run here on the server. `stopWhen` lets the model take several steps,
 * so after a tool returns it's called again to answer with the result.
 * `saveLogEntry` pauses for approval: the stream ends with an
 * `approval-requested` part, and the client's next request carries the
 * user's decision, which streamText executes (or denies) before continuing.
 *
 * Stopping: when the browser aborts the fetch, `request.signal` fires, which
 * cancels the provider's request too, so a stopped reply stops using tokens.
 *
 * Abuse guard (public URL): other sites' pages can't call it (Origin check),
 * bodies are capped, and each IP gets a per-minute and per-day request budget
 * on top of an app-wide daily one (lib/ai/rate-limit.ts).
 */
export async function POST(request: Request) {
  try {
    return await handleChat(request);
  } catch (error) {
    // Anything unexpected before the stream started. Never send the error itself.
    const payload = toPublicError(error);
    logServerError("route crashed", error, payload.code);
    return errorResponse(500, payload);
  }
}

async function handleChat(request: Request) {
  if (!sameOrigin(request)) {
    return errorResponse(403, errorPayload("invalid_request", { error: "This API only serves the DevLog app." }));
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  const raw = declaredLength > MAX_BODY_CHARS ? null : await request.text();
  if (raw === null || raw.length > MAX_BODY_CHARS) {
    return errorResponse(
      413,
      errorPayload("too_long", { error: "This conversation is too long to send. Start a new chat." }),
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return errorResponse(400, errorPayload("invalid_request", { error: "The request body isn't valid JSON." }));
  }

  const body = RequestBody.safeParse(json);
  if (!body.success) {
    return errorResponse(400, errorPayload("invalid_request"));
  }

  const provider = getProvider();
  if (!provider) {
    console.error("[chat] no provider: set GEMINI_API_KEY or ANTHROPIC_API_KEY");
    return errorResponse(500, errorPayload("unknown", { error: "The assistant isn't set up on this server yet." }));
  }

  const tools = createDevLogTools({ errorMode: body.data.toolErrorMode ?? "keyword" });

  // Untrusted input: check message shapes and every tool part's input/output against the schemas.
  const validated = await safeValidateUIMessages<DevLogUIMessage>({
    messages: body.data.messages.slice(-LIMITS.maxMessages),
    tools,
  });
  if (!validated.success) {
    return errorResponse(400, errorPayload("invalid_request"));
  }
  const messages = validated.data;

  // A new turn must say something. (After an approval the last message is the assistant's.)
  const last = messages.at(-1);
  if (last?.role === "user" && !messageText(last).trim()) {
    return errorResponse(400, errorPayload("empty_input"));
  }
  const tooLong = messages.some((m) => m.role === "user" && messageText(m).length > LIMITS.maxMessageChars);
  if (tooLong) {
    return errorResponse(
      400,
      errorPayload("too_long", { error: `Messages are limited to ${LIMITS.maxMessageChars.toLocaleString("en-US")} characters.` }),
    );
  }

  // Dev/preview only (NEXT_PUBLIC_ENABLE_SABOTAGE): force a failure on purpose. See lib/sabotage.ts.
  const sabotage = readSabotage(request);
  const sabotaged = sabotageResponse(sabotage);
  if (sabotaged) return sabotaged;

  // Last check before spending tokens, so malformed requests don't use up anyone's budget.
  if (rateLimitEnabled(provider)) {
    const limit = checkRateLimit(clientIdFrom(request));
    if (!limit.ok) {
      console.warn(`[chat] rate limited (${limit.reason}) retryAfter=${limit.retryAfter}s`);
      return limit.reason === "burst"
        ? errorResponse(429, errorPayload("rate_limited", { retryAfter: limit.retryAfter }))
        : errorResponse(429, errorPayload("quota_exceeded"));
    }
  }

  const result = streamText({
    model: sabotageModel(getModel(provider), sabotage),
    instructions: systemPrompt(todayIso()),
    // A reply stopped mid tool call leaves an incomplete part; skip it rather than fail.
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    toolApproval: TOOL_APPROVAL,
    stopWhen: isStepCount(GENERATION.maxSteps),
    maxOutputTokens: GENERATION.maxOutputTokens,
    maxRetries: GENERATION.maxRetries,
    reasoning: GENERATION.reasoning,
    abortSignal: request.signal,
    timeout: { totalMs: TIMEOUT_MS },
    // Logged (tersely) by `streamErrorText` when it reaches the client; don't log twice.
    onError: () => {},
  });

  const response = createUIMessageStreamResponse({
    stream: toUIMessageStream<typeof tools, DevLogUIMessage>({
      stream: result.stream,
      // Continuing after an approval appends to the same assistant message.
      originalMessages: messages,
      // The configured model at the start; the one that actually answered (maybe the fallback) per step.
      messageMetadata: ({ part }) =>
        part.type === "start"
          ? { model: MODEL_IDS[provider] }
          : part.type === "finish-step" && part.response.modelId
            ? { model: part.response.modelId }
            : undefined,
      // Mid-stream errors reach the client as the JSON payload; tool errors as plain text.
      onError: streamErrorText,
    }),
  });
  return sabotageBody(response, sabotage);
}

/**
 * Browsers always send `Origin` on a cross-site POST; if it names another
 * host, refuse. Requests without it (curl, server-to-server) fall through to
 * the rate limiter, so this only stops other websites from using the route
 * from their visitors' browsers.
 */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("host") ?? new URL(request.url).host);
  } catch {
    return false;
  }
}
