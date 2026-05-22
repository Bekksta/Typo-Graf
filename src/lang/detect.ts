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
const UNIQUE_MARKER_RULES: Array<{ lang: Language; re: RegExp }> = [
  { lang: "de", re: /[äöüß]/i },     // ä ö ü ß — однозначно немецкие
  { lang: "es", re: /[ñ¿¡]/i },      // ñ ¿ ¡ — однозначно испанские
  { lang: "it", re: /[òì]/i },        // ò ì (грав на o/i) — итальянские
  { lang: "pl", re: /[ąęłńśźż]/i },  // ć опускаем — пересекается с bcs/hr
  { lang: "pt", re: /[ãõ]/i },        // ã õ (назальные тильды) — португальские
  { lang: "fr", re: /[çœÿæ]/i },     // ç œ ÿ æ — французские
  { lang: "bcs", re: /[čšž]/i },     // č š ž — bcs (ć/đ опускаем — overlap с pl)
];

// Soft-маркеры: общие диакритики, по которым скорим на ничье/неуверенности.
// Вес: каждое совпадение даёт +1 балл.
const SOFT_CHAR_RULES: Array<{ lang: Language; re: RegExp }> = [
  { lang: "es", re: /[áíóúü]/gi },
  { lang: "fr", re: /[àâèéêëîïôùû]/gi },
  { lang: "it", re: /[àèìòù]/gi },
  { lang: "pt", re: /[âêô]/gi },
  { lang: "pl", re: /[ó]/gi },
];

// Частотные характерные слова. Помогают на текстах типа «Andiamo perché è
// bello», где нет уникальных диакритик: одного характерного слова достаточно,
// чтобы перевесить общие гласные с акцентами.
// Вес: каждое совпадение даёт +5 баллов (слово сильнее одного диакритика).
const SOFT_WORD_RULES: Array<{ lang: Language; re: RegExp }> = [
  { lang: "de", re: /(?<![\p{L}\p{N}])(der|die|das|und|nicht|ich|sein|wird|durch|zwischen|über|für|mit|eine|einen|sie|auch|aber|nach|sind|haben|werden)(?![\p{L}\p{N}])/giu },
  { lang: "es", re: /(?<![\p{L}\p{N}])(el|los|las|una|también|español|hacer|para|por|con|pero|esto|esta|está|este|son|del|muy|qué|cómo|dónde|cuándo|aquí|allá|después|señor)(?![\p{L}\p{N}])/giu },
  { lang: "fr", re: /(?<![\p{L}\p{N}])(le|la|les|dans|pour|sans|avec|vous|peut|leur|leurs|être|faire|c'est|qu'on|qui|nous|une|sont|sont)(?![\p{L}\p{N}])/giu },
  { lang: "it", re: /(?<![\p{L}\p{N}])(che|gli|perché|però|della|sono|molto|quando|ancora|anche|sulla|nella|questo|questa|hanno)(?![\p{L}\p{N}])/giu },
  { lang: "pl", re: /(?<![\p{L}\p{N}])(jest|się|nie|że|ale|też|tylko|jak|ten|ta|jako|które|który|która|przez)(?![\p{L}\p{N}])/giu },
  { lang: "pt", re: /(?<![\p{L}\p{N}])(não|são|em|com|fazer|então|está|estão|para|porque|mas|isso|isto|este|esta)(?![\p{L}\p{N}])/giu },
  { lang: "nl", re: /(?<![\p{L}\p{N}])(het|een|van|zijn|niet|maar|onze|wij|deze|naar|over|door|tussen|veel)(?![\p{L}\p{N}])/giu },
  { lang: "en", re: /(?<![\p{L}\p{N}])(the|of|and|with|that|this|these|those|which|where|when|while|because)(?![\p{L}\p{N}])/giu },
];

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
  for (const { lang, re } of UNIQUE_MARKER_RULES) {
    if (re.test(text)) return lang;
  }
  return null;
}

// Порядок приоритета на ничьях скоринга (первый в списке выигрывает).
// Сортировка примерно по числу носителей в мире: en >> es > pt > fr > de
// > it > pl > nl. На практике приоритет срабатывает только когда суммы
// баллов реально совпадают — наши стопворды между языками не пересекаются,
// так что ничьи возникают редко.
const PRIORITY: Language[] = ["en", "es", "pt", "fr", "de", "it", "pl", "nl"];

function detectBySoftScore(text: string): Language | null {
  const scores = new Map<Language, number>();
  for (const { lang, re } of SOFT_CHAR_RULES) {
    const m = text.match(re);
    if (m) scores.set(lang, (scores.get(lang) ?? 0) + m.length);
  }
  for (const { lang, re } of SOFT_WORD_RULES) {
    const m = text.match(re);
    if (m) scores.set(lang, (scores.get(lang) ?? 0) + m.length * 5);
  }
  let best: Language | null = null;
  let bestScore = 0;
  for (const lang of PRIORITY) {
    const s = scores.get(lang) ?? 0;
    if (s > bestScore) {
      best = lang;
      bestScore = s;
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
    // 2) Скоринг: диакритики (×1) + частотные слова (×5).
    //    Слова помогают на текстах без уникальных акцентов
    //    («Andiamo perché è bello» → it, не fr).
    const soft = detectBySoftScore(text);
    if (soft) return soft;
    // 3) Латиница без признаков → английский.
    return "en";
  }

  // Нет ни кириллицы, ни латиницы — фолбэк на русский.
  return "ru";
}
