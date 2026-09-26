import { Icon } from "./icons";

const SUGGESTIONS = [
  {
    title: "Turn notes into a log entry",
    prompt:
      "Turn these notes into today's log entry: fixed the logout-on-refresh bug, paired with Sam on caching GitHub responses, contribution graph test is flaky on CI but fine locally.",
  },
  {
    title: "Draft a weekly report",
    prompt:
      "Draft a short weekly progress report. This week I shipped the dashboard layout, added dark mode, and started on GitHub OAuth. Next week: finish auth and saving log entries.",
  },
  {
    title: "Explain a blocker for stand-up",
    prompt:
      "Help me explain this blocker in two sentences for stand-up: our Vercel preview builds fail because an env var is missing, and I don't have access to the project settings.",
  },
  {
    title: "Ask a quick coding question",
    prompt: "What's the difference between a Server Component and a Client Component in Next.js? Keep it short, with an example.",
  },
];

export function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex animate-message-in flex-col items-center pt-6 text-center sm:pt-12">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon name="sparkle" className="size-6" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">What did you work on today?</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Paste rough notes and I&apos;ll turn them into a clean DevLog entry. I can also draft weekly
        reports or help you explain a blocker.
      </p>
      <ul className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onPick(s.prompt)}
              className="h-full w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/50 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="block text-sm font-medium">{s.title}</span>
              <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{s.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
