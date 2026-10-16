import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const CI = !!process.env.CI;

/**
 * End-to-end tests against a production build (closest to what users get,
 * and no dev-only console noise). The chat runs on the scripted mock model,
 * so no API key or tokens are needed.
 *
 * Browser:
 *   CI    → Playwright's bundled Chromium (`npx playwright install --with-deps chromium`)
 *   local → the installed Google Chrome (`channel: "chrome"`), so no extra download.
 *           Set PW_BUNDLED=1 to use the bundled Chromium locally too.
 */
const useBundledChromium = CI || !!process.env.PW_BUNDLED;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // CI: annotations in the GitHub UI, plus an HTML report uploaded as an artifact on failure.
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  // Generous waits: the tests stream real replies and may share the machine with a build.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(useBundledChromium ? {} : { channel: "chrome" }) },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 240_000,
    // Mock model only: CI has no API keys, and tests must never spend tokens.
    env: { CHAT_PROVIDER: "mock", DEVLOG_TOOL_LATENCY_MS: "0", ANTHROPIC_API_KEY: "", GEMINI_API_KEY: "" },
  },
});
