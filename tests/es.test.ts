import { describe, test } from "vitest";
import { applySpanishRules } from "../src/rules/es";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";

const M = "es";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applySpanishRules);
}

describe("es: quotes “…”", () => {
  test('"hola" → “hola”', () =>
    E("quotes", '"hola"', "“hola”"));
  test("preserves «…» when already present", () =>
    E("quotes", "«hola»", "«hola»"));
});

describe("es: number + unit (NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NBSP}km`));
});

describe("es: paired ¿…? / ¡…!", () => {
  test("¿Cómo estás? без изменений", () =>
    E("alreadyPaired", "¿Cómo estás?", "¿Cómo estás?"));
  test("Cómo estás? → ¿Cómo estás?", () =>
    E("addOpening", "Cómo estás?", "¿Cómo estás?"));
  test("Hola! → ¡Hola!", () =>
    E("addOpeningBang", "Hola!", "¡Hola!"));
  test("Multi: Hola. Cómo estás? → Hola. ¿Cómo estás?", () =>
    E("multi", "Hola. Cómo estás?", "Hola. ¿Cómo estás?"));
});

describe("es: thousands grouping (NBSP per RAE)", () => {
  test("1234567 → 1 234 567", () =>
    E("groupThousands", "presupuesto 1234567 euros", `presupuesto 1${NBSP}234${NBSP}567 euros`));
  test("1234 (4 цифры) — не группируется", () =>
    E("groupThousandsShort", "1234 unidades", "1234 unidades"));
  test("12345 (5 цифр) — граничный кейс", () =>
    E("groupThousandsBoundary", "12345 registros", `12${NBSP}345 registros`));
  test("'1234567 €' — число группируется + NBSP перед валютой", () =>
    E("groupThousandsCurrency", "1234567 €", `1${NBSP}234${NBSP}567${NBSP}€`));
  test("año '2024' — не трогаем", () =>
    E("groupThousandsYear", "en 2024", "en 2024"));
});
