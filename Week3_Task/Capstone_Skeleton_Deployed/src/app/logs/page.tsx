import type { Metadata } from "next";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { logEntries, type LogEntry } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Daily logs",
};

const moodStyles: Record<LogEntry["mood"], string> = {
  Productive: "bg-success-soft text-success",
  Steady: "bg-primary-soft text-primary",
  Blocked: "bg-accent-soft text-accent",
};

export default function LogsPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Journal"
        title="Daily logs"
        description="A running journal of what you worked on each day."
        action={<Button href="/logs/new">New entry</Button>}
      />

      <ul className="space-y-4">
        {logEntries.map((entry) => (
          <li key={entry.id}>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time dateTime={entry.date} className="text-sm text-muted">
                  {entry.date}
                </time>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${moodStyles[entry.mood]}`}
                >
                  {entry.mood}
                </span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-text">
                {entry.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{entry.summary}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-control border border-border px-2 py-0.5 font-mono text-xs text-muted"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  );
}
