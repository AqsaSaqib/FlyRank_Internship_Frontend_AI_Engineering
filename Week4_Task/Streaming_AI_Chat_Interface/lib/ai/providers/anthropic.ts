import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { CLAUDE_CONFIG, SYSTEM_PROMPT } from "@/lib/ai/config";
import { createPartStream, type ChatTurn } from "@/lib/ai/stream";

let client: Anthropic | null = null;
function getClient() {
  // Reads ANTHROPIC_API_KEY from the server environment.
  client ??= new Anthropic({ timeout: 60_000, maxRetries: 2 });
  return client;
}

/** Stream a Claude reply as NDJSON parts. */
export function streamClaude(messages: ChatTurn[], signal: AbortSignal) {
  const stream = getClient().beta.messages.stream(
    {
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      system: SYSTEM_PROMPT,
      messages,
      thinking: CLAUDE_CONFIG.thinking,
      output_config: { effort: CLAUDE_CONFIG.effort },
      betas: CLAUDE_CONFIG.betas,
      fallbacks: CLAUDE_CONFIG.fallbacks,
    },
    { signal },
  );

  return createPartStream(
    async (send) => {
      let stopReason: string | null = null;
      try {
        for await (const event of stream) {
          switch (event.type) {
            case "message_start":
              await send({ type: "start", model: event.message.model });
              break;
            case "content_block_start":
              // Marks where the API switched models after a safety decline.
              if (event.content_block.type === "fallback") {
                await send({ type: "notice", text: "Switched to a fallback model to finish this reply." });
              }
              break;
            case "content_block_delta":
              if (event.delta.type === "text_delta") {
                await send({ type: "text-delta", text: event.delta.text });
              } else if (event.delta.type === "thinking_delta") {
                await send({ type: "reasoning-delta", text: event.delta.thinking });
              }
              break;
            case "message_delta":
              stopReason = event.delta.stop_reason ?? stopReason;
              break;
          }
        }

        if (stopReason === "refusal") {
          await send({ type: "notice", text: "Claude declined to continue this reply. Try rephrasing your message." });
        } else if (stopReason === "max_tokens") {
          await send({ type: "notice", text: "Reply hit the length limit." });
        }
        await send({ type: "finish", stopReason });
      } catch (err) {
        // The user pressed stop: nothing to report.
        if (signal.aborted || err instanceof Anthropic.APIUserAbortError) return;
        console.error("[claude] stream failed", err);
        await send({ type: "error", message: publicErrorMessage(err) });
      }
    },
    () => stream.abort(),
  );
}

/** Map SDK errors to messages that are safe to show in the browser. */
function publicErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The server's API key was rejected.";
  if (err instanceof Anthropic.RateLimitError) return "Too many requests right now. Wait a moment and try again.";
  if (err instanceof Anthropic.InternalServerError) return "Claude is temporarily overloaded. Try again in a moment.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach Claude. Check the connection and try again.";
  if (err instanceof Anthropic.BadRequestError) return "Claude couldn't process this conversation. Try starting a new chat.";
  return "Something went wrong while generating a reply.";
}
