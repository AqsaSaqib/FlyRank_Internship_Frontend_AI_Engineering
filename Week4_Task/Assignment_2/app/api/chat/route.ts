import { LIMITS, getProvider } from "@/lib/ai/config";
import { streamMock } from "@/lib/ai/mock";
import { streamClaude } from "@/lib/ai/providers/anthropic";
import { streamGemini } from "@/lib/ai/providers/gemini";
import type { ChatTurn } from "@/lib/ai/stream";
import type { ChatRequestBody } from "@/lib/chat/types";

// Long answers can stream for a while; give Vercel functions room.
export const maxDuration = 60;

/**
 * POST /api/chat
 *
 * Body: { messages: [{ role, content }] } — the conversation so far, ending
 * with the user's new message.
 * Response: NDJSON stream of `StreamPart`s (see lib/chat/types.ts), the same
 * shape whichever provider answers (Claude, Gemini or the mock).
 *
 * Stopping: when the browser aborts the fetch, `request.signal` fires, which
 * cancels the provider's request too, so a stopped reply stops using tokens.
 */
export async function POST(request: Request) {
  let messages: ChatTurn[];
  try {
    messages = parseMessages(await request.json());
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Invalid request" }, { status: 400 });
  }

  const provider = getProvider();
  if (!provider) {
    return Response.json(
      { error: "The server has no AI key. Set GEMINI_API_KEY or ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  const body =
    provider === "anthropic"
      ? streamClaude(messages, request.signal)
      : provider === "gemini"
        ? streamGemini(messages, request.signal)
        : streamMock(request.signal);

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      // Stop proxies (nginx, some CDNs) from buffering the stream.
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Validate the untrusted body and shape it for the model APIs:
 * - only user/assistant string turns, trimmed, empty ones dropped
 *   (a reply stopped before its first token is empty)
 * - consecutive same-role turns merged, so roles always alternate
 * - starts with a user turn and ends with one
 * - capped in count and length
 */
function parseMessages(body: unknown): ChatTurn[] {
  const raw = (body as Partial<ChatRequestBody> | null)?.messages;
  if (!Array.isArray(raw)) throw new Error("`messages` must be an array.");

  const turns: ChatTurn[] = [];
  for (const m of raw.slice(-LIMITS.maxMessages)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      throw new Error("Each message needs a role of user or assistant and string content.");
    }
    if (m.content.length > LIMITS.maxMessageChars) {
      throw new Error(`Messages are limited to ${LIMITS.maxMessageChars} characters.`);
    }
    const content = m.content.trim();
    if (!content) continue;

    const last = turns.at(-1);
    if (last?.role === m.role) last.content += "\n\n" + content;
    else turns.push({ role: m.role, content });
  }

  while (turns[0]?.role === "assistant") turns.shift();
  if (turns.at(-1)?.role !== "user") {
    throw new Error("The conversation must end with a user message.");
  }
  return turns;
}
