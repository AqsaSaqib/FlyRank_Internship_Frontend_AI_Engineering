"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { ToolPart } from "@/lib/chat/types";
import type { DevLogUITools } from "@/lib/ai/tools";
import { formatDay, formatHours, formatRange, plural } from "./format";
import { Chip, ChipList, ChoiceHint, SkeletonLines, ToolCard, ToolErrorBody } from "./ToolCard";

type Input = DevLogUITools["getLogStats"]["input"];
type Output = DevLogUITools["getLogStats"]["output"];

/** getLogStats: same state mapping as queryLogs, with a chart as the result. */
export function LogStatsTool({ part }: { part: ToolPart<"getLogStats"> }) {
  const common = { icon: "chart" as const, stateKey: part.state };

  switch (part.state) {
    case "input-streaming":
      return (
        <ToolCard {...common} phase="streaming" title="Crunching your numbers…" hint={hintFor(part.input)}>
          <StatsChips input={part.input ?? {}} pending />
          <ChartSkeleton />
        </ToolCard>
      );

    case "input-available":
    case "approval-requested":
    case "approval-responded":
      return (
        <ToolCard {...common} phase="working" title="Crunching your numbers" hint={hintFor(part.input)}>
          <StatsChips input={part.input} />
          <p className="mt-2.5 text-xs text-muted-foreground">Adding up entries and hours…</p>
        </ToolCard>
      );

    case "output-available":
      return (
        <ToolCard
          {...common}
          phase="done"
          title={`Your activity, ${formatRange(part.output.from, part.output.to)}`}
          hint={hintFor(part.input)}
        >
          <LogStatsCard stats={part.output} />
        </ToolCard>
      );

    case "output-error":
      return (
        <ToolCard {...common} phase="error" title="Couldn't calculate your stats" hint={hintFor(part.input)}>
          <ToolErrorBody errorText={part.errorText} attempted={<StatsChips input={part.input ?? {}} />} />
        </ToolCard>
      );

    case "output-denied":
      return null; // not reachable: getLogStats has no approval step
  }
}

/** Missing-field plan: no dates → "Last 4 weeks"; no groupBy → "Auto grouping". */
function StatsChips({ input, pending = false }: { input: Partial<Input>; pending?: boolean }) {
  return (
    <ChipList label="Stats options">
      <Chip
        icon="calendar"
        label="Dates"
        value={formatRange(input.from, input.to, "Last 4 weeks")}
        muted={!input.from && !input.to}
        pending={pending}
      />
      {(input.groupBy || !pending) && (
        <Chip
          icon="chart"
          label="Grouping"
          value={input.groupBy ? `By ${input.groupBy}` : "Auto grouping"}
          muted={!input.groupBy}
          pending={pending}
        />
      )}
    </ChipList>
  );
}

function hintFor(input: Partial<Input> | undefined) {
  if (!input) return undefined;
  const reason = input.reason || (input.from || input.to ? "you asked about totals for a date range" : undefined);
  return reason ? <ChoiceHint tool="getLogStats" reason={reason} /> : undefined;
}

