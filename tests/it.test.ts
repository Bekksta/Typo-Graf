import { describe, test } from "vitest";
import { applyItalianRules } from "../src/rules/it";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "it";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyItalianRules);
}

describe("it: guillemets «…»", () => {
  test('"ciao" → «ciao»', () => E("quotes", '"ciao"', "«ciao»"));
  test("preserves «…» when already present", () =>
    E("quotes", "«ciao»", "«ciao»"));
});

describe("it: short articles/prepositions glue with NBSP", () => {
  test("il gatto", () => E("article", "il gatto", `il${NBSP}gatto`));
  test("la casa", () => E("article", "la casa", `la${NBSP}casa`));
  test("di Roma", () => E("prep", "di Roma", `di${NBSP}Roma`));
  test("con te", () => E("prep", "con te", `con${NBSP}te`));
});

describe("it: abbreviations with dot glue with NBSP", () => {
  test("Sig. Rossi", () =>
    E("abbr", "Sig. Rossi", `Sig.${NBSP}Rossi`));
  test("Dott. Verdi", () =>
    E("abbr", "Dott. Verdi", `Dott.${NBSP}Verdi`));
});

describe("it: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
  test("20 %", () => E("numUnit", "20 %", `20${NBSP}%`));
});

describe("it: thousands grouping", () => {
  test("1234567 → 1 234 567", () =>
    E("groupThousands", "budget 1234567 euro", `budget 1${NBSP}234${NBSP}567 euro`));
});
