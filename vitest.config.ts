import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  test: {
    environment: "node",

    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],

    coverage: {
      provider: "v8",

      reporter: ["text", "json", "html"],

      include: [
        "src/services/aoe4world/statistics.ts",
        "src/services/aoe4world/timeline.ts",
      ],

      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],

      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 75,
      },
    },
  },
});
