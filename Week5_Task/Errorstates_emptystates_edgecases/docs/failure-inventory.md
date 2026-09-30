# DevLog Assistant — failure inventory

Every way the primary flow (the streaming DevLog Assistant chat) can fail or
come up empty, how to trigger it, and what the UI should do.

Status legend: **Handled** means a designed state was built *and* verified
(in the browser, and by Playwright where noted). The baseline status (before
this work) is kept in brackets.

| Case | How to trigger | Expected UI | Status |
| --- | --- | --- | --- |
| Network offline before send | DevTools → Network → **Offline**, then type | "You're offline" banner above the composer; Send disabled (drafting still works); re-enables by itself on reconnect | **Handled** · e2e `offline` test [was: raw "Failed to fetch"] |
| Connection killed mid-stream | `?sabotage=disconnect`, or go Offline while a reply streams | Partial text kept, dimmed + "Incomplete response"; ChatError "Connection lost" (or "You're offline" until reconnected); **Retry last response** | **Handled** [was: generic red row] |
| API error mid-stream | `?sabotage=midstream` | Partial text kept + "Incomplete response"; ChatError "Something went wrong"; Retry replaces only that reply | **Handled** · e2e `mid-stream failure` test [was: masked message, no marker] |
| 429 rate limit | `?sabotage=429` (or a real provider 429) | "Too many requests · Try again in Xs" with a live countdown (from `Retry-After`); Retry disabled until 0, then "You can try again now." | **Handled** · e2e `429` test [was: generic text] |
| Model overloaded (529/503) | `?sabotage=overloaded` (or provider 529/503 / `overloaded_error`) | "The AI model is busy · This usually clears up in a few seconds." + Retry | **Handled** [was: generic text] |
| Malformed tool / JSON response | `?sabotage=malformed` | Tool card error: "The assistant sent inputs the tool couldn't accept", what was attempted, Retry; the model then says so in one sentence. Unmatched calls (`dynamic-tool`) get the same card | **Handled** [was: not reachable on demand; raw parser text could leak] |
| Empty input | Whitespace-only message; or POST `{"messages":[…"   "]}` | Send disabled for empty/whitespace; server answers 400 `{ error, code: "empty_input" }` (also `invalid_request`, `too_long`) | **Handled** [was: client guard only] |
| No results / empty model reply | `?sabotage=empty`; a search that matches nothing; `/logs?tag=rust` | Empty reply: "No reply this time" + rephrase hint + Retry. No results: dashed empty card in the tool result. Empty filter: "Nothing tagged …" + Show all / Write an entry | **Handled** [was: blank avatar] |
| First-run empty state (no conversations) | New chat / cleared storage; `/logs?sabotage=nologs` | Welcome heading, one line about the assistant, 4 DevLog prompts that fill + focus the input (never auto-send). No logs: "No logs yet" + **Write your first entry** (opens the assistant pre-filled) | **Handled** · e2e happy path [was: tool-demo prompts] |
| Slow response | `?sabotage=slow` (10s to first token); DevTools Slow 3G | Skeleton reply laid out like the real one (text lands exactly on the first skeleton line: 0px shift); at 8s "Still thinking…" + **Stop** in the same row | **Handled** [was: dots only] |
| Route-level crash | `/?sabotage=crash` (chat), `/logs?sabotage=crash` (other pages), any unknown URL | Designed cards: `(chat)/error.tsx`, `app/error.tsx`, `global-error.tsx` (own html/body + theme), `not-found.tsx`; **Try again** (`retry()`), link home, digest reference | **Handled** [was: Next.js default pages] |
| Route handler crash | `?sabotage=throw` | Top-level catch → 500 `{ code: "unknown" }`, logged without secrets; chat shows "Something went wrong" + Retry | **Handled** |

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
