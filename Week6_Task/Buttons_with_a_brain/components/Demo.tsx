"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { Icon } from "@/components/motion-button/icons";
import { MotionButton } from "@/components/motion-button/MotionButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fakeRequest, type OutcomeMode } from "@/lib/fake-request";
import { useAsyncAction, type AsyncStatus, type IgnoreReason } from "@/lib/use-async-action";

const SLOW_MO = 5;
const SPAM_CLICKS = 10;
const SPAM_WINDOW_MS = 300;
const MAX_LOG = 40;

const OUTCOMES: { value: OutcomeMode; label: string }[] = [
  { value: "random", label: "Random (20% fail)" },
  { value: "always-success", label: "Force success" },
  { value: "always-fail", label: "Force fail" },
];

type LogEntry = { id: number; time: string; source: string; message: string; count: number; tone: AsyncStatus | "ignored" | "info" };

/* Does the OS ask for reduced motion? Shown next to the toggle. */
const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduced(onChange: () => void) {
  const mql = matchMedia(reducedQuery);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const timestamp = () => {
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
};

export function Demo() {
  const [mode, setMode] = useState<OutcomeMode>("random");
  const [disabled, setDisabled] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const osReduced = useSyncExternalStore(subscribeReduced, () => matchMedia(reducedQuery).matches, () => false);

  const logId = useRef(0);
  const addLog = useCallback((source: string, message: string, tone: LogEntry["tone"]) => {
    setLog((entries) => {
      const last = entries[0];
      // Collapse repeats (e.g. 9 ignored spam clicks) into one line with a count.
      if (last && last.source === source && last.message === message) {
        return [{ ...last, count: last.count + 1, time: timestamp() }, ...entries.slice(1)];
      }
      return [{ id: ++logId.current, time: timestamp(), source, message, count: 1, tone }, ...entries].slice(0, MAX_LOG);
    });
  }, []);

  const hookOptions = (source: string) => ({
    timeScale: slowMo ? SLOW_MO : 1,
    onTransition: (from: AsyncStatus, to: AsyncStatus) => addLog(source, `${from} → ${to}`, to),
    onIgnored: (reason: IgnoreReason) => addLog(source, `click ignored (${reason})`, "ignored"),
  });

  const send = useAsyncAction(() => fakeRequest(mode), hookOptions("Send"));
  const summary = useAsyncAction(() => fakeRequest(mode), hookOptions("Summary"));

  // Spam test: 10 real clicks on the Send button within 300ms.
  const sendButton = useRef<HTMLButtonElement>(null);
  const spamTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => spamTimers.current.forEach(clearTimeout), []);

  const spam = () => {
    spamTimers.current.forEach(clearTimeout);
    addLog("Spam test", `${SPAM_CLICKS} clicks in ${SPAM_WINDOW_MS}ms`, "info");
    spamTimers.current = Array.from({ length: SPAM_CLICKS }, (_, i) =>
      setTimeout(() => sendButton.current?.click(), (i * SPAM_WINDOW_MS) / (SPAM_CLICKS - 1)),
    );
  };

  return (
    <div
      data-motion={reduced ? "reduce" : "full"}
      style={{ "--motion-scale": slowMo ? SLOW_MO : 1 } as CSSProperties}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div className="grid gap-6">
        {/* Stage */}
        <section aria-labelledby="stage-title" className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 id="stage-title" className="text-sm font-semibold">
              The buttons
            </h2>
            <p className="hidden text-xs text-muted-foreground sm:block">Same component, same motion tokens</p>
          </div>
          <div className="grid gap-10 px-5 py-12 sm:grid-cols-2 sm:py-16">
            <Specimen name="Primary · solid" status={send.status}>
              <MotionButton
                ref={sendButton}
                size="lg"
                variant="solid"
                status={send.status}
                onClick={send.run}
                disabled={disabled}
                icon={<Icon name="send" />}
                copy={{
                  label: "Send message",
                  loading: "Sending…",
                  success: "Sent",
                  error: "Failed to send, retry",
                  retryName: "Retry sending message",
                }}
              />
            </Specimen>
            <Specimen name="Secondary · soft" status={summary.status}>
              <MotionButton
                size="lg"
                variant="soft"
                status={summary.status}
                onClick={summary.run}
                disabled={disabled}
                icon={<Icon name="sparkle" />}
                copy={{
                  label: "Generate summary",
                  loading: "Generating summary…",
                  success: "Summary ready",
                  error: "Failed to generate summary, retry",
                  retryName: "Retry generating summary",
                }}
              />
            </Specimen>
          </div>
        </section>

        {/* Event log */}
        <section aria-labelledby="log-title" className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 id="log-title" className="text-sm font-semibold">
              Event log
            </h2>
            <button
              type="button"
              onClick={() => setLog([])}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              Clear
            </button>
          </div>
          {log.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Click a button and the state transitions show up here.</p>
          ) : (
            <ol className="max-h-72 overflow-y-auto px-5 py-3 font-mono text-xs leading-6">
              {log.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="shrink-0 text-muted-foreground tabular-nums">{entry.time}</span>
                  <span className="w-20 shrink-0 font-semibold">{entry.source}</span>
                  <span className={toneClass[entry.tone]}>
                    {entry.message}
                    {entry.count > 1 && <span className="text-muted-foreground"> ×{entry.count}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Controls */}
      <aside aria-labelledby="controls-title" className="h-fit rounded-2xl border border-border bg-card lg:sticky lg:top-6">
        <div className="border-b border-border px-5 py-3">
          <h2 id="controls-title" className="text-sm font-semibold">
            Controls
          </h2>
        </div>
        <div className="grid gap-5 px-5 py-5">
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Outcome</legend>
            {OUTCOMES.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="outcome"
                  value={o.value}
                  checked={mode === o.value}
                  onChange={() => setMode(o.value)}
                  className="size-4 accent-primary"
                />
                {o.label}
              </label>
            ))}
          </fieldset>

          <div className="grid gap-3 border-t border-border pt-5">
            <Toggle checked={disabled} onChange={setDisabled} label="Disabled" hint="aria-disabled: still focusable" />
            <Toggle
              checked={reduced}
              onChange={setReduced}
              label="Simulate reduced motion"
              hint={osReduced ? "Your system already asks for it" : "Opacity only, no movement"}
            />
            <Toggle checked={slowMo} onChange={setSlowMo} label={`Slow-mo ${SLOW_MO}×`} hint="Multiplies every duration token" />
          </div>

          <div className="grid gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={spam}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Spam test: {SPAM_CLICKS} clicks in {SPAM_WINDOW_MS}ms
            </button>
            <div className="flex items-center justify-between text-sm">
              <span>Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

const toneClass: Record<LogEntry["tone"], string> = {
  idle: "",
  loading: "",
  success: "text-primary",
  error: "text-danger",
  ignored: "text-muted-foreground",
  info: "text-muted-foreground",
};

function Specimen({ name, status, children }: { name: string; status: AsyncStatus; children: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-5">
      {children}
      <p className="text-xs text-muted-foreground">
        {name} · <span className="font-mono">{status}</span>
      </p>
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="grid gap-0.5">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
    </label>
  );
}
