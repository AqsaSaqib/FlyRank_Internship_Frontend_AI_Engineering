"use client";

import { createContext, use, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/chat/icons";

/* -------------------------------------------------------------------------- */
/* Actions a tool card can trigger (provided by the chat)                     */
/* -------------------------------------------------------------------------- */

export type ToolActions = {
  /** Re-run the turn with simulated errors switched off. Null when retry isn't possible (busy, old message). */
  retry: (() => void) | null;
  respondToApproval: (approvalId: string, approved: boolean) => void;
};

export const ToolActionsContext = createContext<ToolActions>({ retry: null, respondToApproval: () => {} });
export const useToolActions = () => use(ToolActionsContext);

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The visual phase of a tool part. Several SDK states map to one phase (e.g.
 * `approval-responded` looks like "working"), and the phase drives the
 * card's border, header treatment and the morph animation.
 */
export type ToolPhase = "streaming" | "working" | "confirm" | "done" | "denied" | "error";

type Props = {
  phase: ToolPhase;
  icon: IconName;
  /** Plain-language status line, e.g. "Searching your logs…" */
  title: string;
  /** Model-choice hint, e.g. "Chose queryLogs because you asked about last week". */
  hint?: ReactNode;
  /** Right side of the header: a count, a badge. */
  aside?: ReactNode;
  /** Changes whenever the body should crossfade (usually the SDK state). */
  stateKey: string;
  children?: ReactNode;
};

const FRAME: Record<ToolPhase, string> = {
  // Dashed while the model is still writing the call: "not decided yet".
  streaming: "border-dashed border-border bg-card/60",
  working: "border-border bg-card",
  confirm: "border-primary/50 bg-card ring-4 ring-primary/10",
  done: "border-border bg-card",
  denied: "border-border bg-muted/40",
  error: "border-danger/40 bg-danger-soft",
};

const ICON: Record<ToolPhase, string> = {
  streaming: "bg-muted text-muted-foreground",
  working: "bg-primary-soft text-primary",
  confirm: "bg-primary text-primary-foreground",
  done: "bg-primary-soft text-primary",
  denied: "bg-muted text-muted-foreground",
  error: "bg-danger/10 text-danger",
};

/**
 * One container for every state of a tool call. It stays mounted from the
 * first streamed token to the final result, so states morph instead of
 * swapping: the frame's colors transition, the height animates to the new
 * content (MorphHeight) and the body crossfades in. With reduced motion the
 * global rule in globals.css turns all of that into an instant change.
 */
export function ToolCard({ phase, icon, title, hint, aside, stateKey, children }: Props) {
  const live = phase === "streaming" || phase === "working";
  return (
    <section
      aria-label={title}
      aria-busy={live}
      className={`my-3 overflow-hidden rounded-xl border transition-[border-color,background-color,box-shadow] duration-200 ${FRAME[phase]}`}
    >
      <header className="flex items-start gap-3 px-3.5 pt-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${ICON[phase]}`}
        >
          {phase === "working" ? <Spinner /> : <Icon name={phase === "error" ? "alert" : icon} className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p
            role={live ? "status" : undefined}
            className={`text-sm font-medium leading-7 ${phase === "streaming" ? "text-shimmer" : ""} ${
              phase === "error" ? "text-danger" : ""
            }`}
          >
            {title}
          </p>
          {hint && <p className="animate-text-in text-xs leading-5 text-muted-foreground">{hint}</p>}
        </div>
        {aside && <div className="shrink-0 pt-1 text-xs text-muted-foreground">{aside}</div>}
      </header>
      <MorphHeight stateKey={stateKey}>{children}</MorphHeight>
    </section>
  );
}

/**
 * Animates its height to fit whatever it contains, and fades the content in
 * when `stateKey` changes. The inner box is measured with a ResizeObserver,
 * so streaming content that grows (chips, list rows) glides too.
 */
function MorphHeight({ stateKey, children }: { stateKey: string; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden transition-[height] duration-200 ease-out" style={{ height }}>
      <div ref={innerRef} className="px-3.5 pb-3.5 pt-2.5">
        <div key={stateKey} className="animate-state-in">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

/** A query parameter: what the tool was asked for. `pending` = still streaming in. */
export function Chip({
  icon,
  label,
  value,
  pending = false,
  muted = false,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  pending?: boolean;
  muted?: boolean;
}) {
  return (
    <li
      className={`inline-flex max-w-full animate-pop-in items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        pending ? "border-dashed border-border text-muted-foreground" : "border-border bg-background"
      } ${muted ? "text-muted-foreground" : ""}`}
    >
      <Icon name={icon} className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="sr-only">{label}: </span>
      <span className="truncate">{value}</span>
      {pending && <span className="thinking-dot size-1 rounded-full bg-current" aria-hidden="true" />}
    </li>
  );
}

export function ChipList({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {children}
    </ul>
  );
}

/** Shimmering placeholder lines for "the model is still writing the call". */
export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  const widths = ["w-11/12", "w-4/5", "w-2/3", "w-3/4"];
  return (
    <div aria-hidden="true" className="mt-3 space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

/** "Chose queryLogs because you asked about last week". */
export function ChoiceHint({ tool, reason }: { tool: string; reason: string }) {
  return (
    <>
      Chose <code className="rounded bg-muted px-1 py-px font-mono text-[11px] text-foreground">{tool}</code> because{" "}
      {reason.replace(/[.\s]+$/, "")}
    </>
  );
}

/**
 * "What went wrong?" The designed failure state shared by all tools: a
 * friendly headline (in the card header), the reason, what was attempted,
 * and a way forward. Never a raw stack trace: `errorText` has already been
 * through the route's `publicErrorMessage`.
 */
export function ToolErrorBody({ errorText, attempted }: { errorText: string; attempted: ReactNode }) {
  const { retry } = useToolActions();
  return (
    <div role="alert" className="space-y-3">
      <p className="text-sm text-foreground">{errorText}</p>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">What I tried</p>
        {attempted}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {retry ? (
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-danger px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger dark:text-background"
          >
            <Icon name="refresh" className="size-3.5" />
            Retry
          </button>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {retry ? "Retry runs it again with simulated errors switched off." : "Ask again to retry."}
        </p>
      </div>
    </div>
  );
}
