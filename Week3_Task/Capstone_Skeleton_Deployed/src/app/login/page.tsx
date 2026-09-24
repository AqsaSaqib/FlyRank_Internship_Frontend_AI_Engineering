import type { Metadata } from "next";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="relative isolate flex flex-1 items-center justify-center px-4 py-16">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10" />
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-lifted sm:p-10">
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-primary-soft text-primary">
              <Icon name="user" className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-text">
              Welcome to DevLog
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to keep your streak going.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <Button href="/dashboard" size="lg" className="w-full">
              <Icon name="commit" className="h-5 w-5" />
              Continue with GitHub
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              Phase 1 preview
              <span className="h-px flex-1 bg-border" />
            </div>
            <p className="text-center text-xs leading-relaxed text-muted">
              Authentication arrives in Phase 2. For now, this button opens the
              demo dashboard.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
