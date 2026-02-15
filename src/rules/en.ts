// rules/en.ts — EN rules for Typo Graf
import {
  NBSP,
  EN_DASH,
  EM_DASH,
  SP_ANY_SRC,
  PRIME,
  DBL_PRM,
  L_DQ,
  R_DQ,
  L_SQ,
  R_SQ,
} from "../lang/maps";
import { SERVICE_WORDS, UNIT_LIST } from "../lib/enLib";

// ===== 1) футы/дюймы (до кавычек) =====
function normalizePrimes(text: string): string {
  // 12'' / 12" / 12” / 12″ -> 12″
  text = text.replace(
    new RegExp(`(\\d)${SP_ANY_SRC}*(?:''|["”]|\\u2033)`, "g"),
    `$1${DBL_PRM}`
  );
  // 12' / 12’ / 12′ -> 12′
  text = text.replace(
    new RegExp(`(\\d)${SP_ANY_SRC}*(?:'|’|\\u2032)(?!['”"\\u2033])`, "g"),
    `$1${PRIME}`
  );

  return text;
}

// ===== 2) smart quotes + nested quotes =====
function smartQuotesEn(input: string): string {
  // нормализуем экзотические кавычки в ASCII
  let text = input.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");

  // апострофы внутри слова → ’ (не затрагивать числовые праймы, мы их уже нормализовали)
  text = text.replace(
    /\b([A-Za-z]+)'([A-Za-z]+)\b/g,
    `${L_SQ}$1${R_SQ}$2`.replace(L_SQ, "").replace(R_SQ, R_SQ)
  ); // заменим ниже корректно
  text = text.replace(
    /\b([A-Za-z]+)'([A-Za-z]+)\b/g,
    (_m, a, b) => `${a}${R_SQ}${b}`
  );
  text = text.replace(/\b([A-Za-z]+)'\b/g, (_m, a) => `${a}${R_SQ}`);
  text = text.replace(/\b'([A-Za-z]+)\b/g, (_m, a) => `${R_SQ}${a}`);

  // парные двойные кавычки “ … ”
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += ch === '"' ? (open ? L_DQ : R_DQ) : ch;
    if (ch === '"') open = !open;
  }

  // ВНУТРИ “ … ” конвертируем одинарные '…' в ‘ … ’ (nested quotes)
  // проходим сегменты “…”
  let nested = "";
  let inside = false;
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (ch === L_DQ) {
      inside = true;
      nested += ch;
      continue;
    }
    if (ch === R_DQ) {
      inside = false;
      nested += ch;
      continue;
    }
    if (inside && ch === "'") {
      // переключаем открывающую/закрывающую одинарную кавычку по парности
      // простая логика: если предыдущая не открывающая, ставим ‘, иначе ’
      // для стабильности считаем баланс в пределах текущего сегмента
      const seg = nested.slice(nested.lastIndexOf(L_DQ) + 1);
      const opens = (seg.match(new RegExp(L_SQ, "g")) || []).length;
      const closes = (seg.match(new RegExp(R_SQ, "g")) || []).length;
      nested += opens === closes ? L_SQ : R_SQ;
    } else {
      nested += ch;
    }
  }
  out = nested;

  // чистим пробелы у краёв кавычек, пунктуацию внутрь закрывающей
  out = out.replace(new RegExp(`${L_DQ}${SP_ANY_SRC}+`, "g"), L_DQ);
  out = out.replace(new RegExp(`${SP_ANY_SRC}+${R_DQ}`, "g"), R_DQ);
  out = out.replace(new RegExp(`${R_DQ}([.,!?:;…])`, "g"), `${R_DQ}$1`);

  return out;
}

// ===== 3) диапазоны: en dash =====
function normalizeRangesEn(text: string): string {
  return text.replace(
    /\b(\d+)\s*-\s*(\d+)\b/g,
    (_m, a, b) => `${a}${EN_DASH}${b}`
  );
}

