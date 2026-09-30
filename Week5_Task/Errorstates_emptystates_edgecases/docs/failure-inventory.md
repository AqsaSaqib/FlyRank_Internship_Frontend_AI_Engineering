# DevLog Assistant — failure inventory

Every way the primary flow (the streaming DevLog Assistant chat) can fail or
come up empty, how to trigger it, and what the UI should do.

Status legend: **Missing** (no deliberate handling) · **Partial** (something
shows, but it's generic or wrong) · **Handled** (designed state, verified).

| Case | How to trigger | Expected UI | Status |
| --- | --- | --- | --- |
| Network offline before send | DevTools → Network → **Offline**, then type a message | "You're offline" banner above the composer; Send disabled; re-enables by itself when back online | Missing — the request fails with a raw "Failed to fetch" |
| Connection killed mid-stream | Go **Offline** while a reply streams | Partial text stays, marked incomplete; inline ChatError "The connection dropped…"; **Retry last response** | Partial — generic red row with the raw message |
| API error mid-stream | Upstream provider error after tokens started | Partial text marked incomplete; ChatError with a readable message; Retry | Partial — masked message, no code, no incomplete marker |
| 429 rate limit | Provider returns 429 | "Too many requests, try again in Xs" with a live countdown; Retry enabled when it reaches 0 | Partial — generic text, no retry-after |
| Model overloaded (529/503) | Provider returns 529 / 503 | "The model is busy right now…" + Retry | Partial — generic text |
| Malformed tool / JSON response | Model emits tool input that isn't valid JSON | Tool card error state ("The assistant sent inputs the tool couldn't accept") with Retry; model explains in one sentence | Partial — card exists, not reachable on demand |
| Empty input | Whitespace-only message, or a crafted request | Send disabled for empty / whitespace; server answers 400 `{ error, code: "empty_input" }` | Partial — client guard only, no server validation |
| No results / empty model reply | Model finishes with no text and no tool call; a search matches nothing | Empty reply: "The assistant didn't return anything" + rephrase hint + Retry. No results: dashed empty card inside the tool result | Partial — empty reply renders a blank avatar |
| First-run empty state (no conversations) | New chat / cleared storage | Welcome heading, one line about the assistant, 3–4 example prompts that fill the input (no auto-send) | Partial — exists, prompts are tool demos |
| Slow response | Model takes > 8s to the first token | Skeleton reply bubble (no layout shift); after ~8s "Still thinking…" with a Stop button | Missing — dots only, no long-wait hint |
| Route-level crash | Render error in a page / layout | Designed error card: human message, **Try again** (`retry()`), link home. `global-error` for the root layout; designed 404 | Missing — Next.js default error page |

## Sabotage toggles

Force any failure on demand. They only work when
`NEXT_PUBLIC_ENABLE_SABOTAGE=true` is set (both client and server check it).
Leave it unset in production. To record, set it on the Vercel project for the
**Preview** environment only and redeploy (it's a `NEXT_PUBLIC_` variable, so
it's read at build time).

Open the chat with `?sabotage=<mode>`. A dashed `sabotage=<mode>` label above
the composer confirms it's armed. It applies to each **new** message only;
**Retry last response** is always sent clean, so retrying shows the recovery.

| Toggle | URL | What happens | What you should see |
| --- | --- | --- | --- |
| `throw` | `/?sabotage=throw` | Route handler throws before streaming; the top-level catch returns 500 `{ code: "unknown" }` | "Something went wrong" + Retry |
| `midstream` | `/?sabotage=midstream` | ~10 tokens stream, then the upstream model sends an error part (API error mid-stream) | Partial text dimmed + "Incomplete response", ChatError, Retry |
| `disconnect` | `/?sabotage=disconnect` | ~10 tokens stream, then the HTTP response is cut (connection killed mid-stream) | Partial text kept, "Connection lost", Retry |
| `429` | `/?sabotage=429` | HTTP 429 with `Retry-After: 10` and `retryAfter: 10` in the body | "Too many requests · Try again in 10s" countdown; Retry unlocks at 0 |
| `overloaded` | `/?sabotage=overloaded` | HTTP 529 `{ code: "overloaded" }` | "The AI model is busy" + Retry |
| `malformed` | `/?sabotage=malformed` | The model returns a `queryLogs` call whose input JSON is cut off | Tool card error "The assistant sent inputs the tool couldn't accept" + Retry; the model then explains in one sentence |
| `slow` | `/?sabotage=slow` | First token delayed by 10s | Skeleton reply; at 8s "Still thinking…" + **Stop** |
| `empty` | `/?sabotage=empty` | The model finishes with no text and no tool call | "No reply this time", rephrase hint + Retry |
| `crash` | `/?sabotage=crash` | The chat throws once while rendering | `(chat)/error.tsx` card; **Try again** recovers |
| `crash` | `/logs?sabotage=crash` | The logs page throws on the server | `app/error.tsx` card with a reference digest (Try again re-throws while the toggle is in the URL; use **Back to DevLog**) |
| `nologs` | `/logs?sabotage=nologs` | Logs page renders with no entries | "No logs yet" + **Write your first entry** CTA |

The API also accepts the toggle directly, for scripted checks:

```bash
curl -i -X POST "http://localhost:3000/api/chat?sabotage=429" \
  -H 'content-type: application/json' \
  -d '{"messages":[{"id":"u1","role":"user","parts":[{"type":"text","text":"hi"}]}]}'
```

(or send the header `x-devlog-sabotage: 429`).

## Manual checks (Chrome DevTools)

Open DevTools → **Network** tab.

1. **Offline before send.** Set the throttling dropdown to **Offline**. The
   "You're offline" banner appears above the composer, and Send is disabled
   (you can still type). Switch back to **No throttling**: the banner goes
   away and Send re-enables by itself.
2. **Offline mid-stream.** Send "Help me write today's log entry". While the
   reply streams, switch to **Offline**. The partial reply stays, marked
   "Incomplete response", with "You're offline" and a disabled Retry. Go back
   online: the message changes to "Connection lost… you can retry" and Retry
   enables. Retry replaces only that reply.
3. **Slow 3G.** Set throttling to **Slow 3G** and send a message. The
   skeleton reply holds the space with no layout shift, the text streams in
   where the skeleton was, and Stop works throughout.
4. **Request blocking.** Right-click the `chat` request → **Block request
   URL** (or add `*/api/chat` under More tools → **Network request
   blocking**), then send. You get "Connection lost" + Retry. Unblock and
   Retry: it works and the user message isn't duplicated.
