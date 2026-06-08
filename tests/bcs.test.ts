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

describe("bcs: thousands grouping (NBSP, ≥5 digits)", () => {
  // Smoke-test v1.0.2 #L4: BCS rules не вызывали groupThousands и числа от
  // 5 цифр оставались слитно — `1234567` вместо `1 234 567`.
  test("1234567 → 1 234 567", () =>
    E("thousands", "1234567 stanovnika", `1${NBSP}234${NBSP}567 stanovnika`));
  test("4-значный год не группируется", () =>
    E("thousands", "godina 2026", "godina 2026"));
});
