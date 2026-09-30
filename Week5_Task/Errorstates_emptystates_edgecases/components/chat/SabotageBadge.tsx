"use client";

import { useEffect, useSyncExternalStore } from "react";

import { parseSabotage, type SabotageMode } from "@/lib/sabotage";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};
const getMode = () => parseSabotage(new URLSearchParams(window.location.search).get("sabotage"));

/** The active sabotage mode from ?sabotage=, or null (always null unless sabotage is enabled). */
export function useSabotageMode(): SabotageMode | null {
  return useSyncExternalStore(subscribe, getMode, () => null);
}

const HINTS: Partial<Record<SabotageMode, string>> = {
  crash: "the chat crashes once on load",
};

/**
 * Makes test mode obvious (and honest) in a recording: which failure is
 * armed and what triggers it. Renders nothing when sabotage is off.
 */
export function SabotageBadge({ mode }: { mode: SabotageMode | null }) {
  if (!mode) return null;
  return (
    <p className="mb-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
      <span className="rounded-full border border-dashed border-border px-2 py-0.5 font-mono">sabotage={mode}</span>
      <span>{HINTS[mode] ?? "applies to your next message; Retry is clean"}</span>
    </p>
  );
}

let crashedOnce = false;

/**
 * `?sabotage=crash`: throws once, from an effect, so the (chat) error.tsx
 * boundary catches it. "Try again" re-renders without the crash, which shows
 * the recovery; a full reload crashes again.
 */
export function CrashOnce() {
  useEffect(() => {
    if (crashedOnce) return;
    crashedOnce = true;
    throw new Error("Sabotage: the chat crashed while rendering.");
  }, []);
  return null;
}
