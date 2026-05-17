import { Language } from "../types";

const CYR = /[Ѐ-ӿ]/;
const LAT = /[A-Za-z]/;

// Маркеры языка по диакритикам/уникальным символам.
const HAS = {
  es: /[ñáéíóúü¿¡]/i,
  fr: /[çàâäæèéêëîïôœùûüÿ]|«|»/i,
  de: /[äöüß]/,
  uk: /[іїєґ]/i,
  bcs: /[čćšđž]/i,
  // ђћјљњ — характерные сербские кириллические буквы
  srCy: /[ђћјљњ]/i,
};

// Сербская кириллица по ТЗ обрабатывается «как ru за вычетом ё»,
// но это решение принимается уже внутри ru-правил. На уровне детекта
// возвращаем 'ru' (см. ТЗ §3.8).
export function detectLanguage(text: string): Language {
  if (CYR.test(text)) {
    if (HAS.uk.test(text)) return "uk";
    if (HAS.srCy.test(text)) return "ru"; // sr-Cyrl → правила ru (без ё)
    return "ru";
  }
  if (HAS.fr.test(text)) return "fr";
  if (HAS.de.test(text)) return "de";
  if (HAS.es.test(text)) return "es";
  if (HAS.bcs.test(text)) return "bcs";
  if (LAT.test(text)) return "en";
  // Фолбэк по ТЗ: нет ни кириллицы, ни латиницы — считаем русским.
  return "ru";
}
