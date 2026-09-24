import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
};

export default function Card({
  title,
  description,
  action,
  interactive = false,
  className = "",
  children,
}: CardProps) {
  const hover = interactive
    ? "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted"
    : "";

  return (
    <div
      className={`min-w-0 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6 ${hover} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-text">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {!title && !action && description && (
        <p className="text-sm text-muted">{description}</p>
      )}
      {children && (
        <div className={title || description ? "mt-5" : ""}>{children}</div>
      )}
    </div>
  );
}
