import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/chat/icons";

type Props = {
  icon: IconName;
  tone?: "danger" | "muted";
  title: string;
  message: ReactNode;
  /** Server errors come with a digest that matches the server log. */
  digest?: string;
  /** Buttons / links: the way forward. */
  children: ReactNode;
};

export const STATUS_TITLE_ID = "status-title";

export const primaryAction =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const secondaryAction =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Full-page state for route boundaries (error.tsx, global-error.tsx,
 * not-found.tsx): one short human sentence and a way forward. Never a stack
 * trace; the digest is the only technical detail, for support.
 */
export function StatusCard({ icon, tone = "danger", title, message, digest, children }: Props) {
  return (
    <main className="grid min-h-app place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-notice-in rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className={`mx-auto grid size-12 place-items-center rounded-2xl ${
            tone === "danger" ? "bg-danger/10 text-danger" : "bg-primary-soft text-primary"
          }`}
        >
          <Icon name={icon} className="size-6" />
        </div>
        {/* Focus lands here when a boundary appears, so screen readers read the title first. */}
        <h1 id={STATUS_TITLE_ID} tabIndex={-1} className="mt-4 text-xl font-semibold tracking-tight text-balance outline-none">
          {title}
        </h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">{message}</p>
        <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">{children}</div>
        {digest && (
          <p className="mt-5 text-xs text-muted-foreground">
            Reference <code className="rounded bg-muted px-1 py-px font-mono">{digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
