// rules/en.ts — EN rules for Typo Graf
import {
  NBSP,
  EN_DASH,
  EM_DASH,
  ANY_SPACE_SRC,
  PRIME,
  DOUBLE_PRIME,
  LEFT_DQUOTE,
  RIGHT_DQUOTE,
  LEFT_SQUOTE,
  RIGHT_SQUOTE,
} from "../lang/maps";
import { PROCLITICS, UNITS_EN } from "../lib/enLib";

// ===== 1) Праймы: 12'' / 12" → 12″ ; 12' → 12′ =====
const DOUBLE_PRIME_RE = new RegExp(
  `(\\d)${ANY_SPACE_SRC}*(?:''|["”]|\\u2033)`,
  "g"
);
const SINGLE_PRIME_RE = new RegExp(
  `(\\d)${ANY_SPACE_SRC}*(?:'|’|\\u2032)(?!['”"\\u2033])`,
  "g"
);

function normalizePrimes(text: string): string {
  return text.replace(DOUBLE_PRIME_RE, `$1${DOUBLE_PRIME}`).replace(SINGLE_PRIME_RE, `$1${PRIME}`);
}

// ===== 2) Smart quotes + nested quotes =====
function smartQuotesEn(input: string): string {
  let text = input.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");

  // апострофы внутри слова → ’ (числовые праймы уже сняты выше)
  text = text.replace(/\b([A-Za-z]+)'([A-Za-z]+)\b/g, `$1${RIGHT_SQUOTE}$2`);
  // Word-end apostrophe: для 'lovers'' '\b' после '\'' не срабатывает,
  // т.к. оба — non-word. Используем явный lookahead "не буква".
  text = text.replace(/([A-Za-z])'(?![A-Za-z])/g, `$1${RIGHT_SQUOTE}`);
  text = text.replace(/(?<![A-Za-z])'([A-Za-z]+)\b/g, `${RIGHT_SQUOTE}$1`);

  // Парные двойные кавычки “…”
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? LEFT_DQUOTE : RIGHT_DQUOTE;
      open = !open;
    } else {
      out += ch;
    }
  }

  // Вложенные одиночные кавычки внутри “…” → ‘…’
  let nested = "";
  let inside = false;
  let openS = true;
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (ch === LEFT_DQUOTE) {
      inside = true;
      openS = true;
      nested += ch;
      continue;
    }
    if (ch === RIGHT_DQUOTE) {
      inside = false;
      nested += ch;
      continue;
    }
    if (inside && ch === "'") {
      nested += openS ? LEFT_SQUOTE : RIGHT_SQUOTE;
      openS = !openS;
    } else {
      nested += ch;
    }
  }
  out = nested;

  // Косметика: пробелы у краёв кавычек, пунктуация внутрь
  out = out.replace(new RegExp(`${LEFT_DQUOTE}${ANY_SPACE_SRC}+`, "g"), LEFT_DQUOTE);
  out = out.replace(new RegExp(`${ANY_SPACE_SRC}+${RIGHT_DQUOTE}`, "g"), RIGHT_DQUOTE);

  return out;
}

// ===== 3) Em dash =====
// По ТЗ: длинные тире — без навязывания пробелов. Делаем только: '--' → '—'.
// Сохранение/изменение пробелов вокруг уже стоящего em dash — НЕ навязываем.
const DOUBLE_DASH_RE = /(\s*)--(\s*)/g;

function normalizeEmDashEn(text: string): string {
  return text.replace(DOUBLE_DASH_RE, (_m, lsp: string, rsp: string) => {
    const left = lsp.length ? " " : "";
    const right = rsp.length ? " " : "";
    return `${left}${EM_DASH}${right}`;
  });
}

