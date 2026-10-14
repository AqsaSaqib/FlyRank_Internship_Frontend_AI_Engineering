import { EmptyState } from "@/components/EmptyState";
import { Icon, type IconName } from "./icons";

export const EXAMPLE_PROMPTS: { icon: IconName; title: string; prompt: string }[] = [
  { icon: "search", title: "Summarize my week", prompt: "Summarize what I logged this week" },
  { icon: "pen", title: "Write today's entry", prompt: "Help me write today's log entry" },
  { icon: "sparkle", title: "Plan tomorrow", prompt: "What should I focus on tomorrow?" },
  { icon: "chart", title: "Chart my time", prompt: "Chart my hours this month" },
];

/**
 * First run / new chat. Examples fill the composer and focus it; they never
 * auto-send, so the user can edit before anything happens.
 */
export function ChatWelcome({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <EmptyState
      icon="sparkle"
      title="What did you work on today?"
      description="I turn rough notes into clean DevLog entries, search and chart your past logs, and help you plan what's next."
      className="pt-6 sm:pt-12"
    >
      <ul aria-label="Example prompts" className="grid w-full gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((s) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onPick(s.prompt)}
              className="flex h-full min-h-11 w-full items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/50 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name={s.icon} className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">&ldquo;{s.prompt}&rdquo;</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </EmptyState>
  );
}
