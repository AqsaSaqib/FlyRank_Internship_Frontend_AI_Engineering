"use client"; // Error boundaries must be Client Components

import { RouteError } from "@/components/RouteError";

/** Any page outside the chat (logs, tool states) that fails to render. */
export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      {...props}
      title="This page didn't load"
      message="Something went wrong on our side while loading it. Your logs are safe, so try again or head back to the assistant."
    />
  );
}
