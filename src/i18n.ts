// Локализация сообщений плагина по UI-локали Figma.
// Локаль приходит из UI через navigator.language (в plugin sandbox его нет).
// Для языков вне поддерживаемого списка фолбэк — английский.

import { Language } from "./types";

export type UILocale = Language;

const SUPPORTED: UILocale[] = ["ru", "en", "fr", "uk", "de", "es", "bcs", "it", "pl", "pt", "nl"];

export function detectUILocale(navLang: string | undefined | null): UILocale {
  const lc = (navLang || "").toLowerCase().split(/[-_]/)[0];
  if (lc === "ru") return "ru";
  if (lc === "uk") return "uk";
  if (lc === "fr") return "fr";
  if (lc === "de") return "de";
  if (lc === "es") return "es";
  if (lc === "it") return "it";
  if (lc === "pl") return "pl";
  if (lc === "pt") return "pt";
  if (lc === "nl") return "nl";
  if (lc === "hr" || lc === "sr" || lc === "bs") return "bcs";
  if (SUPPORTED.indexOf(lc as UILocale) !== -1) return lc as UILocale;
  return "en";
}

type MessageKey =
  // Самостоятельные статусы (с точкой)
  | "doneStat"
  | "cancelledStat"
  | "errorStat"
  | "noTextLayersStat"
  // Статистические предложения (подстановки {list}/{n}/{changes}/{nodes}/{limit}/{total})
  | "languagesStat"
  | "summaryStat"
  | "skippedFontsStat"
  | "skippedLongStat"
  | "limitStat"
  // Подсказка про undo (без точки — отдельной строкой)
  | "undoHint"
  // Текст loading-нотиса во время работы (Тупографим… / Typografing…).
  // К нему добавляется процент: «Тупографим… 47%».
  | "loadingNotice";

