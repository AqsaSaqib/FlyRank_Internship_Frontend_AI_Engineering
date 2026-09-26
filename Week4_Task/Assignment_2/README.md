# DevLog Assistant: Streaming AI Chat (FE-06)

An AI chat for my capstone project **DevLog** (a journal where developers log their daily work).

You write rough notes about your day, and the assistant turns them into a clean log entry. It can also write a weekly report or help you explain a blocker in stand-up. The answer appears **word by word while the AI is writing it** (streaming), like ChatGPT.

**Live preview:** https://devlog-streaming-chat.vercel.app/

---

## What you can do

### Things you can ask

Copy any of these into the chat box. On an empty chat you can also click one of the four suggestion cards to fill the box.

| What you want | Example to type |
| --- | --- |
| **Turn notes into a daily log entry** (the main feature) | `Turn these notes into today's log entry: made the login page, fixed a CSS bug on mobile, stuck on API error 401.` |
| **Write a weekly report** | `Write a short weekly report: this week I finished the navbar, added dark mode, and started the chat feature. Next week: deploy on Vercel.` |
| **Explain a blocker for stand-up** | `Help me explain this blocker in 2 sentences for stand-up: my Vercel build fails because an environment variable is missing.` |
| **Ask a quick coding question** | `What is the difference between useState and useEffect in React? Keep it short.` |
| **Describe your work for a portfolio** | `Describe my streaming chat project in 3 lines for my portfolio.` |
| **Follow up on the last answer** (the chat remembers) | `Now make it shorter.` or `Turn that into a stand-up update.` |

### Buttons and shortcuts

| Control | What it does |
| --- | --- |
| **Send** (arrow button) or `Enter` | Sends your message. |
| `Shift + Enter` | Starts a new line without sending. |
| **Stop** (square button) or `Esc` | Stops the answer while it's being written. The part written so far is kept and marked **Stopped**. |
| **Copy** (under an answer) | Copies the answer text. |
| **Regenerate** (under the last answer) | Asks the AI to write the last answer again. |
| **Thought process** (above an answer) | Click to see a short summary of how the AI thought about your question. It only appears when the AI shared one. |
| **Jump to latest** | Shows up when you scroll up to read. Click it to go back to the newest message. |
| **Sun / moon button** (top right) | Switches between light and dark theme. Your choice is remembered. |
| **New chat** (top right) | Clears the conversation and starts fresh. Use it when you change topic. |

You can keep typing your next message while an answer is still being written. It just won't send until the answer finishes or you press Stop.

Your conversation is saved in your browser, so refreshing the page doesn't lose it. It is only stored on your device.

### Try this as a quick demo (2 minutes)

1. Click the **"Turn notes into a log entry"** card and press `Enter`. Watch the answer stream word by word.
2. While it's writing, press **Stop**. The partial answer stays.
3. Type `Now turn that into a 2-sentence stand-up update.` and press `Enter`. It works right after stopping, and it remembers the notes from step 1.
4. Scroll up while the answer is streaming. The page stops following and a **Jump to latest** button appears.
5. Click the **sun / moon** button to switch the theme, then refresh the page. The chat and the theme are both still there.

### What it can't do

- **No internet.** It can't look up today's date, news, prices, or anything live.
- **Built for developer work.** It answers general questions, but it tends to steer back to logs and reports.
- **Replies in English.** It understands Roman Urdu, but usually answers in English.
- **Can make mistakes.** Like any AI, double-check facts and code before using them.

---

## Which AI does it use?

The app works with **two AI providers**. It picks one based on which key you give it:

| Key in `.env.local` | AI used |
| --- | --- |
| `ANTHROPIC_API_KEY` | **Claude** (what the assignment asks for) |
| `GEMINI_API_KEY` | **Google Gemini** (free tier) |
| no key | A **mock** (fake) reply, for testing the UI on your own computer |

> **Note for the reviewer:** I don't have a Claude API key, so the live preview runs on **Google Gemini's free tier**. The Claude code is complete and ready in [`lib/ai/providers/anthropic.ts`](lib/ai/providers/anthropic.ts). Adding `ANTHROPIC_API_KEY` switches the app to Claude with no code changes.

---

## Where to find things

