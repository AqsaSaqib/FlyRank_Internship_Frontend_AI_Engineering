import { expect, test, type ConsoleMessage } from "@playwright/test";

/**
 * The happy path against the real route handler (mock model): welcome →
 * example prompt → streamed reply → tool call → logs page. It must not log a
 * single console error or warning (hydration, keys, a11y, preloads…).
 */
test("happy path produces zero console errors or warnings", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Example prompts fill the composer; they never auto-send.
  await page.getByRole("button", { name: /Plan tomorrow/ }).click();
  const input = page.getByLabel("Message the DevLog Assistant");
  await expect(input).toHaveValue("What should I focus on tomorrow?");
  await expect(input).toBeFocused();
  await expect(page.getByText("You said:")).toHaveCount(0);

  await input.press("Enter");
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log.getByText("Based on your recent entries")).toBeVisible();
  await expect(log.getByRole("button", { name: "Copy" })).toBeVisible();

  // A tool call (queryLogs) renders its result card.
  await input.fill("What did I work on last week?");
  await input.press("Enter");
  await expect(log.getByText(/You logged \*?\*?\d+/)).toBeVisible();

  await page.getByRole("link", { name: "Logs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your logs" })).toBeVisible();

  // Give late warnings (e.g. unused preloads, a few seconds after load) time to surface.
  await page.waitForTimeout(3_500);
  expect(problems).toEqual([]);
});