const T: Record<UILocale, Record<MessageKey, string>> = {
  ru: {
    doneStat: "Готово.",
    cancelledStat: "Отменено.",
    errorStat: "Ошибка: {message}.",
    noTextLayersStat: "Текстовые слои не найдены.",
    languagesStat: "Языки: {list}.",
    summaryStat: "Изменений: {changes}, узлов: {nodes}.",
    skippedFontsStat: "Пропущено по шрифту: {n}.",
    skippedLongStat: "Пропущено длинных узлов: {n}.",
    limitStat: "Обработан лимит {limit} из {total}.",
    undoHint: "Ctrl/⌘+Z — отменить",
    loadingNotice: "Тупографим…",
  },
  en: {
    doneStat: "Done.",
    cancelledStat: "Cancelled.",
    errorStat: "Error: {message}.",
    noTextLayersStat: "No text layers found.",
    languagesStat: "Languages: {list}.",
    summaryStat: "Changes: {changes}, nodes: {nodes}.",
    skippedFontsStat: "Skipped (font): {n}.",
    skippedLongStat: "Skipped (too long): {n}.",
    limitStat: "Processed first {limit} of {total}.",
    undoHint: "Ctrl/⌘+Z to undo",
    loadingNotice: "Typografing…",
  },
  fr: {
    doneStat: "Terminé.",
    cancelledStat: "Annulé.",
    errorStat: "Erreur : {message}.",
    noTextLayersStat: "Aucun calque de texte trouvé.",
    languagesStat: "Langues : {list}.",
    summaryStat: "Modifications : {changes}, nœuds : {nodes}.",
    skippedFontsStat: "Ignorés (police) : {n}.",
    skippedLongStat: "Ignorés (trop longs) : {n}.",
    limitStat: "{limit} premiers traités sur {total}.",
    undoHint: "Ctrl/⌘+Z pour annuler",
    loadingNotice: "Typographions…",
  },
  uk: {
    doneStat: "Готово.",
    cancelledStat: "Скасовано.",
    errorStat: "Помилка: {message}.",
    noTextLayersStat: "Текстові шари не знайдено.",
    languagesStat: "Мови: {list}.",
    summaryStat: "Змін: {changes}, вузлів: {nodes}.",
    skippedFontsStat: "Пропущено за шрифтом: {n}.",
    skippedLongStat: "Пропущено задовгих вузлів: {n}.",
    limitStat: "Оброблено перші {limit} з {total}.",
    undoHint: "Ctrl/⌘+Z — скасувати",
    loadingNotice: "Типографуємо…",
  },
  de: {
    doneStat: "Fertig.",
    cancelledStat: "Abgebrochen.",
    errorStat: "Fehler: {message}.",
    noTextLayersStat: "Keine Textebenen gefunden.",
    languagesStat: "Sprachen: {list}.",
    summaryStat: "Änderungen: {changes}, Knoten: {nodes}.",
    skippedFontsStat: "Übersprungen (Schrift): {n}.",
    skippedLongStat: "Übersprungen (zu lang): {n}.",
    limitStat: "{limit} von {total} verarbeitet.",
    undoHint: "Ctrl/⌘+Z zum Rückgängigmachen",
    loadingNotice: "Typografieren…",
  },
  es: {
    doneStat: "Listo.",
    cancelledStat: "Cancelado.",
    errorStat: "Error: {message}.",
    noTextLayersStat: "No se encontraron capas de texto.",
    languagesStat: "Idiomas: {list}.",
    summaryStat: "Cambios: {changes}, nodos: {nodes}.",
    skippedFontsStat: "Omitidos (fuente): {n}.",
    skippedLongStat: "Omitidos (demasiado largos): {n}.",
    limitStat: "Procesados los primeros {limit} de {total}.",
    undoHint: "Ctrl/⌘+Z para deshacer",
    loadingNotice: "Tipografiando…",
  },
  bcs: {
    doneStat: "Gotovo.",
    cancelledStat: "Otkazano.",
    errorStat: "Greška: {message}.",
    noTextLayersStat: "Tekstualni slojevi nisu pronađeni.",
    languagesStat: "Jezici: {list}.",
    summaryStat: "Izmjene: {changes}, čvorovi: {nodes}.",
    skippedFontsStat: "Preskočeno (font): {n}.",
    skippedLongStat: "Preskočeno (preduga): {n}.",
    limitStat: "Obrađeno prvih {limit} od {total}.",
    undoHint: "Ctrl/⌘+Z za poništavanje",
    loadingNotice: "Tipografišemo…",
  },
  it: {
    doneStat: "Fatto.",
    cancelledStat: "Annullato.",
    errorStat: "Errore: {message}.",
    noTextLayersStat: "Nessun livello di testo trovato.",
    languagesStat: "Lingue: {list}.",
    summaryStat: "Modifiche: {changes}, nodi: {nodes}.",
    skippedFontsStat: "Saltati (font): {n}.",
    skippedLongStat: "Saltati (troppo lunghi): {n}.",
    limitStat: "Elaborati i primi {limit} di {total}.",
    undoHint: "Ctrl/⌘+Z per annullare",
    loadingNotice: "Tipografando…",
  },
  pl: {
    doneStat: "Gotowe.",
    cancelledStat: "Anulowano.",
    errorStat: "Błąd: {message}.",
    noTextLayersStat: "Nie znaleziono warstw tekstowych.",
    languagesStat: "Języki: {list}.",
    summaryStat: "Zmiany: {changes}, węzły: {nodes}.",
    skippedFontsStat: "Pominięto (czcionka): {n}.",
    skippedLongStat: "Pominięto (zbyt długie): {n}.",
    limitStat: "Przetworzono pierwsze {limit} z {total}.",
    undoHint: "Ctrl/⌘+Z aby cofnąć",
    loadingNotice: "Typografujemy…",
  },
  pt: {
    doneStat: "Concluído.",
    cancelledStat: "Cancelado.",
    errorStat: "Erro: {message}.",
    noTextLayersStat: "Nenhuma camada de texto encontrada.",
    languagesStat: "Idiomas: {list}.",
    summaryStat: "Alterações: {changes}, nós: {nodes}.",
    skippedFontsStat: "Ignorados (fonte): {n}.",
    skippedLongStat: "Ignorados (muito longos): {n}.",
    limitStat: "Processados os primeiros {limit} de {total}.",
    undoHint: "Ctrl/⌘+Z para desfazer",
    loadingNotice: "Tipografando…",
  },
  nl: {
    doneStat: "Klaar.",
    cancelledStat: "Geannuleerd.",
    errorStat: "Fout: {message}.",
    noTextLayersStat: "Geen tekstlagen gevonden.",
    languagesStat: "Talen: {list}.",
    summaryStat: "Wijzigingen: {changes}, knopen: {nodes}.",
    skippedFontsStat: "Overgeslagen (lettertype): {n}.",
    skippedLongStat: "Overgeslagen (te lang): {n}.",
    limitStat: "Eerste {limit} van {total} verwerkt.",
    undoHint: "Ctrl/⌘+Z om ongedaan te maken",
    loadingNotice: "Typograferen…",
  },
};

