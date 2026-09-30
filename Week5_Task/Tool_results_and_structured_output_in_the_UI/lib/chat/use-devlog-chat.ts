"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { useCallback, useEffect, useState } from "react";

import type { DevLogUIMessage, ToolErrorMode } from "./types";

/**
 * Chat state for the DevLog Assistant: the AI SDK's `useChat`, plus
 *   - localStorage persistence (the conversation survives a refresh)
 *   - the demo error switch: opening the page with ?simulateToolError=1 makes
 *     every tool fail; the error card's Retry turns simulation off
 *   - auto-continue after the user approves or cancels a save
 *
 * status (from the SDK):
 *   ready     → input enabled, send button
 *   submitted → request in flight, nothing streamed yet (thinking indicator)
 *   streaming → parts arriving (stop button)
 *   error     → the last request failed (error row with Try again)
 */
const STORAGE_KEY = "devlog-assistant:conversation:v2";

function urlErrorMode(): ToolErrorMode {
  if (typeof window === "undefined") return "keyword";
  return new URLSearchParams(window.location.search).get("simulateToolError") === "1" ? "force" : "keyword";
}

const transport = new DefaultChatTransport<DevLogUIMessage>({
  api: "/api/chat",
  // Resolved per request, so it always reflects the current URL.
  body: () => ({ toolErrorMode: urlErrorMode() }),
});

export function useDevLogChat() {
  const chat = useChat<DevLogUIMessage>({
    transport,
    // After Save / Cancel on an approval card, send the decision back so the
    // server can run (or skip) the tool and the model can finish its reply.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const { messages, setMessages, status, regenerate } = chat;
  const [hydrated, setHydrated] = useState(false);

  // Restore after mount (localStorage doesn't exist during SSR).
  useEffect(() => {
    setMessages(loadConversation());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from an external store
    setHydrated(true);
  }, [setMessages]);

  // Save when a turn settles (not on every streamed token).
  useEffect(() => {
    if (hydrated && (status === "ready" || status === "error")) saveConversation(messages);
  }, [messages, status, hydrated]);

  /** Error card's Retry: re-run the last turn with simulated tool errors off. */
  const retryWithoutSimulation = useCallback(
    () => void regenerate({ body: { toolErrorMode: "off" satisfies ToolErrorMode } }),
    [regenerate],
  );

  return { ...chat, hydrated, retryWithoutSimulation };
}

function loadConversation(): DevLogUIMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(saved) ? (saved as DevLogUIMessage[]) : [];
  } catch {
    return [];
  }
}

function saveConversation(messages: DevLogUIMessage[]) {
  try {
    if (messages.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage full or blocked (private mode): the chat still works, it just won't persist.
  }
}
