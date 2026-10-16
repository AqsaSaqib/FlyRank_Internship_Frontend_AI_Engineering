/**
 * Sample tool parts for the /states showcase: one typed part per state, so
 * every card can be reviewed side by side without talking to a model. They
 * use the same `ToolPart<…>` types the chat receives, so if a tool's schema
 * changes, these stop compiling.
 */
import type { DevLogUITools } from "@/lib/ai/tools";
import type { ToolPart } from "@/lib/chat/types";

type QueryPart = ToolPart<"queryLogs">;
type StatsPart = ToolPart<"getLogStats">;
type SavePart = ToolPart<"saveLogEntry">;

/* ------------------------------- queryLogs -------------------------------- */

const queryInput: DevLogUITools["queryLogs"]["input"] = {
  reason: "you asked about last week",
  from: "2026-09-21",
  to: "2026-09-27",
};

export const queryOutput: DevLogUITools["queryLogs"]["output"] = {
  entries: [
    { id: "log_024", date: "2026-09-27", title: "GitHub OAuth callback", summary: "Finished the OAuth callback route and stored the session in an httpOnly cookie.", tags: ["auth", "nextjs"], hoursSpent: 5 },
    { id: "log_023", date: "2026-09-26", title: "Code review: caching layer", summary: "Reviewed Sam's PR for caching GitHub responses; suggested a 5 minute revalidate.", tags: ["review", "performance"] },
    { id: "log_022", date: "2026-09-23", title: "Dark mode tokens", summary: "Moved colors to CSS variables and added a theme toggle with no flash on load.", tags: ["css", "design-system"], hoursSpent: 3.5 },
  ],
  total: 3,
};

export const QUERY_STATES = {
  streaming: {
    type: "tool-queryLogs",
    toolCallId: "demo-query",
    state: "input-streaming",
    input: { reason: "you asked about last week", from: "2026-09-21" },
  },
  working: { type: "tool-queryLogs", toolCallId: "demo-query", state: "input-available", input: queryInput },
  done: { type: "tool-queryLogs", toolCallId: "demo-query", state: "output-available", input: queryInput, output: queryOutput },
  empty: {
    type: "tool-queryLogs",
    toolCallId: "demo-query-empty",
    state: "output-available",
    input: { keyword: "kubernetes" },
    output: { entries: [], total: 0 },
  },
  error: {
    type: "tool-queryLogs",
    toolCallId: "demo-query",
    state: "output-error",
    input: { ...queryInput, keyword: "fail" },
    errorText: 'Simulated failure: the keyword "fail" makes this tool throw on purpose.',
  },
} satisfies Record<string, QueryPart>;

/* ------------------------------ getLogStats ------------------------------- */

const statsInput: DevLogUITools["getLogStats"]["input"] = { reason: "you asked for a chart of your hours" };

export const statsOutput: DevLogUITools["getLogStats"]["output"] = {
  from: "2026-09-03",
  to: "2026-09-30",
  groupBy: "week",
  buckets: [
    { start: "2026-09-03", end: "2026-09-09", entries: 5, hours: 14.5 },
    { start: "2026-09-10", end: "2026-09-16", entries: 5, hours: 11.5 },
    { start: "2026-09-17", end: "2026-09-23", entries: 6, hours: 17.5 },
    { start: "2026-09-24", end: "2026-09-30", entries: 5, hours: 14.5 },
  ],
  hoursByTag: [
    { tag: "react", hours: 27.5 },
    { tag: "css", hours: 14 },
    { tag: "nextjs", hours: 9.5 },
    { tag: "ai", hours: 7.5 },
  ],
  totalEntries: 21,
  totalHours: 58,
  entriesWithoutHours: 3,
};

export const STATS_STATES = {
  streaming: { type: "tool-getLogStats", toolCallId: "demo-stats", state: "input-streaming", input: { reason: "you asked for a chart" } },
  working: { type: "tool-getLogStats", toolCallId: "demo-stats", state: "input-available", input: statsInput },
  done: { type: "tool-getLogStats", toolCallId: "demo-stats", state: "output-available", input: statsInput, output: statsOutput },
  error: {
    type: "tool-getLogStats",
    toolCallId: "demo-stats",
    state: "output-error",
    input: statsInput,
    errorText: "Simulated failure: the DevLog store didn't respond (forced by ?simulateToolError=1).",
  },
} satisfies Record<string, StatsPart>;

/* ------------------------------ saveLogEntry ------------------------------ */

const saveInput: DevLogUITools["saveLogEntry"]["input"] = {
  reason: "you asked me to save this",
  title: "Fixed the flaky contribution graph test",
  summary: "Pinned TZ=UTC in CI so the date assertions match what runs locally.",
  tags: ["testing", "ci"],
  hoursSpent: 2,
};

export const saveOutput: DevLogUITools["saveLogEntry"]["output"] = {
  entry: { id: "log_a1b2c3d4", date: "2026-09-30", title: saveInput.title, summary: saveInput.summary, tags: saveInput.tags, hoursSpent: 2 },
};

const approval = { id: "demo-approval" };

export const SAVE_STATES = {
  streaming: {
    type: "tool-saveLogEntry",
    toolCallId: "demo-save",
    state: "input-streaming",
    input: { reason: saveInput.reason, title: saveInput.title, summary: "Pinned TZ=UTC in CI so" },
  },
  confirm: { type: "tool-saveLogEntry", toolCallId: "demo-save", state: "approval-requested", input: saveInput, approval },
  saving: {
    type: "tool-saveLogEntry",
    toolCallId: "demo-save",
    state: "approval-responded",
    input: saveInput,
    approval: { ...approval, approved: true },
  },
  done: {
    type: "tool-saveLogEntry",
    toolCallId: "demo-save",
    state: "output-available",
    input: saveInput,
    output: saveOutput,
    approval: { ...approval, approved: true },
  },
  denied: {
    type: "tool-saveLogEntry",
    toolCallId: "demo-save",
    state: "output-denied",
    input: saveInput,
    approval: { ...approval, approved: false },
  },
  error: {
    type: "tool-saveLogEntry",
    toolCallId: "demo-save",
    state: "output-error",
    input: saveInput,
    errorText: "Simulated failure: the DevLog store didn't respond (forced by ?simulateToolError=1).",
  },
} satisfies Record<string, SavePart>;
