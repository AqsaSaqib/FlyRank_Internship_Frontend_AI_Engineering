# DevLog Assistant: Testing Pass (Week 6)

DevLog Assistant is the AI chat in my DevLog app. This week I wrote
**tests** for it, so I know the chat still works after I change something.
GitHub runs the tests on every push, and a failing test blocks the merge.

## What I tested

- **Chat messages**: user text, markdown answers, the "Thought process"
  box, tool cards, broken tool calls, empty replies, and the Copy button.
- **Chat states**: waiting → streaming → done, plus errors (mid-stream,
  429, 500) and Retry.
- **Message box**: empty messages can't be sent, Enter sends, Shift+Enter
  adds a new line, Escape stops, and messages that are too long show an error.
- **Tool cards**: loading, results, no results, and error + Retry.
- **API route**: bad requests get a 400 error, and good ones stream a reply.
- **One browser test** of the main flow: open the app → click an example →
  send → see the reply and tool card → go to the Logs page.

## How to run

```bash
npm install
```

```bash
npm run test:run
```

```bash
npm run test:e2e
```

`test:run` runs the unit tests in a few seconds. `test:e2e` builds the
app and runs the browser tests.

## My test files

| File | What it checks | Tests |
| --- | --- | --- |
| `components/chat/Message.test.tsx` | Every message type, empty reply, Copy | 8 |
| `components/chat/Chat.test.tsx` | **Pending, streaming, done, error, retry** | 6 |
| `components/chat/Composer.test.tsx` | The message box (my form) | 9 |
| `components/tools/ToolPart.test.tsx` | Tool cards: loading, results, empty, error | 9 |
| `components/tools/format.test.ts` | Date and number helpers | 14 |
| `app/api/chat/route.test.ts` | The API route | 9 |
| `e2e/happy-path.spec.ts` | The main flow in a real browser | 1 |
| `e2e/chat-errors.spec.ts` | Errors in a real browser (from Week 5) | 3 |

**Total: 55 unit tests + 4 browser tests, all passing.**

## No real AI in tests

Real AI is slow, costs money, and gives a different answer every time.
So my tests never use it:

- The chat tests use a **fake `/api/chat`** that sends a stream I write
  by hand. I can pause the stream in the middle to check each state.
- The route and browser tests use the app's built-in **mock AI**
  (`CHAT_PROVIDER=mock`).
- A **safety net** in `vitest.setup.ts` removes the API keys. If any test
  tries to call Anthropic or Gemini, it fails with
  *"Real AI API called in a test"*.

## Why I find things by role and label

My tests find things the way a user does:

```ts
screen.getByRole("button", { name: "Retry last response" });
```

I never use test IDs, CSS classes or snapshots. So if I rename a class,
no test breaks. A test only fails when something the user can see or hear
changes. ESLint fails if a test uses `getByTestId`, `querySelector` or
`data-testid`.

## CI (GitHub Actions)

File: `.github/workflows/week6-tests.yml` (inside this Week 6 folder).

1. **unit** job: lint → typecheck → unit tests
2. **e2e** job: runs after unit passes. It installs Chromium and runs the
   browser tests. If they fail, it uploads the report.

It needs no secrets because everything uses the mock AI.

![CI passing](docs/ci-passing.png)

### Turn on branch protection

Settings → Branches → **Add rule** for `main` → tick **Require status
checks to pass before merging** → add **unit** and **e2e** → Save.

## How my AI assistant fixed a failing test

1. I broke something on purpose: I deleted `aria-invalid={tooLong}` from
   `components/chat/Composer.tsx`.
2. The AI ran `npm run test:run`, and 1 test failed:

   ```
   × flags a message over 8000 characters and blocks sending until it's shortened
   Expected: aria-invalid="false"   Received: null
   Tests  1 failed | 54 passed (55)
   ```

3. The test was right, so the AI fixed the **code** and put the line back.
4. It ran the tests again and all of them passed: `Tests 55 passed (55)`.

The page looked exactly the same with the bug, but screen readers lost
the "invalid" message. Only the test noticed.

## Tech used

Next.js 16, React 19, AI SDK, Vitest, React Testing Library, Playwright,
GitHub Actions.
