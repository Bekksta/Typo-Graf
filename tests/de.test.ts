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

describe("de: compound abbreviations", () => {
  test("z.B. → z.NBSPB.", () =>
    E("zb", "z.B. das ist gut", `z.${NBSP}B.${NBSP}das ist gut`));
  test("u.a. → u.NBSPa.", () =>
    E("ua", "Es gibt u.a. Äpfel", `Es gibt u.${NBSP}a.${NBSP}Äpfel`));
  test("d.h. → d.NBSPh.", () =>
    E("dh", "Hier, d.h. dort", `Hier, d.${NBSP}h.${NBSP}dort`));
  test("bzw. → bzw.NBSP", () =>
    E("bzw", "Hund bzw. Katze", `Hund bzw.${NBSP}Katze`));
});

describe("de: thousands grouping with dot", () => {
  test("1234567 → 1.234.567", () =>
    E("groupThousandsDot", "Budget 1234567 Euro", "Budget 1.234.567 Euro"));
  test("1.0.0 (версия) не трогается", () =>
    E("noVersion", "Version 1.0.0", "Version 1.0.0"));
  test("3,14 не трогается", () =>
    E("noDecimal", "Pi ist 3,14", "Pi ist 3,14"));
});
