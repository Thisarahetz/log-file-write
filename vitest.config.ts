import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage"
    }
  }
});
