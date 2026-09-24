import type { Metadata } from "next";
import Card from "@/components/Card";
import Container from "@/components/Container";
import LogEntryForm from "@/components/LogEntryForm";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "New log entry",
};

export default function NewLogPage() {
  return (
    <Container width="narrow">
      <PageHeader
        eyebrow="Journal"
        title="New log entry"
        description="Capture today's progress. Saving is enabled in Phase 2."
      />
      <Card>
        <LogEntryForm />
      </Card>
    </Container>
  );
}
