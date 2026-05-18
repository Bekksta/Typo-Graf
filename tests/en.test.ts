import { describe, test } from "vitest";
import { applyEnglishRules } from "../src/rules/en";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";
const EM_DASH = "—";

const M = "en";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyEnglishRules);
}

describe("en: smart quotes", () => {
  test('"hello" → “hello”', () =>
    E("smartQuotes", '"hello"', "“hello”"));
  test("alternating pairs (and — service word: NBSP after)", () =>
    E("smartQuotes", '"a" and "b"', "“a” and “b”"));
});

describe("en: apostrophes", () => {
  test("don't → don’t", () =>
    E("apostrophes", "don't", "don’t"));
  test("word-end apostrophe", () =>
    E("apostrophes", "lovers'", "lovers’"));
});

describe("en: primes", () => {
  test("12'' → 12″", () => E("doublePrime", "12''", "12″"));
  test("12' → 12′", () => E("singlePrime", "12'", "12′"));
});

describe("en: em-dash from --", () => {
  test("foo--bar → foo—bar", () =>
    E("emDash", "foo--bar", "foo" + EM_DASH + "bar"));
  test("with surrounding spaces preserved", () =>
    E("emDash", "foo -- bar", "foo " + EM_DASH + " bar"));
});

describe("en: ranges (en dash)", () => {
  test("10-12 km", () =>
    E("range", "10-12 km", `10–12${NBSP}km`));
});

describe("en: number + unit (NBSP)", () => {
  test("15 km", () => E("numUnit", "15 km", `15${NBSP}km`));
  test("20 %", () => E("numUnit", "20 %", `20${NBSP}%`));
});

describe("en: currency", () => {
  test("$1234.5 → $1,234.5", () =>
    E("currency", "$1234.5", "$1,234.5"));
  test("trailing currency: 300 $ → 300 NBSP $", () =>
    E("currency", "300 $", `300${NBSP}$`));
});

describe("en: service words glue with NBSP", () => {
  test("a dog", () => E("serviceWords", "a dog", `a${NBSP}dog`));
  test("the cat", () =>
    E("serviceWords", "the cat", `the${NBSP}cat`));
  test("of London", () =>
    E("serviceWords", "of London", `of${NBSP}London`));
});
