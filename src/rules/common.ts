// Общие правила + маскирование URL/email. Только NBSP (U+00A0).
import { NBSP, EN_DASH, ELLIPSIS } from "../lang/maps";

export type Replacement = {
  start: number;
  end: number;
  text: string;
  reason?: string;
};


// ---- маскирование URL/Email фикс. длиной ----
const PUA_BASE = 0xe000;
const MASK_LEN = 10;
const MASK_TOKEN = String.fromCharCode(PUA_BASE) + "x".repeat(MASK_LEN - 1);

type MaskPart = { raw: string };

const URL_RE = /\bhttps?:\/\/[^\s]+/gi;
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;

export function maskUrlsAndEmails(input: string) {
  const parts: MaskPart[] = [];
  let masked = input.replace(URL_RE, (m) => {
    parts.push({ raw: m });
    return MASK_TOKEN;
  });
  masked = masked.replace(EMAIL_RE, (m) => {
    parts.push({ raw: m });
    return MASK_TOKEN;
  });
  return { masked, parts };
}
export function unmaskUrlsAndEmails(text: string, parts: MaskPart[]) {
  if (!parts.length) return text;
  let i = 0;
  return text.replace(new RegExp(MASK_TOKEN, "g"), () => parts[i++]?.raw ?? "");
}

// ---- общие правила (порядок важен) ----
export function applyCommonRules(input: string) {
  const replacements: Replacement[] = [];
  let text = input;

  // … твои текущие common-замены …
  text = text.replace(/\s*\.{3}\s*/g, ELLIPSIS)
             .replace(/\s+…/g, ELLIPSIS)
             .replace(/…(?=[A-Za-zА-Яа-яЁё0-9])/g, ELLIPSIS + " ");

  text = text.replace(/(\d)\s+%/g, (_m, d) => `${d}%`);
  const WJ = "\u2060";
  text = text.replace(/%\s*…/g, "%" + WJ + ELLIPSIS);

  // диапазоны цифр -> en dash
  text = text.replace(/(\d+)\s*-\s*(\d+)/g, (_m, a, b) => `${a}${EN_DASH}${b}`);

  // схлопывание множественных пробелов
  text = text.replace(/ {2,}/g, " ");

  // --- сюда переносим "tightenUnitsAndPercents" + праймы/deg ---
  // единицы/валюта/время: 12 кг, 20 ч., 50%
  text = text.replace(
    /(\d+)[ \u00A0\u2009\u202F\t]+(кг|г|см|мм|мг|м|л|км|т|мл|млн|тыс\.?|₽|€|\$|%|ч\.?|мин\.?|сек\.?)(?![A-Za-zА-Яа-яЁё])/g,
    (_m, n, u) => `${n}${NBSP}${u}`
  );
  // … + после многоточия узкий пробел к единице
  text = text.replace(/…\s+(см\.?|мм|м|км|г|кг|л|%|₽|€|\$)/g, (_m, u) => `\u2026${NBSP}${u}`);

  // праймы (минуты/секунды дуги, футы/дюймы) — ДОЛЖНЫ быть до smartQuotesRu
  const SP_ANY = "[ \\u00A0\\u2009\\u202F\\t]*";
  text = text.replace(new RegExp(`(\\d)${SP_ANY}''(?!')`, "g"), "$1\u2033"); // ″
  text = text.replace(new RegExp(`(\\d)${SP_ANY}'(?!')`,  "g"), "$1\u2032"); // ′

  // градусы: только число + deg
  text = text.replace(/\b(\d+)\s*deg\b/gi, "$1\u00B0"); // °

  return { text, replacements };
}
