"use client";

import { memo, useState } from "react";
import { Streamdown } from "streamdown";

import { messageText, type ChatMessage } from "@/lib/chat/types";
import { Icon } from "./icons";

type Props = {
  message: ChatMessage;
  isLast: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
};

export const Message = memo(function Message(props: Props) {
  return props.message.role === "user" ? (
    <UserMessage message={props.message} />
  ) : (
    <AssistantMessage {...props} />
  );
});

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <li className="flex animate-message-in justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground sm:max-w-[75%]">
        <span className="sr-only">You said: </span>
        {messageText(message)}
      </div>
    </li>
  );
}

function AssistantMessage({ message, isLast, canRegenerate, onRegenerate }: Props) {
  const text = messageText(message);
  const reasoning = message.parts
    .filter((p) => p.type === "reasoning")
    .map((p) => p.text)
    .join("");
  const notices = message.parts.filter((p) => p.type === "notice");

  const live = message.status === "pending" || message.status === "streaming";
  const hasText = text.length > 0;
  const thinking = live && !hasText;
  const showThinkingRow = thinking || reasoning.length > 0;

  return (
    <li className="flex animate-message-in gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 pt-1">
        <span className="sr-only">Assistant said: </span>

        {/*
         * Thinking → text handoff. The indicator row doesn't pop out of
         * existence when the first token lands: it collapses (grid rows
         * 1fr → 0fr) while the text fades in, so the bubble never flickers
         * or jumps. When there is reasoning, the same row stays and turns
         * into the "Thought process" disclosure.
         */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            showThinkingRow ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
          // Collapsed rows stay mounted for the transition; hide them from screen readers.
          aria-hidden={!showThinkingRow}
          inert={!showThinkingRow}
        >
          <div className="min-h-0 overflow-hidden">
            {reasoning ? (
              <Reasoning text={reasoning} active={thinking} />
            ) : (
              <ThinkingIndicator />
            )}
          </div>
        </div>

        {hasText && (
          <div className="animate-text-in">
            <Streamdown
              className="chat-markdown text-[15px] leading-relaxed"
              isAnimating={live}
              caret={live ? "circle" : undefined}
              // Links open in a new tab without the confirmation modal.
              linkSafety={{ enabled: false }}
            >
              {text}
            </Streamdown>
          </div>
        )}

        {notices.map((n, i) => (
          <p key={i} className="mt-2 text-xs text-muted-foreground">
            {n.text}
          </p>
        ))}

        {message.status === "error" && (
          <div
            role="alert"
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            <Icon name="alert" className="size-4 shrink-0" />
            <span className="flex-1">{message.error ?? "Something went wrong."}</span>
            {isLast && canRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="rounded-md px-2 py-1 font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-danger"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!live && message.status !== "error" && (
          <MessageActions
            text={text}
            model={message.model}
            stopped={message.status === "stopped"}
            showRegenerate={isLast && canRegenerate}
            onRegenerate={onRegenerate}
          />
        )}
      </div>
    </li>
  );
}

function Avatar() {
  return (
    <div
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-primary-soft text-primary"
    >
      <Icon name="sparkle" className="size-4" />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div role="status" className="flex h-7 items-center gap-2 text-sm">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="thinking-dot size-1.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      <span className="text-shimmer font-medium">Thinking…</span>
    </div>
  );
}

function Reasoning({ text, active }: { text: string; active: boolean }) {
  return (
    <details className="group mb-2">
      <summary className="flex h-7 w-fit cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <Icon name="chevron" className="size-3.5 transition-transform group-open:rotate-90" />
        {active ? (
          <span role="status" className="text-shimmer">
            Thinking…
          </span>
        ) : (
          "Thought process"
        )}
      </summary>
      <p className="mt-1 whitespace-pre-wrap border-l-2 border-border pl-3 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </details>
  );
}

function MessageActions({
  text,
  model,
  stopped,
  showRegenerate,
  onRegenerate,
}: {
  text: string;
  model?: string;
  stopped: boolean;
  showRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const button =
    "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <div className="mt-1 flex animate-text-in items-center gap-1">
      {stopped && (
        <span className="mr-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          Stopped
        </span>
      )}
      {text && (
        <button
          type="button"
          className={button}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // Clipboard blocked; nothing useful to do.
            }
          }}
        >
          <Icon name={copied ? "check" : "copy"} className="size-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      )}
      {showRegenerate && (
        <button type="button" className={button} onClick={onRegenerate}>
          <Icon name="refresh" className="size-3.5" />
          Regenerate
        </button>
      )}
      {model && <span className="ml-auto truncate pl-2 text-xs text-muted-foreground/70">{model}</span>}
    </div>
  );
}
