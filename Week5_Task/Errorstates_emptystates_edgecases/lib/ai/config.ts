/**
 * DevLog Assistant — model and prompt configuration.
 *
 * This is the ONE place that decides how DevLog talks to an AI model: which
 * provider, which model, how long replies can be, and the system prompt. The
 * route handler only reads from here.
 *
 * `server-only` makes the build fail if a client component ever imports this
 * file, which is how we guarantee API keys and the prompt never reach the
 * browser.
 */
import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

import { createMockModel } from "@/lib/ai/mock";

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Picked from whichever key is set in the server environment (.env.local
 * locally, project env vars on Vercel). Never prefix a key with NEXT_PUBLIC_,
 * that would put it in the browser bundle.
 *
 *   ANTHROPIC_API_KEY set → Claude (what the brief asks for)
 *   GEMINI_API_KEY set    → Google Gemini (free tier)
 *   neither               → scripted mock model (local development / CHAT_MOCK=1)
 *   CHAT_PROVIDER=…       → force one of anthropic | gemini | mock
 */
export type Provider = "anthropic" | "gemini" | "mock";

export function getProvider(): Provider | null {
  // Explicit choice wins, e.g. CHAT_PROVIDER=mock to demo every tool state without spending tokens.
  const forced = process.env.CHAT_PROVIDER;
  if (forced === "anthropic" || forced === "gemini" || forced === "mock") return forced;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.NODE_ENV !== "production" || process.env.CHAT_MOCK === "1") return "mock";
  return null; // production with no key: a configuration error
}

export const MODEL_IDS = {
  /** Override per environment with ANTHROPIC_MODEL. */
  anthropic: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
  /** Google's alias for their newest Flash model. Override with GEMINI_MODEL. */
  gemini: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  mock: "mock",
} as const;

/** The AI SDK model for a provider. Keys are read from the server env. */
export function getModel(provider: Provider): LanguageModel {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(MODEL_IDS.anthropic);
    case "gemini":
      // The SDK defaults to GOOGLE_GENERATIVE_AI_API_KEY; DevLog has always used GEMINI_API_KEY.
      return createGoogle({ apiKey: process.env.GEMINI_API_KEY })(MODEL_IDS.gemini);
    case "mock":
      return createMockModel();
  }
}

/* -------------------------------------------------------------------------- */
/* Generation settings                                                        */
/* -------------------------------------------------------------------------- */

export const GENERATION = {
  /** Hard ceiling on one model step. A chat answer never needs more. */
  maxOutputTokens: 4096,

  /**
   * Provider-agnostic reasoning effort. Chat is latency-sensitive and "low"
   * keeps time-to-first-token short while still thinking on hard questions.
   * Reasoning streams to the UI as the collapsible "Thought process".
   */
  reasoning: "low" as const,

  /**
   * Max model steps per request. A step is one model call; a tool call and the
   * answer after it are two. 5 leaves room for e.g. query → stats → answer.
   */
  maxSteps: 5,
};

/* -------------------------------------------------------------------------- */
/* Request limits (cost + abuse guard for a public preview URL)               */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  /** Only the most recent N messages are sent to the model. */
  maxMessages: 40,
  /** Max characters in a single user message. */
  maxMessageChars: 8_000,
};

/* -------------------------------------------------------------------------- */
/* System prompt (shared by every provider)                                   */
/* -------------------------------------------------------------------------- */

/**
 * DevLog is a developer progress journal (daily logs, weekly reports, a public
 * portfolio). The assistant is its central AI interaction: it turns messy notes
 * about a day of work into a clean log entry and helps developers reflect.
 *
 * Built per request because the model needs today's date to turn "last week"
 * into a date range.
 */
export function systemPrompt(today: string) {
  return `You are the DevLog Assistant, built into DevLog — a progress journal where developers keep daily log entries, generate weekly reports, and share a public portfolio.

Today is ${today} (YYYY-MM-DD, UTC). Weeks start on Monday.

Your job is to help the developer capture and reflect on their work:
- Turn rough notes ("fixed auth bug, pairing w/ Sam on caching, stuck on flaky test") into a clear daily log entry with sections for what they did, what they learned, and what's blocking them.
- Summarize several days of entries into a weekly progress report when asked.
- Help them think through blockers, next steps, and how to describe their work for a portfolio or stand-up.
- Answer general programming questions briefly when they come up while they're logging.

Tools:
- queryLogs: when they ask what they worked on, or to find entries (by dates, a tag like "react", or a keyword). Convert relative dates ("last week", "yesterday") to YYYY-MM-DD using today's date.
- getLogStats: for trends, totals, "how many hours", or when they ask for a chart.
- saveLogEntry: only when they ask to save or log an entry. They review and approve it before it's saved. Use only facts they gave you; omit hoursSpent unless they said it.
- Fill "reason" with a short phrase like "you asked about last week".
- The app renders every tool result as a card, so don't repeat the entries or numbers in a list. After a tool returns, reply with one to three sentences: the takeaway, a pattern you notice, or a useful next step.
- If a tool fails, say so plainly in one sentence and suggest retrying; don't pretend it worked.
- If they cancel a save, acknowledge it briefly and don't try again unless asked.

Style:
- Be concise and warm, like a thoughtful senior teammate. Prefer short paragraphs and bullet lists.
- Use Markdown. Put code in fenced blocks with a language tag.
- If the notes are too vague to write a useful entry, ask one or two specific follow-up questions instead of inventing details.
- Never make up commits, metrics, or accomplishments the developer didn't mention.`;
}
