/**
 * Small typed builders for chat messages. Tool parts come from
 * components/tools/fixtures.ts (the same ones the /states page renders), so a
 * schema change breaks the build before it can silently break a test.
 */
import type { DevLogPart, DevLogUIMessage } from "@/lib/chat/types";
import type { DynamicToolPart } from "@/components/tools/MalformedToolCall";

export { QUERY_STATES, SAVE_STATES, STATS_STATES, queryOutput, saveOutput, statsOutput } from "@/components/tools/fixtures";

let nextId = 0;
const id = (prefix: string) => `${prefix}-${++nextId}`;

export const text = (value: string): DevLogPart => ({ type: "text", text: value, state: "done" });

export const reasoning = (value: string): DevLogPart => ({ type: "reasoning", text: value, state: "done" });

/** A tool call the SDK couldn't match to a typed tool (e.g. cut-off JSON input). */
export const malformedToolCall = (overrides: Partial<DynamicToolPart> = {}): DynamicToolPart =>
  ({
    type: "dynamic-tool",
    toolName: "queryLogs",
    toolCallId: id("call"),
    state: "output-error",
    input: '{"reason": "you asked about last week", "from": "2026-09-',
    errorText: "The assistant sent inputs the tool couldn't accept.",
    ...overrides,
  }) as DynamicToolPart;

export const userMessage = (value: string): DevLogUIMessage => ({
  id: id("user"),
  role: "user",
  parts: [text(value)],
});

export const assistantMessage = (...parts: DevLogPart[]): DevLogUIMessage => ({
  id: id("assistant"),
  role: "assistant",
  parts,
});

/* -------------------------------------------------------------------------- */
/* UI message stream (what /api/chat sends back), for mocking fetch            */
/* -------------------------------------------------------------------------- */

/** Same headers the route (and e2e/chat-errors.spec.ts) uses. */
export const STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "x-vercel-ai-ui-message-stream": "v1",
};

export type StreamChunk = Record<string, unknown> & { type: string };

/** One SSE event. */
export const sseEvent = (chunk: StreamChunk | "[DONE]") =>
  `data: ${chunk === "[DONE]" ? chunk : JSON.stringify(chunk)}\n\n`;

/** The chunks of a complete plain-text reply. */
export function textReply(reply: string, messageId = id("reply")): StreamChunk[] {
  return [
    { type: "start", messageId },
    { type: "text-start", id: "t1" },
    ...reply.split(/(?<= )/).map((delta) => ({ type: "text-delta", id: "t1", delta })),
    { type: "text-end", id: "t1" },
    { type: "finish" },
  ];
}

/** A finished response body: every chunk, then [DONE]. */
export function sseResponse(chunks: StreamChunk[], init: ResponseInit = {}) {
  const body = chunks.map(sseEvent).join("") + sseEvent("[DONE]");
  return new Response(body, { status: 200, headers: STREAM_HEADERS, ...init });
}

/** A JSON error response in the route's `{ error, code, retryAfter? }` shape. */
export function errorResponse(status: number, payload: { error: string; code: string; retryAfter?: number }) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      ...(payload.retryAfter ? { "retry-after": String(payload.retryAfter) } : {}),
    },
  });
}

/**
 * A response whose body the test writes to by hand, so each state (pending,
 * streaming, done, error) can be asserted while the stream is still open.
 */
export function controlledStream() {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    response: new Response(body, { status: 200, headers: STREAM_HEADERS }),
    send(...chunks: StreamChunk[]) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(sseEvent(chunk)));
    },
    close() {
      controller.enqueue(encoder.encode(sseEvent("[DONE]")));
      controller.close();
    },
  };
}
