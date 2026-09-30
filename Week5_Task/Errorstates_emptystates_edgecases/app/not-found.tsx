import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/chat/icons";
import { StatusCard, primaryAction, secondaryAction } from "@/components/StatusCard";

export const metadata: Metadata = {
  title: "Page not found · DevLog",
};

export default function NotFound() {
  return (
    <StatusCard
      icon="search"
      tone="muted"
      title="We couldn't find that page"
      message="The link may be old or mistyped. Your logs and the assistant are one click away."
    >
      <Link href="/logs" className={secondaryAction}>
        <Icon name="book" className="size-4" />
        Browse your logs
      </Link>
      <Link href="/" className={primaryAction}>
        <Icon name="home" className="size-4" />
        Back to DevLog
      </Link>
    </StatusCard>
  );
}
