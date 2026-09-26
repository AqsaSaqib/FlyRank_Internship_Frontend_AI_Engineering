"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  messageText,
  type ChatMessage,
  type ChatRequestBody,
  type MessagePart,
  type StreamPart,
} from "./types";

/**
 * Chat state for the DevLog Assistant: our own consumer for the NDJSON stream
 * from /api/chat (the job `useChat` does in the AI SDK).
 *
 * status:
 *   ready     → input enabled, send button
 *   submitted → request in flight, no tokens yet (thinking indicator)
 *   streaming → tokens arriving (stop button)
 *
 * Stop is a state transition, not just a UI change: aborting keeps the
 * partial reply (marked "stopped"), returns to "ready", and the partial text
 * is sent as history on the next turn so Claude sees what it already said.
 */
export type ChatStatus = "ready" | "submitted" | "streaming";

const STORAGE_KEY = "devlog-assistant:conversation:v1";

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [hydrated, setHydrated] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  // Always-current copy for callbacks, so they don't close over stale state.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* ------------------------------ persistence ------------------------------ */

  // Restore after mount (localStorage doesn't exist during SSR).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from an external store
    setMessages(loadConversation());
    setHydrated(true);
  }, []);

  // Save, at most every 400ms while streaming, so a refresh mid-reply keeps
  // almost everything.
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => saveConversation(messages), status === "ready" ? 0 : 400);
    return () => clearTimeout(id);
  }, [messages, status, hydrated]);

  /* ------------------------------- updates -------------------------------- */

  const updateMessage = useCallback(
    (id: string, update: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === id ? update(m) : m))),
    [],
  );

  /**
   * Run one assistant turn for `history` (which must end with a user message),
   * streaming into a new assistant message appended after it.
   */
  const run = useCallback(
    async (history: ChatMessage[]) => {
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [],
        status: "pending",
      };
      setMessages([...history, assistant]);
      setStatus("submitted");

      const controller = new AbortController();
      abortRef.current = controller;

      // Tokens can arrive faster than the screen refreshes. Buffer them and
      // commit once per animation frame: fewer renders, smoother text.
      let pending: StreamPart[] = [];
      let frame = 0;
      const flush = () => {
        frame = 0;
        if (!pending.length) return;
        const parts = pending;
        pending = [];
        updateMessage(assistant.id, (m) => applyParts(m, parts));
      };
      const enqueue = (part: StreamPart) => {
        pending.push(part);
        frame ||= requestAnimationFrame(flush);
      };
      const finish = (update: Partial<ChatMessage>) => {
        cancelAnimationFrame(frame);
        flush();
        updateMessage(assistant.id, (m) => ({ ...m, ...update }));
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toRequestBody(history)),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? `Request failed (${res.status})`);
        }

        let sawFinish = false;
        let streamError: string | null = null;
        for await (const part of readNdjson(res.body)) {
          if (part.type === "text-delta" || part.type === "reasoning-delta") {
            setStatus("streaming");
          }
          if (part.type === "finish") sawFinish = true;
          if (part.type === "error") streamError = part.message;
          enqueue(part);
        }

        if (streamError) throw new Error(streamError);
        if (!sawFinish) throw new Error("The connection closed before the reply finished.");
        finish({ status: "done" });
      } catch (err) {
        if (controller.signal.aborted) {
          finish({ status: "stopped" });
        } else {
          finish({
            status: "error",
            error: err instanceof Error ? err.message : "Something went wrong.",
          });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStatus("ready");
      }
    },
    [updateMessage],
  );

  /* ---------------------------- public actions ---------------------------- */

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || abortRef.current) return false;
      const user: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: content }],
        status: "done",
      };
      void run([...messagesRef.current, user]);
      return true;
    },
    [run],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  /** Re-run the last assistant turn (after an error, a stop, or just to retry). */
  const regenerate = useCallback(() => {
    if (abortRef.current) return;
    const history = [...messagesRef.current];
    while (history.at(-1)?.role === "assistant") history.pop();
    if (history.length) void run(history);
  }, [run]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  // Abort an in-flight request if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, status, hydrated, send, stop, regenerate, clear };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Fold streamed parts into a message, merging consecutive deltas of a type. */
function applyParts(message: ChatMessage, stream: StreamPart[]): ChatMessage {
  const parts = [...message.parts];
  const append = (type: "text" | "reasoning", text: string) => {
    const last = parts.at(-1);
    if (last?.type === type) parts[parts.length - 1] = { type, text: last.text + text };
    else parts.push({ type, text });
  };

  let status = message.status;
  let error = message.error;
  let model = message.model;
  for (const part of stream) {
    switch (part.type) {
      case "start":
        model = part.model;
        break;
      case "text-delta":
        append("text", part.text);
        status = "streaming";
        break;
      case "reasoning-delta":
        append("reasoning", part.text);
        status = "streaming";
        break;
      case "notice":
        parts.push({ type: "notice", text: part.text } satisfies MessagePart);
        break;
      case "error":
        error = part.message;
        break;
    }
  }
  return { ...message, parts, status, error, model };
}

/** Parse a newline-delimited JSON stream into typed parts. */
async function* readNdjson(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamPart> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep the incomplete last line
      for (const line of lines) if (line.trim()) yield JSON.parse(line) as StreamPart;
    }
    if (buffer.trim()) yield JSON.parse(buffer) as StreamPart;
  } finally {
    reader.releaseLock();
  }
}

function toRequestBody(history: ChatMessage[]): ChatRequestBody {
  return {
    messages: history
      .map((m) => ({ role: m.role, content: messageText(m) }))
      .filter((m) => m.content.trim()),
  };
}

function loadConversation(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    if (!Array.isArray(saved)) return [];
    // A reply that was mid-stream when the page closed can't resume: keep what
    // arrived and mark it stopped, or drop it if nothing did.
    return saved
      .map((m) =>
        m.status === "pending" || m.status === "streaming" ? { ...m, status: "stopped" as const } : m,
      )
      .filter((m) => m.role === "user" || m.parts.length > 0 || m.status === "error");
  } catch {
    return [];
  }
}

function saveConversation(messages: ChatMessage[]) {
  try {
    if (messages.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage full or blocked (private mode): the chat still works, it just won't persist.
  }
}
