import type { Metadata } from "next";
import Card from "@/components/Card";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import SettingsForm from "@/components/SettingsForm";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  const defaultGithubUser = process.env.NEXT_PUBLIC_DEFAULT_GITHUB_USER ?? "";

  return (
    <Container width="narrow">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile and the GitHub account DevLog reads from."
      />
      <Card>
        <SettingsForm defaultGithubUser={defaultGithubUser} />
      </Card>
    </Container>
  );
}