function ChartSkeleton() {
  const heights = [40, 65, 30, 80, 55, 70];
  return (
    <div aria-hidden="true">
      <div className="mt-3 flex h-24 items-end gap-2">
        {heights.map((h, i) => (
          <div key={i} className="skeleton flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
      <SkeletonLines lines={1} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* LogStatsCard                                                               */
/* -------------------------------------------------------------------------- */

type Metric = "entries" | "hours";

export function LogStatsCard({ stats }: { stats: Output }) {
  const [metric, setMetric] = useState<Metric>("entries");

  if (stats.totalEntries === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        No entries between {formatDay(stats.from)} and {formatDay(stats.to)} yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Entries" value={String(stats.totalEntries)} />
        <Stat
          label="Hours tracked"
          value={formatHours(stats.totalHours)}
          note={stats.entriesWithoutHours > 0 ? `${plural(stats.entriesWithoutHours, "entry", "entries")} without hours` : undefined}
        />
      </dl>

      <figure>
        <div className="mb-2 flex items-center justify-between gap-2">
          <figcaption className="text-xs font-medium text-muted-foreground">
            {metric === "entries" ? "Entries" : "Hours"} per {stats.groupBy}
          </figcaption>
          <div role="group" aria-label="Chart metric" className="flex rounded-lg border border-border p-0.5 text-xs">
            {(["entries", "hours"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={metric === m}
                onClick={() => setMetric(m)}
                className="rounded-md px-2 py-0.5 capitalize text-muted-foreground transition-colors aria-pressed:bg-primary-soft aria-pressed:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <TimelineChart stats={stats} metric={metric} />
      </figure>

      {stats.hoursByTag.length > 0 && (
        <figure>
          <figcaption className="mb-2 text-xs font-medium text-muted-foreground">Hours by tag</figcaption>
          <TagBars rows={stats.hoursByTag} />
          <p className="mt-1.5 text-[11px] text-muted-foreground">An entry&apos;s hours count toward each of its tags.</p>
        </figure>
      )}

      <details className="group text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">
          View as table
        </summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">{stats.groupBy === "day" ? "Day" : "Week of"}</th>
              <th className="py-1 text-right font-medium">Entries</th>
              <th className="py-1 text-right font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {stats.buckets.map((b) => (
              <tr key={b.start} className="border-t border-border">
                <td className="py-1">{bucketLabel(b, stats.groupBy)}</td>
                <td className="py-1 text-right">{b.entries}</td>
                <td className="py-1 text-right">{formatHours(b.hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      {note && <dd className="text-[11px] text-muted-foreground">{note}</dd>}
    </div>
  );
}

type Bucket = Output["buckets"][number];

function bucketLabel(b: Bucket, groupBy: Output["groupBy"]) {
  return groupBy === "day" || b.start === b.end ? formatDay(b.start) : `${formatDay(b.start)} – ${formatDay(b.end)}`;
}

/**
 * Hand-rolled SVG bar chart, sized to its container in real pixels (so text
 * never scales). Single series in the brand color, so no legend: the caption
 * names it. Each bar has a hit area taller than the bar, a tooltip on hover
 * or keyboard focus, and an aria-label; the table view holds the same data.
 */
function TimelineChart({ stats, metric }: { stats: Output; metric: Metric }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    setWidth(el.clientWidth); // don't wait for the first observer callback to draw
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const H = 140;
  const pad = { top: 8, right: 4, bottom: 20, left: 26 };
  const values = stats.buckets.map((b) => (metric === "entries" ? b.entries : b.hours));
  const max = niceMax(Math.max(...values, 1));
  const innerW = Math.max(width - pad.left - pad.right, 0);
  const innerH = H - pad.top - pad.bottom;
  const slot = innerW / Math.max(values.length, 1);
  const barW = Math.max(Math.min(slot - 2, 36), 2); // 2px gap between bars
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(values.length / Math.max(Math.floor(innerW / 44), 1));
  const format = (v: number) => (metric === "entries" ? String(v) : formatHours(v));

  return (
    <div ref={boxRef} className="relative" onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={`${metric} per ${stats.groupBy}`} className="block">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(max * t)}
                y2={y(max * t)}
                className="stroke-border"
                strokeDasharray={t === 0 ? undefined : "2 3"}
              />
              <text x={pad.left - 6} y={y(max * t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {format(max * t)}
              </text>
            </g>
          ))}
          {values.map((v, i) => {
            const b = stats.buckets[i];
            const x = pad.left + i * slot + (slot - barW) / 2;
            const h = Math.max(pad.top + innerH - y(v), v > 0 ? 2 : 0);
            return (
              <g key={b.start}>
                {/* Rounded top, square base anchored to the axis. */}
                <path
                  d={roundedTopBar(x, pad.top + innerH - h, barW, h, Math.min(4, barW / 2))}
                  className={`transition-[fill-opacity] duration-150 ${active === null || active === i ? "fill-primary" : "fill-primary/40"}`}
                />
                <rect
                  x={pad.left + i * slot}
                  y={pad.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${bucketLabel(b, stats.groupBy)}: ${plural(b.entries, "entry", "entries")}, ${formatHours(b.hours)}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none focus-visible:stroke-primary"
                />
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={H - 5} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                    {formatDay(b.start)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {active !== null && width > 0 && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(pad.left + active * slot + slot / 2, 60), width - 60),
            top: y(values[active]) - 6,
          }}
        >
          <p className="font-medium">{bucketLabel(stats.buckets[active], stats.groupBy)}</p>
          <p className="text-muted-foreground">
            {plural(stats.buckets[active].entries, "entry", "entries")} · {formatHours(stats.buckets[active].hours)}
          </p>
        </div>
      )}
    </div>
  );
}

/** Horizontal bars; value labels sit in text color beside the bar, never on it. */
function TagBars({ rows }: { rows: Output["hoursByTag"] }) {
  const max = Math.max(...rows.map((r) => r.hours), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.tag} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 text-xs" title={`#${r.tag}: ${formatHours(r.hours)}`}>
          <span className="truncate font-mono text-muted-foreground">#{r.tag}</span>
          <span className="h-2.5 overflow-hidden rounded-r bg-muted">
            <span className="block h-full rounded-r bg-primary" style={{ width: `${(r.hours / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{formatHours(r.hours)}</span>
        </li>
      ))}
    </ul>
  );
}

function niceMax(v: number) {
  const step = v <= 4 ? 2 : v <= 10 ? 5 : v <= 40 ? 10 : 20;
  return Math.ceil(v / step) * step;
}

function roundedTopBar(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  const rr = Math.min(r, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
