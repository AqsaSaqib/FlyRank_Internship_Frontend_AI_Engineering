import { expect, test, type Page, type Request } from "@playwright/test";

/**
 * The chat endpoint is mocked with hand-written UI message streams (the same
 * SSE protocol `useChat` reads), so each failure is exact and repeatable.
 */

const sse = (chunks: object[], done = true) =>
  chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + (done ? "data: [DONE]\n\n" : "");

const STREAM_HEADERS = {
  "content-type": "text/event-stream",
  "x-vercel-ai-ui-message-stream": "v1",
};

const PARTIAL = "Here's a draft of today's entry: you fixed the logout bug and";

/** Tokens, then an upstream error mid-stream (what the route sends when the provider fails). */
const midStreamFailure = sse(
  [
    { type: "start", messageId: "a-failed" },
    { type: "text-start", id: "t1" },
    ...PARTIAL.split(/(?<= )/).map((delta) => ({ type: "text-delta", id: "t1", delta })),
    { type: "error", errorText: JSON.stringify({ error: "Something went wrong on our side.", code: "unknown" }) },
  ],
  false,
);

const successfulReply = sse([
  { type: "start", messageId: "a-ok" },
  { type: "text-start", id: "t1" },
  { type: "text-delta", id: "t1", delta: "Recovered: here is the full entry." },
  { type: "text-end", id: "t1" },
  { type: "finish" },
]);

async function freshChat(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "What did you work on today?" })).toBeVisible();
}

async function send(page: Page, text: string) {
  const input = page.getByLabel("Message the DevLog Assistant");
  await input.fill(text);
  await input.press("Enter");
}

test("mid-stream failure shows ChatError, and Retry re-sends only the last response", async ({ page }) => {
  const requests: Request[] = [];
  await page.route("**/api/chat", async (route) => {
    requests.push(route.request());
    await route.fulfill({
      status: 200,
      headers: STREAM_HEADERS,
      body: requests.length === 1 ? midStreamFailure : successfulReply,
    });
  });

  await freshChat(page);
  await send(page, "Help me write today's log entry");

  // The partial reply stays, marked incomplete, with a designed error under it.
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log.getByText(PARTIAL)).toBeVisible();
  await expect(log.getByText("Incomplete response")).toBeVisible();
  // Scoped to the log: Next's route announcer is also role="alert".
  const alert = log.getByRole("alert");
  await expect(alert).toContainText("Something went wrong");
  await expect(alert).toContainText("The partial reply above is kept.");
  const retry = page.getByRole("button", { name: "Retry last response" });
  await expect(retry).toBeVisible();

  // Double click: still exactly one retry request.
  await retry.dblclick();

  await expect(log.getByText("Recovered: here is the full entry.")).toBeVisible();
  await expect(log.getByRole("alert")).toHaveCount(0);
  await expect(log.getByText(PARTIAL)).toHaveCount(0);
  expect(requests).toHaveLength(2);

  // Only the last assistant response was retried: same conversation, no new user message.
  const first = requests[0].postDataJSON();
  const second = requests[1].postDataJSON();
  expect(first.trigger).toBe("submit-message");
  expect(second.trigger).toBe("regenerate-message");
  expect(second.messages.map((m: { id: string; role: string }) => [m.id, m.role])).toEqual(
    first.messages.map((m: { id: string; role: string }) => [m.id, m.role]),
  );
  expect(second.messages.at(-1).role).toBe("user");
  await expect(log.getByText("Help me write today's log entry")).toHaveCount(1);
});

test("429 shows a countdown and Retry unlocks when it ends", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/chat", async (route) => {
    calls += 1;
    if (calls === 1) {
      await route.fulfill({
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "2" },
        body: JSON.stringify({ error: "Too many requests right now.", code: "rate_limited", retryAfter: 2 }),
      });
    } else {
      await route.fulfill({ status: 200, headers: STREAM_HEADERS, body: successfulReply });
    }
  });

  await freshChat(page);
  await send(page, "Hello");

  const alert = page.getByRole("log", { name: "Conversation" }).getByRole("alert");
  await expect(alert).toContainText("Too many requests");
  const retry = page.getByRole("button", { name: /Retry last response/ });
  await expect(retry).toHaveAttribute("aria-disabled", "true");
  await expect(retry).toHaveAttribute("aria-disabled", "false", { timeout: 5_000 });
  await expect(alert).toContainText("You can try again now.");
  await retry.click();
  await expect(page.getByText("Recovered: here is the full entry.")).toBeVisible();
});

test("offline: banner, Send disabled, and both recover automatically", async ({ page, context }) => {
  await freshChat(page);
  const input = page.getByLabel("Message the DevLog Assistant");
  await input.fill("Draft while offline");

  await context.setOffline(true);
  await expect(page.getByText("You're offline. Sending is paused")).toBeVisible();
  await expect(page.getByRole("button", { name: /Send message/ })).toBeDisabled();

  await context.setOffline(false);
  await expect(page.getByText("You're offline. Sending is paused")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
  await expect(input).toHaveValue("Draft while offline");
});
