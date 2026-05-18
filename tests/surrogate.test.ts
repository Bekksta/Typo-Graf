import { describe, test } from "vitest";
import { runPipeline } from "./_helpers/pipeline";
import { expectTransform } from "./_helpers/expect";

const M = "surrogate";
const NBSP = " ";

// Emoji и символы вне BMP — surrogate pairs (.length считает их как 2).
// Регэкспы должны их не задевать и не ломать на половине пары.

describe("surrogate: emoji passes through", () => {
  test("узел с эмодзи остаётся валидным", () => {
    const input = "Привет 🌍 мир";
    const out = runPipeline(input, "ru");
    expectTransform(M, "emojiPass", input, out, () => out);
    // Проверяем что эмодзи на месте (без обрезки половины пары)
    if (!out.includes("🌍")) {
      throw new Error("emoji lost or broken");
    }
  });

  test("эмодзи рядом с правилами не ломает их", () => {
    const input = "ребенок 🎈 20 кг";
    const out = runPipeline(input, "ru");
    // Ёфикация работает, NBSP перед «кг» работает
    expectTransform(M, "emojiWithRules", input, `ребёнок 🎈 20${NBSP}кг`, () => out);
  });
});

describe("surrogate: math symbols (ℳ, 𝐀)", () => {
  test("Mathematical Bold (U+1D400 = 𝐀) — non-BMP — не теряется", () => {
    const input = "Уравнение 𝐀 решено";
    const out = runPipeline(input, "ru");
    if (!out.includes("𝐀")) {
      throw new Error("non-BMP math symbol lost");
    }
    expectTransform(M, "mathBold", input, out, () => out);
  });
});

describe("surrogate: long emoji sequences", () => {
  test("семейка эмодзи (с ZWJ) не ломается", () => {
    const input = "👨‍👩‍👧 — это семья";
    const out = runPipeline(input, "ru");
    if (!out.includes("👨‍👩‍👧")) {
      throw new Error("ZWJ emoji sequence broken");
    }
    expectTransform(M, "zwjFamily", input, out, () => out);
  });
});
