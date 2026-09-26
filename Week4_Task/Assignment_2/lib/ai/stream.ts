import "server-only";

import type { StreamPart } from "@/lib/chat/types";

/** One conversation turn, already validated by the route handler. */
export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Send one part to the browser. Always `await` it so parts stay in order. */
export type Send = (part: StreamPart) => Promise<void>;

/**
 * Some models (Gemini) stream text in big chunks of a few hundred characters,
 * which looks like the whole answer popping in at once. Big text chunks are
 * re-sent word by word with this small gap, so replies visibly stream.
 * Claude already streams small tokens, so its deltas pass straight through.
 */
const WORD_DELAY_MS = 12;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Wraps a provider's streaming loop in a ReadableStream of NDJSON parts.
 *
 * After the browser disconnects (the user pressed stop) the stream is
 * cancelled, and enqueue/close would throw. Both become no-ops, and `onCancel`
 * lets the provider abort its upstream request so we stop paying for tokens.
 */
export function createPartStream(
  run: (send: Send) => Promise<void>,
  onCancel?: () => void,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let closed = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (part: StreamPart) => {
        if (!closed) controller.enqueue(encoder.encode(JSON.stringify(part) + "\n"));
      };

      const send: Send = async (part) => {
        const words = part.type === "text-delta" ? part.text.match(/\S+\s*|\s+/g) : null;
        if (!words || words.length <= 3) return emit(part);
        for (const word of words) {
          if (closed) return;
          emit({ type: "text-delta", text: word });
          await sleep(WORD_DELAY_MS);
        }
      };

      await run(send);
      if (!closed) controller.close();
      closed = true;
    },
    cancel() {
      closed = true;
      onCancel?.();
    },
  });
}
