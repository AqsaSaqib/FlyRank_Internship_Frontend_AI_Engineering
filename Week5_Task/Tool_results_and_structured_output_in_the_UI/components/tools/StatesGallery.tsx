"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/chat/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  QUERY_STATES,
  SAVE_STATES,
  STATS_STATES,
  queryOutput,
  saveOutput,
  statsOutput,
} from "./fixtures";
import { ToolActionsContext, type ToolActions } from "./ToolCard";
import { ToolPart, type DevLogToolPart } from "./ToolPart";

/**
 * /states: every tool state on one screen, for review. Each card is the real
 * component the chat renders, fed a sample part, so what you see here is what
 * users see. The JSON panels show the structured output each tool returns,
 * next to the component that renders it (the chat itself never shows JSON).
 */

// Buttons on sample cards don't talk to a server; they just say so.
const DEMO_ACTIONS: ToolActions = {
  retry: () => window.alert("In the chat, Retry re-runs the turn with simulated errors switched off."),
  respondToApproval: (_id, approved) =>
    window.alert(approved ? "In the chat, this runs saveLogEntry on the server." : "In the chat, this cancels the save."),
};

export function StatesGallery() {
  return (
    <ToolActionsContext value={DEMO_ACTIONS}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="chevron" className="size-4 rotate-180" />
              Back to chat
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
          <h1 className="text-2xl font-semibold tracking-tight">Tool Results &amp; Structured Output</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The DevLog Assistant calls tools on the server and renders what comes back as components. Below: what
            each tool returns (structured output), the component it becomes, and every state a tool call goes
            through. These are the same components the chat uses, with sample data.
          </p>

          <LiveDemo />

          <ToolSection
            title="queryLogs"
            description="Searches entries by date range, tag or keyword."
            json={queryOutput}
            result={QUERY_STATES.done}
            states={[
              { part: QUERY_STATES.streaming, label: "Loading · input-streaming", question: "What is it doing?" },
              { part: QUERY_STATES.working, label: "Working · input-available", question: "With what input?" },
              { part: QUERY_STATES.empty, label: "Empty result · output-available", question: "What came back? (nothing)" },
              { part: QUERY_STATES.error, label: "Error · output-error", question: "What went wrong?" },
            ]}
          />

          <ToolSection
            title="getLogStats"
            description="Totals per day or week and hours by tag, for a chart."
            json={statsOutput}
            result={STATS_STATES.done}
            states={[
              { part: STATS_STATES.streaming, label: "Loading · input-streaming", question: "What is it doing?" },
              { part: STATS_STATES.working, label: "Working · input-available", question: "With what input?" },
              { part: STATS_STATES.error, label: "Error · output-error", question: "What went wrong?" },
            ]}
          />

          <ToolSection
            title="saveLogEntry"
            description="Saves a new entry, only after the user approves it."
            json={saveOutput}
            result={SAVE_STATES.done}
            states={[
              { part: SAVE_STATES.streaming, label: "Drafting · input-streaming", question: "What is it doing?" },
              { part: SAVE_STATES.confirm, label: "Confirm · approval-requested", question: "Should I save this?" },
              { part: SAVE_STATES.saving, label: "Saving · approval-responded", question: "Is it saving?" },
              { part: SAVE_STATES.denied, label: "Cancelled · output-denied", question: "Was anything saved?" },
              { part: SAVE_STATES.error, label: "Error · output-error", question: "What went wrong?" },
            ]}
          />
        </main>
      </div>
    </ToolActionsContext>
  );
}

/* -------------------------------------------------------------------------- */

type StateSample = { part: DevLogToolPart; label: string; question: string };

function ToolSection({
  title,
  description,
  json,
  result,
  states,
}: {
  title: string;
  description: string;
  json: unknown;
  result: DevLogToolPart;
  states: StateSample[];
}) {
  return (
    <section aria-labelledby={`${title}-heading`} className="mt-12">
      <h2 id={`${title}-heading`} className="font-mono text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel label="Structured output" hint="What the tool returns">
          <pre className="max-h-[420px] overflow-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
            {JSON.stringify(json, null, 2)}
          </pre>
        </Panel>
        <Panel label="Rendered as" hint="What the user sees · output-available">
          <ToolPart part={result} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {states.map((s) => (
          <Panel key={s.label} label={s.label} hint={s.question}>
            <ToolPart part={s.part} />
          </Panel>
        ))}
      </div>
    </section>
  );
}

function Panel({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <figure className="min-w-0 rounded-xl border border-border bg-card p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </figcaption>
      <div className="mt-1">{children}</div>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Live demo: one card morphing through its states                            */
/* -------------------------------------------------------------------------- */

type Step = { part: DevLogToolPart; ms: number };

const SUCCESS: Step[] = [
  { part: { ...QUERY_STATES.streaming, input: { reason: "you asked about last week" } }, ms: 500 },
  { part: QUERY_STATES.streaming, ms: 700 },
  { part: { ...QUERY_STATES.streaming, input: QUERY_STATES.working.input }, ms: 600 },
  { part: QUERY_STATES.working, ms: 1400 },
  { part: QUERY_STATES.done, ms: 0 },
];
const FAILURE: Step[] = [...SUCCESS.slice(0, 4), { part: QUERY_STATES.error, ms: 0 }];

/**
 * Plays the same sequence of parts the chat receives while a tool runs, so
 * the transitions (height morph, crossfade, border change) can be watched
 * without waiting on a model.
 */
function LiveDemo() {
  const [steps, setSteps] = useState<Step[]>(SUCCESS);
  const [index, setIndex] = useState(SUCCESS.length - 1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const step = steps[index];
    if (index < steps.length - 1) timer.current = setTimeout(() => setIndex((i) => i + 1), step.ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, steps]);

  const play = (sequence: Step[]) => {
    setSteps(sequence);
    setIndex(0);
  };
  const playing = index < steps.length - 1;

  return (
    <section aria-labelledby="live-heading" className="mt-8 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="live-heading" className="text-sm font-medium">
            Transitions
          </h2>
          <p className="text-xs text-muted-foreground">
            One card, morphing through its states. Current: <code className="font-mono">{steps[index].part.state}</code>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => play(SUCCESS)}
            disabled={playing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="refresh" className="size-3.5" />
            Play success
          </button>
          <button
            type="button"
            onClick={() => play(FAILURE)}
            disabled={playing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="alert" className="size-3.5" />
            Play error
          </button>
        </div>
      </div>
      <div className="mx-auto mt-2 max-w-2xl">
        {/* Same key throughout, so React keeps one card and it morphs. */}
        <ToolPart key="live" part={steps[index].part} />
      </div>
    </section>
  );
}
