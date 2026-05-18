import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: false,
    globalSetup: "./tests/_helpers/globalSetup.ts",
    reporters: ["default"],
  },
});
