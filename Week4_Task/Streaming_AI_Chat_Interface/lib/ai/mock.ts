import "server-only";

import { createPartStream } from "@/lib/ai/stream";

/**
 * Development-only stand-in for a real model, used when no API key is set.
 * Streams a canned reply with the same NDJSON protocol and similar pacing, so
 * the thinking indicator, stop button and auto-scroll can be tested for free.
 */
const REPLY = `Here's a draft entry from your notes:

## Daily log

**What I did**
- Fixed the session bug where users were logged out after a refresh.
- Paired on the caching layer and agreed to cache GitHub responses for 5 minutes.

**What I learned**
- \`fetch\` in a Server Component is cached by default only when you opt in:

\`\`\`ts
const res = await fetch(url, { next: { revalidate: 300 } });
\`\`\`

**Blockers**
- The contribution graph test is flaky on CI. It passes locally, which suggests a timezone difference.

| Area | Status |
| --- | --- |
| Auth | Done |
| Caching | In progress |
| Flaky test | Blocked |

Want me to turn this into a *stand-up update* as well? This is a **mock reply**: add \`GEMINI_API_KEY\` or \`ANTHROPIC_API_KEY\` to \`.env.local\` to talk to a real model.`;

export function streamMock(signal: AbortSignal) {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  return createPartStream(async (send) => {
    await send({ type: "start", model: "mock" });
    await wait(700); // time to first token
    await send({
      type: "reasoning-delta",
      text: "The notes mention a bug fix, pairing on caching and a flaky test, so I'll group them into done, learned and blocked.",
    });

    // Split into small word-ish chunks like real token deltas.
    for (const chunk of REPLY.match(/\s*\S{1,6}/g) ?? []) {
      if (signal.aborted) return;
      await send({ type: "text-delta", text: chunk });
      await wait(25);
    }
    await send({ type: "finish", stopReason: "end_turn" });
  });
}
