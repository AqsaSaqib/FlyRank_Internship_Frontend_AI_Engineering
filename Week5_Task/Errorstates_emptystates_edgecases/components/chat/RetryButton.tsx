"use client";

import { useRef, useState, type Ref } from "react";

import { Spinner } from "@/components/tools/ToolCard";
import { Icon } from "./icons";

type Props = {
  /** Resolves when the retried request finishes (useChat's `regenerate` does). */
  onRetry: () => Promise<void> | void;
  /** Blocked from outside: a request is in flight, offline, or a rate-limit countdown. */
  disabled?: boolean;
  /** Short suffix shown while blocked, e.g. "12s". */
  waitLabel?: string;
  label?: string;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * A retry that can't run twice.
 *
 * - A ref flips synchronously on the first click, so a double click (or
 *   Enter + click) within the same frame is ignored before React re-renders.
 * - While the retry runs the button shows a spinner and stays disabled.
 * - `disabled` covers everything else that must block it (status
 *   submitted/streaming, offline, a rate-limit countdown).
 */
export function RetryButton({ onRetry, disabled = false, waitLabel, label = "Retry last response", ref }: Props) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const blocked = disabled || pending;

  const handleClick = async () => {
    if (running.current || blocked) return;
    running.current = true;
    setPending(true);
    try {
      await onRetry();
    } finally {
      running.current = false;
      setPending(false);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      // aria-disabled keeps it focusable, so focus isn't lost to <body> while it's blocked.
      aria-disabled={blocked}
      aria-busy={pending}
      className="tap-target inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-[background-color,opacity] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-background"
    >
      {pending ? <Spinner className="size-3.5" /> : <Icon name="refresh" className="size-3.5" />}
      {pending ? "Retrying…" : label}
      {!pending && waitLabel && (
        <span className="tabular-nums text-muted-foreground" aria-hidden="true">
          · {waitLabel}
        </span>
      )}
    </button>
  );
}
