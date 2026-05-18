import { describe, test } from "vitest";
import { applyYoFix } from "../src/rules/yoPairs";
import { expectTransform } from "./_helpers/expect";

const M = "yo";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyYoFix);
}

describe("yo: white-list replacement", () => {
  test("ребенок → ребёнок", () => E("yoFix", "ребенок", "ребёнок"));
  test("Ребенок keeps capital", () =>
    E("yoFixCase", "Ребенок", "Ребёнок"));
  test("ВЕДЕМ → Ведём (preserveCase 'first' — только первая буква)", () =>
    E("yoFixUpper", "ВЕДЕМ", "Ведём"));
  test("слова вне словаря остаются", () =>
    E("yoFixSkip", "переменная", "переменная"));
  test("не трогает соседние буквы (переведена ≠ слово из словаря)", () =>
    E("yoFixBoundary", "переведена", "переведена"));
  test("'все' остаётся (omonym с 'весь')", () =>
    E("yoFixOmonym", "все", "все"));
  test("'шел' → 'шёл' (safe, без омонимов)", () =>
    E("yoFixSafe", "шел", "шёл"));
  test("'елка' → 'ёлка' (типичная safe-замена)", () =>
    E("yoFixSafeBig", "елка", "ёлка"));
  test("'учет' → 'учёт' (бизнес-лексика)", () =>
    E("yoFixBiz", "учет", "учёт"));
});
