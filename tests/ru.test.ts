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

describe("ru: date ranges (em-dash, no spaces)", () => {
  test("1991-1995 → 1991—1995 (годы)", () =>
    E("yearRange", "1991-1995", "1991—1995"));
  test("1991–1995 → 1991—1995 (en-dash → em-dash)", () =>
    E("yearRange", "1991–1995", "1991—1995"));
  test("январь-март → январь—март", () =>
    E("monthRange", "январь-март", "январь—март"));
  test("сентября-декабря → сентября—декабря (родительный)", () =>
    E("monthRangeGen", "с сентября-декабря", `с${NBSP}сентября—декабря`));
  test("числовой диапазон 10-12 не превращается в em-dash (через ru-rules — без common)", () =>
    E("noNumRange", "10-12", "10-12"));
});

describe("ru: и/или normalization", () => {
  test("'и / или' → 'и/или' (без пробелов)", () =>
    E("andOr", "и / или", "и/или"));
  test("'и/или' остаётся", () =>
    E("andOrIdempotent", "и/или", "и/или"));
});

describe("ru: negative numbers in financial context (− U+2212)", () => {
  test("-300 ₽ → −300 ₽", () =>
    E("negCurrency", "-300 ₽", "−300 ₽"));
  test("-15 % → −15 %", () =>
    E("negPercent", "-15 %", "−15 %"));
  test("-2 °C → −2 °C", () =>
    E("negDeg", "-2 °C", "−2 °C"));
  test("обычный дефис в списке -5 пункт остаётся", () =>
    E("noMinus", "-5 пункт", "-5 пункт"));
});

describe("ru: thousands grouping", () => {
  test("1234567 → 1 234 567 (NBSP)", () =>
    E("groupThousands", "Бюджет 1234567 рублей", `Бюджет 1${NBSP}234${NBSP}567 рублей`));
  test("12345 → 12 345 (минимум 5 цифр)", () =>
    E("groupThousands", "ровно 12345", `ровно 12${NBSP}345`));
  test("год 1991 не трогаем", () =>
    E("noGroupYear", "В 1991 году", `В${NBSP}1991 году`));
  test("четырёхзначное 1024 не трогаем", () =>
    E("noGroupSmall", "ровно 1024", "ровно 1024"));
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
