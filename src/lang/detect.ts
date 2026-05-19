import { Language } from "../types";

const CYR_LETTER = /[Ѐ-ӿ]/;
const LAT_LETTER = /[A-Za-z]/;

// Кириллические маркеры (уникальные для языка).
const HAS_UK = /[іїєґ]/i;
const HAS_SR_CY = /[ђћјљњ]/i;

// Принцип: сначала ищем 100%-уникальные маркеры (символ, который в других
// поддерживаемых языках не встречается). Если нашли — мгновенный возврат,
// без скоринга. Если уникального маркера нет — переходим к soft-scoring
// по характерным, но общим с другими языками диакритикам.

// 100%-уникальные маркеры. Порядок не важен — каждый язык обособлен.
const UNIQUE: Array<{ lang: Language; re: RegExp }> = [
  { lang: "de", re: /[äöüß]/i },     // ä ö ü ß — однозначно немецкие
  { lang: "es", re: /[ñ¿¡]/i },      // ñ ¿ ¡ — однозначно испанские
  { lang: "it", re: /[òì]/i },        // ò ì (грав на o/i) — итальянские
  { lang: "pl", re: /[ąęłńśźż]/i },  // ć опускаем — пересекается с bcs/hr
  { lang: "pt", re: /[ãõ]/i },        // ã õ (назальные тильды) — португальские
  { lang: "fr", re: /[çœÿæ]/i },     // ç œ ÿ æ — французские
  { lang: "bcs", re: /[čšž]/i },     // č š ž — bcs (ć/đ опускаем — overlap с pl)
];

// Soft-маркеры: общие диакритики, по которым скорим на ничье/неуверенности.
// Порядок задаёт приоритет на ничьих (первый в списке выигрывает).
const SOFT: Array<{ lang: Language; re: RegExp }> = [
  { lang: "es", re: /[áíóúü]/gi },
  { lang: "fr", re: /[àâèéêëîïôùû]/gi },
  { lang: "it", re: /[àèìòù]/gi },
  { lang: "pt", re: /[âêô]/gi },
  { lang: "pl", re: /[ó]/gi },
];

// Голландский — по частотным служебным словам, диакритики редки.
const HAS_NL = /\b(het|een|van|zijn|niet|maar|onze|wij)\b/gi;

function countScripts(text: string): { cyr: number; lat: number } {
  let cyr = 0;
  let lat = 0;
  for (const ch of text) {
    if (CYR_LETTER.test(ch)) cyr++;
    else if (LAT_LETTER.test(ch)) lat++;
  }
  return { cyr, lat };
}

function detectByUnique(text: string): Language | null {
  for (const { lang, re } of UNIQUE) {
    if (re.test(text)) return lang;
  }
  return null;
}

function detectBySoftScore(text: string): Language | null {
  let best: Language | null = null;
  let bestScore = 0;
  for (const { lang, re } of SOFT) {
    const m = text.match(re);
    const score = m ? m.length : 0;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  return best;
}

export function detectLanguage(text: string): Language {
  const { cyr, lat } = countScripts(text);

  // Кириллическая ветка. Уникальные маркеры → мгновенный возврат.
  // `Љ`/`Њ` и др. — однозначно сербская кириллица; счёт не нужен.
  if (cyr > 0 && cyr >= lat) {
    if (HAS_SR_CY.test(text)) return "sr-Cyrl";
    if (HAS_UK.test(text)) return "uk";
    return "ru";
  }

  if (lat > 0) {
    // 1) Уникальные маркеры — мгновенный return.
    const unique = detectByUnique(text);
    if (unique) return unique;
    // 2) Скоринг по общим диакритикам (например, é/à/è).
    const soft = detectBySoftScore(text);
    if (soft) return soft;
    // 3) Голландский по частотным служебным словам.
    if (HAS_NL.test(text)) return "nl";
    // 4) Латиница без признаков → английский.
    return "en";
  }

  // Нет ни кириллицы, ни латиницы — фолбэк на русский.
  return "ru";
}
