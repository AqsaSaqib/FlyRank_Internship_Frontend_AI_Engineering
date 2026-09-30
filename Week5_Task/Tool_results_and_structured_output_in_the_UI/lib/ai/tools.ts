/**
 * DevLog Assistant tools: server-side functions the model can call, whose
 * results the chat renders as real components (components/tools/).
 *
 *   queryLogs     read   → LogResultsCard
 *   getLogStats   read   → LogStatsCard (bar charts)
 *   saveLogEntry  write  → SaveEntryCard, runs only after the user approves
 *                          (see `TOOL_APPROVAL` and the route's `toolApproval`)
 *
 * Schemas are deliberately small: every field has `.describe()` because the
 * model reads those descriptions, and every optional field has a documented
 * default so the UI always knows what to show when it's missing.
 *
 * Errors: throw `ToolFailure` with a message that's safe to show the user.
 * The route's `onError` passes those through and masks anything else.
 */
import "server-only";

import { tool, type InferUITools, type ToolApprovalConfiguration } from "ai";
import { z } from "zod";

import { addDays, addEntry, listEntries, todayIso, type LogEntry } from "@/lib/devlog/entries";

/* -------------------------------------------------------------------------- */
/* Errors and the demo error switch                                           */
/* -------------------------------------------------------------------------- */

/** A tool error whose message is written for the user (shown in the error card). */
export class ToolFailure extends Error {
  override name = "ToolFailure";
}

/**
 * How tools decide to fail on purpose, for demos and review:
 *   "keyword" (default) → a tool fails when the model passes the keyword "fail"
 *   "force"             → every tool call fails (page opened with ?simulateToolError=1)
 *   "off"               → never simulate (used by the error card's Retry button)
 */
export const TOOL_ERROR_MODES = ["keyword", "force", "off"] as const;
export type ToolErrorMode = (typeof TOOL_ERROR_MODES)[number];

/**
 * The store is in memory, so tools would return in microseconds and the
 * "working" state would never be seen. A short delay stands in for a real
 * database round-trip. Set DEVLOG_TOOL_LATENCY_MS=0 to disable.
 */
const LATENCY_MS = Number(process.env.DEVLOG_TOOL_LATENCY_MS ?? 700);
const simulateLatency = () => new Promise((r) => setTimeout(r, LATENCY_MS));

async function maybeSimulateFailure(mode: ToolErrorMode, keywordHit: boolean) {
  await simulateLatency();
  if (mode === "force") {
    throw new ToolFailure("Simulated failure: the DevLog store didn't respond (forced by ?simulateToolError=1).");
  }
  if (mode === "keyword" && keywordHit) {
    throw new ToolFailure('Simulated failure: the keyword "fail" makes this tool throw on purpose.');
  }
}

/* -------------------------------------------------------------------------- */
/* Shared schema pieces                                                       */
/* -------------------------------------------------------------------------- */

const isoDay = z.iso.date();

/**
 * Shown in the UI as "Chose queryLogs because …". Optional: when the model
 * leaves it out, the UI derives a hint from the other inputs instead.
 */
const reason = z
  .string()
  .max(120)
  .optional()
  .describe(
    "One short phrase for the user explaining why you chose this tool, starting lower-case, e.g. 'you asked about last week'.",
  );

/** What the tools return for one entry (and what the result cards render). */
export type LogEntrySummary = Pick<LogEntry, "id" | "date" | "title" | "summary" | "tags" | "hoursSpent">;

const MAX_RESULTS = 20;

function checkRange(from: string, to: string) {
  if (from > to) throw new ToolFailure(`The start date (${from}) is after the end date (${to}).`);
}

/* -------------------------------------------------------------------------- */
/* Tools                                                                      */
/* -------------------------------------------------------------------------- */

