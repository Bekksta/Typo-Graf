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
  test("ВЕДЕМ → ВЕДЕМ (preserveCase first only)", () =>
    E("yoFixUpper", "ВЕДЕМ", "Ведём"));
  test("Слова вне списка остаются", () =>
    E("yoFixSkip", "переменная", "переменная"));
  test("Не трогает соседние буквы", () =>
    E("yoFixBoundary", "переведена", "переведена"));
});
