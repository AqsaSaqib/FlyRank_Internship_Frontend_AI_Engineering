import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/chat/icons";

type Props = {
  icon: IconName;
  title: string;
  description: ReactNode;
  /** The way forward: a primary CTA, example prompts, a "clear filter" link. */
  children?: ReactNode;
  /** h1 on a page of its own, h2 inside one. */
  headingLevel?: "h1" | "h2";
  className?: string;
};

/**
 * Onboarding, not apology: every empty screen says what goes here and how to
 * add the first one.
 */
export function EmptyState({ icon, title, description, children, headingLevel = "h2", className = "" }: Props) {
  const Heading = headingLevel;
  return (
    <div className={`flex animate-message-in flex-col items-center text-center ${className}`}>
      <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon name={icon} className="size-6" />
      </div>
      <Heading className="mt-4 text-xl font-semibold tracking-tight text-balance">{title}</Heading>
      <p className="mt-2 max-w-md text-sm text-pretty text-muted-foreground">{description}</p>
      {children && <div className="mt-6 flex w-full flex-col items-center">{children}</div>}
    </div>
  );
}