export function createDevLogTools({ errorMode = "keyword" }: { errorMode?: ToolErrorMode } = {}) {
  return {
    queryLogs: tool({
      description:
        "Search the user's DevLog entries by date range, tag (a technology or topic), and/or keyword. Use it whenever the user asks what they worked on, or to find entries. Returns at most 20 entries, newest first, plus the total number of matches.",
      inputSchema: z.object({
        reason,
        from: isoDay
          .optional()
          .describe("Earliest entry date to include, YYYY-MM-DD (inclusive). Omit for no lower bound."),
        to: isoDay.optional().describe("Latest entry date to include, YYYY-MM-DD (inclusive). Omit for up to today."),
        tag: z
          .string()
          .min(1)
          .optional()
          .describe("One lower-case tag to filter by, e.g. 'react', 'testing', 'auth'. Omit to include every tag."),
        keyword: z
          .string()
          .min(1)
          .optional()
          .describe("Word or phrase to look for in entry titles and summaries. Omit to skip text search."),
      }),
      execute: async ({ from, to, tag, keyword }) => {
        await maybeSimulateFailure(errorMode, keyword?.trim().toLowerCase() === "fail");
        if (from && to) checkRange(from, to);

        const tagLc = tag?.trim().toLowerCase();
        const kwLc = keyword?.trim().toLowerCase();
        const matches = listEntries().filter(
          (e) =>
            (!from || e.date >= from) &&
            (!to || e.date <= to) &&
            (!tagLc || e.tags.includes(tagLc)) &&
            (!kwLc || `${e.title} ${e.summary}`.toLowerCase().includes(kwLc)),
        );

        return {
          entries: matches.slice(0, MAX_RESULTS).map(toSummary),
          total: matches.length,
        };
      },
    }),

    getLogStats: tool({
      description:
        "Aggregate the user's DevLog entries for a chart: entries and hours per day or week, and hours by tag. Use it for questions about trends, totals, how much time went where, or 'show me a chart'.",
      inputSchema: z.object({
        reason,
        from: isoDay.optional().describe("First day to include, YYYY-MM-DD. Omit for 27 days before `to` (4 weeks)."),
        to: isoDay.optional().describe("Last day to include, YYYY-MM-DD. Omit for today."),
        groupBy: z
          .enum(["day", "week"])
          .optional()
          .describe("Bucket size for the timeline. Omit to use 'day' for ranges up to 14 days, otherwise 'week'."),
      }),
      execute: async ({ from: fromIn, to: toIn, groupBy: groupIn }) => {
        await maybeSimulateFailure(errorMode, false);

        const to = toIn ?? todayIso();
        const from = fromIn ?? addDays(to, -27);
        checkRange(from, to);
        const days = dayDiff(from, to) + 1;
        if (days > 366) throw new ToolFailure("Stats cover at most one year at a time. Try a shorter range.");
        // A daily chart with more than 31 bars is unreadable; honor 'day' only when it fits.
        const groupBy = groupIn === "day" && days <= 31 ? "day" : groupIn ?? (days <= 14 ? "day" : "week");

        const inRange = listEntries().filter((e) => e.date >= from && e.date <= to);

        // Buckets run forward from `from`, so the last one may be shorter.
        const size = groupBy === "day" ? 1 : 7;
        const buckets: { start: string; end: string; entries: number; hours: number }[] = [];
        for (let start = from; start <= to; start = addDays(start, size)) {
          const end = minDate(addDays(start, size - 1), to);
          const inBucket = inRange.filter((e) => e.date >= start && e.date <= end);
          buckets.push({
            start,
            end,
            entries: inBucket.length,
            hours: round1(inBucket.reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0)),
          });
        }

        // An entry's hours count toward each of its tags.
        const byTag = new Map<string, number>();
        for (const e of inRange) {
          if (e.hoursSpent == null) continue;
          for (const t of e.tags) byTag.set(t, (byTag.get(t) ?? 0) + e.hoursSpent);
        }
        const hoursByTag = [...byTag]
          .map(([tag, hours]) => ({ tag, hours: round1(hours) }))
          .sort((a, b) => b.hours - a.hours || a.tag.localeCompare(b.tag))
          .slice(0, 6);

        return {
          from,
          to,
          groupBy,
          buckets,
          hoursByTag,
          totalEntries: inRange.length,
          totalHours: round1(inRange.reduce((sum, e) => sum + (e.hoursSpent ?? 0), 0)),
          /** Entries with no hoursSpent, so the UI can say the hours are partial. */
          entriesWithoutHours: inRange.filter((e) => e.hoursSpent == null).length,
        };
      },
    }),

    saveLogEntry: tool({
      description:
        "Save a new entry to the user's DevLog. The user sees exactly these fields and must approve before it is saved, so only call it when they ask to save or log something. Never invent work they didn't mention.",
      inputSchema: z.object({
        reason,
        date: isoDay.optional().describe("Day the work happened, YYYY-MM-DD. Omit for today."),
        title: z.string().min(3).max(80).describe("Short headline for the entry, e.g. 'Fixed logout-on-refresh bug'."),
        summary: z.string().min(3).max(280).describe("One or two sentences on what was done, in the user's words."),
        tags: z
          .array(z.string().min(1).max(24))
          .max(5)
          .describe("Up to 5 lower-case tags (technologies or topics). Use an empty array if none fit."),
        hoursSpent: z
          .number()
          .min(0.25)
          .max(24)
          .optional()
          .describe("Hours spent, only if the user said. Omit when unknown; never guess."),
      }),
      execute: async ({ date, title, summary, tags, hoursSpent }) => {
        await maybeSimulateFailure(errorMode, title.trim().toLowerCase() === "fail");
        const entry = addEntry({
          date: date ?? todayIso(),
          title: title.trim(),
          summary: summary.trim(),
          tags: [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))],
          ...(hoursSpent != null && { hoursSpent }),
        });
        return { entry: toSummary(entry) };
      },
    }),
  };
}

export type DevLogTools = ReturnType<typeof createDevLogTools>;

/** Typed `tool-*` UI parts: input/output types per tool, used by the client. */
export type DevLogUITools = InferUITools<DevLogTools>;

/** Writes need a human in the loop; reads run immediately. */
export const TOOL_APPROVAL = {
  saveLogEntry: "user-approval",
} satisfies ToolApprovalConfiguration<DevLogTools, never>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toSummary({ id, date, title, summary, tags, hoursSpent }: LogEntry): LogEntrySummary {
  return { id, date, title, summary, tags, ...(hoursSpent != null && { hoursSpent }) };
}

function dayDiff(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

const minDate = (a: string, b: string) => (a < b ? a : b);
const round1 = (n: number) => Math.round(n * 10) / 10;
