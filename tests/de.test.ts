import { describe, test } from "vitest";
import { applyGermanRules } from "../src/rules/de";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "de";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyGermanRules);
}

describe("de: quotes „…“", () => {
  test('"Hallo" → „Hallo“', () =>
    E("quotes", '"Hallo"', "„Hallo“"));
  test("preserves »…« when already present", () =>
    E("quotes", "»Hallo«", "»Hallo«"));
});

describe("de: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
  test("20 %", () => E("numUnit", "20 %", `20${NBSP}%`));
});

describe("de: decimal comma untouched", () => {
  test("3,14 → 3,14", () => E("decimal", "Pi ist 3,14", "Pi ist 3,14"));
});
