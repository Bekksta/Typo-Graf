import { describe, test } from "vitest";
import { applyUkrainianRules } from "../src/rules/uk";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";
const NNBSP = " ";

const M = "uk";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyUkrainianRules);
}

describe("uk: short prepositions glue with NBSP", () => {
  test("в дом", () => E("shortPreps", "в дім", `в${NBSP}дім`));
  test("і ось", () => E("shortPreps", "і ось", `і${NBSP}ось`));
});

describe("uk: quotes «…»", () => {
  test('"привіт" → «привіт»', () =>
    E("guillemets", '"привіт"', "«привіт»"));
});

describe("uk: tokens №/§/стор./рис./м. + narrow NBSP", () => {
  test("№ 5", () => E("tokenNum", "№ 5", `№${NNBSP}5`));
  test("стор. 12", () =>
    E("tokenNum", "стор. 12", `стор.${NNBSP}12`));
});

describe("uk: number + unit (narrow NBSP)", () => {
  test("5 km", () => E("numUnit", "5 km", `5${NNBSP}km`));
});
