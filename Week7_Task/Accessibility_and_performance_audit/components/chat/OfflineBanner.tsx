import { Icon } from "./icons";

/**
 * Subtle notice above the composer while the browser is offline. The live
 * region is always mounted so going offline (and back) is announced.
 */
export function OfflineBanner({ offline }: { offline: boolean }) {
  return (
    <div role="status" aria-live="polite">
      {offline && (
        <p className="mb-2 flex animate-notice-in items-center justify-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground">
          <Icon name="wifiOff" className="size-3.5 shrink-0" />
          You&apos;re offline. Sending is paused and will be available again when you reconnect.
        </p>
      )}
    </div>
  );
}
