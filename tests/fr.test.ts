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

describe("fr: em-dash with regular spaces", () => {
  test("foo -- bar → foo — bar", () =>
    E("emDash", "foo -- bar", "foo — bar"));
  test("word - word → word — word", () =>
    E("emDashSingle", "word - word", "word — word"));
});

describe("fr: thousands grouping (narrow NBSP)", () => {
  test("1234567 → 1 234 567 (NNBSP)", () =>
    E("groupThousands", "budget 1234567 euros", `budget 1${NNBSP}234${NNBSP}567 euros`));
});

describe("fr: smart apostrophe for liaison", () => {
  test("l'arbre → l’arbre", () =>
    E("apostrophe", "l'arbre", "l’arbre"));
  test("d'accord → d’accord", () =>
    E("apostrophe", "d'accord", "d’accord"));
  test("qu'on → qu’on", () =>
    E("apostrophe", "qu'on", "qu’on"));
  test("Aujourd'hui → Aujourd’hui", () =>
    E("apostrophe", "Aujourd'hui", "Aujourd’hui"));
});

describe("fr: number + unit/% with narrow NBSP", () => {
  test("20 % → 20 NNBSP %", () =>
    E("numUnit", "20 %", `20${NNBSP}%`));
  test("5 km → 5 NNBSP km", () =>
    E("numUnit", "5 km", `5${NNBSP}km`));
});
