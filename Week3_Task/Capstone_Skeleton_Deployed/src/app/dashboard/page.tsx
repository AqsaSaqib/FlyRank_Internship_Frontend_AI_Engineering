import type { Metadata } from "next";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Container from "@/components/Container";
import ContributionGraph from "@/components/ContributionGraph";
import Icon, { type IconName } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { recentActivity, stats, type Activity } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statIcons: IconName[] = ["commit", "book", "repo", "report"];

const activityStyle: Record<Activity["type"], { icon: IconName; className: string }> = {
  commit: { icon: "commit", className: "bg-primary-soft text-primary" },
  log: { icon: "pen", className: "bg-secondary-soft text-secondary" },
  report: { icon: "report", className: "bg-accent-soft text-accent" },
};

export default function DashboardPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Your week at a glance. Showing placeholder data until GitHub is connected."
        action={
          <Button href="/logs/new">
            <Icon name="pen" className="h-4 w-4" />
            New log entry
          </Button>
        }
      />

      <section aria-label="Stats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{stat.label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-control bg-surface-muted text-muted">
                <Icon name={statIcons[index]} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-text">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium text-success">{stat.change}</p>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          title="Contribution activity"
          description="Last 20 weeks of commits and logs."
          className="lg:col-span-2"
        >
          <ContributionGraph />
        </Card>
        <Card className="flex flex-col justify-between bg-gradient-to-br from-primary-soft to-surface">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-accent-soft text-accent">
              <Icon name="flame" />
            </span>
            <p className="mt-4 text-sm font-medium text-muted">Current streak</p>
            <p className="text-4xl font-semibold tracking-tight text-text">
              12 days
            </p>
          </div>
          <p className="mt-6 text-sm text-muted">
            Longest streak: <span className="font-medium text-text">21 days</span>
          </p>
        </Card>
      </section>

      <section className="mt-6">
        <Card
          title="Recent activity"
          description="Commits, logs, and reports."
          action={
            <Button href="/logs" variant="ghost" size="sm">
              View all
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          }
        >
          <ul className="-my-2 divide-y divide-border">
            {recentActivity.map((item) => {
              const style = activityStyle[item.type];
              return (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.className}`}
                  >
                    <Icon name={style.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-text">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.repo && (
                        <span className="font-mono">{item.repo} · </span>
                      )}
                      {item.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </Container>
  );
}
