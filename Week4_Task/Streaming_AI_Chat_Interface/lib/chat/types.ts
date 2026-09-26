/**
 * Types shared by the route handler and the chat UI.
 */

/* ----------------------------- UI message model ---------------------------- */

/** One typed piece of a message. Rendered differently by the UI. */
export type MessagePart =
  | { type: "reasoning"; text: string }
  | { type: "text"; text: string }
  | { type: "notice"; text: string };

export type MessageStatus =
  | "pending" // request sent, nothing received yet (thinking indicator)
  | "streaming" // tokens arriving
  | "done"
  | "stopped" // user pressed stop, partial output kept
  | "error";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  status: MessageStatus;
  error?: string;
  /** Which model answered (assistant messages), shown under the reply. */
  model?: string;
};

/* ------------------------------ Wire protocol ----------------------------- */

/** What the client POSTs to /api/chat. Text only: history is plain turns. */
export type ChatRequestBody = {
  messages: { role: "user" | "assistant"; content: string }[];
};

/**
 * What /api/chat streams back: newline-delimited JSON, one part per line.
 * A small typed protocol is easier to consume and test than raw SSE frames.
 */
export type StreamPart =
  | { type: "start"; model: string }
  | { type: "reasoning-delta"; text: string }
  | { type: "text-delta"; text: string }
  | { type: "notice"; text: string }
  | { type: "finish"; stopReason: string | null }
  | { type: "error"; message: string };

/** Plain text of a message, ignoring reasoning and notices. */
export function messageText(message: ChatMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}
