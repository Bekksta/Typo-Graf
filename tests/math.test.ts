import { describe, test } from "vitest";
import { applyMath } from "../src/rules/math";
import { expectTransform } from "./_helpers/expect";

const M = "math";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyMath);
}

describe("math: powers", () => {
  test("x^2 → x²", () => E("powers", "x^2", "x²"));
  test("a^10 → a¹⁰", () => E("powers", "a^10", "a¹⁰"));
  test("10^-3 → 10⁻³", () => E("powers", "10^-3", "10⁻³"));
  test("e^(x) → eˣ", () => E("powers", "e^(x)", "eˣ"));
  test("base^(n+1) keeps parens", () =>
    E("powers", "a^(n+1)", "a⁽ⁿ⁺¹⁾"));
});

describe("math: subscripts", () => {
  test("x_1 → x₁", () => E("subscripts", "x_1", "x₁"));
  test("a_i → aᵢ", () => E("subscripts", "a_i", "aᵢ"));
  test("x_(n+1) keeps parens (long)", () =>
    E("subscripts", "x_(n+1)", "x₍ₙ₊₁₎"));
});

describe("math: multiplication", () => {
  test("asterisk → middle dot (spaces normalized between tokens)", () =>
    E("mul", "2*3", "2 · 3"));
  test("normalize bullet • (spaces normalized between tokens)", () =>
    E("mul", "a•b", "a · b"));
  test("doesn't break **bold**", () =>
    E("mul", "**bold**", "**bold**"));
  test("chain a*b*c → a · b · c (все пары получают пробелы)", () =>
    E("mulChain", "a*b*c", "a · b · c"));
});

describe("math: protect minus does NOT touch em-dash", () => {
  test("'4 — u' остаётся em-dash, не превращается в '−'", () =>
    E("emDashUntouched", "4 — u", "4 — u"));
});

describe("math: pi is case-sensitive", () => {
  test("lowercase 'pi' → π", () => E("piCase", "pi", "π"));
  test("uppercase 'Pi' остаётся словом", () =>
    E("piCase", "Pi", "Pi"));
});

describe("math: division and fractions", () => {
  test("1/2 → ½", () => E("frac", "1/2", "½"));
  test("3/4 → ¾", () => E("frac", "3/4", "¾"));
  test("a/b → a / b (spaces)", () => E("div", "a/b", "a / b"));
});

describe("math: comparisons", () => {
  test("a!=b → a ≠ b", () => E("neq", "a!=b", "a ≠ b"));
  test("x<=y → x ≤ y", () => E("leq", "x<=y", "x ≤ y"));
  test("x>=y → x ≥ y", () => E("geq", "x>=y", "x ≥ y"));
  test("x=2 → x = 2", () => E("eq", "x=2", "x = 2"));
});

describe("math: signs", () => {
  test("+- → ±", () => E("plusMinus", "+-", "±"));
  test("-+ → ∓", () => E("minusPlus", "-+", "∓"));
});

describe("math: arrows", () => {
  test("-> → →", () => E("arrows", "-> ", "→ "));
  test("<- → ←", () => E("arrows", "<-", "←"));
  test("=> → ⇒", () => E("arrows", "=>", "⇒"));
  test("<=> → ⇔", () => E("arrows", "<=>", "⇔"));
  test("--> → ⟶", () => E("arrows", "-->", "⟶"));
});

describe("math: constants and functions", () => {
  test("pi → π", () => E("pi", "pi", "π"));
  test("sqrt(x) → √x", () => E("sqrt", "sqrt(x)", "√x"));
  test("inf → ∞", () => E("inf", "inf", "∞"));
  test("\\alpha → α", () => E("greek", "\\alpha", "α"));
  test("\\omega → ω", () => E("greek", "\\omega", "ω"));
  test("sin(x) → sin x", () => E("sin", "sin(x)", "sin x"));
  test("log10(x) → log₁₀ x", () =>
    E("logBase", "log10(x)", "log₁₀ x"));
  test("vec(a) → a⃗", () => E("vec", "vec(a)", "a⃗"));
});
