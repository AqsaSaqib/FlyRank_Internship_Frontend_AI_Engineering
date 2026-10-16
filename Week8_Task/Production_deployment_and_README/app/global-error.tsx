"use client"; // Error boundaries must be Client Components

import { useLayoutEffect } from "react";

import { RouteError } from "@/components/RouteError";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

/**
 * Last line of defence: the root layout itself failed. This replaces the
 * whole document, so it brings its own <html>/<body> and styles, and applies
 * the saved theme itself (the layout's theme script didn't run).
 */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    } catch {
      // Storage blocked: the CSS falls back to the system setting.
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <title>Something went wrong · DevLog</title>
        <RouteError
          {...props}
          hardHomeLink
          title="DevLog couldn't load"
          message="Something went wrong on our side. Your conversation and logs are safe. Try again in a moment."
        />
      </body>
    </html>
  );
}