const LANG_NAMES: Record<UILocale, Record<Language, string>> = {
  ru: {
    ru: "русский",
    en: "английский",
    fr: "французский",
    de: "немецкий",
    es: "испанский",
    uk: "украинский",
    bcs: "сербохорватский (лат.)",
    it: "итальянский",
    pl: "польский",
    pt: "португальский",
    nl: "голландский",
    "sr-Cyrl": "сербский (кир.)",
  },
  en: {
    ru: "Russian",
    en: "English",
    fr: "French",
    de: "German",
    es: "Spanish",
    uk: "Ukrainian",
    bcs: "Serbo-Croatian (Latin)",
    it: "Italian",
    pl: "Polish",
    pt: "Portuguese",
    nl: "Dutch",
    "sr-Cyrl": "Serbian (Cyrillic)",
  },
  fr: {
    ru: "russe",
    en: "anglais",
    fr: "français",
    de: "allemand",
    es: "espagnol",
    uk: "ukrainien",
    bcs: "serbo-croate (latin)",
    it: "italien",
    pl: "polonais",
    pt: "portugais",
    nl: "néerlandais",
    "sr-Cyrl": "serbe (cyrillique)",
  },
  uk: {
    ru: "російська",
    en: "англійська",
    fr: "французька",
    de: "німецька",
    es: "іспанська",
    uk: "українська",
    bcs: "сербохорватська (лат.)",
    it: "італійська",
    pl: "польська",
    pt: "португальська",
    nl: "нідерландська",
    "sr-Cyrl": "сербська (кир.)",
  },
  de: {
    ru: "Russisch",
    en: "Englisch",
    fr: "Französisch",
    de: "Deutsch",
    es: "Spanisch",
    uk: "Ukrainisch",
    bcs: "Serbokroatisch (Lat.)",
    it: "Italienisch",
    pl: "Polnisch",
    pt: "Portugiesisch",
    nl: "Niederländisch",
    "sr-Cyrl": "Serbisch (Kyrillisch)",
  },
  es: {
    ru: "ruso",
    en: "inglés",
    fr: "francés",
    de: "alemán",
    es: "español",
    uk: "ucraniano",
    bcs: "serbocroata (lat.)",
    it: "italiano",
    pl: "polaco",
    pt: "portugués",
    nl: "neerlandés",
    "sr-Cyrl": "serbio (cirílico)",
  },
  bcs: {
    ru: "ruski",
    en: "engleski",
    fr: "francuski",
    de: "njemački",
    es: "španjolski",
    uk: "ukrajinski",
    bcs: "srpskohrvatski (lat.)",
    it: "talijanski",
    pl: "poljski",
    pt: "portugalski",
    nl: "nizozemski",
    "sr-Cyrl": "srpski (ćir.)",
  },
  it: {
    ru: "russo",
    en: "inglese",
    fr: "francese",
    de: "tedesco",
    es: "spagnolo",
    uk: "ucraino",
    bcs: "serbo-croato (lat.)",
    it: "italiano",
    pl: "polacco",
    pt: "portoghese",
    nl: "olandese",
    "sr-Cyrl": "serbo (cirillico)",
  },
  pl: {
    ru: "rosyjski",
    en: "angielski",
    fr: "francuski",
    de: "niemiecki",
    es: "hiszpański",
    uk: "ukraiński",
    bcs: "serbsko-chorwacki (łac.)",
    it: "włoski",
    pl: "polski",
    pt: "portugalski",
    nl: "niderlandzki",
    "sr-Cyrl": "serbski (cyr.)",
  },
  pt: {
    ru: "russo",
    en: "inglês",
    fr: "francês",
    de: "alemão",
    es: "espanhol",
    uk: "ucraniano",
    bcs: "servo-croata (lat.)",
    it: "italiano",
    pl: "polonês",
    pt: "português",
    nl: "holandês",
    "sr-Cyrl": "sérvio (cir.)",
  },
  nl: {
    ru: "Russisch",
    en: "Engels",
    fr: "Frans",
    de: "Duits",
    es: "Spaans",
    uk: "Oekraïens",
    bcs: "Servo-Kroatisch (Lat.)",
    it: "Italiaans",
    pl: "Pools",
    pt: "Portugees",
    nl: "Nederlands",
    "sr-Cyrl": "Servisch (Cyrillisch)",
  },
};

export function t(
  locale: UILocale,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  let msg = T[locale]?.[key] ?? T.en[key];
  if (params) {
    for (const k of Object.keys(params)) {
      msg = msg.replace(`{${k}}`, String(params[k]));
    }
  }
  return msg;
}

export function langName(uiLocale: UILocale, lang: Language): string {
  return LANG_NAMES[uiLocale]?.[lang] ?? LANG_NAMES.en[lang] ?? lang;
}
