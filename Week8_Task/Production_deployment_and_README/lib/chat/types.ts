/**
 * Types shared by the route handler and the chat UI.
 *
 * Messages use the AI SDK's `UIMessage`, typed with DevLog's tools so every
 * `tool-queryLogs` / `tool-getLogStats` / `tool-saveLogEntry` part has typed
 * `input` and `output`. The tool import is type-only, so no server code (or
 * the `server-only` guard in tools.ts) ends up in the browser bundle.
 */
import type { UIDataTypes, UIMessage } from "ai";

import type { DevLogUITools, ToolErrorMode } from "@/lib/ai/tools";

export type { ToolErrorMode };

/** Sent with each assistant message: which model answered (shown under the reply). */
export type DevLogMetadata = { model?: string };

export type DevLogUIMessage = UIMessage<DevLogMetadata, UIDataTypes, DevLogUITools>;
export type DevLogPart = DevLogUIMessage["parts"][number];

export type ToolName = keyof DevLogUITools;
/** The typed UI part for one tool, e.g. `ToolPart<"queryLogs">`. */
export type ToolPart<NAME extends ToolName> = Extract<DevLogPart, { type: `tool-${NAME}` }>;

/** What the client POSTs to /api/chat (DefaultChatTransport adds `id` and `trigger`). */
export type ChatRequestBody = {
  messages: DevLogUIMessage[];
  toolErrorMode?: ToolErrorMode;
};

/** Plain text of a message, ignoring reasoning and tool parts. */
export function messageText(message: DevLogUIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}
