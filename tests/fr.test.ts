import { describe, test } from "vitest";
import { applyFrenchRules } from "../src/rules/fr";
import { expectTransform } from "./_helpers/expect";

const NNBSP = " "; // narrow nbsp

const M = "fr";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyFrenchRules);
}

describe("fr: guillemets « … » with narrow NBSP inside", () => {
  test('"Bonjour" → «NNBSP Bonjour NNBSP»', () =>
    E("guillemets", '"Bonjour"', `«${NNBSP}Bonjour${NNBSP}»`));
});

describe("fr: narrow NBSP before ; : ? ! »", () => {
  test("text ; → text NNBSP;", () =>
    E("punctNarrow", "text ;", `text${NNBSP};`));
  test("text ! → text NNBSP!", () =>
    E("punctNarrow", "Bonjour !", `Bonjour${NNBSP}!`));
  test("text : → text NNBSP:", () =>
    E("punctNarrow", "voir :", `voir${NNBSP}:`));
});

describe("fr: number + unit/% with narrow NBSP", () => {
  test("20 % → 20 NNBSP %", () =>
    E("numUnit", "20 %", `20${NNBSP}%`));
  test("5 km → 5 NNBSP km", () =>
    E("numUnit", "5 km", `5${NNBSP}km`));
});
