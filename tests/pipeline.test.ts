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

describe("pipeline: composite units (Мбит/с не превращается в Мбит / с)", () => {
  // WJ (U+2060) оборачивает `/` — невидим визуально, блокирует UAX#14 break
  // и одновременно регекс applyMathDivision (он матчит `[symbol]/[symbol]`,
  // WJ в его «символьный» класс не входит). NBSP перед единицей ставится
  // только если ПРЕФИКС единицы есть в COMMON_UNITS_RE (Мбит, км...). Для
  // `об`/`кадр` префикс не в списке — там просто пробел, а не NBSP. Это
  // отдельный концерн от защиты `/`; см. TODO.md.
  const WJ = "⁠";
  test("100 Мбит/с — `/` обёрнут WJ, NBSP перед (Мбит в COMMON_UNITS_RE)", () =>
    E("compUnitMbits", "Скорость 100 Мбит/с стабильна.", `Скорость 100${NBSP}Мбит${WJ}/${WJ}с стабильна.`));
  test("60 км/ч — `/` обёрнут WJ, NBSP перед (км в COMMON_UNITS_RE)", () =>
    E("compUnitKmh", "Едет 60 км/ч.", `Едет 60${NBSP}км${WJ}/${WJ}ч.`));
  test("3000 об/мин — `/` обёрнут WJ (без NBSP, об нет в COMMON_UNITS_RE)", () =>
    E("compUnitRpm", "Двигатель 3000 об/мин.", `Двигатель 3000 об${WJ}/${WJ}мин.`));
  test("60 кадр/с — `/` обёрнут WJ (без NBSP, кадр нет в COMMON_UNITS_RE)", () =>
    E("compUnitFps", "Снимаем 60 кадр/с.", `Снимаем 60 кадр${WJ}/${WJ}с.`));

  // Smoke-test v1.0.2 #L2: украинские композиты раньше отсутствовали в словаре —
  // `applyMathDivision` вставлял пробелы вокруг `/`. NBSP перед единицей —
  // от common-правила (префикс `Мбіт`/`км` в COMMON_UNITS_RE), uk-rule этот
  // префикс не апгрейдит до NNBSP (его в UNITS_BY_LANG.eu нет).
  test("100 Мбіт/с (uk) — `/` обёрнут WJ", () => {
    const input = "Швидкість 100 Мбіт/с стабільна.";
    expectTransform(
      M,
      "compUnitMbitsUk",
      input,
      `Швидкість 100${NBSP}Мбіт${WJ}/${WJ}с стабільна.`,
      (s) => runPipeline(s, "uk")
    );
  });
  test("60 км/год (uk) — `/` обёрнут WJ", () => {
    const input = "Їде 60 км/год.";
    expectTransform(
      M,
      "compUnitKmhUk",
      input,
      `Їде 60${NBSP}км${WJ}/${WJ}год.`,
      (s) => runPipeline(s, "uk")
    );
  });
});

describe("pipeline: negative number + unit (smoke-test v1.0.2 #L5)", () => {
  // До фикса COMMON_UNITS_RE захватывал только `\d+` без знака — между минус-
  // числом и единицей оставался обычный пробел вместо NBSP. После — на пайплайн-
  // уровне сначала NBSP вставляется common-rule'ом, потом ru-rule конвертирует
  // минус в U+2212. В expected учитываем и проклитики (`на`, `со`).
  test("-2 °C → −2 NBSP °C", () =>
    E(
      "negDegPipeline",
      "Сегодня -2 °C на улице.",
      `Сегодня −2${NBSP}°C на${NBSP}улице.`
    ));
  test("-15 % → −15 NBSP %", () =>
    E(
      "negPercentPipeline",
      "Скидка -15 % на товар.",
      `Скидка −15${NBSP}% на${NBSP}товар.`
    ));
  test("-300 ₽ → −300 NBSP ₽", () =>
    E(
      "negRubPipeline",
      "Списано -300 ₽ со счёта.",
      `Списано −300${NBSP}₽ со${NBSP}счёта.`
    ));
});

describe("pipeline: versions are opaque (NUM_RANGE_RE не ломает semver)", () => {
  test("v2.0.0-alpha — без изменений", () =>
    E("verPrefix", "Releasing v2.0.0-alpha now.", "Releasing v2.0.0-alpha now."));
  test("1.2.3 (semver) — без изменений", () =>
    E("verSemver", "Version 1.2.3 shipped.", "Version 1.2.3 shipped."));
  test("0.10-rc1 — без изменений", () =>
    E("verRc", "tag 0.10-rc1 done", "tag 0.10-rc1 done"));
  test("1.2.3-rc1 — без изменений", () =>
    E("verSemverRc", "Tag 1.2.3-rc1 ready.", "Tag 1.2.3-rc1 ready."));
});

describe("pipeline: trailing newlines stripped, paragraph breaks preserved", () => {
  test("trailing single \\n удаляется", () =>
    E("trailingOne", "текст\n", "текст"));
  test("trailing множественные \\n удаляются", () =>
    E("trailingMany", "текст\n\n\n", "текст"));
  test("переносы между абзацами сохраняются (без хвоста)", () =>
    E("paraBreak", "Абзац 1.\n\nАбзац 2.", "Абзац 1.\n\nАбзац 2."));
  test("хвост срезается, межабзацный — нет", () =>
    E("paraBreakTrail", "Абзац 1.\n\nАбзац 2.\n\n", "Абзац 1.\n\nАбзац 2."));
  test("\\r\\n в хвосте срезается (после CRLF→LF)", () =>
    E("trailingCrlf", "текст\r\n\r\n", "текст"));
  test("узел только из переносов → пусто", () =>
    E("onlyNewlines", "\n\n", ""));
  test("без хвоста — без изменений", () =>
    E("noTrail", "текст", "текст"));
});
