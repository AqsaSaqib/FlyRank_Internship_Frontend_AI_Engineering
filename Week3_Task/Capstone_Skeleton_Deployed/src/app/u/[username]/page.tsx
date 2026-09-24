import type { Metadata } from "next";
import Card from "@/components/Card";
import Container from "@/components/Container";
import { logEntries, stats } from "@/lib/placeholder-data";

export async function generateMetadata({
  params,
}: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${decodeURIComponent(username)}'s portfolio`,
  };
}

export default async function PortfolioPage({
  params,
}: PageProps<"/u/[username]">) {
  const { username } = await params;
  const name = decodeURIComponent(username);
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <Container width="narrow">
      <section className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-on-primary"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="break-all text-2xl font-semibold text-text sm:text-3xl">
            @{name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Public DevLog portfolio · placeholder profile
          </p>
        </div>
      </section>

      <section aria-label="Highlights" className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-text">{stat.value}</p>
          </Card>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text">Recent log entries</h2>
        <ul className="mt-4 space-y-3">
          {logEntries.map((entry) => (
            <li key={entry.id}>
              <Card>
                <time dateTime={entry.date} className="text-xs text-muted">
                  {entry.date}
                </time>
                <h3 className="mt-1 font-semibold text-text">{entry.title}</h3>
                <p className="mt-1 text-sm text-muted">{entry.summary}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
