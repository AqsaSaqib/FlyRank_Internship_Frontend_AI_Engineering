# Buttons with a Brain

A **"Send message"** button for my capstone project **DevLog**. It shows what is happening with small animations: hover, press, loading, success and error.

A second button, **"Generate summary"**, uses the same component and the same animation settings, with a different style, text and icon.

**Live demo:** https://devlog-motion-button.vercel.app/

---

## What it does

| State | What you see |
| --- | --- |
| Hover | Lifts up a little, with a shadow |
| Pressed | Shrinks a little |
| Loading | Turns into a circle with a spinner |
| Success | Shows ✓, then goes back to normal after 1.2s |
| Error | Turns red, shakes once and says **Retry**. Stays like that until you click it. |
| Disabled | Faded, doesn't react, but you can still reach it with `Tab` |

No animation library. Only CSS transitions, plus `element.animate()` for the shake.

---

## How to run

```bash
cd Week6_Task/Buttons_with_a_brain
npm install
npm run dev
```

Open http://localhost:3000. No API key needed. The request is fake: it fails about 1 in 5 times.

On the demo page you can force success or failure, turn on disabled, reduced motion and **Slow-mo 5×**, run a **Spam test** (10 fast clicks), switch the theme, and watch the event log.

---

## Project structure

| File | What it is |
| --- | --- |
| `components/motion-button/MotionButton.tsx` | The button |
| `components/motion-button/motion-button.css` | Button styles and animations |
| `lib/motion.ts` | All animation timings in one place |
| `lib/use-async-action.ts` | State logic (idle, loading, success, error) |
| `lib/fake-request.ts` | Fake request |
| `components/Demo.tsx` | Demo page controls and event log |

---

## Duration & easing choices

- **Press is the fastest (90ms)**, so the button feels instant.
- **Things that appear use ease-out** (fast start, soft end), so they feel quick.
- **The pill ⇄ circle change uses ease-in-out**, because both shapes are resting shapes.
- **The bounce (spring) is only on the ✓**, so success feels special.
- **Loading shows for at least 0.45s**, so the spinner never just flashes.
- **Errors stay until you click Retry**, so you never miss a failed message.

| Token | Time | Used for |
| --- | --- | --- |
| `--dur-instant` | 90ms | Press |
| `--dur-fast` | 160ms | Hover, focus ring |
| `--dur-base` | 240ms | Text and color change |
| `--dur-morph` | 320ms | Pill ⇄ circle |
| shake | 400ms | Error shake |

---

## Checklist

- ✅ All states: idle, hover/focus, pressed, loading, success, error, disabled
- ✅ Only `transform` and `opacity` are animated
- ✅ Same timings shared by both buttons
- ✅ Fast clicks are ignored while loading (spam test)
- ✅ Hovering in and out during an animation doesn't break it
- ✅ Works with the keyboard (`Tab`, `Enter`, `Space`)
- ✅ Screen readers hear "Sending…", "Sent" and "Failed to send, retry"
- ✅ Reduced motion: nothing moves, but colors, text and ✓ still change
- ✅ Good contrast in light and dark mode
- ✅ `npm run build`, `npx tsc --noEmit` and `npm run lint` pass with zero errors

---

## Deploy on Vercel

1. Push the repo to GitHub.
2. On Vercel, click **Add New → Project** and pick the repo.
3. Set **Root Directory** to `Week6_Task/Buttons_with_a_brain`.
4. Click **Deploy**, then add the link to **Live demo** above.
