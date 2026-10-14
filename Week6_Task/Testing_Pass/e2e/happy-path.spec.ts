import { expect, test, type ConsoleMessage } from "@playwright/test";

/**
 * The primary flow, end to end, against the real route handler and the
 * scripted mock model (CHAT_PROVIDER=mock in playwright.config.ts):
 *
 *   open / → welcome → example prompt → send → streamed reply
 *   → tool card result → /logs
 *
 * Role, label and text locators only. It must not log a single console
 * error or warning (hydration, keys, a11y, preloads…).
 */
test("primary flow: example prompt → streamed reply with a tool card → logs page", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));

  // Open / with no saved conversation: the welcome screen.
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "What did you work on today?" })).toBeVisible();

  // An example prompt fills the composer; it never auto-sends.
  const examples = page.getByRole("list", { name: "Example prompts" });
  await examples.getByRole("button", { name: /Summarize my week/ }).click();
  const input = page.getByLabel("Message the DevLog Assistant");
  await expect(input).toHaveValue("Summarize what I logged this week");
  await expect(input).toBeFocused();
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log.getByText("You said:")).toHaveCount(0);

  // Send. While the reply streams the composer offers Stop instead of Send.
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(log.getByText("Summarize what I logged this week")).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop generating" })).toBeVisible();
  await expect(input).toHaveValue("");

  // The model calls queryLogs; its result renders as a card with real rows.
  const card = log.getByRole("region", { name: /^Found \d+ entr(y|ies)$/ });
  await expect(card).toBeVisible();
  await expect(card.getByText("Tool calling for DevLog Assistant")).toBeVisible();

  // Then it streams a short summary of the result, and the turn finishes.
  await expect(log.getByText(/You logged \d+ matching entr(y|ies)/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  await expect(log.getByRole("button", { name: "Copy" })).toBeVisible();

  // On to the logs page.
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Logs", exact: true }).click();
  await expect(page).toHaveURL(/\/logs$/);
  await expect(page.getByRole("heading", { name: "Your logs" })).toBeVisible();
  await expect(page.getByText("Tool calling for DevLog Assistant")).toBeVisible();

  // Give late warnings (e.g. unused preloads, a few seconds after load) time to surface.
  await page.waitForTimeout(3_500);
  expect(problems).toEqual([]);
});
