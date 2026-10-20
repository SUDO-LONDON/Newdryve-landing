import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // `server-only` throws outside a React Server Components build; the
      // tests import server modules directly.
      "server-only": path.join(root, "test/stubs/server-only.ts"),
    },
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    restoreMocks: true,
  },
});
