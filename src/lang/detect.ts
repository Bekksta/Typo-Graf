import { Language } from "../types";

const CYR_LETTER = /[Ѐ-ӿ]/;
const LAT_LETTER = /[A-Za-z]/;

// Маркеры языка по диакритикам/уникальным символам.
// fr НЕ включает ä/ö/ü/ß — они однозначно немецкие; иначе "Schöne Grüße"
// определялся как fr из-за ü/ö, общих с de.
const HAS = {
  es: /[ñáíóú¿¡]/i,
  fr: /[çàâæèéêëîïôœùûÿ]|«|»/i,
  de: /[äöüß]/,
  uk: /[іїєґ]/i,
  bcs: /[čćšđž]/i,
  // it: ò и ì — грав-акценты на o/i, уникальные для итальянского.
  // (французский использует ô î с circumflex, не grave). à/è/é/ù — общие
  // с французским и не дискриминируют надёжно, поэтому НЕ маркеры.
  it: /[òì]/i,
  // pl: характерные польские диакритики ą ć ę ł ń ś ź ż.
  pl: /[ąćęłńśźż]/i,
  // pt: ã и õ — назальные тильды, уникальные для португальского
  // (испанский использует ñ, не ã/õ).
  pt: /[ãõ]/i,
  // nl: голландский редко использует диакритики; распознаём по характерным
  // частотным словам (het, een, van, zijn, niet, maar). Не идеально, но
  // выручает для типичных голландских макетов.
  nl: /\b(het|een|van|zijn|niet|maar|onze|wij)\b/i,
  // ђћјљњ — характерные сербские кириллические буквы
  srCy: /[ђћјљњ]/i,
};

// «Доминирующий скрипт»-подход: считаем кириллические и латинские буквы;
// больше — побеждает. Это исправляет старое поведение, когда «It's awesome,
// but мир» определялся как ru (по первому встреченному маркеру), хотя
// английского текста в нём намного больше.
function countScripts(text: string): { cyr: number; lat: number } {
  let cyr = 0;
  let lat = 0;
  for (const ch of text) {
    if (CYR_LETTER.test(ch)) cyr++;
    else if (LAT_LETTER.test(ch)) lat++;
  }
  return { cyr, lat };
}

export function detectLanguage(text: string): Language {
  const { cyr, lat } = countScripts(text);

  // Если кириллицы строго больше — кириллический путь.
  // Тай (cyr === lat > 0) разрешаем в пользу кириллицы — практичный дефолт.
  if (cyr > 0 && cyr >= lat) {
    if (HAS.uk.test(text)) return "uk";
    if (HAS.srCy.test(text)) return "sr-Cyrl";
    return "ru";
  }

  // Если латиницы больше (или кириллицы нет) — латинский путь.
  // Проверяем уникальные маркеры в порядке убывания специфичности.
  if (lat > 0) {
    if (HAS.de.test(text)) return "de";
    if (HAS.it.test(text)) return "it";
    if (HAS.pl.test(text)) return "pl";
    // pt: ã/õ — характерны для португальского, в др. латинских языках почти
    // не встречаются. Проверяем до es, чтобы «São Paulo» не пошло как es.
    if (HAS.pt.test(text)) return "pt";
    if (HAS.fr.test(text)) return "fr";
    if (HAS.es.test(text)) return "es";
    if (HAS.bcs.test(text)) return "bcs";
    if (HAS.nl.test(text)) return "nl";
    return "en";
  }

  // Фолбэк: нет ни кириллицы, ни латиницы — считаем русским.
  return "ru";
}
