import "server-only";

import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel, type Content } from "@google/genai";

import { GEMINI_CONFIG, SYSTEM_PROMPT } from "@/lib/ai/config";
import { createPartStream, type ChatTurn, type Send } from "@/lib/ai/stream";

let client: GoogleGenAI | null = null;
function getClient() {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Errors worth retrying on the next model: busy (503/500) or rate limited (429). */
const RETRYABLE = new Set([429, 500, 503]);

/** Stream a Gemini reply as NDJSON parts. */
export function streamGemini(messages: ChatTurn[], signal: AbortSignal) {
  // Gemini calls the assistant role "model".
  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return createPartStream(async (send) => {
    const models = GEMINI_CONFIG.models;
    for (let i = 0; i < models.length; i++) {
      const isLastModel = i === models.length - 1;
      let started = false; // true once any text or thinking reached the browser

      try {
        await streamOneModel(models[i], contents, signal, send, () => (started = true));
        return;
      } catch (err) {
        if (signal.aborted) return; // the user pressed stop
        const status = err instanceof ApiError ? err.status : 0;
        // Before anything has streamed, a busy model can be swapped silently.
        if (!started && !isLastModel && RETRYABLE.has(status)) {
          console.warn(`[gemini] ${models[i]} returned ${status}, trying ${models[i + 1]}`);
          continue;
        }
        console.error("[gemini] stream failed", err);
        await send({ type: "error", message: publicErrorMessage(status) });
        return;
      }
    }
  });
}

async function streamOneModel(
  model: string,
  contents: Content[],
  signal: AbortSignal,
  send: Send,
  markStarted: () => void,
) {
  const stream = await getClient().models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
      abortSignal: signal, // stop button → cancels the request to Google
      thinkingConfig: {
        includeThoughts: GEMINI_CONFIG.includeThoughts,
        // Thinking levels exist on Gemini 3+; 2.5 models use their default.
        ...(model.startsWith("gemini-2.5") ? {} : { thinkingLevel: ThinkingLevel[GEMINI_CONFIG.thinkingLevel] }),
      },
    },
  });

  let finishReason: string | null = null;
  let announced = false;

  for await (const chunk of stream) {
    if (!announced) {
      await send({ type: "start", model: chunk.modelVersion ?? model });
      announced = true;
    }
    if (chunk.promptFeedback?.blockReason) finishReason = "blocked";

    const candidate = chunk.candidates?.[0];
    for (const part of candidate?.content?.parts ?? []) {
      if (!part.text) continue;
      markStarted();
      await send({ type: part.thought ? "reasoning-delta" : "text-delta", text: part.text });
    }
    if (candidate?.finishReason) finishReason = candidate.finishReason;
  }

  if (finishReason === FinishReason.MAX_TOKENS) {
    await send({ type: "notice", text: "Reply hit the length limit." });
  } else if (finishReason && finishReason !== FinishReason.STOP) {
    await send({ type: "notice", text: "Gemini stopped this reply early (content filter). Try rephrasing your message." });
  }
  await send({ type: "finish", stopReason: finishReason });
}

/** Map HTTP status codes to messages that are safe to show in the browser. */
function publicErrorMessage(status: number): string {
  if (status === 400) return "Gemini couldn't process this conversation. Try starting a new chat.";
  if (status === 401 || status === 403) return "The server's Gemini API key was rejected.";
  if (status === 429) return "Free-tier limit reached. Wait a minute and try again.";
  if (status === 500 || status === 503) return "Gemini is busy right now. Try again in a moment.";
  return "Something went wrong while generating a reply.";
}
