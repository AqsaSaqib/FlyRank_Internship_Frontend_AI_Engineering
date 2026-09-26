"use client";

import { useRef } from "react";

import { useChatStream } from "@/lib/chat/use-chat-stream";
import { useStickToBottom } from "@/lib/chat/use-stick-to-bottom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Composer, type ComposerHandle } from "./Composer";
import { EmptyState } from "./EmptyState";
import { Icon } from "./icons";
import { Message } from "./Message";

/**
 * The DevLog Assistant: DevLog's central AI interaction, a streaming chat
 * that turns rough notes into log entries and weekly reports.
 */
export function Chat() {
  const { messages, status, hydrated, send, stop, regenerate, clear } = useChatStream();
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom();
  const composerRef = useRef<ComposerHandle>(null);
  const busy = status !== "ready";

  const handleSend = (text: string) => {
    const sent = send(text);
    // Sending is an explicit "show me the latest": re-pin to the bottom.
    if (sent) requestAnimationFrame(() => scrollToBottom("auto"));
    return sent;
  };

  const handleStop = () => {
    stop();
    composerRef.current?.focus();
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold leading-tight">DevLog Assistant</h1>
              <p className="truncate text-xs text-muted-foreground">Notes in, log entries out</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                clear();
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
              <ol className="flex flex-col gap-6">
                {messages.map((m, i) => (
                  <Message
                    key={m.id}
                    message={m}
                    isLast={i === messages.length - 1}
                    canRegenerate={!busy}
                    onRegenerate={regenerate}
                  />
                ))}
              </ol>
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
