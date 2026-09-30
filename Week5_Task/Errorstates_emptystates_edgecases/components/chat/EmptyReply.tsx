"use client";

import { Notice } from "./ChatError";
import { RetryButton } from "./RetryButton";

/**
 * The model finished without saying anything (no text, no tool call). Rare,
 * but a blank bubble reads as "broken"; this says what happened and offers a
 * way forward.
 */
export function EmptyReply({ busy, online, onRetry }: { busy: boolean; online: boolean; onRetry: () => Promise<void> }) {
  return (
    <Notice icon="inbox" tone="muted">
      <div role="status">
        <p className="text-sm font-medium">No reply this time</p>
        <p className="text-sm text-muted-foreground">
          The assistant finished without an answer. Try rephrasing your message with a bit more detail, or retry.
        </p>
      </div>
      <div className="mt-2.5">
        <RetryButton onRetry={onRetry} disabled={busy || !online} />
      </div>
    </Notice>
  );
}
