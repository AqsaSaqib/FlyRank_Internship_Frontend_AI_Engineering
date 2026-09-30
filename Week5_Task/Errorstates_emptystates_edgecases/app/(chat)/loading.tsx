import { ChatHeader } from "@/components/chat/ChatHeader";

/**
 * Shown while the chat route loads. Same shell as <Chat />: the real header,
 * the welcome screen's shapes, and a composer of the exact same size, so
 * nothing moves when the page swaps in.
 */
export default function ChatLoading() {
  return (
    <div className="flex h-app flex-col" aria-busy="true">
      <ChatHeader>
        <div className="skeleton size-9 rounded-lg" aria-hidden="true" />
        <div className="skeleton h-9 w-[6.5rem] rounded-lg" aria-hidden="true" />
      </ChatHeader>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <p role="status" className="sr-only">
          Loading the DevLog Assistant…
        </p>
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-6 pt-12 sm:pt-18" aria-hidden="true">
          <div className="skeleton size-12 rounded-2xl" />
          <div className="skeleton mt-4 h-6 w-64 max-w-full rounded" />
          <div className="mt-3 w-full max-w-md space-y-2">
            <div className="skeleton mx-auto h-3.5 w-full rounded" />
            <div className="skeleton mx-auto h-3.5 w-2/3 rounded" />
          </div>
          <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[4.25rem] rounded-xl border border-border bg-card p-3.5">
                <div className="skeleton h-3.5 w-1/2 rounded" />
                <div className="skeleton mt-2 h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="shrink-0 bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2" aria-hidden="true">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
            <div className="flex h-10 flex-1 items-center px-2">
              <div className="skeleton h-3.5 w-48 max-w-full rounded" />
            </div>
            <div className="size-10 shrink-0 rounded-xl bg-muted" />
          </div>
          <p className="mt-2 hidden text-center text-xs text-transparent sm:block">&nbsp;</p>
        </div>
      </footer>
    </div>
  );
}
