import { describe, test } from "vitest";
import * as fc from "fast-check";
import { runPipeline } from "./_helpers/pipeline";
import { recordCase } from "./_helpers/registry";
import type { Language } from "../src/types";

// Property: повторный прогон не должен ничего менять.
// f(f(x)) === f(x). Это базовое свойство правильно реализованной
// текстовой нормализации — иначе пользователь, запустивший плагин дважды,
// получит дрейф (NBSP двоятся, кавычки переворачиваются и т.п.).

const LANGS: Language[] = ["ru", "en", "fr", "de", "es", "uk", "bcs", "it", "pl", "pt", "nl", "sr-Cyrl"];

function runProperty(arb: fc.Arbitrary<string>, label: string): void {
  for (const lang of LANGS) {
    test(`${label} → fix-point per lang [${lang}]`, () => {
      fc.assert(
        fc.property(arb, (input) => {
          const once = runPipeline(input, lang);
          const twice = runPipeline(once, lang);
          const ok = twice === once;
          recordCase({
            module: "idempotency",
            rule: `${label}-${lang}`,
            status: ok ? "pass" : "fail",
            input,
            expected: once,
            actual: twice,
            mismatch: ok ? [] : [{ index: -1, expected: once, expectedCode: "first-pass", actual: twice, actualCode: "second-pass" }],
          });
          return ok;
        }),
        // numRuns подобран как разумный baseline: ловит большинство классов
        // багов, не превращая прогон тестов в минуты.
        { numRuns: 200 }
      );
    });
  }
}

describe("idempotency: ASCII + punctuation", () => {
  runProperty(
    fc.string({ minLength: 0, maxLength: 80 }),
    "ascii"
  );
});

describe("idempotency: typographic chars", () => {
  // Целенаправленно подмешиваем символы, на которых правила любят дрейфовать.
  const TYPO_CHARS = [
    " ", " ", " ", " ", // обычные/неразрывные/узкие пробелы
    "«", "»", "“", "”", "„", "‟",     // кавычки
    "—", "–", "‑", "-",               // тире / дефис / NB-hyphen
    "…", ".", "!", "?", ",", ":",
    "%", "$", "€", "₽", "°",
    "*", "/", "^", "_", "+", "=", "<", ">",
    "1", "2", "3", "a", "b", "c",
    "А", "Б", "В", "г", "м", "ё",
    "'", "\"",
  ];
  runProperty(
    fc.array(fc.constantFrom(...TYPO_CHARS), { minLength: 0, maxLength: 60 })
      .map((arr) => arr.join("")),
    "typo"
  );
});

describe("idempotency: mixed Russian phrases", () => {
  const WORDS = [
    "ребенок", "все", "шел", "учет", "ёлка",
    "в", "на", "по", "и", "т.д.", "т.е.",
    "А.", "С.", "Пушкин", "г-н", "Иванов",
    "20", "%", "300", "₽", "—", "--",
    "10-12", "кг", "№", "5", "§",
    "x^2", "1/2", "pi", "->", "sqrt(x)",
  ];
  runProperty(
    fc.array(fc.constantFrom(...WORDS), { minLength: 1, maxLength: 15 })
      .map((arr) => arr.join(" ")),
    "ru-phrases"
  );
});

describe("idempotency: URL/email guarded", () => {
  // Маска URL/email — критическое место: повторный прогон не должен
  // ничего менять внутри (или вокруг) URL.
  const tokens = ["See", "https://example.com/a-b?x=1...", "or", "foo@bar.com", "now", "."];
  runProperty(
    fc.array(fc.constantFrom(...tokens), { minLength: 1, maxLength: 8 })
      .map((arr) => arr.join(" ")),
    "url-email"
  );
});
