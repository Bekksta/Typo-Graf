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
