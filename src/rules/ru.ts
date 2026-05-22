import {
  HYPHEN_ABBRS,
  DOT_UNIT_ABBRS,
  DOT_GENERIC_ABBRS,
  PROCLITICS,
  COMPOSITE_ABBR_RULES,
  QUANTIFIER_NOUNS,
} from "../lib/ruLib";
import { NBSP, NBH, ANY_SPACE_CLASS, ANY_SPACE_SRC, EM_DASH, WORD_JOINER } from "../lang/maps";
import { preserveCase } from "../lib/commonCase";
import { applyYoFix } from "./yoPairs";

// 5.1 Проклитики (короткие предлоги/союзы/forward-частицы) → NBSP справа.
// Парная функция — `glueParticles` ниже (энклитики `бы/ли/же/ль`, NBSP слева).
// Пересечение списков запрещено: слово либо тянет вправо, либо влево.
function glueProclitics(text: string): string {
  const re = new RegExp(
    `(^|[\\s(>])(${PROCLITICS.join(
      "|"
    )})(?:${ANY_SPACE_SRC})(?=[A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u04510-9\xAB])`,
    "gmi"
  );
  return text.replace(re, (_m, pre, w) => pre + w + NBSP);
}

// 5.2 Инициалы
function fixInitials(text: string): string {
  text = text.replace(
    /([А-ЯЁ])\.(?:[ \u00A0\u2009\u202F\t]+)([А-ЯЁ])\.(?:[ \u00A0\u2009\u202F\t]+)([А-ЯЁ][а-яё]+)/g,
    (_m, a, b, last) => `${a}.` + NBSP + `${b}.` + NBSP + `${last}`
  );
  text = text.replace(
    /([А-ЯЁ])\.(?:[ \u00A0\u2009\u202F\t]+)([А-ЯЁ])\./g,
    (_m, a, b) => `${a}.` + NBSP + `${b}.`
  );
  return text;
}

// 5.3 Умные кавычки «» (без вмешательства в уже расставленные праймы ′″)
function smartQuotesRu(text: string): string {
  // нормализуем экзотические кавычки к "
  text = text.replace(/[“”„‟«»]/g, '"').replace(/'{2}/g, '"');

  // затем чередуем «»
  let open = true,
    out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? "«" : "»";
      open = !open;
    } else {
      out += ch;
    }
  }
  // убираем лишние пробелы внутри « »
  out = out
    .replace(/«[ \t\u00A0\u2009\u202F]+/g, "«")
    .replace(/[ \t\u00A0\u2009\u202F]+»/g, "»");
  // пунктуация перед закрывающей кавычкой — внутрь
  out = out.replace(/»([.,!?:;…])/g, "»$1");
  // буква сразу после закрывающей — добавляем пробел
  out = out.replace(/»([А-ЯЁA-Z])/g, "» $1");
  return out;
}

