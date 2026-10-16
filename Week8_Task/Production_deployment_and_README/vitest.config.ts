import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

/**
 * Unit and component tests (Vitest + React Testing Library).
 *
 * - jsdom for components; a test file can opt into Node with
 *   `// @vitest-environment node` (the route handler test does).
 * - "@/…" resolves like tsconfig's paths.
 * - "server-only" throws when imported outside a React Server environment,
 *   so it's swapped for an empty module: the route test imports server code.
 * - e2e/ belongs to Playwright, not Vitest.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    // Streamdown and the AI SDK ship ESM with CSS imports; let Vite transform them.
    server: { deps: { inline: ["streamdown"] } },
  },
});
