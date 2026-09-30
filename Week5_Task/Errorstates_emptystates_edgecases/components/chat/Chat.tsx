"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { useDevLogChat } from "@/lib/chat/use-devlog-chat";
import { useStickToBottom } from "@/lib/chat/use-stick-to-bottom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToolActionsContext, type ToolActions } from "@/components/tools/ToolCard";
import { Composer, type ComposerHandle } from "./Composer";
import { EmptyState } from "./EmptyState";
import { Icon } from "./icons";
import { Message } from "./Message";

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
  // The reply the user stopped, so it can show a "Stopped" badge.
  const [stoppedId, setStoppedId] = useState<string | null>(null);
  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);

  const handleSend = (text: string) => {
    const content = text.trim();
    if (!content || busy) return false;
    setStoppedId(null);
    void sendMessage({ text: content });
    // Sending is an explicit "show me the latest": re-pin to the bottom.
    requestAnimationFrame(() => scrollToBottom("auto"));
    return true;
  };

  const handleStop = () => {
    if (last?.role === "assistant") setStoppedId(last.id);
    void stop();
    composerRef.current?.focus();
  };

  const handleRegenerate = () => {
    setStoppedId(null);
    void regenerate();
  };

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
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold leading-tight">DevLog Assistant</h1>
              <p className="truncate text-xs text-muted-foreground">Search, chart and save your logs</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/states"
              title="Every tool state on one page"
              className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:inline-flex"
            >
              <Icon name="chart" className="size-4" />
              Tool states
            </Link>
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40"
            >
              <Icon name="plus" className="size-4" />
              <span>New chat</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain"
          // Screen readers hear new messages without re-reading the whole log.
          role="log"
          aria-live="polite"
          aria-busy={busy}
          aria-label="Conversation"
        >
          <div ref={contentRef} className="mx-auto max-w-3xl px-4 pb-6 pt-6">
            {hydrated && messages.length === 0 ? (
              <EmptyState onPick={(prompt) => composerRef.current?.setValue(prompt)} />
            ) : (
              <ToolActionsContext value={toolActions}>
                <ol className="flex flex-col gap-6">
                  {messages.map((m, i) => {
                    const isLast = i === messages.length - 1;
                    return (
                      <Message
                        key={m.id}
                        message={m}
                        isLast={isLast}
                        live={isLast && busy}
                        stopped={m.id === stoppedId}
                        error={isLast && error ? error.message : undefined}
                        canRegenerate={!busy}
                        onRegenerate={handleRegenerate}
                      />
                    );
                  })}
                  {/* The request failed before any assistant message existed, or a
                      reply is pending and nothing has streamed yet. */}
                  {last?.role === "user" && (error || busy) && (
                    <Message
                      key="pending"
                      message={{ id: "pending", role: "assistant", parts: [] }}
                      isLast
                      live={busy}
                      stopped={false}
                      error={error?.message}
                      canRegenerate={!busy}
                      onRegenerate={handleRegenerate}
                    />
                  )}
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
            className="absolute bottom-4 left-1/2 inline-flex h-9 -translate-x-1/2 animate-pop-in items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium shadow-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Icon name="arrowDown" className="size-4" />
            {busy ? "New reply below" : "Jump to latest"}
          </button>
        )}
      </main>

      <footer className="shrink-0 bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto max-w-3xl">
          <Composer ref={composerRef} status={status} onSend={handleSend} onStop={handleStop} />
          <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
            Enter to send · Shift+Enter for a new line · Esc to stop
          </p>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground"
    >
      {"{}"}
    </div>
  );
}