// 5.4 NBSP после аббревиатур с точкой, с разделением единиц/служебных
function nbspAfterAbbr(text: string): string {
  let out = text;

  // №, § → NBSP перед числом
  out = out.replace(/№[ \u00A0\u2009\u202F\t]+(?=\d)/g, "№" + NBSP);
  out = out.replace(/§[ \u00A0\u2009\u202F\t]+(?=\d)/g, "§" + NBSP);

  // "г." (город) — NBSP только если слева НЕ цифра
  out = out.replace(/г\.(?:[ \u00A0\u2009\u202F\t]+)(?=[А-ЯЁ])/g, (m, off) => {
    let i = (off as number) - 1;
    while (i >= 0 && ANY_SPACE_CLASS.test(out[i])) i--;
    const prev = i >= 0 ? out[i] : "";
    if (/\d/.test(prev)) return m; // это "год", не трогаем тут
    if (prev === "г") return m;    // второй "г" в "гг." — пропускаем
    return "г." + NBSP;
  });

  // г-н, г-жа, д-р и пр. — NBSP после
  out = out.replace(
    /(г-н|г-жа|г-жи|д-р)(?:[ \u00A0\u2009\u202F\t]+)(?=[А-ЯЁ])/gi,
    (_m, abbr) => abbr + NBSP
  );

  // Общая логика: служебные клеим ВСЕГДА; единицы — не клеим, если далее цифра.
  // Lookbehind `(?<![\p{L}\p{N}])` гарантирует, что сокращение стоит
  // отдельно — иначе хвост любого слова на `-те.`/`-г.`/`-п.` ловился бы
  // как аббревиатура. Это же закрывает кейс «гг.» автоматически: при
  // попытке сматчить второй `г.` слева стоит `г` (буква) — не подходит.
  const reAbbrDot = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:(${DOT_UNIT_ABBRS.join("|")})|(${DOT_GENERIC_ABBRS.join(
      "|"
    )}))\\.(?:${ANY_SPACE_SRC}+)(?=\\S)`,
    "giu"
  );
  out = out.replace(
    reAbbrDot,
    (
      m: string,
      unit: string | undefined,
      generic: string | undefined,
      off: number
    ) => {
      const abbr = (unit || generic) as string;
      // PREV non-space char: если слева цифра, аббревиатура замыкает число
      // («1991 г.», «5 кг.») — NBSP справа не нужен.
      let pi = off - 1;
      while (pi >= 0 && ANY_SPACE_CLASS.test(out[pi])) pi--;
      const prev = pi >= 0 ? out[pi] : "";
      if (unit && /\d/.test(prev)) {
        return m.replace(/\u00A0/g, " ");
      }
      // Хвост composite («и т. д.», «т. е.», «до н. э.»): если матч —
      // однобуквенное сокращение, а слева через пробел стоит ещё одна
      // одиночная `<буква>.` — это устойчивое сочетание. NBSP справа
      // ставить нельзя, иначе `и т. д. А. С. Пушкин` склеится в один
      // чанк. `д. Иванов` (доктор/деревня) продолжит работать — там
      // слева НЕ composite-хвост.
      if (abbr.length === 1 && prev === ".") {
        const prevLetter = pi - 1 >= 0 ? out[pi - 1] : "";
        const beforeLetter = pi - 2 >= 0 ? out[pi - 2] : "";
        if (
          prevLetter &&
          /\p{L}/u.test(prevLetter) &&
          (!beforeLetter || !/\p{L}/u.test(beforeLetter))
        ) {
          return m.replace(/\u00A0/g, " ");
        }
      }
      let i = off + m.length;
      while (i < out.length && ANY_SPACE_CLASS.test(out[i])) i++;
      const next = out[i] || "";
      if (unit && /\d/.test(next)) {
        // единицы + цифра: НЕ склеиваем справа
        return m.replace(/\u00A0/g, " ");
      }
      // Замаскированный URL/email (PUA U+E000-U+F8FF) — не клеим:
      // адрес — opaque-токен, «следующим словом» он не считается.
      const nc = next.charCodeAt(0);
      if (nc >= 0xe000 && nc <= 0xf8ff) {
        return m.replace(/\u00A0/g, " ");
      }
      // служебные и единицы без цифры — NBSP
      return m.replace(new RegExp(`${ANY_SPACE_SRC}+`, "g"), NBSP);
    }
  );

  // р-н и его формы — NBSP после
  out = out.replace(
    /(р-?н)(?:[ \u00A0\u2009\u202F\t]+)(?=\S)/gi,
    (_m, a) => `${a}${NBSP}`
  );

  return out;
}

// 5.5 Составные дефисные аббревиатуры (г-н, т-ща...) с NBH и NBSP по месту
function escRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function fixHyphenatedAbbr(text: string): string {
  let out = text;
  const H = "[\\-\\u2013\\u2014\\u2011]";
  for (const raw of HYPHEN_ABBRS) {
    const parts = raw.split("-");
    const pattern = parts.map(escRe).join(H);
    const re = new RegExp(
      `${pattern}(?![A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451])(?:${ANY_SPACE_SRC}+)?(?=\\S)`,
      "gi"
    );
    out = out.replace(re, (m: string, offset: number) => {
      let glued = m.replace(new RegExp(H, "g"), NBH);
      // если далее буква — NBSP после; иначе — просто сжать хвостовые пробелы
      let i = offset + m.length;
      while (i < out.length && ANY_SPACE_CLASS.test(out[i])) i++;
      const next = out[i] || "";
      if (/[A-Za-zА-Яа-яЁё]/.test(next)) {
        glued = glued.replace(new RegExp(`${ANY_SPACE_SRC}+$`), "");
        return glued.endsWith(NBSP) ? glued : glued + NBSP;
      } else {
        return glued.replace(new RegExp(`${ANY_SPACE_SRC}+$`), "");
      }
    });
  }
  return out;
}

// 5.6 Составные сокращения: нормализация «тд/т.д/т д» → «т. д.», «до нэ» → «до н. э.» и т.п.
function normalizeCompositeAbbr(text: string): string {
  let out = text;
  for (const { re, canon } of COMPOSITE_ABBR_RULES) {
    out = out.replace(re, (m: string, pre: string) => (pre ?? "") + preserveCase(canon, m, "first", "ru"));
  }
  return out;
}

// 5.7 Постпозитивные частицы (энклитики) бы/ли/же/ль — NBSP перед.
// Парная функция — `glueProclitics` выше (forward-clitic, NBSP справа).
// Список замкнутый: эти 4 частицы по Лебедеву §32 тянутся к слову СЛЕВА,
// поэтому жить им можно только здесь и нигде больше.
function glueParticles(text: string): string {
  return text.replace(
    /([А-ЯЁа-яёA-Za-z]{2,})[ \u00A0\u2009\u202F\t]+(бы|ли|же|ль)(?=[^А-Яа-яЁёA-Za-z]|$)/gi,
    (_m, w, p) => w + NBSP + p
  );
}

// 5.8 Тире/эм-даш: только нормализация явных кейсов, БЕЗ замены дефиса на тире
function normalizeEmDash(text: string): string {
  
  let out = text;
  // двойной дефис → em dash
  out = out.replace(new RegExp(`(${ANY_SPACE_SRC}*)--(${ANY_SPACE_SRC}*)`, "g"), ` ${EM_DASH} `);
  // дефис/ен-даш между не-числами → em dash
  out = out.replace(
    /([^\d\s])\s[-–]\s([^\d\s])/g,
    (_m, a: string, b: string) => `${a} ${EM_DASH} ${b}`
  );
  // унификация уже стоящего em dash: NBSP слева, обычный пробел справа.
  // ИСКЛЮЧЕНИЯ: цифры с обеих сторон (диапазон вида 1991—1995) и WORD_JOINER-
  // обёртка (U+2060) — её ставит `convertDateRanges` для дата-диапазонов,
  // чтобы запретить перенос; повторно её трогать нельзя.
  out = out.replace(
    /(\S)[ \u00A0\u2009\u202F\t]*—[ \u00A0\u2009\u202F\t]*(\S)/g,
    (m, a: string, b: string) => {
      if (/\d/.test(a) && /\d/.test(b)) return m;
      if (a === WORD_JOINER || b === WORD_JOINER) return m;
      return `${a}${NBSP}${EM_DASH} ${b}`;
    }
  );
  
  return out;
}

// 5.10 Диапазоны дат: годы и месяцы → em-dash без пробелов.
const MONTHS_RU = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTHS_ALT = MONTHS_RU.join("|");
const YEAR_RANGE_RE = /\b(\d{4})[-–](\d{4})\b/g;
const MONTH_RANGE_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(${MONTHS_ALT})[\\s\\u00A0]*[-–][\\s\\u00A0]*(${MONTHS_ALT})(?![\\p{L}\\p{N}])`,
  "giu"
);

