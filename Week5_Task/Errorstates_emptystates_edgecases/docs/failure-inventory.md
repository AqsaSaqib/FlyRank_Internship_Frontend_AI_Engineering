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
