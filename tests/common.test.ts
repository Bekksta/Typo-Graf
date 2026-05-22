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

describe("common: ISO 8601 даты — защищены от en-dash", () => {
  const WJ = "⁠";
  test("'2024-12-31' → '2024[WJ]-[WJ]12[WJ]-[WJ]31' (ISO date)", () =>
    E("isoDate", "2024-12-31", `2024${WJ}-${WJ}12${WJ}-${WJ}31`));
  test("'2024-12-31T23:59:59' — datetime сохраняется", () =>
    E("isoDateTime", "2024-12-31T23:59:59", `2024${WJ}-${WJ}12${WJ}-${WJ}31T23:59:59`));
  test("'2024-12-31T23:59:59Z' — UTC timezone", () =>
    E("isoDateTimeUtc", "2024-12-31T23:59:59Z", `2024${WJ}-${WJ}12${WJ}-${WJ}31T23:59:59Z`));
  test("'2024-12-31T23:59:59+03:00' — offset не трогаем", () =>
    E("isoDateTimeTz", "2024-12-31T23:59:59+03:00", `2024${WJ}-${WJ}12${WJ}-${WJ}31T23:59:59+03:00`));
  test("ISO date внутри предложения", () =>
    E("isoInText", "Релиз 2024-12-31, готов.", `Релиз 2024${WJ}-${WJ}12${WJ}-${WJ}31, готов.`));
  test("ISO date рядом с year range — оба работают", () =>
    E("isoMixed", "Эпоха 1991-1995, релиз 2024-12-31.", `Эпоха 1991–1995, релиз 2024${WJ}-${WJ}12${WJ}-${WJ}31.`));
});

describe("common: год-месяц (YYYY-MM) — защищён от en-dash", () => {
  const WJ = "⁠";
  test("'2024-12' → '2024[WJ]-[WJ]12' (валидный месяц)", () =>
    E("ymBasic", "2024-12", `2024${WJ}-${WJ}12`));
  test("'2024-01' — пограничный месяц 01", () =>
    E("ymJan", "2024-01", `2024${WJ}-${WJ}01`));
  test("'1999-09' внутри предложения", () =>
    E("ymInText", "За 1999-09 отчёт сдан.", `За 1999${WJ}-${WJ}09 отчёт сдан.`));
  test("'2024-13' (невалидный месяц) — остаётся как numeric range", () =>
    E("ymInvalid", "2024-13", "2024–13"));
  test("'2024-1' (1-значный месяц) — НЕ ISO-формат, как range", () =>
    E("ymShortMonth", "2024-1", "2024–1"));
  test("'1999-2024' (year range, оба 4-значные) — остаётся en-dash", () =>
    E("ymYearRange", "1999-2024", "1999–2024"));
  test("'10-12' (короткие числа) — обычный range, en-dash", () =>
    E("ymNumRange", "10-12", "10–12"));
  test("'2024-12' рядом с полной ISO — оба защищены", () =>
    E("ymWithIso", "2024-12, ровно 2024-12-31.", `2024${WJ}-${WJ}12, ровно 2024${WJ}-${WJ}12${WJ}-${WJ}31.`));
});

describe("common: double spaces", () => {
  test("collapse 2 spaces to 1", () =>
    E("doubleSpace", "a  b", "a b"));
  test("collapse 4 spaces", () => E("doubleSpace", "a    b", "a b"));
  test("после точки конца предложения два пробела → один", () =>
    E("doubleSpaceAfterDot", "text.  Next sentence", "text. Next sentence"));
  test("после ! и ?", () =>
    E("doubleSpaceAfterBang", "Wait!  Here we go?  Yes.", "Wait! Here we go? Yes."));
});

describe("common: number + unit (NBSP)", () => {
  test("кг", () => E("numUnitRu", "12 кг", "12" + NBSP + "кг"));
  test("%", () => E("numUnitRu", "300 ₽", "300" + NBSP + "₽"));
  test("digit + г.код — abbreviation 'г.' is glued (lookahead allows '.')", () =>
    E("numUnitRu", "12 г.код", `12${NBSP}г.код`));
  test("гг.: 1991 гг. → NBSP перед (после — обычный пробел, гг. не висячая)", () =>
    E("ggYearAbbr", "1991 гг.", `1991${NBSP}гг.`));
  test("вв.: XX вв. (после римской цифры — не наш случай, только цифровые)", () =>
    E("vvCenturyAbbr", "9 вв.", `9${NBSP}вв.`));
  test("частота: 100 МГц", () =>
    E("numUnitFreq", "100 МГц", `100${NBSP}МГц`));
  test("сопротивление: 470 Ом", () =>
    E("numUnitOhm", "470 Ом", `470${NBSP}Ом`));
  test("ёмкость: 5 мВ", () =>
    E("numUnitVolt", "5 мВ", `5${NBSP}мВ`));
  // Расширенный набор единиц
  test("Imaging: '12 Мп' → NBSP", () =>
    E("numUnitMpx", "Камера 12 Мп", `Камера 12${NBSP}Мп`));
  test("Imaging long: '12 мегапикселей'", () =>
    E("numUnitMpxLong", "12 мегапикселей", `12${NBSP}мегапикселей`));
  test("UI: '1920 px'", () =>
    E("numUnitPx", "1920 px", `1920${NBSP}px`));
  test("UI: '300 dpi'", () =>
    E("numUnitDpi", "300 dpi", `300${NBSP}dpi`));
  test("UI: '60 fps'", () =>
    E("numUnitFps", "60 fps", `60${NBSP}fps`));
  test("Digital: '500 Кб' (кириллица, mixed case)", () =>
    E("numUnitKb", "500 Кб", `500${NBSP}Кб`));
  test("Digital: '4 Гб' (single-letter prefix)", () =>
    E("numUnitGb", "Объём 4 Гб данных", `Объём 4${NBSP}Гб данных`));
  test("Digital: '250 байт'", () =>
    E("numUnitByte", "250 байт", `250${NBSP}байт`));
  test("Pressure: '1013 кПа'", () =>
    E("numUnitKPa", "1013 кПа", `1013${NBSP}кПа`));
  test("Energy: '200 кДж'", () =>
    E("numUnitKJ", "200 кДж", `200${NBSP}кДж`));
  test("Currency: '50 £'", () =>
    E("numUnitGbp", "50 £", `50${NBSP}£`));
  test("Currency: '100 ₸'", () =>
    E("numUnitTenge", "100 ₸", `100${NBSP}₸`));
  test("Permille: '5 ‰'", () =>
    E("numUnitPermille", "5 ‰", `5${NBSP}‰`));
  // Negative: без числа перед — не клеим
  test("'у меня бит хорошее' (без числа) — не клеим", () =>
    E("noBitWithoutDigit", "у меня бит настроение", "у меня бит настроение"));
  test("'пиксель один' (без числа) — не клеим", () =>
    E("noPixelWithoutDigit", "пиксель один", "пиксель один"));
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

describe("common: trademark substitutions", () => {
  test("(c) → ©", () => E("trademark", "Copyright (c) 2026", "Copyright © 2026"));
  test("(C) → ©", () => E("trademark", "(C) Acme", "© Acme"));
  test("(r) → ®", () => E("trademark", "Foo (r) Inc.", "Foo ® Inc."));
  test("(tm) → ™", () => E("trademark", "Bar (tm)", "Bar ™"));
  test("(TM) → ™", () => E("trademark", "Bar(TM)", "Bar™"));
});
