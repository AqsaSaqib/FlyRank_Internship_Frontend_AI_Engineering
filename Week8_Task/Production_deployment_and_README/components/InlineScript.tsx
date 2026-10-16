"use client";

/**
 * An inline script that runs during the initial HTML parse (before first
 * paint) and is inert when React renders it on the client.
 *
 * React warns when a client render produces a <script> (e.g. when an error
 * boundary makes it re-render the root layout). Rendering `text/plain` on the
 * client avoids that; `suppressHydrationWarning` covers the type mismatch.
 * Pattern from Next's "Preventing flash before hydration" guide.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
