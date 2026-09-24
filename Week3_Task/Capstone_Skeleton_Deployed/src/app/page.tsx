import Button from "@/components/Button";
import Card from "@/components/Card";
import ContributionGraph from "@/components/ContributionGraph";
import Icon, { type IconName } from "@/components/Icon";

const features: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "commit",
    title: "GitHub activity",
    description:
      "Connect your username and see recent commits right next to your notes.",
  },
  {
    icon: "pen",
    title: "Daily logs",
    description:
      "Two minutes a day: what you shipped, what blocked you, what you learned.",
  },
  {
    icon: "report",
    title: "Weekly reports",
    description:
      "Turn a week of commits and logs into a clean summary in one click.",
  },
  {
    icon: "globe",
    title: "Public portfolio",
    description:
      "Share /u/your-name to show recruiters consistency, not just a résumé.",
  },
];

const steps = [
  {
    title: "Connect GitHub",
    description: "Add your GitHub username. No tokens or passwords needed.",
  },
  {
    title: "Log your day",
    description: "Write a short entry. DevLog links it to that day's commits.",
  },
  {
    title: "Share your progress",
    description: "Generate weekly reports and publish your portfolio page.",
  },
];

function ProductPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-secondary/10 to-transparent blur-2xl"
      />
      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lifted">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted/30" />
          <span className="ml-3 truncate font-mono text-xs text-muted">
            devlog.app/dashboard
          </span>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Commits", value: "42" },
              { label: "Streak", value: "12d" },
              { label: "Repos", value: "3" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-control border border-border p-3"
              >
                <p className="text-[11px] text-muted">{stat.label}</p>
                <p className="text-lg font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
          <ContributionGraph weeks={18} seed={11} showLegend={false} />
          <div className="flex items-start gap-3 rounded-control bg-surface-muted p-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">
                Shipped the responsive navbar
              </p>
              <p className="truncate font-mono text-xs text-muted">
                feat: add mobile menu · devlog
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10" />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 h-80 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              A progress journal for developers
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-text sm:text-5xl lg:text-6xl">
              Your code tells a story.{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DevLog writes it down.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg lg:mx-0">
              Pair your GitHub commits with short daily notes, then turn them
              into weekly reports and a public portfolio that shows how you
              grow.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Button href="/login" size="lg">
                Start your log
                <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
              <Button href="/dashboard" size="lg" variant="outline">
                View live demo
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted lg:justify-start">
              {["Free to start", "Public GitHub only", "No API keys"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Icon name="check" className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Everything you need to show your progress
          </h2>
          <p className="mt-4 text-muted">
            Built for bootcamp grads, interns, and anyone learning in public.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} interactive>
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-primary">
                <Icon name={feature.icon} />
              </span>
              <h3 className="mt-5 font-semibold text-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            How it works
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary-soft font-mono text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-emerald-500/30 blur-3xl"
          />
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start your streak today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Two minutes a day. Future you, and future employers, will thank
            you.
          </p>
          <div className="mt-8">
            <Button
              href="/login"
              size="lg"
              variant="inverse"
              className="w-full sm:w-auto"
            >
              Create your DevLog
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
