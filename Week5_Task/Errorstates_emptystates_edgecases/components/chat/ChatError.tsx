"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { isRetryable, parseChatError, type ChatErrorCode } from "@/lib/chat/errors";
import { Icon, type IconName } from "./icons";
import { RetryButton } from "./RetryButton";

type Props = {
  error: Error;
  online: boolean;
  /** A request is in flight (status submitted/streaming): retry must wait. */
  busy: boolean;
  /** Some of the reply streamed before the failure and is still shown above. */
  partial: boolean;
  onRetry: () => Promise<void>;
};

const COPY: Record<ChatErrorCode, { icon: IconName; title: string; detail: string }> = {
  rate_limited: { icon: "clock", title: "Too many requests", detail: "The AI provider asked us to slow down." },
  quota_exceeded: {
    icon: "clock",
    title: "AI limit reached",
    detail: "The assistant has used up its AI quota for now. It resets automatically, so please try again later.",
  },
  overloaded: { icon: "clock", title: "The AI model is busy", detail: "This usually clears up in a few seconds." },
  offline: { icon: "wifiOff", title: "You're offline", detail: "Reconnect to retry. Your conversation is saved." },
  network: { icon: "wifiOff", title: "Connection lost", detail: "The reply was cut off before it finished." },
  unknown: { icon: "alert", title: "Something went wrong", detail: "The reply couldn't be finished." },
  empty_input: { icon: "alert", title: "Nothing to send", detail: "Type a message first." },
  invalid_request: { icon: "alert", title: "Couldn't send that", detail: "Try starting a new chat." },
  too_long: { icon: "alert", title: "Message too long", detail: "Shorten it and send again." },
};

/**
 * The inline error under a failed reply: what happened in one line, what to
 * do next, and a Retry that re-runs only the last assistant response.
 *
 * Accessibility: the message is a `role="alert"` region (announced once).
 * The live countdown sits outside it so it isn't re-announced every second.
 * If focus isn't somewhere the user is working (e.g. the composer), it moves
 * to Retry so keyboard users land on the way forward.
 */
export function ChatError({ error, online, busy, partial, onRetry }: Props) {
  const info = parseChatError(error, online);
  const copy = COPY[info.code];
  const retryAfter = useCountdown(info.code === "rate_limited" ? (info.retryAfter ?? 0) : 0);
  const retryRef = useRef<HTMLButtonElement>(null);
  const retryable = isRetryable(info.code);

  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body) retryRef.current?.focus({ preventScroll: true });
  }, []);

  // 400-class errors carry the server's specific message; transient ones use our copy.
  const detail = !retryable && info.message ? info.message : detailFor(info.code, copy.detail, retryAfter, !!info.retryAfter, online);

  return (
    <Notice icon={copy.icon} className="mt-3">
      <div role="alert" className="min-w-0">
        <p className="text-sm font-medium">{copy.title}</p>
        <p className="text-sm text-muted-foreground">
          {detail}
          {partial && " The partial reply above is kept."}
        </p>
      </div>
      {retryable && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <RetryButton
            ref={retryRef}
            onRetry={onRetry}
            disabled={busy || !online || retryAfter > 0}
            waitLabel={retryAfter > 0 ? `${retryAfter}s` : undefined}
          />
          {!online && <span className="text-xs text-muted-foreground">Waiting for a connection…</span>}
        </div>
      )}
    </Notice>
  );
}

function detailFor(
  code: ChatErrorCode,
  fallback: string,
  secondsLeft: number,
  hadRetryAfter: boolean,
  online: boolean,
): ReactNode {
  if (code === "rate_limited") {
    if (!hadRetryAfter) return "Wait a moment, then try again.";
    if (secondsLeft <= 0) return "You can try again now.";
    return (
      <>
        Try again in{" "}
        {/* Ticks visibly; screen readers get one stable sentence instead of a count every second. */}
        <span aria-hidden="true" className="tabular-nums">
          {secondsLeft}s
        </span>
        <span className="sr-only">a few seconds</span>.
      </>
    );
  }
  // The connection dropped mid-reply but is back now.
  if (code === "network" && online) return `${fallback} You're connected, so you can retry.`;
  return fallback;
}

/** Seconds left, ticking down once a second from `seconds` (fixed at mount). */
function useCountdown(seconds: number) {
  const [endsAt] = useState(() => Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(next);
      if (next === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [endsAt, seconds]);

  return left;
}

/**
 * The calm container shared by ChatError and EmptyReply: a neutral card with
 * a small tinted icon, fading in over 200ms (instant with reduced motion).
 */
export function Notice({
  icon,
  tone = "danger",
  className = "",
  children,
}: {
  icon: IconName;
  tone?: "danger" | "muted";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex animate-notice-in items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${
          tone === "danger" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon name={icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
