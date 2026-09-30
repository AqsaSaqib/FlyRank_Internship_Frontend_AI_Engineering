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
  let json: unknown;
  try {
    json = await request.json();
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

  const result = streamText({
    model: getModel(provider),
    instructions: systemPrompt(todayIso()),
    // A reply stopped mid tool call leaves an incomplete part; skip it rather than fail.
    messages: await convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    tools,
    toolApproval: TOOL_APPROVAL,
    stopWhen: isStepCount(GENERATION.maxSteps),
    maxOutputTokens: GENERATION.maxOutputTokens,
    reasoning: GENERATION.reasoning,
    abortSignal: request.signal,
    timeout: { totalMs: TIMEOUT_MS },
    // Logged (tersely) by `streamErrorText` when it reaches the client; don't log twice.
    onError: () => {},
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream<typeof tools, DevLogUIMessage>({
      stream: result.stream,
      // Continuing after an approval appends to the same assistant message.
      originalMessages: messages,
      messageMetadata: ({ part }) => (part.type === "start" ? { model: MODEL_IDS[provider] } : undefined),
      // Mid-stream errors reach the client as the JSON payload; tool errors as plain text.
      onError: streamErrorText,
    }),
  });
}
