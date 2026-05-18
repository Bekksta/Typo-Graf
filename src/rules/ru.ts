import {
  HYPHEN_ABBR,
  DOT_UNIT_ABBR,
  DOT_GENERIC_ABBR,
  SERVICE_WORDS,
  COMPOSITE_ABBR_RULES,
} from "../lib/ruLib";
import { NBSP, NBH, SP_ANY_CLASS, SP_ANY_SRC, EM_DASH } from "../lang/maps";
import { preserveCase } from "../lib/commonCase";
import { applyYoFix } from "./yoPairs";

// 5.1 Короткие предлоги/частицы → NBSP после
export function glueShortPreps(text: string): string {
  const re = new RegExp(
    `(^|[\\s(>])(${SERVICE_WORDS.join(
      "|"
    )})(?:${SP_ANY_SRC})(?=[A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u04510-9\xAB\uE000-\uF8FF])`,
    "gmi"
  );
  return text.replace(re, (_m, pre, w) => pre + w + NBSP);
}

// 5.2 Инициалы
export function fixInitials(text: string): string {
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
export function smartQuotesRu(text: string): string {
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
export function nbspAfterAbbr(text: string): string {
  let out = text;

  // №, § → NBSP перед числом
  out = out.replace(/№[ \u00A0\u2009\u202F\t]+(?=\d)/g, "№" + NBSP);
  out = out.replace(/§[ \u00A0\u2009\u202F\t]+(?=\d)/g, "§" + NBSP);

  // "г." (город) — NBSP только если слева НЕ цифра
  out = out.replace(/г\.(?:[ \u00A0\u2009\u202F\t]+)(?=[А-ЯЁ])/g, (m, off) => {
    let i = (off as number) - 1;
    while (i >= 0 && SP_ANY_CLASS.test(out[i])) i--;
    const prev = i >= 0 ? out[i] : "";
    if (/\d/.test(prev)) return m; // это "год", не трогаем тут
    return "г." + NBSP;
  });

  // г-н, г-жа, д-р и пр. — NBSP после
  out = out.replace(
    /(г-н|г-жа|г-жи|д-р)(?:[ \u00A0\u2009\u202F\t]+)(?=[А-ЯЁ])/gi,
    (_m, abbr) => abbr + NBSP
  );

  // Общая логика: служебные клеим ВСЕГДА; единицы — не клеим, если далее цифра
  const reAbbrDot = new RegExp(
    `(?:(${DOT_UNIT_ABBR.join("|")})|(${DOT_GENERIC_ABBR.join(
      "|"
    )}))\\.(?:${SP_ANY_SRC}+)(?=\\S)`,
    "gi"
  );
  out = out.replace(
    reAbbrDot,
    (
      m: string,
      unit: string | undefined,
      _generic: string | undefined,
      off: number
    ) => {
      let i = off + m.length;
      while (i < out.length && SP_ANY_CLASS.test(out[i])) i++;
      const next = out[i] || "";
      if (unit && /\d/.test(next)) {
        // единицы + цифра: НЕ склеиваем справа
        return m.replace(/\u00A0/g, " ");
      }
      // служебные и единицы без цифры — NBSP
      return m.replace(new RegExp(`${SP_ANY_SRC}+`, "g"), NBSP);
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
export function fixHyphenatedAbbr(text: string): string {
  let out = text;
  const H = "[\\-\\u2013\\u2014\\u2011]";
  for (const raw of HYPHEN_ABBR) {
    const parts = raw.split("-");
    const pattern = parts.map(escRe).join(H);
    const re = new RegExp(
      `${pattern}(?![A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451])(?:${SP_ANY_SRC}+)?(?=\\S)`,
      "gi"
    );
    out = out.replace(re, (m: string, offset: number) => {
      let glued = m.replace(new RegExp(H, "g"), NBH);
      // если далее буква — NBSP после; иначе — просто сжать хвостовые пробелы
      let i = offset + m.length;
      while (i < out.length && SP_ANY_CLASS.test(out[i])) i++;
      const next = out[i] || "";
      if (/[A-Za-zА-Яа-яЁё]/.test(next)) {
        glued = glued.replace(new RegExp(`${SP_ANY_SRC}+$`), "");
        return glued.endsWith(NBSP) ? glued : glued + NBSP;
      } else {
        return glued.replace(new RegExp(`${SP_ANY_SRC}+$`), "");
      }
    });
  }
  return out;
}

// 5.6 Составные сокращения: нормализация «тд/т.д/т д» → «т. д.», «до нэ» → «до н. э.» и т.п.
export function normalizeCompositeAbbr(text: string): string {
  let out = text;
  for (const { re, canon } of COMPOSITE_ABBR_RULES) {
    out = out.replace(re, (m: string, pre: string) => (pre ?? "") + preserveCase(canon, m, "first", "ru"));
  }
  return out;
}

// 5.7 Частицы бы/ли/же — NBSP перед
export function glueParticles(text: string): string {
  return text.replace(
    /([А-ЯЁа-яёA-Za-z]{2,})[ \u00A0\u2009\u202F\t]+(бы|ли|же)(?=[^А-Яа-яЁёA-Za-z]|$)/gi,
    (_m, w, p) => w + NBSP + p
  );
}

// 5.8 Тире/эм-даш: только нормализация явных кейсов, БЕЗ замены дефиса на тире
export function normalizeEmDash(text: string): string {
  
  let out = text;
  // двойной дефис → em dash
  out = out.replace(new RegExp(`(${SP_ANY_SRC}*)--(${SP_ANY_SRC}*)`, "g"), ` ${EM_DASH} `);
  // дефис/ен-даш между не-числами → em dash
  out = out.replace(
    /([^\d\s])\s[-–]\s([^\d\s])/g,
    (_m, a: string, b: string) => `${a} ${EM_DASH} ${b}`
  );
  // унификация уже стоящего em dash: NBSP слева, обычный пробел справа
  out = out.replace(
    /(\S)[ \u00A0\u2009\u202F\t]*—[ \u00A0\u2009\u202F\t]*(\S)/g,
    (m, a: string, b: string) => {
      if (/\d/.test(a) && /\d/.test(b)) return m;
      return `${a}${NBSP}${EM_DASH} ${b}`;
    }
  );
  
  return out;
}

// 5.10 Диапазоны дат: годы и месяцы → em-dash без пробелов (Лебедев).
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

export function convertDateRanges(text: string): string {
  text = text.replace(YEAR_RANGE_RE, `$1${EM_DASH}$2`);
  text = text.replace(MONTH_RANGE_RE, (_m, a: string, b: string) =>
    `${a}${EM_DASH}${b}`
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
export function convertNegativeMinus(text: string): string {
  return text.replace(NEG_NUM_RE, "−$1");
}

// 5.12 «и / или» (с пробелами вокруг косой черты) → «и/или» — это
// устойчивая сочетание, всегда слитное.
export function normalizeAndOr(text: string): string {
  return text.replace(
    /(?<![\p{L}\p{N}])и\s*\/\s*или(?![\p{L}\p{N}])/giu,
    "и/или"
  );
}

// Группировка тысяч в больших числах: 1234567 → 1 234 567 (NBSP-разделитель).
// Порог — 5 цифр, чтобы не задеть года (1991), версии (1024) и пр. четырёхзначные.
// Word-boundary защищает от ISBN/SKU-подобных штук с буквами рядом.
export function groupThousandsRu(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  );
}

// 5.9 Пробелы перед знаками препинания.
// Перед %, ‰, ₽, €, $ ПРОБЕЛ НЕ удаляем — по ТЗ там должен стоять NBSP,
// который проставляется в common/lang-правилах; иначе он бы здесь срезался.
export function removeSpacesBeforePunctuation(text: string): string {
  text = text.replace(new RegExp(`${SP_ANY_SRC}+([.,!?;:])`, "g"), "$1");
  text = text.replace(new RegExp(`${SP_ANY_SRC}+(\\u2026)`, "g"), "$1");
  text = text.replace(new RegExp(`${SP_ANY_SRC}+([)\\xBB])`, "g"), "$1");
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
  text = glueShortPreps(text); // 5.1
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
  text = groupThousandsRu(text);

  return text;
}
