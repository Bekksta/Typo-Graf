import { describe, test } from "vitest";
import { applyRussianRules } from "../src/rules/ru";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";
const NBH = "‑"; // non-breaking hyphen
const EM_DASH = "—";

const M = "ru";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, applyRussianRules);
}

describe("ru: initials", () => {
  test("3-part initials: A. S. Pushkin", () =>
    E("initials", "А. С. Пушкин", `А.${NBSP}С.${NBSP}Пушкин`));
  test("2-part initials only", () =>
    E("initials", "А. С.", `А.${NBSP}С.`));
});

describe("ru: short prepositions glue with NBSP", () => {
  test("в дом", () => E("shortPreps", "в дом", `в${NBSP}дом`));
  test("на улице", () =>
    E("shortPreps", "на улице", `на${NBSP}улице`));
  test("к окну", () => E("shortPreps", "к окну", `к${NBSP}окну`));
  test("по плану", () =>
    E("shortPreps", "по плану", `по${NBSP}плану`));
});

describe("ru: smart quotes («»)", () => {
  test('"hello" → «hello»', () =>
    E("smartQuotes", '"привет"', "«привет»"));
  test("punctuation pulled inside closing", () =>
    E("smartQuotes", '"слово" ,', "«слово»,"));
  test("nested pair", () =>
    E("smartQuotes", '"a" и "b"', "«a» и «b»"));
});

describe("ru: hyphenated abbreviations (NBH + NBSP)", () => {
  test("г-н Иванов", () =>
    E("hyphenAbbr", "г-н Иванов", `г${NBH}н${NBSP}Иванов`));
  test("д-р Петров", () =>
    E("hyphenAbbr", "д-р Петров", `д${NBH}р${NBSP}Петров`));
});

describe("ru: composite abbreviations (т. д., и т. п., н. э.)", () => {
  test("и т.д. → и т. д.", () =>
    E("compositeAbbr", "и т.д.", `и${NBSP}т.${NBSP}д.`));
  test("т.п. → т. п.", () =>
    E("compositeAbbr", "т.п.", `т.${NBSP}п.`));
  test("до н.э. → до н. э.", () =>
    E("compositeAbbr", "до н.э.", `до${NBSP}н.${NBSP}э.`));
});

describe("ru: № and §", () => {
  test("№ 8 → №NBSP8", () => E("noSign", "№ 8", `№${NBSP}8`));
  test("§ 104 → §NBSP104", () =>
    E("paraSign", "§ 104", `§${NBSP}104`));
});

describe("ru: particles бы / ли / же", () => {
  test("сделал ли я (ли — и частица, и SERVICE_WORD, потому 2 NBSP)", () =>
    E("particles", "сделал ли я", `сделал${NBSP}ли${NBSP}я`));
  test("если бы", () =>
    E("particles", "если бы", `если${NBSP}бы`));
});

describe("ru: em-dash normalization", () => {
  test("foo -- bar → foo — bar", () =>
    E("emDash", "foo -- bar", `foo${NBSP}${EM_DASH} bar`));
  test("слово - слово (нецифровые) → em-dash", () =>
    E("emDash", "слово - слово", `слово${NBSP}${EM_DASH} слово`));
});

describe("ru: yo-fix (white-list)", () => {
  test("ребенок → ребёнок", () =>
    E("yoFix", "ребенок", "ребёнок"));
  test("все остаётся 'все' (есть омоним мн.ч. от 'весь' — не safe)", () =>
    E("yoFix", "все", "все"));
  test("шел → шёл", () => E("yoFix", "шел", "шёл"));
  test("преамбула без слов из списка не меняется", () =>
    E("yoFix", "мел", "мел"));
});

describe("ru: spaces before punctuation removed", () => {
  test("space before comma", () =>
    E("spaceBeforePunct", "слово , далее", "слово, далее"));
  test("space before question mark", () =>
    E("spaceBeforePunct", "что ?", "что?"));
  test("NBSP перед % НЕ срезается", () =>
    E("keepNbspBeforePercent", `20${NBSP}%`, `20${NBSP}%`));
  test("NBSP перед ₽ НЕ срезается", () =>
    E("keepNbspBeforeCurrency", `300${NBSP}₽`, `300${NBSP}₽`));
});
