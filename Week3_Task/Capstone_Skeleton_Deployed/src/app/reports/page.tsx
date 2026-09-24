import type { Metadata } from "next";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { weeklyReports } from "@/lib/placeholder-data";

export const metadata: Metadata = {
  title: "Weekly reports",
};

export default function ReportsPage() {
  return (
    <Container>
      <PageHeader
        eyebrow="Insights"
        title="Weekly reports"
        description="Summaries of your commits and logs, generated every week."
        action={
          <Button variant="outline" disabled title="Available in a later phase">
            Generate report
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weeklyReports.map((report) => (
          <Card key={report.id} interactive>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {report.week}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-text">
              {report.range}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-control bg-surface-muted p-3">
                <dt className="text-xs text-muted">Commits</dt>
                <dd className="text-xl font-semibold text-text">{report.commits}</dd>
              </div>
              <div className="rounded-control bg-surface-muted p-3">
                <dt className="text-xs text-muted">Log entries</dt>
                <dd className="text-xl font-semibold text-text">{report.logs}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted">{report.highlight}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