// WORD_JOINER (U+2060) — non-breaking, zero-width. Оборачиваем em-dash в
// числовых/месячных диапазонах, иначе Figma по правилам UAX#14 рвёт строку
// прямо по em-dash: `1799—|1837` уезжает на новую строку, и `гг.` остаётся
// один. WORD_JOINER запрещает перенос — диапазон становится неразрывным целиком.
function convertDateRanges(text: string): string {
  text = text.replace(YEAR_RANGE_RE, `$1${WORD_JOINER}${EM_DASH}${WORD_JOINER}$2`);
  text = text.replace(MONTH_RANGE_RE, (_m, a: string, b: string) =>
    `${a}${WORD_JOINER}${EM_DASH}${WORD_JOINER}${b}`
  );
  return text;
}

// 5.11 Отрицательные числа в валютном/процентном/единичном контексте:
// «-300 ₽» → «−300 ₽» (U+2212, математический минус). Срабатывает только
// если за минусом идёт число, а после него NBSP/space + валюта/% или
// типичная единица — иначе риск задеть простой дефис в списках.
const NEG_NUM_RE = new RegExp(
  `(?<![\\d\\p{L}])-(\\d+(?:[.,]\\d+)?)(?=[ \\u00A0\\u2009\\u202F\\t]*(?:%|₽|€|\\$|°|кг|г|см|мм|м|л|км|мл|т|МБ|ГБ|ТБ|Гц|кГц|МГц|Вт|кВт|В|А|Ом))`,
  "gu"
);
function convertNegativeMinus(text: string): string {
  return text.replace(NEG_NUM_RE, "−$1");
}

