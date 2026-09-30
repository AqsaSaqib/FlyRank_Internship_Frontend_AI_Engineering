"use client";

import { useEffect, useState } from "react";

import { Avatar } from "./Avatar";
import { Icon } from "./icons";

/** After this long with no first token, offer "Still thinking…" and a Stop. */
export const SLOW_AFTER_MS = 8000;

const WIDTHS = ["w-11/12", "w-4/5", "w-3/5"];

/**
 * Placeholder lines for a reply that hasn't produced its first token yet.
 *
 * Each bar sits in a box exactly one line of reply text tall (text-[15px],
 * leading-relaxed, `h-[1lh]`), so the first streamed line lands where the
 * first bar was: the text replaces the skeleton in place instead of pushing
 * anything around.
 */
export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true" className="text-[15px] leading-relaxed">
      {WIDTHS.slice(0, lines).map((width) => (
        <div key={width} className="flex h-[1lh] items-center">
          <div className={`skeleton h-3 rounded ${width}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * The waiting state inside a reply, laid out like the reply it becomes:
 *
 *   row 1  "Thinking…" (h-7 + mb-2): the exact box of the reasoning
 *          disclosure that usually streams first, so it's replaced in place
 *   rows   skeleton lines where the first lines of text will land
 *
 * After ~8s the label turns into "Still thinking…" with a Stop, in the same
 * row, so a slow model never looks frozen and nothing grows.
 *
 * `hasReasoning`: the reasoning disclosure is already showing its own
 * "Thinking…", so only the lines are drawn and the slow hint goes below them.
 */
export function ThinkingSkeleton({ onStop, hasReasoning = false }: { onStop?: () => void; hasReasoning?: boolean }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  const label = (
    <>
      {/* The visible label is announced through the status below instead. */}
      <span aria-hidden="true" className="text-shimmer font-medium">
        {slow ? "Still thinking…" : "Thinking…"}
      </span>
      {slow && (
        <>
          <span aria-hidden="true" className="hidden animate-notice-in text-muted-foreground sm:inline">
            This is taking longer than usual.
          </span>
          {onStop && (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="tap-target inline-flex h-7 animate-notice-in items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="stop" className="size-3.5" />
              Stop
            </button>
          )}
        </>
      )}
    </>
  );

  return (
    <div>
      <span role="status" className="sr-only">
        {slow ? "Still thinking. This is taking longer than usual." : "Thinking…"}
      </span>
      {!hasReasoning && (
        <div className="mb-2 flex h-7 items-center gap-x-3 text-sm">
          <ThinkingDots />
          {label}
        </div>
      )}
      <SkeletonLines />
      {hasReasoning && slow && <div className="mt-2 flex items-center gap-x-3 text-sm">{label}</div>}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="-mr-1 flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="thinking-dot size-1.5 rounded-full bg-primary" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  );
}

/**
 * A whole assistant message in its loading state: same list item, gap, avatar
 * and top padding as a real reply. Used by the route's loading.tsx.
 */
export function MessageSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <li className="flex gap-3" aria-hidden="true">
      <Avatar />
      <div className="min-w-0 flex-1 pt-1">
        <SkeletonLines lines={lines} />
      </div>
    </li>
  );
}
