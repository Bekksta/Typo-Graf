import { describe, test } from "vitest";
import { applySerbianCyrillicRules } from "../src/rules/srCyrl";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "sr-Cyrl";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applySerbianCyrillicRules);
}

describe('sr-Cyrl: quotes „…"', () => {
  test('"здраво" → „здраво"', () =>
    E("quotes", '"здраво"', "„здраво”"));
});

describe("sr-Cyrl: NBSP before unit (как ru)", () => {
  test("5 кг", () => E("numUnit", "5 кг", `5${NBSP}кг`));
});

describe("sr-Cyrl: no ё-fication", () => {
  // Если в тексте есть «ребенок» (русское), мы НЕ ёфицируем — это сербский.
  // На деле: yo-fix словарь ищет слова без ё и заменяет; для сербских
  // (без ё в алфавите) слов в словаре нет, так что замены не будет.
  test("'ребенок' остаётся как есть", () =>
    E("noYoFix", "ребенок", "ребенок"));
});
