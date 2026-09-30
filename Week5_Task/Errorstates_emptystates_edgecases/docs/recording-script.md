# Recording script (Vercel preview)

**Before recording**

1. In Vercel → Project → Settings → Environment Variables, add
   `NEXT_PUBLIC_ENABLE_SABOTAGE` = `true` for **Preview** only (not
   Production). Redeploy the preview; `NEXT_PUBLIC_` values are read at build time.
2. Open the preview URL in Chrome, DevTools docked right (Network tab), window
   about 1280×800. Clear the chat with **New chat**.
3. Optional: turn on "Show clicks" in your screen recorder.

Below, `$URL` is your preview URL.

---

## Scene 1: Happy path (≈40s)

1. Open `$URL/`. Point out the welcome state: heading, one line about the
   assistant, four example prompts.
2. Click **Plan tomorrow**. The prompt fills the composer and focuses it,
   and nothing is sent until you press Enter.
3. Press **Enter**. Point out the skeleton reply ("Thinking…" + lines) and how
   the text streams in exactly where the skeleton was, with no jump.
4. Type `What did I work on last week?` and press Enter. A tool card
   appears, then the result.
5. Click **Logs** in the header. The list page loads, and the entry cards link by tag.

## Scene 2: Mid-stream failure → Retry last response (≈40s)

1. Open `$URL/?sabotage=midstream`. Point out the dashed `sabotage=midstream`
   label above the composer (test mode is visible on screen).
2. Click **New chat**, click **Write today's entry**, press **Enter**.
3. After a few words, the stream fails. Show:
   - the partial text stays, dimmed, with **Incomplete response**;
   - the calm error card ("Something went wrong · The partial reply above is
     kept"), which fades in with no red flash;
   - the **Retry last response** button.
4. Double-click **Retry last response**. It locks on the first click, so only
   one request goes out: in the Network tab, the second `chat` request's payload has
   `"trigger": "regenerate-message"` and the same single user message.
5. The full reply streams in and replaces the partial one. The user message is
   **not** duplicated.

## Scene 3: Rate limit 429 with countdown (≈25s)

1. Open `$URL/?sabotage=429`, click **New chat**, type `Hello`, press **Enter**.
2. Show "Too many requests · Try again in 10s" counting down, with **Retry last
   response · 10s** disabled.
3. When it reaches 0, the text changes to "You can try again now" and Retry
   enables. Click it and the reply arrives.

## Scene 4: Offline (≈30s)

1. Open `$URL/` (no sabotage). Type a message but don't send.
2. DevTools → Network → throttling → **Offline**. The "You're offline" banner
   appears above the composer and **Send** is disabled (you can keep typing).
3. Switch back to **No throttling**. The banner disappears and Send enables.
4. Optional: send `Help me write today's log entry`, and while it streams
   switch to **Offline**. The partial reply is kept with "You're offline" and a
   disabled Retry. Go back online: it changes to "Connection lost… you can
   retry", and **Retry last response** finishes the reply.

## Optional extras (≈10s each)

- **Slow model:** `$URL/?sabotage=slow` → send. At 8s, "Still thinking…"
  and **Stop** appear in the same row; click Stop and the reply shows "Stopped" +
  Regenerate.
- **Overloaded:** `$URL/?sabotage=overloaded` shows "The AI model is busy".
- **Malformed tool call:** `$URL/?sabotage=malformed` → "What did I work on
  last week?" shows the tool card error "The assistant sent inputs the tool
  couldn't accept" + Retry.
- **Empty reply:** `$URL/?sabotage=empty` shows "No reply this time" + rephrase
  hint + Retry.
- **Route crash:** `$URL/?sabotage=crash` shows the designed "The assistant
  hit a snag" card, and **Try again** recovers the chat.
- **Empty list:** `$URL/logs?sabotage=nologs` shows "No logs yet" →
  **Write your first entry** opens the assistant with the composer pre-filled.
- **Mobile:** DevTools device toolbar → iPhone 12 Pro (390px) shows no
  horizontal scroll, a long code block scrolls inside its bubble, and scrolling up
  mid-reply shows **Jump to latest**.

**After recording:** remove `NEXT_PUBLIC_ENABLE_SABOTAGE` from Preview (or
leave it; it never applies to Production unless you add it there).
