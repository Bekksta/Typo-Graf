import { describe, test } from "vitest";
import { applyPolishRules } from "../src/rules/pl";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "pl";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyPolishRules);
}

describe('pl: quotes „…”', () => {
  test('"witaj" → „witaj”', () => E("quotes", '"witaj"', "„witaj”"));
  test("preserves „…” when already present", () =>
    E("quotes", "„witaj”", "„witaj”"));
});

describe("pl: single-letter words glue with NBSP", () => {
  test("a kot", () => E("oneLetter", "a kot", `a${NBSP}kot`));
  test("i pies", () => E("oneLetter", "i pies", `i${NBSP}pies`));
  test("w domu", () => E("oneLetter", "w domu", `w${NBSP}domu`));
  test("z tobą", () => E("oneLetter", "z tobą", `z${NBSP}tobą`));
  test("ze szkoły (фонетический вариант)", () =>
    E("oneLetterPhon", "ze szkoły", `ze${NBSP}szkoły`));
});

describe("pl: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
  test("20 %", () => E("numUnit", "20 %", `20${NBSP}%`));
  test("100 zł", () => E("numCurrency", "100 zł", `100${NBSP}zł`));
});

describe("pl: decimal comma untouched", () => {
  test("3,14 → 3,14", () => E("decimal", "Pi to 3,14", "Pi to 3,14"));
});

describe("pl: thousands grouping", () => {
  test("1234567 → 1 234 567", () =>
    E("groupThousands", "budżet 1234567 zł", `budżet 1${NBSP}234${NBSP}567${NBSP}zł`));
});
