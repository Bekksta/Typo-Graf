import { describe, test } from "vitest";
import { applyDutchRules } from "../src/rules/nl";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "nl";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyDutchRules);
}

describe('nl: quotes „…"', () => {
  test('"hallo" → „hallo"', () => E("quotes", '"hallo"', "„hallo”"));
  test("preserves „…\" when already present", () =>
    E("quotes", "„hallo”", "„hallo”"));
});

describe("nl: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
  test("20 %", () => E("numUnit", "20 %", `20${NBSP}%`));
});

describe("nl: decimal comma untouched", () => {
  test("3,14 → 3,14", () => E("decimal", "Pi is 3,14", "Pi is 3,14"));
});

describe("nl: thousands grouping", () => {
  test("1234567 → 1 234 567", () =>
    E("groupThousands", "budget 1234567 euro", `budget 1${NBSP}234${NBSP}567 euro`));
});
