import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  InvalidToolInputError,
  isStepCount,
  NoSuchToolError,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai";

import { GENERATION, LIMITS, MODEL_IDS, getModel, getProvider, systemPrompt } from "@/lib/ai/config";
import { TOOL_APPROVAL, TOOL_ERROR_MODES, ToolFailure, createDevLogTools, type ToolErrorMode } from "@/lib/ai/tools";
import { todayIso } from "@/lib/devlog/entries";
import type { DevLogUIMessage } from "@/lib/chat/types";

// Long answers (and a tool round-trip) can stream for a while; give Vercel functions room.
export const maxDuration = 60;

/**
 * POST /api/chat
 *
 * Body: { messages: UIMessage[], toolErrorMode? } from `useChat`.
 * Response: the AI SDK UI message stream (SSE): text, reasoning and typed
 * tool parts, the same whichever provider answers (Claude, Gemini or the mock).
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
  let body: { messages?: unknown; toolErrorMode?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const provider = getProvider();
  if (!provider) {
    return Response.json(
      { error: "The server has no AI key. Set GEMINI_API_KEY or ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  const errorMode: ToolErrorMode = TOOL_ERROR_MODES.find((m) => m === body.toolErrorMode) ?? "keyword";
  const tools = createDevLogTools({ errorMode });

  // Untrusted input: check message shapes and every tool part's input/output against the schemas.
  const validated = await safeValidateUIMessages<DevLogUIMessage>({
    messages: Array.isArray(body.messages) ? body.messages.slice(-LIMITS.maxMessages) : body.messages,
    tools,
  });
  if (!validated.success) {
    return Response.json({ error: "The conversation couldn't be read. Try starting a new chat." }, { status: 400 });
  }
  const messages = validated.data;
  const tooLong = messages.some(
    (m) => m.role === "user" && m.parts.some((p) => p.type === "text" && p.text.length > LIMITS.maxMessageChars),
  );
  if (tooLong) {
    return Response.json({ error: `Messages are limited to ${LIMITS.maxMessageChars} characters.` }, { status: 400 });
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
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream<typeof tools, DevLogUIMessage>({
      stream: result.stream,
      // Continuing after an approval appends to the same assistant message.
      originalMessages: messages,
      messageMetadata: ({ part }) => (part.type === "start" ? { model: MODEL_IDS[provider] } : undefined),
      onError: publicErrorMessage,
    }),
  });
}

/**
 * Every error that reaches the browser goes through here: tool failures
 * (shown in the tool's error card as `errorText`) and stream errors (shown
 * under the reply). The SDK masks errors by default; we pass through the
 * messages we wrote for users and replace everything else, so stack traces
 * and provider internals never leak.
 */
function publicErrorMessage(error: unknown): string {
  if (error instanceof ToolFailure) return error.message;
  if (NoSuchToolError.isInstance(error)) return "The assistant tried to use a tool that doesn't exist.";
  if (InvalidToolInputError.isInstance(error)) return "The assistant sent inputs the tool couldn't accept.";
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 0;
    if (status === 401 || status === 403) return "The server's API key was rejected.";
    if (status === 429) return "Too many requests right now. Wait a moment and try again.";
    if (status >= 500) return "The AI provider is temporarily unavailable. Try again in a moment.";
    return "The AI provider couldn't process this conversation. Try starting a new chat.";
  }
  console.error("[chat] unexpected error", error);
  return "Something went wrong while running this step.";
}
