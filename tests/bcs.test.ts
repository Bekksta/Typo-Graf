import { describe, test } from "vitest";
import { applyBCSRules } from "../src/rules/bcs";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "bcs";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyBCSRules);
}

describe("bcs: default quotes „…“", () => {
  test('"zdravo" → „zdravo“', () =>
    E("quotes", '"zdravo"', "„zdravo“"));
  test("preserves «…» when already present", () =>
    E("quotes", "«zdravo»", "«zdravo»"));
});

describe("bcs: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
});
