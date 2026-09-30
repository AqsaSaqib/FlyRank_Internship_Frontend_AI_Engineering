"use client"; // Error boundaries must be Client Components

import { RouteError } from "@/components/RouteError";

/**
 * The chat itself crashed while rendering. Stream and request failures never
 * get here (they're handled inline by ChatError); this is for bugs.
 */
export default function ChatRouteError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      {...props}
      title="The assistant hit a snag"
      message="Your conversation is saved in this browser. Try again to reload the chat."
    />
  );
}
