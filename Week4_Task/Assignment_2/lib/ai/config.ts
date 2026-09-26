/**
 * DevLog Assistant — model and prompt configuration.
 *
 * This is the ONE place that decides how DevLog talks to an AI model: which
 * provider, which model, how long replies can be, and the system prompt. The
 * route handler and the provider files only read from here.
 *
 * `server-only` makes the build fail if a client component ever imports this
 * file, which is how we guarantee API keys and the prompt never reach the
 * browser.
 */
import "server-only";

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
 *   neither               → mock reply (local development / CHAT_MOCK=1)
 */
export type Provider = "anthropic" | "gemini" | "mock";

export function getProvider(): Provider | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.NODE_ENV !== "production" || process.env.CHAT_MOCK === "1") return "mock";
  return null; // production with no key: a configuration error
}

/* -------------------------------------------------------------------------- */
/* Claude (Anthropic)                                                         */
/* -------------------------------------------------------------------------- */

export const CLAUDE_CONFIG = {
  /** Override per environment with ANTHROPIC_MODEL. */
  model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",

  /** Hard ceiling on one reply. A chat answer never needs more. */
  maxTokens: 4096,

  /**
   * How hard the model thinks before answering. Chat is latency-sensitive and
   * "low" keeps time-to-first-token short while still thinking on hard
   * questions. Raise to "medium"/"high" for heavier features (FE-07).
   */
  effort: "low" as const,

  /**
   * Adaptive thinking lets Claude decide when to reason. "summarized" streams a
   * readable summary, shown in the UI as a collapsible "Thought process".
   */
  thinking: { type: "adaptive", display: "summarized" } as const,

  /**
   * Server-side fallback: if Claude's safety classifiers decline a request,
   * the API retries on a fallback model inside the same stream.
   */
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default" as const,
};

/* -------------------------------------------------------------------------- */
/* Gemini (Google)                                                            */
/* -------------------------------------------------------------------------- */

export const GEMINI_CONFIG = {
  /**
   * Tried in order. The free tier sometimes answers "503: high demand" or
   * "429: rate limited"; when that happens before any text has streamed, the
   * next model is tried. Override the first one with GEMINI_MODEL.
   *
   * "gemini-flash-latest" is Google's alias for their newest Flash model.
   */
  models: [
    process.env.GEMINI_MODEL ?? "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
  ],

  /** Hard ceiling on one reply (includes thinking tokens on Gemini). */
  maxOutputTokens: 8192,

  /**
   * Gemini 3+ models: think a little before answering. "LOW" keeps the first
   * token quick. (Gemini 2.5 models ignore this and use their default.)
   */
  thinkingLevel: "LOW" as const,

  /** Stream a summary of the model's thinking for the "Thought process" part. */
  includeThoughts: true,
};

/* -------------------------------------------------------------------------- */
/* Request limits (cost + abuse guard for a public preview URL)               */
/* -------------------------------------------------------------------------- */

export const LIMITS = {
  /** Only the most recent N turns are sent to the model. */
  maxMessages: 40,
  /** Max characters in a single message. */
  maxMessageChars: 8_000,
};

/* -------------------------------------------------------------------------- */
/* System prompt (shared by every provider)                                   */
/* -------------------------------------------------------------------------- */

/**
 * DevLog is a developer progress journal (daily logs, weekly reports, a public
 * portfolio). The assistant is its central AI interaction: it turns messy notes
 * about a day of work into a clean log entry and helps developers reflect.
 */
export const SYSTEM_PROMPT = `You are the DevLog Assistant, built into DevLog — a progress journal where developers keep daily log entries, generate weekly reports, and share a public portfolio.

Your job is to help the developer capture and reflect on their work:
- Turn rough notes ("fixed auth bug, pairing w/ Sam on caching, stuck on flaky test") into a clear daily log entry with sections for what they did, what they learned, and what's blocking them.
- Summarize several days of entries into a weekly progress report when asked.
- Help them think through blockers, next steps, and how to describe their work for a portfolio or stand-up.
- Answer general programming questions briefly when they come up while they're logging.

Style:
- Be concise and warm, like a thoughtful senior teammate. Prefer short paragraphs and bullet lists.
- Use Markdown. Put code in fenced blocks with a language tag.
- If the notes are too vague to write a useful entry, ask one or two specific follow-up questions instead of inventing details.
- Never make up commits, metrics, or accomplishments the developer didn't mention.`;
