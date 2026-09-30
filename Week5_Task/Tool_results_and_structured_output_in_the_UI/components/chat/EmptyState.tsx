import { Icon } from "./icons";

const SUGGESTIONS = [
  {
    title: "Search your logs",
    prompt: "What did I work on last week?",
  },
  {
    title: "Chart your time",
    prompt: "Show me a chart of my hours over the last 4 weeks.",
  },
  {
    title: "Save an entry (asks first)",
    prompt: "Save this entry: fixed the flaky contribution graph test by pinning TZ=UTC in CI, testing, 2h",
  },
  {
    title: "Turn notes into a log entry",
    prompt:
      "Turn these notes into today's log entry: fixed the logout-on-refresh bug, paired with Sam on caching GitHub responses, contribution graph test is flaky on CI but fine locally.",
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
        Paste rough notes and I&apos;ll turn them into a clean DevLog entry. I can also search your
        logs, chart where your time went, and save entries once you approve them.
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
