/**
 * Server half of the sabotage toggles (see lib/sabotage.ts for the list and
 * the NEXT_PUBLIC_ENABLE_SABOTAGE guard).
 *
 * Each failure is injected at the layer where it really happens, so the real
 * error handling runs:
 *   route    throw, 429, overloaded       → before streaming (sabotageResponse)
 *   model    midstream, slow, malformed,  → a model middleware; streamText and
 *            empty                          the UI stream handle it as usual
 *   network  disconnect                   → the HTTP body is cut mid-stream
 */
import "server-only";

import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { APICallError, wrapLanguageModel, type LanguageModel } from "ai";

import { errorPayload, errorResponse } from "@/lib/ai/errors";
import { SABOTAGE_HEADER, parseSabotage, type SabotageMode } from "@/lib/sabotage";

/** Text deltas to let through before a mid-stream failure: enough to see a partial reply. */
const TOKENS_BEFORE_FAILURE = 10;
const SLOW_FIRST_TOKEN_MS = 10_000;
const RATE_LIMIT_RETRY_AFTER = 10;

/** The requested mode, from the header (what the chat UI sends) or ?sabotage= (curl, bookmarks). */
export function readSabotage(request: Request): SabotageMode | null {
  return parseSabotage(request.headers.get(SABOTAGE_HEADER) ?? new URL(request.url).searchParams.get("sabotage"));
}

/** Failures that happen before any streaming: a thrown handler or an HTTP error status. */
export function sabotageResponse(mode: SabotageMode | null): Response | null {
  switch (mode) {
    case "throw":
      // Caught by the route's top-level handler, like any unexpected crash.
      throw new Error("Sabotage: the route handler threw before streaming.");
    case "429":
      return errorResponse(429, errorPayload("rate_limited", { retryAfter: RATE_LIMIT_RETRY_AFTER }));
    case "overloaded":
      return errorResponse(529, errorPayload("overloaded"));
    default:
      return null;
  }
}

/** Failures inside the model's stream. Only the first model step is sabotaged. */
export function sabotageModel(model: LanguageModel, mode: SabotageMode | null): LanguageModel {
  if (typeof model === "string") return model;
  if (mode !== "midstream" && mode !== "slow" && mode !== "malformed" && mode !== "empty") return model;

  let firstStep = true;
  return wrapLanguageModel({
    model,
    middleware: {
      specificationVersion: "v4",
      wrapStream: async ({ doStream, params }) => {
        if (!firstStep) return doStream();
        firstStep = false;

        switch (mode) {
          case "slow":
            await delay(SLOW_FIRST_TOKEN_MS, params.abortSignal);
            return doStream();
          case "midstream": {
            const result = await doStream();
            return { ...result, stream: result.stream.pipeThrough(failAfterTokens()) };
          }
          case "malformed":
            return { stream: fromParts(malformedToolCall()) };
          case "empty":
            return { stream: fromParts([finish("stop")]) };
        }
      },
    },
  });
}

/** `disconnect`: pass the first part of the HTTP body through, then cut the connection. */
export function sabotageBody(response: Response, mode: SabotageMode | null): Response {
  if (mode !== "disconnect" || !response.body) return response;

  const decoder = new TextDecoder();
  let textDeltas = 0;
  const cut = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      textDeltas += decoder.decode(chunk, { stream: true }).split('"type":"text-delta"').length - 1;
      // Erroring the body aborts the HTTP response: the browser sees a dropped connection.
      if (textDeltas >= TOKENS_BEFORE_FAILURE) controller.error(new Error("Sabotage: connection cut mid-stream."));
    },
  });
  return new Response(response.body.pipeThrough(cut), { status: response.status, headers: response.headers });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Let a few text deltas through, then emit the same `error` part a provider
 * sends when the upstream API fails mid-response. If the reply ends first,
 * the error replaces its `finish`.
 */
function failAfterTokens() {
  let textDeltas = 0;
  let failed = false;
  const fail = (controller: TransformStreamDefaultController<LanguageModelV4StreamPart>) => {
    failed = true;
    controller.enqueue({
      type: "error",
      error: new APICallError({
        message: "Sabotage: the upstream model failed mid-stream.",
        url: "sabotage://midstream",
        requestBodyValues: {},
        statusCode: 500,
        isRetryable: false,
      }),
    });
    controller.terminate();
  };
  return new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
    transform(part, controller) {
      if (failed) return;
      if (part.type === "finish") return fail(controller);
      controller.enqueue(part);
      if (part.type === "text-delta" && ++textDeltas >= TOKENS_BEFORE_FAILURE) fail(controller);
    },
  });
}

/** A `queryLogs` call whose input is cut off mid-JSON, like a model that stopped early. */
function malformedToolCall(): LanguageModelV4StreamPart[] {
  const id = `sabotage_${crypto.randomUUID().slice(0, 8)}`;
  const input = '{"reason": "you asked about last week", "from": "2026-09-';
  return [
    { type: "stream-start", warnings: [] },
    { type: "tool-input-start", id, toolName: "queryLogs" },
    { type: "tool-input-delta", id, delta: input },
    { type: "tool-input-end", id },
    { type: "tool-call", toolCallId: id, toolName: "queryLogs", input },
    finish("tool-calls"),
  ];
}

function finish(reason: "stop" | "tool-calls"): LanguageModelV4StreamPart {
  return {
    type: "finish",
    finishReason: { unified: reason, raw: reason },
    usage: {
      inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 0, text: 0, reasoning: 0 },
    },
  };
}

function fromParts(parts: LanguageModelV4StreamPart[]) {
  return new ReadableStream<LanguageModelV4StreamPart>({
    start(controller) {
      if (parts[0]?.type !== "stream-start") controller.enqueue({ type: "stream-start", warnings: [] });
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
