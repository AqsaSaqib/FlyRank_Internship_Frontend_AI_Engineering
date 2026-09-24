// Placeholder data for Phase 1. Replaced by real data sources in later phases.

export type Stat = {
  label: string;
  value: string;
  change: string;
};

export type Activity = {
  id: string;
  type: "commit" | "log" | "report";
  title: string;
  repo?: string;
  time: string;
};

export type LogEntry = {
  id: string;
  date: string;
  title: string;
  summary: string;
  mood: "Productive" | "Steady" | "Blocked";
  tags: string[];
};

export type WeeklyReport = {
  id: string;
  week: string;
  range: string;
  commits: number;
  logs: number;
  highlight: string;
};

export const stats: Stat[] = [
  { label: "Commits this week", value: "42", change: "+12% vs last week" },
  { label: "Log entries", value: "5", change: "5-day streak" },
  { label: "Active repos", value: "3", change: "+1 new this week" },
  { label: "Reports generated", value: "8", change: "Last: Sunday" },
];

export const recentActivity: Activity[] = [
  {
    id: "a1",
    type: "commit",
    title: "feat: add responsive navbar with mobile menu",
    repo: "devlog",
    time: "2 hours ago",
  },
  {
    id: "a2",
    type: "log",
    title: "Wrote daily log: Finished Phase 1 routing",
    time: "5 hours ago",
  },
  {
    id: "a3",
    type: "commit",
    title: "fix: handle failed GitHub fetch on health page",
    repo: "devlog",
    time: "Yesterday",
  },
  {
    id: "a4",
    type: "report",
    title: "Generated weekly report for Week 38",
    time: "2 days ago",
  },
  {
    id: "a5",
    type: "commit",
    title: "chore: configure Tailwind design tokens",
    repo: "portfolio-site",
    time: "3 days ago",
  },
];

export const logEntries: LogEntry[] = [
  {
    id: "l1",
    date: "2026-09-23",
    title: "Finished Phase 1 routing",
    summary:
      "Set up every placeholder route, shared layout, and the health check page. Next up: authentication.",
    mood: "Productive",
    tags: ["nextjs", "routing"],
  },
  {
    id: "l2",
    date: "2026-09-22",
    title: "Design tokens and components",
    summary:
      "Defined colors, fonts, and radius in globals.css with @theme and built Card, Button, and PageHeader.",
    mood: "Steady",
    tags: ["tailwind", "design-system"],
  },
  {
    id: "l3",
    date: "2026-09-21",
    title: "Stuck on mobile menu focus",
    summary:
      "Spent time on keyboard handling for the hamburger menu. Escape now closes it; focus trap still to do.",
    mood: "Blocked",
    tags: ["a11y"],
  },
];

export const weeklyReports: WeeklyReport[] = [
  {
    id: "r38",
    week: "Week 38",
    range: "Sep 14 – Sep 20, 2026",
    commits: 37,
    logs: 5,
    highlight: "Shipped the capstone skeleton and deployed to Vercel.",
  },
  {
    id: "r37",
    week: "Week 37",
    range: "Sep 7 – Sep 13, 2026",
    commits: 29,
    logs: 4,
    highlight: "Built a settings form with validation in Week 2 tasks.",
  },
  {
    id: "r36",
    week: "Week 36",
    range: "Aug 31 – Sep 6, 2026",
    commits: 18,
    logs: 3,
    highlight: "Learned App Router fundamentals and Server Components.",
  },
];
