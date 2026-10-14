import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "./icons";

/** No display value here, so callers can pick `inline-flex` or `hidden sm:inline-flex`. */
export const headerButton =
  "tap-target h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:px-3";

/**
 * The app bar: brand on the left, navigation and `children` (page actions)
 * on the right. Server-safe, so loading.tsx renders the exact same bar.
 */
export function ChatHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href="/" className="tap-target flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          <Logo />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight">DevLog Assistant</p>
            <p className="truncate text-xs text-muted-foreground">Search, chart and save your logs</p>
          </div>
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/logs" className={`inline-flex ${headerButton}`}>
            <Icon name="book" className="size-4" />
            <span className="sr-only sm:not-sr-only">Logs</span>
          </Link>
          <Link href="/states" title="Every tool state on one page" className={`hidden sm:inline-flex ${headerButton}`}>
            <Icon name="chart" className="size-4" />
            Tool states
          </Link>
          {children}
        </nav>
      </div>
    </header>
  );
}

export function Logo() {
  return (
    <div
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground"
    >
      {"{}"}
    </div>
  );
}
