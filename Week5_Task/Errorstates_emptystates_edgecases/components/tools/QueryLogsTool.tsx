"use client";

import type { ToolPart } from "@/lib/chat/types";
import type { DevLogUITools } from "@/lib/ai/tools";
import { Icon } from "@/components/chat/icons";
import { formatHours, formatRange, formatWeekday, plural } from "./format";
import { ChipList, Chip, ChoiceHint, SkeletonLines, ToolCard, ToolErrorBody } from "./ToolCard";

type Input = DevLogUITools["queryLogs"]["input"];
type Output = DevLogUITools["queryLogs"]["output"];

/**
 * queryLogs, one card through every state:
 *
 *   input-streaming  "What is it doing?"   shimmer title + chips appearing as params stream
 *   input-available  "With what input?"    final chips + spinner
 *   output-available "What came back?"     LogResultsCard (or its empty state)
 *   output-error     "What went wrong?"    ToolErrorBody with Retry
 *
 * queryLogs never needs approval, but typed parts include the approval states,
 * so they're handled (as "working") to keep the switch exhaustive.
 */
export function QueryLogsTool({ part }: { part: ToolPart<"queryLogs"> }) {
  const common = { icon: "search" as const, stateKey: part.state };

  switch (part.state) {
    case "input-streaming":
      return (
        <ToolCard {...common} phase="streaming" title="Searching your logs…" hint={hintFor(part.input)}>
          <QueryChips input={part.input ?? {}} pending />
          <SkeletonLines />
        </ToolCard>
      );

    case "input-available":
    case "approval-requested":
    case "approval-responded":
      return (
        <ToolCard {...common} phase="working" title="Searching your logs" hint={hintFor(part.input)}>
          <QueryChips input={part.input} />
          <p className="mt-2.5 text-xs text-muted-foreground">Looking through your entries…</p>
        </ToolCard>
      );

    case "output-available":
      return (
        <ToolCard
          {...common}
          phase="done"
          title={part.output.total === 0 ? "No matching entries" : `Found ${plural(part.output.total, "entry", "entries")}`}
          hint={hintFor(part.input)}
          aside={<QueryChipsInline input={part.input} />}
        >
          <LogResultsCard output={part.output} input={part.input} />
        </ToolCard>
      );

    case "output-error":
      return (
        <ToolCard {...common} phase="error" title="Couldn't search your logs" hint={hintFor(part.input)}>
          <ToolErrorBody errorText={part.errorText} attempted={<QueryChips input={part.input ?? {}} />} />
        </ToolCard>
      );

    case "output-denied":
      return null; // not reachable: queryLogs has no approval step
  }
}

/* -------------------------------------------------------------------------- */
/* Chips: the query as the user would describe it                             */
/* -------------------------------------------------------------------------- */

/**
 * Missing-field plan: no dates → "All time"; no tag / keyword → no chip.
 * While streaming, a chip appears as soon as its field starts arriving.
 */
function QueryChips({ input, pending = false }: { input: Partial<Input>; pending?: boolean }) {
  const hasDates = Boolean(input.from || input.to);
  return (
    <ChipList label="Search filters">
      {(hasDates || !pending) && (
        <Chip
          icon="calendar"
          label="Dates"
          value={formatRange(input.from, input.to)}
          muted={!hasDates}
          pending={pending}
        />
      )}
      {input.tag && <Chip icon="tag" label="Tag" value={`#${input.tag}`} pending={pending} />}
      {input.keyword && <Chip icon="search" label="Keyword" value={`“${input.keyword}”`} pending={pending} />}
    </ChipList>
  );
}

/** Compact summary for the result header, so the filters stay visible next to the results. */
function QueryChipsInline({ input }: { input: Input }) {
  const parts = [formatRange(input.from, input.to), input.tag && `#${input.tag}`, input.keyword && `“${input.keyword}”`];
  return <span className="hidden sm:inline">{parts.filter(Boolean).join(" · ")}</span>;
}

/** The model's own reason when it gave one, otherwise one derived from the inputs. */
function hintFor(input: Partial<Input> | undefined) {
  if (!input) return undefined;
  const reason =
    input.reason ||
    (input.tag
      ? `you mentioned ${input.tag}`
      : input.keyword
        ? `you searched for “${input.keyword}”`
        : input.from || input.to
          ? `you asked about ${formatRange(input.from, input.to).toLowerCase()}`
          : undefined);
  return reason ? <ChoiceHint tool="queryLogs" reason={reason} /> : undefined;
}

/* -------------------------------------------------------------------------- */
/* LogResultsCard                                                             */
/* -------------------------------------------------------------------------- */

export function LogResultsCard({ output, input }: { output: Output; input: Input }) {
  if (output.entries.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-4 py-6 text-center">
        <Icon name="inbox" className="size-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Nothing logged for this search</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {input.tag || input.keyword
            ? "Try a different tag or keyword, or widen the date range."
            : "Try a wider date range."}
        </p>
        <div className="mt-3">
          <QueryChips input={input} />
        </div>
      </div>
    );
  }

  const tracked = output.entries.filter((e) => e.hoursSpent != null);
  const hours = tracked.reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0);

  return (
    <div>
      <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
        {output.entries.map((e) => (
          <li key={e.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                <time dateTime={e.date}>{formatWeekday(e.date)}</time>
              </p>
              <p className="truncate text-sm font-medium">{e.title}</p>
            </div>
            {/* Missing-field plan: no hours → a muted dash, not "0h". */}
            <p className="self-center text-right font-mono text-xs tabular-nums">
              {e.hoursSpent != null ? (
                formatHours(e.hoursSpent)
              ) : (
                <span className="text-muted-foreground" title="No time logged">
                  —<span className="sr-only">no time logged</span>
                </span>
              )}
            </p>
            <p className="col-span-2 line-clamp-2 text-xs text-muted-foreground">{e.summary}</p>
            {e.tags.length > 0 && (
              <ul className="col-span-2 flex flex-wrap gap-1" aria-label="Tags">
                {e.tags.map((t) => (
                  <li key={t} className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] text-primary">
                    #{t}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
        <span>
          {output.total > output.entries.length
            ? `Showing the ${output.entries.length} newest of ${output.total}`
            : plural(output.total, "entry", "entries")}
        </span>
        {tracked.length > 0 && (
          <span>
            {formatHours(hours)} logged
            {tracked.length < output.entries.length && ` on ${tracked.length} of ${output.entries.length}`}
          </span>
        )}
      </p>
    </div>
  );
}
