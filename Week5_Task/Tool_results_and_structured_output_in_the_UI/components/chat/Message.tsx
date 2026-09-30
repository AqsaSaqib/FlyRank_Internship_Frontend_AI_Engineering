"use client";

import { memo, useState } from "react";
import { Streamdown } from "streamdown";

import { messageText, type DevLogPart, type DevLogUIMessage } from "@/lib/chat/types";
import { ToolPart, isDevLogToolPart, type DevLogToolPart } from "@/components/tools/ToolPart";
import { Icon } from "./icons";

type Props = {
  message: DevLogUIMessage;
  isLast: boolean;
  /** This message is the one currently streaming. */
  live: boolean;
  stopped: boolean;
  /** The request for this turn failed (only ever set on the last message). */
  error?: string;
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

function UserMessage({ message }: { message: DevLogUIMessage }) {
  return (
    <li className="flex animate-message-in justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground sm:max-w-[75%]">
        <span className="sr-only">You said: </span>
        {messageText(message)}
      </div>
    </li>
  );
}

/**
 * Visible content in stream order: runs of text, and tool cards between them
 * (text → tool → text is the usual shape of a multi-step reply). Reasoning is
 * collected separately into the "Thought process" disclosure.
 */
type Block = { kind: "text"; key: string; text: string } | { kind: "tool"; key: string; part: DevLogToolPart };

function toBlocks(parts: DevLogPart[]): Block[] {
  const blocks: Block[] = [];
  parts.forEach((part, i) => {
    if (part.type === "text") {
      const prev = blocks.at(-1);
      if (prev?.kind === "text") prev.text += part.text;
      else if (part.text) blocks.push({ kind: "text", key: `text-${i}`, text: part.text });
    } else if (isDevLogToolPart(part)) {
      blocks.push({ kind: "tool", key: part.toolCallId, part });
    }
  });
  return blocks;
}

function AssistantMessage({ message, isLast, live, stopped, error, canRegenerate, onRegenerate }: Props) {
  const text = messageText(message);
  const reasoning = message.parts
    .filter((p) => p.type === "reasoning")
    .map((p) => p.text)
    .join("");
  const blocks = toBlocks(message.parts);
  const lastBlock = blocks.at(-1);

  const hasContent = blocks.length > 0;
  // The turn is paused on the user's Save / Cancel; actions would be premature.
  const awaitingApproval = blocks.some((b) => b.kind === "tool" && b.part.state === "approval-requested");
  const thinking = live && !hasContent;
  const showThinkingRow = thinking || reasoning.length > 0;

  return (
    <li className="flex animate-message-in gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 pt-1">
        <span className="sr-only">Assistant said: </span>

        {/*
         * Thinking → content handoff. The indicator row doesn't pop out of
         * existence when the first token (or tool card) lands: it collapses
         * (grid rows 1fr → 0fr) while the content fades in, so the bubble
         * never flickers or jumps. When there is reasoning, the same row
         * stays and turns into the "Thought process" disclosure.
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

        {blocks.map((block) =>
          block.kind === "tool" ? (
            <ToolPart key={block.key} part={block.part} />
          ) : (
            <div key={block.key} className="animate-text-in">
              <Streamdown
                className="chat-markdown text-[15px] leading-relaxed"
                isAnimating={live && block === lastBlock}
                caret={live && block === lastBlock ? "circle" : undefined}
                // Links open in a new tab without the confirmation modal.
                linkSafety={{ enabled: false }}
              >
                {block.text}
              </Streamdown>
            </div>
          ),
        )}

        {error && (
          <div
            role="alert"
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            <Icon name="alert" className="size-4 shrink-0" />
            <span className="flex-1">{readableError(error)}</span>
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

        {!live && !error && hasContent && !awaitingApproval && (
          <MessageActions
            text={text}
            model={message.metadata?.model}
            stopped={stopped}
            showRegenerate={isLast && canRegenerate}
            onRegenerate={onRegenerate}
          />
        )}
      </div>
    </li>
  );
}

/** HTTP errors from the route arrive as its JSON body (`{"error": "..."}`); show just the message. */
function readableError(message: string): string {
  try {
    const parsed: unknown = JSON.parse(message);
    if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    // Not JSON: already a readable message from the stream.
  }
  return message || "Something went wrong.";
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
