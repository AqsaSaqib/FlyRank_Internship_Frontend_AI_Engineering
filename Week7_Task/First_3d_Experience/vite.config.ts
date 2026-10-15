import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // three + r3f + drei land in one lazy chunk; it's expected to be large,
    // so raise the warning above it rather than hide real regressions elsewhere.
    chunkSizeWarningLimit: 1200,
  },
});
