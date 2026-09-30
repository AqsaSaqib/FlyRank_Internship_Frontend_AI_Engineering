import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * End-to-end tests against a production build (closest to what users get,
 * and no dev-only console noise). The chat runs on the scripted mock model,
 * so no API key or tokens are needed.
 *
 * Uses the locally installed Google Chrome (`channel: "chrome"`). On a CI
 * runner without Chrome: `npx playwright install chrome`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Generous waits: the tests stream real replies and may share the machine with a build.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { CHAT_PROVIDER: "mock", DEVLOG_TOOL_LATENCY_MS: "0" },
  },
});
