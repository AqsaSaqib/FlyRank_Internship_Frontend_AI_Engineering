"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TIMING } from "./motion";

/**
 * The async lifecycle as a small state machine:
 *
 *   idle ──run──▶ loading ──resolve──▶ success ──(hold)──▶ idle
 *                    │
 *                    └──reject──▶ error ──run (Retry)──▶ loading
 *
 * Hover, focus and press are not here. They are CSS states on top of this.
 */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type IgnoreReason = "loading" | "success";

type Options = {
  /** Multiplies the min-loading and success-hold timers (slow-mo). Default 1. */
  timeScale?: number;
  minLoadingMs?: number;
  successHoldMs?: number;
  onTransition?: (from: AsyncStatus, to: AsyncStatus) => void;
  onIgnored?: (reason: IgnoreReason) => void;
};

export function useAsyncAction(action: () => Promise<unknown>, options: Options = {}) {
  const [status, setStatus] = useState<AsyncStatus>("idle");

  // The ref is the source of truth for guards: it updates synchronously, so
  // two clicks in the same tick can't both start a request.
  const statusRef = useRef<AsyncStatus>("idle");
  const requestId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const mounted = useRef(false);

  // Always call the latest action/options without re-creating run().
  const latest = useRef({ action, options });
  useEffect(() => {
    latest.current = { action, options };
  });

  useEffect(() => {
    mounted.current = true;
    const pending = timers.current;
    return () => {
      mounted.current = false;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const transition = useCallback((next: AsyncStatus) => {
    const prev = statusRef.current;
    if (prev === next) return;
    statusRef.current = next;
    setStatus(next);
    latest.current.options.onTransition?.(prev, next);
  }, []);

  const wait = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        if (ms <= 0) return resolve();
        const id = setTimeout(() => {
          timers.current.delete(id);
          resolve();
        }, ms);
        timers.current.add(id);
      }),
    [],
  );

  const run = useCallback(async () => {
    const current = statusRef.current;
    if (current === "loading" || current === "success") {
      latest.current.options.onIgnored?.(current);
      return;
    }

    const id = ++requestId.current;
    const { action, options } = latest.current;
    const scale = options.timeScale ?? 1;
    const minLoading = (options.minLoadingMs ?? TIMING.minLoading) * scale;
    const successHold = (options.successHoldMs ?? TIMING.successHold) * scale;

    transition("loading");
    const started = performance.now();

    let ok = true;
    try {
      await action();
    } catch {
      ok = false;
    }

    // Don't let a fast response flash the spinner.
    await wait(minLoading - (performance.now() - started));

    // A newer request (or a reset, or unmount) owns the button now.
    if (!mounted.current || id !== requestId.current) return;

    if (!ok) {
      // Error stays until the user clicks Retry: going back to "Send" by
      // itself would hide the failure.
      transition("error");
      return;
    }

    transition("success");
    await wait(successHold);
    if (mounted.current && id === requestId.current) transition("idle");
  }, [transition, wait]);

  /** Back to idle. Any request still in flight becomes stale and is ignored. */
  const reset = useCallback(() => {
    requestId.current++;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    transition("idle");
  }, [transition]);

  return { status, run, reset };
}
