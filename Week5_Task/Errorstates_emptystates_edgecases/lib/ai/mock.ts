import "server-only";

import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Prompt,
  LanguageModelV4StreamPart,
  LanguageModelV4ToolResultOutput,
  LanguageModelV4Usage,
} from "@ai-sdk/provider";

import { addDays, listEntries, todayIso } from "@/lib/devlog/entries";

/**
 * Development stand-in for a real model, used when no API key is set.
 *
 * It speaks the AI SDK's model protocol, so everything downstream (streamText,
 * tool execution, approvals, the UI stream) is the real code path. Instead of
 * thinking, it picks a tool with keyword rules and streams the tool input in
 * small JSON chunks, so every tool part state is visible:
 *
 *   "what did I work on last week?"      → queryLogs (dates)
 *   "show my react entries"              → queryLogs (tag)
 *   "search my logs for fail"            → queryLogs → error card
 *   "chart my hours this month"          → getLogStats
 *   "save this: fixed the flaky test, 2h"→ saveLogEntry → approval card
 *   anything else                        → a canned markdown reply
 */
export function createMockModel(): LanguageModelV4 {
  return {
    specificationVersion: "v4",
    provider: "devlog-mock",
    modelId: "mock",
    supportedUrls: {},
    doGenerate() {
      throw new Error("The mock model only supports streaming.");
    },
    async doStream(options) {
      return { stream: toStream(script(options.prompt), options) };
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Script                                                                     */
/* -------------------------------------------------------------------------- */

type Step =
  | { kind: "text"; reasoning?: string; text: string }
  | { kind: "tool"; reasoning: string; toolName: string; input: Record<string, unknown> };

function script(prompt: LanguageModelV4Prompt): Step {
  const last = prompt.at(-1);

  // Second step: a tool just returned (or was denied / failed). Summarize it.
  if (last?.role === "tool") {
    const result = last.content.findLast((p) => p.type === "tool-result");
    return { kind: "text", text: result ? summarize(result.toolName, result.output) : "Done." };
  }

  const text =
    last?.role === "user"
      ? last.content
          .map((p) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .trim()
      : "";
  const lc = text.toLowerCase();
  const tag = findTag(lc);
  const range = findRange(lc);

  if (/\b(save|log this|add (an |this )?entry|record this)\b/.test(lc)) {
    const body = text.replace(/^.*?\b(save|log this|add (an |this )?entry|record this)\b[^:]*:?\s*/i, "") || text;
    const hours = lc.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/);
    const clean = body.replace(/,?\s*\d+(?:\.\d+)?\s*(?:h|hrs?|hours?)\b/i, "").trim();
    return {
      kind: "tool",
      reasoning: "They asked me to save an entry, so I'll draft one for them to approve.",
      toolName: "saveLogEntry",
      input: {
        reason: "you asked me to save this",
        title: capitalize(clipWords(clean.split(/[.,;]/)[0], 60) || "Untitled entry"),
        summary: capitalize(clean.slice(0, 240)) || "No details given.",
        tags: tag ? [tag] : [],
        ...(hours && { hoursSpent: Number(hours[1]) }),
      },
    };
  }

  // The welcome screen's "write" and "plan" prompts get a written answer, not a search.
  if (/\b(write|draft)\b/.test(lc) && /\b(entry|log)\b/.test(lc)) {
    return { kind: "text", reasoning: CANNED_REASONING, text: CANNED_REPLY };
  }
  if (/\b(focus|tomorrow|next up|prioriti[sz]e)\b/.test(lc)) {
    return { kind: "text", reasoning: FOCUS_REASONING, text: FOCUS_REPLY };
  }

  if (/\b(stats|chart|graph|trend|how many|hours|breakdown|time spent)\b/.test(lc)) {
    return {
      kind: "tool",
      reasoning: "This is about totals over time, so stats will answer it better than a list.",
      toolName: "getLogStats",
      input: {
        reason: range ? `you asked about ${range.label}` : "you asked for totals over time",
        ...(range && { from: range.from, to: range.to }),
        ...(/\b(daily|per day|by day)\b/.test(lc) && { groupBy: "day" }),
      },
    };
  }

  const keyword = lc.match(/"([^"]+)"/)?.[1] ?? lc.match(/\b(?:for|about|mentioning)\s+(fail)\b/)?.[1];
  if (keyword || tag || range || /\b(what did i|worked on|search|find|show|entries|logs?)\b/.test(lc)) {
    return {
      kind: "tool",
      reasoning: "They want to see past entries, so I'll search their logs.",
      toolName: "queryLogs",
      input: {
        reason: range ? `you asked about ${range.label}` : tag ? `you mentioned ${tag}` : "you asked to see your entries",
        ...(range && { from: range.from, to: range.to }),
        ...(tag && { tag }),
        ...(keyword && { keyword }),
      },
    };
  }

  return { kind: "text", reasoning: CANNED_REASONING, text: CANNED_REPLY };
}

function summarize(toolName: string, output: LanguageModelV4ToolResultOutput): string {
  if (output.type === "execution-denied") return "No problem, I didn't save anything. Tell me if you want to change it and try again.";
  if (output.type === "error-text" || output.type === "error-json") {
    return "That tool call failed, so I don't have results to show. Use **Retry** on the card to run it again.";
  }
  if (output.type !== "json" || typeof output.value !== "object" || output.value === null) return "Done.";
  const value = output.value as Record<string, unknown>;

  if (toolName === "queryLogs") {
    const total = Number(value.total ?? 0);
    return total === 0
      ? "Nothing matched those filters. Try a wider date range or a different tag."
      : `You logged **${total}** matching ${total === 1 ? "entry" : "entries"}. Want me to turn them into a weekly report?`;
  }
  if (toolName === "getLogStats") {
    const top = (value.hoursByTag as { tag: string }[] | undefined)?.[0]?.tag;
    return `That's **${value.totalEntries}** entries and **${value.totalHours}h** tracked${top ? `, with most time going to **${top}**` : ""}.`;
  }
  if (toolName === "saveLogEntry") return "Saved. It will show up when you search your logs.";
  return "Done.";
}

/* -------------------------------------------------------------------------- */
/* Tiny natural-language helpers                                              */
/* -------------------------------------------------------------------------- */

function findTag(lc: string): string | undefined {
  const tags = new Set(listEntries().flatMap((e) => e.tags));
  return [...tags].find((t) => new RegExp(`\\b${t.replace(/[-]/g, "\\-")}\\b`).test(lc));
}

function findRange(lc: string): { from: string; to: string; label: string } | undefined {
  const today = todayIso();
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -weekday);
  if (/\blast week\b/.test(lc)) return { from: addDays(monday, -7), to: addDays(monday, -1), label: "last week" };
  if (/\bthis week\b/.test(lc)) return { from: monday, to: today, label: "this week" };
  if (/\byesterday\b/.test(lc)) return { from: addDays(today, -1), to: addDays(today, -1), label: "yesterday" };
  if (/\btoday\b/.test(lc)) return { from: today, to: today, label: "today" };
  if (/\bthis month\b/.test(lc)) return { from: `${today.slice(0, 8)}01`, to: today, label: "this month" };
  const days = lc.match(/\blast (\d{1,3}) days\b/);
  if (days) return { from: addDays(today, -Number(days[1]) + 1), to: today, label: `the last ${days[1]} days` };
  return undefined;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Shorten to at most `max` characters without cutting a word in half. */
function clipWords(s: string, max: number) {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, t.lastIndexOf(" ", max)).trim();
}

/* -------------------------------------------------------------------------- */
/* Streaming                                                                  */
/* -------------------------------------------------------------------------- */

const USAGE: LanguageModelV4Usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

function toStream(step: Step, options: LanguageModelV4CallOptions): ReadableStream<LanguageModelV4StreamPart> {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const aborted = () => options.abortSignal?.aborted ?? false;

  return new ReadableStream<LanguageModelV4StreamPart>({
    async start(controller) {
      const send = (part: LanguageModelV4StreamPart) => {
        if (!aborted()) controller.enqueue(part);
      };
      send({ type: "stream-start", warnings: [] });
      send({ type: "response-metadata", modelId: "mock" });
      await wait(500); // time to first token

      if (step.reasoning) {
        send({ type: "reasoning-start", id: "r1" });
        send({ type: "reasoning-delta", id: "r1", delta: step.reasoning });
        send({ type: "reasoning-end", id: "r1" });
      }

      if (step.kind === "tool") {
        const id = `mock_${crypto.randomUUID().slice(0, 8)}`;
        const json = JSON.stringify(step.input);
        send({ type: "tool-input-start", id, toolName: step.toolName });
        // Small chunks with a gap, so the input-streaming state is visible.
        for (const chunk of json.match(/.{1,6}/g) ?? []) {
          if (aborted()) break;
          send({ type: "tool-input-delta", id, delta: chunk });
          await wait(45);
        }
        send({ type: "tool-input-end", id });
        send({ type: "tool-call", toolCallId: id, toolName: step.toolName, input: json });
        send({ type: "finish", usage: USAGE, finishReason: { unified: "tool-calls", raw: "tool_use" } });
      } else {
        send({ type: "text-start", id: "t1" });
        for (const chunk of step.text.match(/\s*\S{1,6}/g) ?? []) {
          if (aborted()) break;
          send({ type: "text-delta", id: "t1", delta: chunk });
          await wait(20);
        }
        send({ type: "text-end", id: "t1" });
        send({ type: "finish", usage: USAGE, finishReason: { unified: "stop", raw: "end_turn" } });
      }
      controller.close();
    },
  });
}

const FOCUS_REASONING =
  "The flaky CI test is still open from earlier this week, and the OAuth work is nearly done, so those come first.";

const FOCUS_REPLY = `Based on your recent entries, here's what I'd put first tomorrow:

1. **Close out the flaky contribution graph test.** You found the timezone cause; confirm CI is green for a few runs and remove any retries you added.
2. **Wrap up the GitHub OAuth callback.** Add a test for the expired-session path so the logout-on-refresh bug can't come back.
3. **Review time.** Leave an hour for Sam's caching PR follow-ups.

Want me to save this as a plan in today's entry? *(Mock reply: add an API key to \`.env.local\` for real answers.)*`;

const CANNED_REASONING =
  "The notes mention a bug fix, pairing on caching and a flaky test, so I'll group them into done, learned and blocked.";

const CANNED_REPLY = `Here's a draft entry from your notes:

## Daily log

**What I did**
- Fixed the session bug where users were logged out after a refresh.
- Paired on the caching layer and agreed to cache GitHub responses for 5 minutes.

**What I learned**
- \`fetch\` in a Server Component is cached only when you opt in:

\`\`\`ts
const res = await fetch(url, { next: { revalidate: 300 } });
\`\`\`

**Blockers**
- The contribution graph test is flaky on CI. It passes locally, which suggests a timezone difference.

Want me to save this as an entry? This is a **mock reply**: add \`GEMINI_API_KEY\` or \`ANTHROPIC_API_KEY\` to \`.env.local\` to talk to a real model. Try *"what did I work on last week?"* or *"chart my hours"* to see the tools.`;
