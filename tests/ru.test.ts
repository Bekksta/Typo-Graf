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

  // Подряд идущие проклитики — обе должны получить NBSP. До lookbehind-фикса
  // (smoke-test v1.0.0 bug #2) первая проклитика «съедала» граничный пробел и
  // вторая просто не находилась — результат был `и<NBSP>в почте` вместо
  // `и<NBSP>в<NBSP>почте`.
  test("и в почте (two proclitics in a row)", () =>
    E("shortPreps", "и в почте", `и${NBSP}в${NBSP}почте`));
  test("у и я (single-letter proclitics + я)", () =>
    E("shortPreps", "у и я документа", `у${NBSP}и${NBSP}я${NBSP}документа`));
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

describe("ru: particles бы / ли / же / ль (энклитики — NBSP только слева)", () => {
  test("сделал ли я → NBSP перед 'ли', обычный пробел после", () =>
    E("particles", "сделал ли я", `сделал${NBSP}ли я`));
  test("если бы → NBSP перед 'бы'", () =>
    E("particles", "если бы", `если${NBSP}бы`));
  test("всё было бы иначе → только между было и бы", () =>
    E("particles", "всё было бы иначе", `всё было${NBSP}бы иначе`));
  test("то же самое → NBSP перед 'же', 'самое' свободно", () =>
    E("particles", "то же самое", `то${NBSP}же самое`));
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

const WJ = "⁠"; // word joiner — оборачивает em-dash в дата-диапазонах,
                     // чтобы Figma не рвала строку по em-dash (UAX#14).
describe("ru: date ranges (em-dash wrapped in WJ, no spaces)", () => {
  test("1991-1995 → 1991⁠—⁠1995 (годы)", () =>
    E("yearRange", "1991-1995", `1991${WJ}—${WJ}1995`));
  test("1991–1995 → 1991⁠—⁠1995 (en-dash → em-dash)", () =>
    E("yearRange", "1991–1995", `1991${WJ}—${WJ}1995`));
  test("январь-март → январь⁠—⁠март", () =>
    E("monthRange", "январь-март", `январь${WJ}—${WJ}март`));
  test("сентября-декабря → сентября⁠—⁠декабря (родительный)", () =>
    E("monthRangeGen", "с сентября-декабря", `с${NBSP}сентября${WJ}—${WJ}декабря`));
  test("числовой диапазон 10-12 не превращается в em-dash (через ru-rules — без common)", () =>
    E("noNumRange", "10-12", "10-12"));
});

describe("ru: lookbehind защищает от ложных аббревиатур в хвостах слов", () => {
  test("'вместе. Сделал' — обычный пробел; 'я это' клеится (я — однобуквенная проклитика)", () =>
    E("noTeInVmeste", "мы шли вместе. Сделал я это", `мы шли вместе. Сделал я${NBSP}это`));
  test("'плач. Слово' — обычный пробел (плач≠плачь — единица 'ч')", () =>
    E("noChInPlach", "плач. Слово", "плач. Слово"));
  test("'степ. ещё' — обычный пробел (степ≠п единица)", () =>
    E("noPInStep", "степ. ещё", "степ. ещё"));
  test("'те самые яблоки' — местоимение, не аббревиатура", () =>
    E("noTePronoun", "те самые яблоки", "те самые яблоки"));
});

describe("ru: гг./вв. — NBSP только перед, НЕ после", () => {
  // Регресс-тест: второй `г` в `гг.` не должен распознаваться как
  // самостоятельное «год.» и получать NBSP справа.
  test("1991 гг. произошло — NBSP только перед гг.", () => {
    const run = (s: string) => {
      const t = applyRussianRules(s);
      return t;
    };
    expectTransform(M, "noNbspAfterGg", "1991 гг. произошло", "1991 гг. произошло", run);
  });
});

describe("ru: и/или normalization", () => {
  test("'и / или' → 'и/или' (без пробелов)", () =>
    E("andOr", "и / или", "и/или"));
  test("'и/или' остаётся", () =>
    E("andOrIdempotent", "и/или", "и/или"));
  test("'И/или' в начале предложения сохраняет заглавную", () =>
    E("andOrCase", "И/или дальше.", "И/или дальше."));
  test("'И / или' с пробелами в начале — заглавная сохраняется", () =>
    E("andOrCaseSpaces", "И / или дальше.", `И/или${NBSP}дальше.`));
});

describe("ru: однобуквенное 'я' — проклитика (Лебедев §31)", () => {
  test("'я задачу' → 'я NBSP задачу'", () =>
    E("yaSingleLetter", "Сделал я задачу.", `Сделал я${NBSP}задачу.`));
  test("'Я закончил' → 'Я NBSP закончил'", () =>
    E("yaCapital", "Я закончил.", `Я${NBSP}закончил.`));
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
  test("1234567 → 1 234 567 (NBSP) + NBSP перед 'рублей' (квантификатор)", () =>
    E("groupThousands", "Бюджет 1234567 рублей", `Бюджет 1${NBSP}234${NBSP}567${NBSP}рублей`));
  test("12345 → 12 345 (минимум 5 цифр)", () =>
    E("groupThousands", "ровно 12345", `ровно 12${NBSP}345`));
  test("год 1991 + NBSP перед 'году' (квантификатор)", () =>
    E("noGroupYear", "В 1991 году", `В${NBSP}1991${NBSP}году`));
  test("четырёхзначное 1024 не трогаем", () =>
    E("noGroupSmall", "ровно 1024", "ровно 1024"));
});

describe("ru: number + quantifier noun (валюта/время/дата) → NBSP", () => {
  test("5 рублей → 5[NBSP]рублей", () =>
    E("quant", "5 рублей", `5${NBSP}рублей`));
  test("12 января → 12[NBSP]января (месяц)", () =>
    E("quantMonth", "12 января", `12${NBSP}января`));
  test("300 минут → 300[NBSP]минут", () =>
    E("quantTime", "300 минут", `300${NBSP}минут`));
  test("1991 году → 1991[NBSP]году (год во всех падежах)", () =>
    E("quantYear", "В 1991 году", `В${NBSP}1991${NBSP}году`));
  test("243 голубя — НЕ клеим (не квантификатор)", () =>
    E("noQuantNoun", "243 голубя", "243 голубя"));
  test("100 коробок — НЕ клеим (не в списке)", () =>
    E("noQuantBox", "100 коробок", "100 коробок"));
});

describe("ru: composite tail не клеится к следующему слову (см. блок 1)", () => {
  test("'и т. д. А. С. Пушкин' — между д. и А. обычный пробел", () =>
    E("compositeTail", "и т.д. А. С. Пушкин", `и${NBSP}т.${NBSP}д. А.${NBSP}С.${NBSP}Пушкин`));
  test("'д. Иванов' (доктор/деревня) — продолжает работать с NBSP", () =>
    E("doctorDot", "д. Иванов", `д.${NBSP}Иванов`));
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
