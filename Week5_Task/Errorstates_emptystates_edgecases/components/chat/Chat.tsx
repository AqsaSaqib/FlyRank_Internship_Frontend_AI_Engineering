"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDevLogChat } from "@/lib/chat/use-devlog-chat";
import { useOnlineStatus } from "@/lib/chat/use-online-status";
import { useStickToBottom } from "@/lib/chat/use-stick-to-bottom";
import type { DevLogUIMessage } from "@/lib/chat/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToolActionsContext, type ToolActions } from "@/components/tools/ToolCard";
import { ChatHeader } from "./ChatHeader";
import { ChatWelcome } from "./ChatWelcome";
import { Composer, type ComposerHandle } from "./Composer";
import { Icon } from "./icons";
import { Message } from "./Message";
import { OfflineBanner } from "./OfflineBanner";

/** Placeholder for a reply that has no message yet (request sent, nothing streamed, or it failed first). */
const PENDING_REPLY: DevLogUIMessage = { id: "pending", role: "assistant", parts: [] };

/**
 * The DevLog Assistant: DevLog's central AI interaction, a streaming chat
 * that turns rough notes into log entries and weekly reports.
 */
export function Chat() {
  const {
    messages,
    setMessages,
    status,
    error,
    hydrated,
    sendMessage,
    stop,
    regenerate,
    clearError,
    addToolApprovalResponse,
    retryWithoutSimulation,
  } = useDevLogChat();
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();
  const composerRef = useRef<ComposerHandle>(null);
  const online = useOnlineStatus();
  // The reply the user stopped, so it can show a "Stopped" badge.
  const [stoppedId, setStoppedId] = useState<string | null>(null);
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  // A reply is pending and nothing has streamed yet, or the request failed
  // before any assistant message existed: show a placeholder reply.
  const rows = useMemo(
    () => (last?.role === "user" && (error || busy) ? [...messages, PENDING_REPLY] : messages),
    [messages, last, error, busy],
  );
  // Read by the stable callbacks below, so memoized messages don't re-render on every token.
  const lastRef = useRef(last);
  useEffect(() => {
    lastRef.current = last;
  });

  // Empty-state CTAs elsewhere link to /?prompt=…: fill the composer (never auto-send).
  useEffect(() => {
    const url = new URL(window.location.href);
    const prompt = url.searchParams.get("prompt");
    if (!prompt) return;
    composerRef.current?.setValue(prompt);
    url.searchParams.delete("prompt");
    window.history.replaceState(null, "", url);
  }, []);

  const handleSend = (text: string) => {
    const content = text.trim();
    if (!content || busy || !online) return false;
    setStoppedId(null);
    void sendMessage({ text: content });
    // Sending is an explicit "show me the latest": re-pin to the bottom.
    requestAnimationFrame(() => scrollToBottom("auto"));
    return true;
  };

  const handleStop = useCallback(() => {
    const current = lastRef.current;
    if (current?.role === "assistant") setStoppedId(current.id);
    void stop();
    composerRef.current?.focus();
  }, [stop]);

  /**
   * Retry / Regenerate: re-run ONLY the last assistant response. `regenerate()`
   * drops that one message (partial text included) and re-sends the same
   * conversation, so the user's message is never duplicated. RetryButton
   * guards against double clicks; the buttons are disabled while busy.
   */
  const handleRetry = useCallback(async () => {
    const active = document.activeElement;
    setStoppedId(null);
    const run = regenerate();
    // The Retry button is about to unmount: keep keyboard focus in the conversation.
    if (active instanceof HTMLElement && scrollRef.current?.contains(active)) {
      scrollRef.current.focus({ preventScroll: true });
    }
    await run;
  }, [regenerate, scrollRef]);

  // Tool cards reach these through context instead of props through every message.
  const toolActions = useMemo<ToolActions>(
    () => ({
      retry: busy
        ? null
        : () => {
            setStoppedId(null);
            retryWithoutSimulation();
          },
      respondToApproval: (id, approved) => void addToolApprovalResponse({ id, approved }),
    }),
    [busy, retryWithoutSimulation, addToolApprovalResponse],
  );

  return (
    <div className="flex h-app flex-col">
      <ChatHeader>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => {
            void stop();
            clearError();
            setMessages([]);
            setStoppedId(null);
            composerRef.current?.focus();
          }}
          disabled={messages.length === 0}
          className="tap-target inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="plus" className="size-4" />
          <span>New chat</span>
        </button>
      </ChatHeader>

      <main className="relative min-h-0 flex-1">
        <h1 className="sr-only">DevLog Assistant</h1>
        <div
          ref={scrollRef}
          // Focus target after Retry (the button unmounts); not in the tab order.
          tabIndex={-1}
          className="h-full overflow-y-auto overscroll-contain outline-none"
          // Screen readers hear new messages without re-reading the whole log.
          role="log"
          aria-live="polite"
          aria-busy={busy}
          aria-label="Conversation"
        >
          <div ref={contentRef} className="mx-auto max-w-3xl px-4 pb-6 pt-6">
            {hydrated && messages.length === 0 ? (
              <ChatWelcome onPick={(prompt) => composerRef.current?.setValue(prompt)} />
            ) : (
              <ToolActionsContext value={toolActions}>
                <ol className="flex flex-col gap-6">
                  {/* One list (not map + a sibling), so the pending placeholder and the
                      real reply share a key slot and React keeps the same element. */}
                  {rows.map((m, i) => {
                    const isLast = i === rows.length - 1;
                    return (
                      <Message
                        key={replyKey(m, rows[i - 1])}
                        message={m}
                        isLast={isLast}
                        live={isLast && busy}
                        stopped={m.id === stoppedId}
                        error={isLast ? error : undefined}
                        busy={busy}
                        online={online}
                        onStop={handleStop}
                        onRetry={handleRetry}
                      />
                    );
                  })}
                </ol>
              </ToolActionsContext>
            )}
          </div>
        </div>

        {/* Shown only after the reader scrolls away from the latest message. */}
        {!isAtBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="tap-target absolute bottom-4 left-1/2 inline-flex h-9 -translate-x-1/2 animate-pop-in items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium shadow-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon name="arrowDown" className="size-4" />
            {busy ? "New reply below" : "Jump to latest"}
          </button>
        )}
      </main>

      <footer className="shrink-0 bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto max-w-3xl">
          <OfflineBanner offline={!online} />
          <Composer ref={composerRef} status={status} onSend={handleSend} onStop={handleStop} offline={!online} />
          <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
            Enter to send · Shift+Enter for a new line · Esc to stop
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * A reply's key is tied to the user message it answers, so the pending
 * placeholder (skeleton) and the real message that replaces it are the same
 * element to React: no remount, no replayed entry animation, no flicker when
 * the first token arrives.
 */
function replyKey(message: DevLogUIMessage, previous: DevLogUIMessage | undefined) {
  return message.role === "assistant" && previous?.role === "user" ? `reply-to-${previous.id}` : message.id;
}