// 5.12 «и / или» (с пробелами вокруг косой черты) → «и/или» — это
// устойчивое сочетание, всегда слитное. В начале предложения сохраняем
// заглавную: `И / или` → `И/или`, иначе теряли бы регистр.
function normalizeAndOr(text: string): string {
  return text.replace(
    /(?<![\p{L}\p{N}])(и)\s*\/\s*или(?![\p{L}\p{N}])/giu,
    (_m, lead: string) => (lead === "И" ? "И/или" : "и/или")
  );
}

// Группировка тысяч в больших числах: 1234567 → 1 234 567 (NBSP-разделитель).
// Порог — 5 цифр, чтобы не задеть года (1991), версии (1024) и пр. четырёхзначные.
// Word-boundary защищает от ISBN/SKU-подобных штук с буквами рядом.
function groupThousandsRu(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  );
}

// Число + квантификаторное сущ. (валюта/время/дата) → NBSP.
// Список узкий и кураторский (см. QUANTIFIER_NOUNS + MONTHS_RU): только
// устойчивые количественные классы. «5 рублей», «12 января», «300 минут»
// клеятся; «243 голубя», «100 коробок» — нет, чтобы не лепить произвольно.
// Число может быть с уже расставленными NBSP-разделителями тысяч
// («1 234 567 рублей»), поэтому слева числа допускаем NBSP.
function glueNumQuantifiers(text: string): string {
  const words = [...QUANTIFIER_NOUNS, ...MONTHS_RU].join("|");
  const re = new RegExp(
    `(\\d)[ \\t]+(${words})(?![\\p{L}\\p{N}])`,
    "giu"
  );
  return text.replace(re, (_m, d: string, w: string) => `${d}${NBSP}${w}`);
}

// 5.9 Пробелы перед знаками препинания.
// Перед %, ‰, ₽, €, $ ПРОБЕЛ НЕ удаляем — по ТЗ там должен стоять NBSP,
// который проставляется в common/lang-правилах; иначе он бы здесь срезался.
function removeSpacesBeforePunctuation(text: string): string {
  text = text.replace(new RegExp(`${ANY_SPACE_SRC}+([.,!?;:])`, "g"), "$1");
  text = text.replace(new RegExp(`${ANY_SPACE_SRC}+(\\u2026)`, "g"), "$1");
  text = text.replace(new RegExp(`${ANY_SPACE_SRC}+([)\\xBB])`, "g"), "$1");
  // убрать случайные пробелы из URL (на всякий)
  text = text.replace(/https?:\/\/[^\s]+/g, (m) => m.replace(/ /g, ""));
  return text;
}

// Оркестратор русских правил.
// `yoFix` можно выключить — это полезно для sr-Cyrl (cербской кириллицы),
// где буквы «ё» в алфавите нет и ёфикация неуместна.
export function applyRussianRules(
  input: string,
  opts: { yoFix?: boolean } = {}
): string {
  const yoFix = opts.yoFix !== false;
  let text = input;

  // Порядок важен!
  text = fixInitials(text); // 5.2
  text = glueProclitics(text); // 5.1
  text = normalizeCompositeAbbr(text); // 5.6 (до кавычек/тире)
  text = nbspAfterAbbr(text); // 5.4
  text = smartQuotesRu(text); // 5.3
  text = normalizeEmDash(text); // 5.8 (без автозамены дефиса на —)
  text = convertDateRanges(text); // 5.10 — годы и месяцы получают em-dash
  text = fixHyphenatedAbbr(text); // 5.5
  text = glueParticles(text); // 5.7
  text = removeSpacesBeforePunctuation(text); // 5.9
  if (yoFix) text = applyYoFix(text); // ёфикация по белому списку
  text = convertNegativeMinus(text); // 5.11
  text = normalizeAndOr(text); // 5.12 — «и/или» без пробелов
  text = glueNumQuantifiers(text); // число + валюта/время/месяц → NBSP
  text = groupThousandsRu(text);

  return text;
}
