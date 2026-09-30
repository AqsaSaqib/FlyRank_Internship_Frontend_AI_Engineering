import "server-only";

/**
 * DevLog entries: an in-memory store seeded with realistic sample data.
 *
 * There is no database yet, so this module is the single source of entries for
 * the AI tools. Seed dates are generated relative to today (UTC), so questions
 * like "what did I do last week?" always have answers.
 *
 * Entries saved through `saveLogEntry` live in server memory only: they survive
 * while the server process is warm and reset on a cold start (on Vercel, after
 * a few idle minutes or a redeploy).
 */

export type LogEntry = {
  id: string;
  /** Day the work happened, YYYY-MM-DD. */
  date: string;
  title: string;
  summary: string;
  /** Lower-case tech / topic tags, e.g. "react", "testing". */
  tags: string[];
  /** Not every developer tracks time, so this is often missing. */
  hoursSpent?: number;
};

/** YYYY-MM-DD for a Date, in UTC so server and seed agree. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return isoDate(new Date());
}

/** Add days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

/* -------------------------------------------------------------------------- */
/* Seed                                                                       */
/* -------------------------------------------------------------------------- */

type Seed = Omit<LogEntry, "id" | "date"> & { daysAgo: number };

// Newest first. Weekends are mostly empty, like a real journal.
const SEED: Seed[] = [
  { daysAgo: 0, title: "Tool calling for DevLog Assistant", summary: "Added server-side tools to the chat and started on the result cards.", tags: ["ai", "nextjs", "typescript"], hoursSpent: 3 },
  { daysAgo: 1, title: "Streaming UI polish", summary: "Smoothed the thinking → text handoff and fixed a scroll jump when replies grow.", tags: ["react", "css", "ai"], hoursSpent: 4.5 },
  { daysAgo: 2, title: "Flaky contribution graph test", summary: "Traced the CI-only failure to a timezone assumption; pinned TZ=UTC in the test env.", tags: ["testing", "ci"], hoursSpent: 2 },
  { daysAgo: 3, title: "GitHub OAuth callback", summary: "Finished the OAuth callback route and stored the session in an httpOnly cookie.", tags: ["auth", "nextjs"], hoursSpent: 5 },
  { daysAgo: 4, title: "Code review: caching layer", summary: "Reviewed Sam's PR for caching GitHub responses; suggested a 5 minute revalidate.", tags: ["review", "performance"] },
  { daysAgo: 7, title: "Dark mode tokens", summary: "Moved colors to CSS variables and added a theme toggle with no flash on load.", tags: ["css", "design-system"], hoursSpent: 3.5 },
  { daysAgo: 8, title: "Dashboard layout", summary: "Built the responsive dashboard grid and the weekly summary card.", tags: ["react", "css"], hoursSpent: 6 },
  { daysAgo: 9, title: "Accessibility audit", summary: "Fixed focus order in the composer and added live-region announcements for new messages.", tags: ["a11y", "react"], hoursSpent: 2.5 },
  { daysAgo: 10, title: "Postgres schema draft", summary: "Sketched tables for users, entries and tags; decided on a join table for tags.", tags: ["database", "postgres"], hoursSpent: 2 },
  { daysAgo: 11, title: "Debugged hydration mismatch", summary: "A Date rendered on the server differed on the client; moved it into an effect.", tags: ["nextjs", "react", "debugging"], hoursSpent: 1.5 },
  { daysAgo: 13, title: "Weekend reading: RSC", summary: "Read about Server Components data fetching and wrote notes on caching defaults.", tags: ["learning", "nextjs"] },
  { daysAgo: 14, title: "Vercel preview env vars", summary: "Preview builds failed on a missing env var; documented the setup in the README.", tags: ["devops", "vercel"], hoursSpent: 1 },
  { daysAgo: 15, title: "Form validation with Zod", summary: "Shared one Zod schema between the settings form and the API route.", tags: ["typescript", "zod", "react"], hoursSpent: 4 },
  { daysAgo: 16, title: "Pairing on rate limiting", summary: "Paired with Priya on a token-bucket limiter for the public API.", tags: ["backend", "performance"], hoursSpent: 3 },
  { daysAgo: 17, title: "Storybook setup", summary: "Added Storybook with the design tokens and stories for Button and Card.", tags: ["design-system", "tooling"], hoursSpent: 2.5 },
  { daysAgo: 18, title: "Bug: logout on refresh", summary: "Session cookie had the wrong path; users were logged out after a refresh.", tags: ["auth", "debugging"], hoursSpent: 2 },
  { daysAgo: 21, title: "Playwright smoke tests", summary: "Wrote smoke tests for sign-in and creating an entry; running on every PR.", tags: ["testing", "ci"], hoursSpent: 3.5 },
  { daysAgo: 22, title: "Markdown editor", summary: "Integrated a markdown editor for entries with a live preview.", tags: ["react", "editor"], hoursSpent: 5 },
  { daysAgo: 23, title: "Performance: bundle size", summary: "Cut 80 KB by lazy-loading the chart library and removing moment.js.", tags: ["performance", "tooling"], hoursSpent: 2 },
  { daysAgo: 24, title: "Tags autocomplete", summary: "Built a combobox for tags with keyboard navigation and ARIA roles.", tags: ["a11y", "react"], hoursSpent: 4 },
  { daysAgo: 25, title: "Mentoring session", summary: "Walked a junior dev through git rebase and writing good commit messages.", tags: ["mentoring", "git"] },
  { daysAgo: 28, title: "API route for entries", summary: "CRUD route handlers for entries with input validation and error codes.", tags: ["backend", "nextjs", "zod"], hoursSpent: 4.5 },
  { daysAgo: 29, title: "CI caching", summary: "Cached node_modules and the Next build in CI; pipeline went from 9 to 4 minutes.", tags: ["ci", "devops"], hoursSpent: 1.5 },
  { daysAgo: 30, title: "Portfolio page", summary: "Public portfolio page that lists highlighted entries with OG images.", tags: ["nextjs", "design"], hoursSpent: 3 },
  { daysAgo: 31, title: "Learning: React compiler", summary: "Tried the React compiler on a branch; removed most manual useMemo calls.", tags: ["learning", "react"], hoursSpent: 2 },
  { daysAgo: 32, title: "Error boundaries", summary: "Added route-level error boundaries with a retry button and friendly copy.", tags: ["react", "ux"], hoursSpent: 2.5 },
  { daysAgo: 35, title: "Project kickoff", summary: "Set up the Next.js app, Tailwind, ESLint and the first deploy to Vercel.", tags: ["nextjs", "tooling", "vercel"], hoursSpent: 3 },
];

function seedEntries(): LogEntry[] {
  const today = todayIso();
  return SEED.map(({ daysAgo, ...rest }, i) => ({
    id: `log_${String(SEED.length - i).padStart(3, "0")}`,
    date: addDays(today, -daysAgo),
    ...rest,
  }));
}

// Kept on globalThis so Next's dev hot reload doesn't wipe saved entries.
const store = globalThis as typeof globalThis & { __devlogEntries?: LogEntry[] };

/** All entries, newest first. */
export function listEntries(): LogEntry[] {
  store.__devlogEntries ??= seedEntries();
  return [...store.__devlogEntries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function addEntry(entry: Omit<LogEntry, "id">): LogEntry {
  store.__devlogEntries ??= seedEntries();
  const saved: LogEntry = { id: `log_${crypto.randomUUID().slice(0, 8)}`, ...entry };
  store.__devlogEntries.push(saved);
  return saved;
}