| What | File |
| --- | --- |
| **Route handler** (the server part that talks to the AI) | [`app/api/chat/route.ts`](app/api/chat/route.ts) |
| **Chat component** (what you see on screen) | [`components/chat/Chat.tsx`](components/chat/Chat.tsx) |
| One message bubble | [`components/chat/Message.tsx`](components/chat/Message.tsx) |
| Text box + Send/Stop button | [`components/chat/Composer.tsx`](components/chat/Composer.tsx) |
| Reads the stream and stores the chat (my own version of `useChat`) | [`lib/chat/use-chat-stream.ts`](lib/chat/use-chat-stream.ts) |
| Smart auto-scroll | [`lib/chat/use-stick-to-bottom.ts`](lib/chat/use-stick-to-bottom.ts) |
| **All settings in one place**: system prompt, models, limits | [`lib/ai/config.ts`](lib/ai/config.ts) |
| Claude connection | [`lib/ai/providers/anthropic.ts`](lib/ai/providers/anthropic.ts) |
| Gemini connection | [`lib/ai/providers/gemini.ts`](lib/ai/providers/gemini.ts) |
| Light/dark theme button | [`components/ThemeToggle.tsx`](components/ThemeToggle.tsx) |

---

## How it works (simple version)

```
 You type a message
        │
        ▼
 Browser sends the whole chat to  /api/chat   (our server)
        │
        ▼
 Server adds the secret API key and asks Claude or Gemini
        │
        ▼
 The AI sends the answer back in small pieces
        │
        ▼
 Server passes each piece to the browser, one line at a time
        │
        ▼
 Browser adds each piece to the message, so you see it being "typed"
```

- **The API key never goes to the browser.** Only the server reads it. The settings file imports `server-only`, so the build fails if browser code ever tries to import it.
- **Each message is made of typed parts:** `text` (the answer), `reasoning` (the AI's "thought process", which you can open), and `notice` (small info lines).
- **Stop button:** it cancels the request in the browser. The server notices and cancels the request to the AI too, so a stopped answer stops using tokens.

---

## Assignment checklist

| Requirement | How it's done |
| --- | --- |
| Answers stream word by word | Pieces are shown as soon as they arrive. Gemini sends big chunks, so the server splits them into words ([`lib/ai/stream.ts`](lib/ai/stream.ts)). |
| Stop works without breaking anything | After Stop, the half-written answer stays (marked **Stopped**), the Send button comes back, and the next message works. |
| Chat remembers earlier messages | The full conversation is sent on every turn. Tested: "turn that into a stand-up update" correctly used the previous answer. |
| API key stays on the server | Read only in server files, and the variable is never named `NEXT_PUBLIC_…`. |
| Works on a phone | Tested at 375px wide with no sideways scrolling. The text box uses 16px text so iPhones don't zoom in. |

### Mentor tips I followed

- **Auto-scroll:** the chat follows new text only while you are at the bottom. When you scroll up to read, it stops following immediately and a **"Jump to latest"** button appears.
- **Thinking indicator:** a "Thinking…" row shows before the first word. When the text arrives, the row smoothly shrinks away while the text fades in, so nothing flickers or jumps.
- **Half-finished markdown:** rendered with [Streamdown](https://streamdown.ai), which is built for streaming, so an unfinished code block or `**bold` doesn't break the layout.
- **Stop, then send again:** tested and working.

### Extra features (stretch goals)

- **Animations** for new messages and the thinking → text change. They turn off for people who choose "reduce motion" in their device settings.
- **Chat is saved** in the browser (`localStorage`), so refreshing the page doesn't lose the conversation.
- **Light / dark theme button** in the header. It remembers your choice.
- **Model name** under each answer, so you can see which AI replied.
- **Backup models for Gemini:** if the free model is busy (error 503) or rate limited (error 429), the server tries the next Gemini model automatically.

---

## Run it on your computer

1. Install packages:
   ```bash
   npm install
   ```
2. Create your key file by copying the example:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and paste your key after `GEMINI_API_KEY=`.
   You can get a free key at https://aistudio.google.com/apikey.
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000.

> If you change `.env.local`, stop the server (`Ctrl + C`) and run `npm run dev` again.

---

## Put it online (Vercel)

1. Push the code to GitHub. `.env.local` is **not** uploaded, which is correct because keys must stay private.
2. On [vercel.com](https://vercel.com), click **Add New → Project** and import the repo.
3. Set **Root Directory** to `Week4_Task/Assignment_2`.
4. Under **Environment Variables**, add `GEMINI_API_KEY` with your key.
5. Click **Deploy**. This project is live at https://devlog-streaming-chat.vercel.app/

---

## Tech used

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · `@anthropic-ai/sdk` (Claude) · `@google/genai` (Gemini) · `streamdown` (markdown while streaming)
