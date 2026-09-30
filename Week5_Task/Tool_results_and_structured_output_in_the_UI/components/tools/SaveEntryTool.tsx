"use client";

import type { DeepPartial } from "ai";

import type { ToolPart } from "@/lib/chat/types";
import type { DevLogUITools } from "@/lib/ai/tools";
import { Icon } from "@/components/chat/icons";
import { formatHours, formatWeekday } from "./format";
import { ChoiceHint, ToolCard, ToolErrorBody, useToolActions } from "./ToolCard";

type Input = DevLogUITools["saveLogEntry"]["input"];

/**
 * saveLogEntry needs a human in the loop (`toolApproval: 'user-approval'` in
 * the route), so it has more states than the read tools:
 *
 *   input-streaming     the draft fills in field by field
 *   input-available     brief: the call is complete, approval is being requested
 *   approval-requested  "Save this entry?" exactly what will be saved + Save / Cancel
 *   approval-responded  approved → "Saving…"; cancelled → waiting for output-denied
 *   output-available    "Saved" with the stored entry
 *   output-denied       "Not saved" (the user cancelled)
 *   output-error        error card with Retry
 */
export function SaveEntryTool({ part }: { part: ToolPart<"saveLogEntry"> }) {
  const { respondToApproval } = useToolActions();
  const common = { icon: "save" as const, stateKey: part.state };
  const hint = part.input ? <ChoiceHint tool="saveLogEntry" reason={part.input.reason || "you asked to save an entry"} /> : undefined;

  switch (part.state) {
    case "input-streaming":
      return (
        <ToolCard {...common} phase="streaming" title="Drafting a log entry…" hint={hint}>
          <EntryPreview input={part.input ?? {}} drafting />
        </ToolCard>
      );

    case "input-available":
      return (
        <ToolCard {...common} phase="working" title="Preparing your entry for review" hint={hint}>
          <EntryPreview input={part.input} />
        </ToolCard>
      );

    case "approval-requested": {
      // Automatic decisions also pass through this state; only manual ones need buttons.
      if (part.approval.isAutomatic) {
        return (
          <ToolCard {...common} phase="working" title="Checking this entry" hint={hint}>
            <EntryPreview input={part.input} />
          </ToolCard>
        );
      }
      const approvalId = part.approval.id;
      return (
        <ToolCard {...common} phase="confirm" title="Save this entry to your DevLog?" hint={hint}>
          <EntryPreview input={part.input} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => respondToApproval(approvalId, true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="check" className="size-4" />
              Save entry
            </button>
            <button
              type="button"
              onClick={() => respondToApproval(approvalId, false)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
            >
              Cancel
            </button>
            <p className="text-xs text-muted-foreground">Nothing is saved until you choose.</p>
          </div>
        </ToolCard>
      );
    }

    case "approval-responded":
      return part.approval.approved ? (
        <ToolCard {...common} phase="working" title="Saving your entry" hint={hint}>
          <EntryPreview input={part.input} />
        </ToolCard>
      ) : (
        <ToolCard {...common} phase="denied" title="Cancelled" hint={hint}>
          <EntryPreview input={part.input} dimmed />
        </ToolCard>
      );

    case "output-available":
      return (
        <ToolCard
          {...common}
          phase="done"
          title="Saved to your DevLog"
          hint={hint}
          aside={<span className="font-mono">{part.output.entry.id}</span>}
        >
          <EntryPreview input={part.output.entry} saved />
        </ToolCard>
      );

    case "output-denied":
      return (
        <ToolCard {...common} phase="denied" title="Not saved" hint={hint}>
          <EntryPreview input={part.input} dimmed />
          <p className="mt-2 text-xs text-muted-foreground">You cancelled, so nothing was written.</p>
        </ToolCard>
      );

    case "output-error":
      return (
        <ToolCard {...common} phase="error" title="Couldn't save your entry" hint={hint}>
          <ToolErrorBody errorText={part.errorText} attempted={<EntryPreview input={part.input ?? {}} dimmed />} />
        </ToolCard>
      );
  }
}

/**
 * Exactly what will be (or was) saved, field by field. Missing-field plan:
 * no date → "Today" (the tool's default), no hours → "Not tracked", no tags →
 * "No tags". While drafting, missing fields show a shimmer instead.
 */
function EntryPreview({
  input,
  drafting = false,
  saved = false,
  dimmed = false,
}: {
  input: DeepPartial<Input> | Input | (Omit<Input, "reason" | "date"> & { date: string });
  drafting?: boolean;
  saved?: boolean;
  dimmed?: boolean;
}) {
  const tags = (input.tags ?? []).filter((t): t is string => Boolean(t));
  const placeholder = (w: string) => (drafting ? <span aria-hidden="true" className={`skeleton inline-block h-3 rounded align-middle ${w}`} /> : null);

  return (
    <dl
      className={`grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-opacity ${
        dimmed ? "opacity-60" : ""
      }`}
    >
      <dt className="text-xs leading-5 text-muted-foreground">Date</dt>
      <dd className="leading-5">
        {input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? formatWeekday(input.date) : drafting && input.date ? input.date : "Today"}
      </dd>

      <dt className="text-xs leading-5 text-muted-foreground">Title</dt>
      <dd className={`font-medium leading-5 ${dimmed && !saved ? "line-through decoration-muted-foreground/50" : ""}`}>
        {input.title || placeholder("w-2/3")}
      </dd>

      <dt className="text-xs leading-5 text-muted-foreground">Summary</dt>
      <dd className="leading-5 text-muted-foreground">{input.summary || placeholder("w-11/12")}</dd>

      <dt className="text-xs leading-5 text-muted-foreground">Tags</dt>
      <dd className="leading-5">
        {tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label="Tags">
            {tags.map((t) => (
              <li key={t} className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] text-primary">
                #{t}
              </li>
            ))}
          </ul>
        ) : drafting ? (
          placeholder("w-1/3")
        ) : (
          <span className="text-muted-foreground">No tags</span>
        )}
      </dd>

      <dt className="text-xs leading-5 text-muted-foreground">Hours</dt>
      <dd className="leading-5">
        {input.hoursSpent != null ? (
          <span className="font-mono tabular-nums">{formatHours(input.hoursSpent)}</span>
        ) : drafting ? (
          placeholder("w-10")
        ) : (
          <span className="text-muted-foreground">Not tracked</span>
        )}
      </dd>
    </dl>
  );
}
