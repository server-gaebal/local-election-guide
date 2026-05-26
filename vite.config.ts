import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  define: {
    __APP_DATA_VERSION__: JSON.stringify(
      process.env.VITE_DATA_VERSION ?? process.env.GITHUB_SHA ?? `local-${Date.now()}`,
    ),
  },
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
