"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";

import { Icon } from "@/components/chat/icons";
import { STATUS_TITLE_ID, StatusCard, primaryAction, secondaryAction } from "@/components/StatusCard";

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
  title?: string;
  message?: string;
  /** Plain <a> for global-error, where the app's router may be what broke. */
  hardHomeLink?: boolean;
};

/**
 * Shared body of every error.tsx: a designed card with "Try again" and a
 * link home. `retry()` (Next 16.3+) re-fetches and re-renders the segment,
 * which also recovers from server-side failures, unlike `reset()`.
 */
export function RouteError({
  error,
  retry,
  title = "Something went wrong",
  message = "This page hit an unexpected error. Trying again usually fixes it.",
  hardHomeLink = false,
}: Props) {
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // The message and digest are enough to find it in the logs; the user never sees the stack.
    console.error("[route error]", error.digest ?? "", error.message);
    document.getElementById(STATUS_TITLE_ID)?.focus();
  }, [error]);

  const homeContent = (
    <>
      <Icon name="home" className="size-4" />
      Back to DevLog
    </>
  );

  return (
    <StatusCard icon="alert" title={title} message={message} digest={error.digest}>
      {hardHomeLink ? (
        // Full navigation on purpose: global-error means the app shell itself failed.
        // eslint-disable-next-line @next/next/no-html-link-for-pages
        <a href="/" className={secondaryAction}>
          {homeContent}
        </a>
      ) : (
        <Link href="/" className={secondaryAction}>
          {homeContent}
        </Link>
      )}
      <button
        type="button"
        onClick={() => startTransition(() => retry())}
        disabled={pending}
        className={`${primaryAction} disabled:opacity-70`}
      >
        <Icon name="refresh" className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Trying again…" : "Try again"}
      </button>
    </StatusCard>
  );
}
