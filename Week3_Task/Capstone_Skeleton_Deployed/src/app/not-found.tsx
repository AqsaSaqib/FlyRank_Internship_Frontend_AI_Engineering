import type { Metadata } from "next";
import Button from "@/components/Button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-text sm:text-3xl">
        This page isn&apos;t in the log
      </h1>
      <p className="mt-3 text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button href="/">Back to home</Button>
        <Button href="/dashboard" variant="outline">
          Open dashboard
        </Button>
      </div>
    </div>
  );
}
