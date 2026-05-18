import { defineConfig, type Plugin } from "vitest/config";
import { readFileSync } from "node:fs";

// Vite/Vitest по умолчанию не понимает импорты .txt — повторяем то,
// что в проде делает esbuild через --loader:.txt=text.
const textLoader: Plugin = {
  name: "text-loader",
  transform(_code, id) {
    if (!id.endsWith(".txt")) return null;
    const raw = readFileSync(id, "utf-8");
    return {
      code: `export default ${JSON.stringify(raw)};`,
      map: null,
    };
  },
};

export default defineConfig({
  plugins: [textLoader],
  test: {
    include: ["tests/**/*.test.ts"],
    globals: false,
    globalSetup: "./tests/_helpers/globalSetup.ts",
    reporters: ["default"],
  },
});
