import type { Metadata } from "next";
import Link from "next/link";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { Icon } from "@/components/chat/icons";
import { EmptyState } from "@/components/EmptyState";
import { primaryAction, secondaryAction } from "@/components/StatusCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatHours, formatWeekday, plural } from "@/components/tools/format";
import { listEntries, type LogEntry } from "@/lib/devlog/entries";
import { parseSabotage } from "@/lib/sabotage";

export const metadata: Metadata = {
  title: "Your logs · DevLog",
  description: "Every DevLog entry, newest first.",
};

/** Where "create your first entry" CTAs go: the assistant, with the composer pre-filled. */
const WRITE_ENTRY_HREF = `/?prompt=${encodeURIComponent("Help me write today's log entry")}`;

export default async function LogsPage({ searchParams }: PageProps<"/logs">) {
  const params = await searchParams;
  const tag = typeof params.tag === "string" ? params.tag.trim().toLowerCase() : undefined;

  // Dev/preview only: ?sabotage=crash → app/error.tsx, ?sabotage=nologs → the first-run empty state.
  const sabotage = parseSabotage(params.sabotage);
  if (sabotage === "crash") throw new Error("Sabotage: the logs page crashed while rendering.");

  const all = sabotage === "nologs" ? [] : listEntries();
  const entries = tag ? all.filter((e) => e.tags.includes(tag)) : all;

  return (
    <div className="min-h-app">
      <ChatHeader>
        <ThemeToggle />
      </ChatHeader>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">{tag ? `Logs tagged “${tag}”` : "Your logs"}</h1>
            {entries.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">{plural(entries.length, "entry", "entries")}, newest first</p>
            )}
          </div>
          {entries.length > 0 && (
            <Link href={WRITE_ENTRY_HREF} className={`${primaryAction} h-10`}>
              <Icon name="pen" className="size-4" />
              New entry
            </Link>
          )}
        </div>

        {all.length === 0 ? (
          <EmptyState
            icon="book"
            title="No logs yet"
            description="Your DevLog fills up one day at a time. Tell the assistant what you worked on and it'll turn your notes into your first entry."
            className="mt-16"
          >
            <Link href={WRITE_ENTRY_HREF} className={primaryAction}>
              <Icon name="pen" className="size-4" />
              Write your first entry
            </Link>
          </EmptyState>
        ) : entries.length === 0 ? (
          <EmptyState
            icon="tag"
            title={`Nothing tagged “${tag}” yet`}
            description="Log some work with this tag, or look through everything you've logged."
            className="mt-16"
          >
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Link href="/logs" className={secondaryAction}>
                Show all logs
              </Link>
              <Link href={WRITE_ENTRY_HREF} className={primaryAction}>
                <Icon name="pen" className="size-4" />
                Write an entry
              </Link>
            </div>
          </EmptyState>
        ) : (
          <ol className="mt-6 flex flex-col gap-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}

function EntryCard({ entry }: { entry: LogEntry }) {
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="min-w-0 text-[15px] font-medium">{entry.title}</h2>
        <p className="shrink-0 text-xs text-muted-foreground">
          <time dateTime={entry.date}>{formatWeekday(entry.date)}</time>
          {entry.hoursSpent != null && ` · ${formatHours(entry.hoursSpent)}`}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
      {entry.tags.length > 0 && (
        <ul aria-label="Tags" className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <li key={t}>
              <Link
                href={`/logs?tag=${encodeURIComponent(t)}`}
                className="tap-target inline-flex min-h-7 items-center rounded-full border border-border bg-background px-2.5 text-xs transition-colors hover:border-primary/50 hover:bg-primary-soft/50 focus-visible:outline-2 focus-visible:outline-primary"
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
