import { describe, test } from "vitest";
import { applyPortugueseRules } from "../src/rules/pt";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "pt";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyPortugueseRules);
}

describe("pt: smart quotes “…”", () => {
  test('"olá" → “olá”', () => E("quotes", '"olá"', "“olá”"));
  test("preserves «…» when already present (PT-PT)", () =>
    E("quotes", "«olá»", "«olá»"));
});

describe("pt: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
  test("20 %", () => E("numUnit", "20 %", `20${NBSP}%`));
  test("R$ 100 → R$NBSP100? brazilian currency", () =>
    E("numCurrencyBR", "preço 100 R$", `preço 100${NBSP}R$`));
});

describe("pt: thousands grouping", () => {
  test("1234567 → 1 234 567", () =>
    E("groupThousands", "venda 1234567 reais", `venda 1${NBSP}234${NBSP}567 reais`));
});
