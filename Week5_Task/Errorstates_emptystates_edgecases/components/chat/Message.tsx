"use client";

import { memo, useState } from "react";
import { Streamdown } from "streamdown";

import { messageText, type DevLogPart, type DevLogUIMessage } from "@/lib/chat/types";
import { ToolPart, isDevLogToolPart, type DevLogToolPart } from "@/components/tools/ToolPart";
import { Avatar } from "./Avatar";
import { ChatError } from "./ChatError";
import { EmptyReply } from "./EmptyReply";
import { Icon } from "./icons";
import { ThinkingSkeleton } from "./MessageSkeleton";

type Props = {
  message: DevLogUIMessage;
  isLast: boolean;
  /** This message is the one currently streaming. */
  live: boolean;
  stopped: boolean;
  /** The request for this turn failed (only ever set on the last message). */
  error?: Error;
  /** A request is in flight anywhere in the chat. */
  busy: boolean;
  online: boolean;
  onStop: () => void;
  /** Re-run only this (the last) assistant response. Resolves when the request settles. */
  onRetry: () => Promise<void>;
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

function AssistantMessage({ message, isLast, live, stopped, error, busy, online, onStop, onRetry }: Props) {
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
  // Waiting for the first token: the skeleton holds the reply's place.
  const thinking = live && !hasContent;
  // The stream failed after some content arrived: keep it, marked as incomplete.
  const incomplete = !!error && hasContent;
  // Finished cleanly but said nothing (no text, no tool call).
  const emptyReply = isLast && !live && !error && !hasContent && !stopped;

  return (
    <li className="flex animate-message-in gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 pt-1">
        <span className="sr-only">Assistant said: </span>

        {reasoning && <Reasoning text={reasoning} active={thinking} />}

        {/* Laid out like the reply it becomes, so the first tokens replace it in place. */}
        {thinking && <ThinkingSkeleton onStop={onStop} hasReasoning={!!reasoning} />}

        <div className={incomplete ? "opacity-70 transition-opacity duration-200" : undefined}>
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
        </div>

        {incomplete && (
          <span className="mt-1 inline-flex animate-notice-in items-center gap-1.5 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
            <Icon name="alert" className="size-3" />
            Incomplete response
          </span>
        )}

        {error && isLast && (
          <ChatError error={error} online={online} busy={busy} partial={incomplete} onRetry={onRetry} />
        )}

        {emptyReply && <EmptyReply busy={busy} online={online} onRetry={onRetry} />}

        {!live && !error && (hasContent || stopped) && !awaitingApproval && (
          <MessageActions
            text={text}
            model={message.metadata?.model}
            stopped={stopped}
            showRegenerate={isLast && !busy}
            onRegenerate={onRetry}
          />
        )}
      </div>
    </li>
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
    "tap-target inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary";

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