// ===== 4) em dash с NBSP слева и обычным пробелом справа =====
function normalizeEmDashEn(text: string): string {
  let t = text;

  // 0) унифицируем все варианты "длинных" штрихов в один тип,
  // чтобы дальше было проще матчить
  t = t.replace(/[\u2013\u2014\u2212]/g, "-"); // EN, EM, MINUS → обычный дефис

  // 1) "--" между нецифровыми токенами → NBSP—space
  t = t.replace(/(\S)(\s*)--(\s*)(\S)/g, (m, left, lsp, rsp, right) => {
    // числовой диапазон с "--" трогать не будем, на всякий
    if (/\d/.test(left) && /\d/.test(right)) return m;
    return `${left}${NBSP}${EM_DASH} ${right}`;
  });

  // 2) одиночный "-" с пробелами вокруг между нецифровыми токенами
  t = t.replace(/(\S)\s-\s(\S)/g, (m, left, right) => {
    // если по обе стороны цифры — это скорее всего "1 - 2" (диапазон/минус), не трогаем
    if (/\d/.test(left) && /\d/.test(right)) return m;
    return `${left}${NBSP}${EM_DASH} ${right}`;
  });

  // 3) на всякий случай: любое NBSP/space вокруг уже стоящего EM_DASH
  // приводим к NBSP слева и одному обычному пробелу справа
  t = t
    .replace(new RegExp(`\\s*${EM_DASH}\\s*`, "g"), `${NBSP}${EM_DASH} `)
    .replace(new RegExp(`${NBSP}${EM_DASH}\\s+`, "g"), `${NBSP}${EM_DASH} `);

  return t;
}

// ===== 5) number + unit/percent (NBSP); валюты слева, формат числа =====
const UNITS = UNIT_LIST.map((u) =>
  u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|");

function formatCurrencyLeadingSymbol(text: string): string {
  // ($|£|€) [spaces] number [decimal_part]
  // → symbol + formatted_number (thousands with comma; decimal separator -> dot; keep decimals if present)
  return text.replace(
    /([$£€])\s*([0-9]{1,3}(?:[ .]?[0-9]{3})*|\d+)([.,]\d+)?/g,
    (_m, sym: string, num: string, dec: string | undefined) => {
      // убираем пробелы/точки в группе, оставим сплошные цифры
      const rawDigits = num.replace(/[ .,]/g, "");
      // расставляем тысячи запятой
      const withThousands = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      let out = withThousands;
      if (dec) {
        // заменяем запятую на точку, сохраняем длину
        out += "." + dec.slice(1);
      }
      return sym + out;
    }
  );
}

function tightenUnitsAndPercentsEn(text: string): string {
  let t = text;

  // Валюта перед числом — без пробела и с форматированием
  t = formatCurrencyLeadingSymbol(t);

  // если где-то превратили "," в ".", возвращаем US-формат: $1.234.56 -> $1,234.56
  t = t.replace(/([$£€]\d{1,3})\.(\d{3})(?!\d)/g, (_m, a, b) => `${a},${b}`);

  // Проценты: число NBSP %
  t = t.replace(
    new RegExp(`(\\d+)${SP_ANY_SRC}*%`, "g"),
    (_m, n) => `${n}${NBSP}%`
  );

  // Единицы: число NBSP unit (если дальше не буква/цифра)
  const reUnit = new RegExp(
    `(\\d+)${SP_ANY_SRC}+(${UNITS})(?![A-Za-z0-9])`,
    "g"
  );
  t = t.replace(reUnit, (_m, n, u) => `${n}${NBSP}${u}`);

  return t;
}

// ===== 6) NBSP для предлогов/союзов (из внешней коллекции) =====
function gluePrepsAndConjs(text: string): string {
  if (!SERVICE_WORDS.length) return text;
  // \b(word)[spaces]+(\S) → word NBSP \2
  const alternation = SERVICE_WORDS.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|");
  const re = new RegExp(`\\b(${alternation})${SP_ANY_SRC}+(?=\\S)`, "gi");
  return text.replace(re, (_m, w) => w + NBSP);
}

// ===== 7) Public API =====
export function applyEnglishRules(input: string): string {
  let t = input;
  t = normalizePrimes(t);
  t = smartQuotesEn(t);
  t = normalizeRangesEn(t);
  t = normalizeEmDashEn(t);
  t = tightenUnitsAndPercentsEn(t);
  t = gluePrepsAndConjs(t);
  return t;
}
