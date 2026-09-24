"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Button from "@/components/Button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-danger">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-text">
        This page hit an unexpected error
      </h1>
      <p className="mt-3 text-muted">
        Try again, or head back to the dashboard.
        {error.digest && (
          <span className="mt-2 block break-all font-mono text-xs">
            Reference: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button onClick={() => retry()}>Try again</Button>
        <Button href="/dashboard" variant="outline">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
