import { Demo } from "@/components/Demo";
import { MOTION_NOTES } from "@/lib/motion";

export default function Page() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14">
      <header className="grid max-w-2xl gap-3">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">DevLog · Week 6</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Buttons with a brain</h1>
        <p className="text-base leading-7 text-muted-foreground">
          A &quot;Send message&quot; button for the DevLog Assistant that shows its whole lifecycle: hover, press,
          loading, success and error. Every change is a transition built only from <code className="font-mono text-[0.9em]">transform</code>{" "}
          and <code className="font-mono text-[0.9em]">opacity</code>. The second button is the same component with a different
          variant, label and icon, to prove it&apos;s a system.
        </p>
      </header>

      <Demo />

      <section aria-labelledby="notes-title" className="grid gap-5">
        <div className="grid max-w-2xl gap-2">
          <h2 id="notes-title" className="text-xl font-semibold tracking-tight">
            Motion notes
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Durations get longer as the change gets bigger: a press is a tiny change you cause, so it answers at once; a
            shape morph is the biggest change, so it gets the most time. Things that enter use ease-out (fast start, soft
            landing). The morph goes between two resting shapes, so it uses ease-in-out. The spring overshoot is saved for
            the success check, so it stays special. With reduced motion, everything that moves becomes an opacity fade,
            but no feedback is removed: the danger color, the Retry label, the check and the announcements all stay.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Token</th>
                <th scope="col" className="px-4 py-3 font-medium">Value</th>
                <th scope="col" className="px-4 py-3 font-medium">Easing</th>
                <th scope="col" className="px-4 py-3 font-medium">Used for</th>
                <th scope="col" className="px-4 py-3 font-medium">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOTION_NOTES.map((row) => (
                <tr key={row.token} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{row.token}</td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{row.value}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.easing}</td>
                  <td className="px-4 py-3">{row.use}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