// ===== 4) number + unit/percent (NBSP); валюты =====
const UNITS = UNITS_EN.map((u) =>
  u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|");

const PERCENT_RE = new RegExp(`(\\d+)${ANY_SPACE_SRC}*%`, "g");
const UNIT_RE = new RegExp(
  `(\\d+)${ANY_SPACE_SRC}+(${UNITS})(?![A-Za-z0-9])`,
  "g"
);
// ($|£|€) [пробелы] число[.,доли] — нормализуем формат и убираем пробел.
// Порядок альтернатив важен: \d+ — first, иначе [0-9]{1,3}... частично
// проглатывает 4-значные числа ("1234" → "123"), теряя последнюю цифру.
const LEADING_CURRENCY_RE =
  /([$£€])\s*(\d+(?:[ ,]\d{3})+|\d+)([.,]\d+)?/g;
// Защита от схлопывания тысяч в формат "$1.234.56": возвращаем "," как разделитель тысяч
const US_THOUSANDS_RE = /([$£€]\d{1,3})\.(\d{3})(?!\d)/g;
// Число + пробел + валютный знак справа: "300 $" → "300 NBSP $"
const TRAILING_CURRENCY_RE = new RegExp(
  `(\\d)${ANY_SPACE_SRC}+([$£€])`,
  "g"
);

function normalizeLeadingCurrency(text: string): string {
  return text.replace(LEADING_CURRENCY_RE, (_m, sym: string, num: string, dec: string | undefined) => {
    const rawDigits = num.replace(/[ .,]/g, "");
    const withThousands = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const tail = dec ? "." + dec.slice(1) : "";
    return `${sym}${withThousands}${tail}`;
  });
}

function glueUnitsAndPercentsEn(text: string): string {
  let t = text;
  t = normalizeLeadingCurrency(t);
  t = t.replace(US_THOUSANDS_RE, "$1,$2");
  t = t.replace(PERCENT_RE, (_m, n) => `${n}${NBSP}%`);
  t = t.replace(UNIT_RE, (_m, n, u) => `${n}${NBSP}${u}`);
  t = t.replace(TRAILING_CURRENCY_RE, (_m, n, sym) => `${n}${NBSP}${sym}`);
  return t;
}

// ===== 5) Диапазоны =====
const RANGE_RE = /\b(\d+)\s*-\s*(\d+)\b/g;
function normalizeRangesEn(text: string): string {
  return text.replace(RANGE_RE, `$1${EN_DASH}$2`);
}

// Группировка тысяч (5+ цифр) запятой-разделителем — англоязычная норма.
// Применяется к произвольным числам, не только к валютным префиксам
// (normalizeLeadingCurrency уже отрабатывает $1234 → $1,234).
function groupThousandsEn(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

// ===== 6) NBSP после проклитик (артиклей/предлогов/союзов) =====
// NB: в ТЗ §3.3 явно "Артикли/предлоги НЕ склеиваем NBSP".
//     В разделе "Готовый функционал" — обратное. Оставлено по факту реализации,
//     требует подтверждения у владельца продукта.
const PROCLITICS_RE = PROCLITICS.length
  ? new RegExp(
      `\\b(${PROCLITICS.map((w) =>
        w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      ).join("|")})${ANY_SPACE_SRC}+(?=\\S)`,
      "gi"
    )
  : null;

function glueProclitics(text: string): string {
  if (!PROCLITICS_RE) return text;
  return text.replace(PROCLITICS_RE, (_m, w) => w + NBSP);
}

// English honorifics: Dr./Mr./Mrs./Ms./Prof./St./Sr./Jr./Rev./Capt./Lt./Col./Gen.
// + NBSP перед фамилией. Не трогаем в конце предложения (где после '.' нет
// заглавного имени, а идёт пробел и обычное слово/конец).
const HONORIFICS_RE = /\b(Dr|Mr|Mrs|Ms|Prof|St|Sr|Jr|Rev|Capt|Lt|Col|Gen)\.\s+(?=[A-Z])/g;
function glueHonorifics(text: string): string {
  return text.replace(HONORIFICS_RE, `$1.${NBSP}`);
}

// Латинские сокращения e.g. / i.e. / etc. / vs. / cf.
// Внутри e.g. и i.e. ставим NBSP (по строгой типографике), и NBSP после
// всего сокращения перед следующим словом.
function glueLatinAbbrs(text: string): string {
  // 1) e.g. → e.NBSPg.   (требуем точки на ОБЕИХ позициях, чтобы случайно
  // не подцепить "egg", "ego" и т.п.)
  text = text.replace(/\be\.\s*g\.(?=\s|,|;|:|\)|$)/g, `e.${NBSP}g.`);
  text = text.replace(/\bi\.\s*e\.(?=\s|,|;|:|\)|$)/g, `i.${NBSP}e.`);
  // 2) NBSP после сокращения, если дальше идёт обычное слово
  text = text.replace(
    /(e\. g\.|i\. e\.|etc\.|vs\.|cf\.)\s+(?=\S)/g,
    `$1${NBSP}`
  );
  return text;
}

export function applyEnglishRules(input: string): string {
  let t = input;
  t = normalizePrimes(t);
  t = smartQuotesEn(t);
  // em dash должен идти ДО ranges: -- содержит -, ranges работает только с цифрами
  t = normalizeEmDashEn(t);
  t = normalizeRangesEn(t);
  t = glueUnitsAndPercentsEn(t);
  t = groupThousandsEn(t);
  t = glueLatinAbbrs(t);
  t = glueHonorifics(t);
  t = glueProclitics(t);
  return t;
}
