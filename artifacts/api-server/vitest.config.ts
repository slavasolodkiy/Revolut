import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/__tests__/**/*.test.ts"],
    // Ensure mocks are processed before imports
    sequence: {
      setupFiles: "list",
    },
  },
});
