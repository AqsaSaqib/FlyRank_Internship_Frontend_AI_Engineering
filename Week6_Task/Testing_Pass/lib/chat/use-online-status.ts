"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * `navigator.onLine`, kept current by the online/offline events.
 *
 * `false` is reliable (there's definitely no network); `true` only means
 * "connected to something", so requests can still fail and are handled as
 * network errors. The server snapshot is `true` so SSR never renders the
 * offline banner.
 */
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
