# DevLog Assistant: Error States, Empty States & Edge Cases

DevLog is a journal where developers write down their daily work.
**DevLog Assistant** is its AI chat. You can ask it things like
"What did I work on last week?" and it answers using your logs.

This week I made the chat **handle problems nicely**: no internet, the
AI failing halfway, too many requests, empty replies, slow replies, and
small phone screens.

---

## How to run it

**1. Open a terminal in this folder and install:**

```bash
npm install
```

**2. Add your AI key.** Create a file called `.env.local` and put this inside:

```
GEMINI_API_KEY=your-key-here
```

Get a free key at https://aistudio.google.com/apikey.
No key? It still works with a built-in **mock** (fake) AI.

The app uses **gemini-flash-lite-latest**. If Gemini says "too many
requests" or "busy", it automatically tries a backup model
(**gemini-3.5-flash-lite**), so you usually won't see an error.

**3. Start the app:**

```bash
npm run dev
```

**4. Open http://localhost:3000** in your browser.

To stop it, press `Ctrl + C` in the terminal.

---

## What I added

| Problem | What the user sees |
| --- | --- |
| **No internet** | A small "You're offline" message. The Send button turns off, then turns back on by itself. |
| **AI stops halfway** | The half-written answer stays, marked "Incomplete response", with a **Retry last response** button. |
| **Too many requests (429)** | "Too many requests, try again in 10s" with a countdown. |
| **AI quota used up** | The backup model answers instead. If both are used up: "AI limit reached, try again later". |
| **AI is busy (529/503)** | "The AI model is busy" + Retry. |
| **Broken tool answer** | A clear error card on the tool + Retry. |
| **Empty message** | The Send button stays off. The server also rejects it. |
| **AI replies with nothing** | "No reply this time. Try rephrasing" + Retry. |
| **First visit** | A welcome screen with 4 example questions. Clicking one fills the box (it doesn't send). |
| **No logs yet** | "No logs yet" + a **Write your first entry** button. |
| **Slow AI** | A grey placeholder where the answer will appear. After 8 seconds: "Still thinking…" + Stop. |
| **Page crashes** | A friendly error page with **Try again** and **Back to DevLog**. |
| **Wrong URL** | A friendly "page not found" page. |

**Retry is safe:** it only redoes the last answer, never repeats your
message, and double clicks send only one request.

**Phones:** works at 360px, 390px and 768px wide. There's no sideways
scrolling, buttons are big enough to tap (44px), and the input box
stays above the keyboard.

---

## Try the errors yourself

Add this line to `.env.local` and restart `npm run dev`:

```
NEXT_PUBLIC_ENABLE_SABOTAGE=true
```

Then open one of these links and send a message:

| Link | What happens |
| --- | --- |
| `/?sabotage=midstream` | AI fails halfway, then click **Retry last response** |
| `/?sabotage=disconnect` | Connection drops halfway |
| `/?sabotage=429` | Too many requests (countdown) |
| `/?sabotage=overloaded` | AI is busy |
| `/?sabotage=slow` | Slow answer (10 seconds) |
| `/?sabotage=malformed` | Broken tool answer |
| `/?sabotage=empty` | AI replies with nothing |
| `/?sabotage=throw` | Server error |
| `/?sabotage=crash` | Page crash, then click **Try again** |
| `/logs?sabotage=nologs` | "No logs yet" screen |

**No internet test:** in Chrome press F12, go to the **Network** tab,
and change "No throttling" to **Offline**.

> Sabotage is for testing only. Without `NEXT_PUBLIC_ENABLE_SABOTAGE=true`
> these links do nothing, so they're safe in production.

---

## Checks and tests

```bash
npm run check
```

Checks the code and makes a production build.

```bash
npm run test:e2e
```

Runs automatic browser tests (needs Google Chrome). They test that:

- the AI failing halfway shows the error and Retry works
- the 429 countdown works
- the offline message works
- the normal flow has no console errors

---

## Put it online (Vercel)

1. Set **Root Directory** to `Week5_Task/Errorstates_emptystates_edgecases`.
2. Add `GEMINI_API_KEY` under **Environment Variables**.
3. For a demo recording only, also add `NEXT_PUBLIC_ENABLE_SABOTAGE` = `true`
   for **Preview** (not Production).

---

## More details

- [docs/failure-inventory.md](docs/failure-inventory.md): every problem case, how to trigger it, and what should happen
- [docs/recording-script.md](docs/recording-script.md): step-by-step script for a demo video

## Main files

| What | File |
| --- | --- |
| Chat page | `components/chat/Chat.tsx` |
| Error message under a reply | `components/chat/ChatError.tsx` |
| Retry button | `components/chat/RetryButton.tsx` |
| Loading placeholder | `components/chat/MessageSkeleton.tsx` |
| Empty screens | `components/EmptyState.tsx`, `components/chat/ChatWelcome.tsx` |
| Server (AI route) | `app/api/chat/route.ts` |
| Error codes | `lib/chat/errors.ts`, `lib/ai/errors.ts` |
| Sabotage (testing) | `lib/sabotage.ts`, `lib/ai/sabotage.ts` |
| Error pages | `app/error.tsx`, `app/global-error.tsx`, `app/(chat)/error.tsx`, `app/not-found.tsx` |
| Tests | `e2e/` |

## Tech used

Next.js 16 · React 19 · Tailwind CSS 4 · Vercel AI SDK 7 · Zod · Playwright
