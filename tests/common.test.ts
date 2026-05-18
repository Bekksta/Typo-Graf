import { describe, test } from "vitest";
import { applyCommonRules } from "../src/rules/common";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";
const WJ = "⁠";

const M = "common";
const run = (input: string) => (s: string) => applyCommonRules(s);

function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyCommonRules);
}

describe("common: ellipsis", () => {
  test("triple dot → ellipsis (with auto space before letter)", () =>
    E("ellipsis", "a...b", "a… b"));
  test("ellipsis trims left space", () =>
    E("ellipsis", "слово ...", "слово…"));
  test("ellipsis adds space before letter/digit", () =>
    E("ellipsis", "abc…def", "abc… def"));
  test("idempotent on real ellipsis", () => E("ellipsis", "уже…", "уже…"));
});

describe("common: percent", () => {
  test("digit + space + % → digit NBSP % (по ТЗ — NBSP, не удаление)", () =>
    E("percent", "20 %", `20${NBSP}%`));
  test("percent followed by ellipsis → WJ + ellipsis", () =>
    E("percentEllipsis", "20%…", "20%" + WJ + "…"));
});

describe("common: numeric ranges (en dash)", () => {
  test("dash between numbers → en dash", () =>
    E("range", "10-12", "10–12"));
  test("with spaces around", () => E("range", "10 - 12", "10–12"));
  test("range + unit (NBSP after dash)", () =>
    E("range", "10-12 кг", "10–12" + NBSP + "кг"));
});

describe("common: double spaces", () => {
  test("collapse 2 spaces to 1", () =>
    E("doubleSpace", "a  b", "a b"));
  test("collapse 4 spaces", () => E("doubleSpace", "a    b", "a b"));
});

describe("common: number + unit (NBSP)", () => {
  test("кг", () => E("numUnitRu", "12 кг", "12" + NBSP + "кг"));
  test("%", () => E("numUnitRu", "300 ₽", "300" + NBSP + "₽"));
  test("digit + г.код — abbreviation 'г.' is glued (lookahead allows '.')", () =>
    E("numUnitRu", "12 г.код", `12${NBSP}г.код`));
});

describe("common: primes", () => {
  test("double prime (two apostrophes)", () =>
    E("doublePrime", "10''", "10″"));
  test("single prime (one apostrophe)", () =>
    E("singlePrime", "10'", "10′"));
});

describe("common: degrees", () => {
  test("digit + deg → °", () => E("degree", "45 deg", "45°"));
  test("Deg case-insensitive", () => E("degree", "90 Deg", "90°"));
});
