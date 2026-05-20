import { describe, test } from "vitest";
import { runPipeline } from "./_helpers/pipeline";
import { expectTransform } from "./_helpers/expect";

const NBSP = " ";
const NNBSP = " ";

const M = "pipeline";
function E(rule: string, input: string, expected: string): void {
  expectTransform(M, rule, input, expected, (s) => runPipeline(s));
}

describe("pipeline: URL/email guarded", () => {
  test("URL passes through untouched + abbr NOT glued to URL (PUA opaque)", () => {
    const url = "https://site.com/a-b?x=1...";
    const out = runPipeline(`см. ${url}`);
    expectTransform(
      M,
      "urlUntouched",
      `см. ${url}`,
      `см. ${url}`,
      () => out
    );
  });

  test("email passes through untouched + proclitic NOT glued to email", () => {
    const email = "foo@bar.com";
    const out = runPipeline(`пишите на ${email} сегодня`);
    expectTransform(
      M,
      "emailUntouched",
      `пишите на ${email} сегодня`,
      `пишите на ${email} сегодня`,
      () => out
    );
  });
});

describe("pipeline: дата-диапазон с WJ вокруг em-dash — не рвётся в Figma", () => {
  test("'1799-1837 гг.' — em-dash обёрнут U+2060, NBSP перед гг.", () => {
    const WJ = "⁠";
    const out = runPipeline("в 1799-1837 гг.", "ru");
    expectTransform(
      M,
      "yearRangeWj",
      "в 1799-1837 гг.",
      `в${NBSP}1799${WJ}—${WJ}1837${NBSP}гг.`,
      () => out
    );
  });
});

describe("pipeline: гг./вв. — NBSP только перед, после обычный пробел", () => {
  test("'1991 гг. Учёт' — между гг. и Учёт regular space (не NBSP)", () => {
    const out = runPipeline("1991 гг. Учёт", "ru");
    const gg = out.indexOf("гг.");
    const after = out.charCodeAt(gg + 3);
    if (after !== 0x20) {
      throw new Error(`expected regular space after гг., got U+${after.toString(16)}`);
    }
    expectTransform(M, "noNbspAfterGgFull", "1991 гг. Учёт", out, () => out);
  });
});

describe("pipeline: brand whitelist guarded", () => {
  test("'JavaScript' — не дробится никакими правилами", () =>
    E("brandJs", "Изучаем JavaScript всю жизнь.", `Изучаем JavaScript всю жизнь.`));
  test("'Booking.com' остаётся как есть", () =>
    E("brandDot", "Сайт Booking.com работает.", `Сайт Booking.com работает.`));
  test("'iPhone' — точное написание сохранено", () =>
    E("brandCase", "Купил iPhone вчера.", `Купил iPhone вчера.`));
  test("'iphone' (lowercase) — НЕ в whitelist, обычная обработка", () =>
    E("brandLower", "iphone today", `iphone today`));
});

describe("pipeline: end-to-end RU examples from TZ", () => {
  test("ребенок 20 кг → ребёнок 20 кг (NBSP перед кг)", () =>
    E(
      "tzRuExample",
      "ребенок 20 кг",
      `ребёнок 20${NBSP}кг`
    ));
  test("10-12 кг → 10–12 кг", () =>
    E("tzRuRange", "10-12 кг", `10–12${NBSP}кг`));
  test("№ 5, стр. 12 → NBSP правильно", () =>
    E("tzRuNumStr", "№ 5, стр. 12", `№${NBSP}5, стр.${NBSP}12`));
});

describe("pipeline: math + common together", () => {
  test("x^2 + y^3 → x² + y³", () =>
    E("mathPowers", "x^2 + y^3", "x² + y³"));
});

describe("pipeline: detect → routes to correct lang", () => {
  test("french detected → guillemets", () =>
    E("detectFr", 'Ça dit "salut"', `Ça dit «${NNBSP}salut${NNBSP}»`));
  test("english detected → smart quotes", () =>
    E("detectEn", 'Say "hello"', `Say “hello”`));
});

describe("pipeline: CRLF normalization", () => {
  test("CRLF → LF", () => {
    const input = "line1\r\nline2";
    const expected = "line1\nline2";
    expectTransform(M, "crlf", input, expected, (s) => runPipeline(s, "en"));
  });
  test("lone CR → LF", () => {
    const input = "line1\rline2";
    const expected = "line1\nline2";
    expectTransform(M, "cr", input, expected, (s) => runPipeline(s, "en"));
  });
});

describe("pipeline: NFC normalization", () => {
  test("decomposed é (e + combining acute) → precomposed é", () => {
    const decomposed = "café"; // c, a, f, e, combining acute
    const precomposed = "café"; // c, a, f, é
    expectTransform(M, "nfc", decomposed, precomposed, (s) => runPipeline(s, "en"));
  });
});

describe("pipeline: multi-pass convergence", () => {
  test("'...   ...' → '……' (ELLIPSIS_COMPACT eats whitespace around dots)", () =>
    E("multiPass", "...   ...", "……"));
});
