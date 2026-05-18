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
  // Статистические предложения (с двоеточием и точкой, подстановки {list}/{n}/{total})
  | "languagesStat"
  | "changesStat"
  | "affectedStat"
  | "skippedFontsStat"
  | "skippedLongStat"
  | "limitStat"
  // Подсказка про undo (без точки — отдельной строкой)
  | "undoHint"
  // UI лейблы
  | "scanning"
  | "processing"
  | "cancelling"
  | "cancelButton";

const T: Record<UILocale, Record<MessageKey, string>> = {
  ru: {
    doneStat: "Готово.",
    cancelledStat: "Отменено.",
    errorStat: "Ошибка: {message}.",
    noTextLayersStat: "Текстовые слои не найдены.",
    languagesStat: "Языки: {list}.",
    changesStat: "Изменений: {n}.",
    affectedStat: "Затронуто узлов: {n}.",
    skippedFontsStat: "Пропущено по шрифту: {n}.",
    skippedLongStat: "Пропущено длинных узлов: {n}.",
    limitStat: "Обработан лимит {limit} из {total}.",
    undoHint: "Ctrl/⌘+Z — отменить",
    scanning: "Сканирование…",
    processing: "Обработка…",
    cancelling: "Отмена…",
    cancelButton: "Отменить",
  },
  en: {
    doneStat: "Done.",
    cancelledStat: "Cancelled.",
    errorStat: "Error: {message}.",
    noTextLayersStat: "No text layers found.",
    languagesStat: "Languages: {list}.",
    changesStat: "Changes: {n}.",
    affectedStat: "Affected nodes: {n}.",
    skippedFontsStat: "Skipped (font): {n}.",
    skippedLongStat: "Skipped (too long): {n}.",
    limitStat: "Processed first {limit} of {total}.",
    undoHint: "Ctrl/⌘+Z to undo",
    scanning: "Scanning…",
    processing: "Processing…",
    cancelling: "Cancelling…",
    cancelButton: "Cancel",
  },
  fr: {
    doneStat: "Terminé.",
    cancelledStat: "Annulé.",
    errorStat: "Erreur : {message}.",
    noTextLayersStat: "Aucun calque de texte trouvé.",
    languagesStat: "Langues : {list}.",
    changesStat: "Modifications : {n}.",
    affectedStat: "Nœuds modifiés : {n}.",
    skippedFontsStat: "Ignorés (police) : {n}.",
    skippedLongStat: "Ignorés (trop longs) : {n}.",
    limitStat: "{limit} premiers traités sur {total}.",
    undoHint: "Ctrl/⌘+Z pour annuler",
    scanning: "Analyse…",
    processing: "Traitement…",
    cancelling: "Annulation…",
    cancelButton: "Annuler",
  },
  uk: {
    doneStat: "Готово.",
    cancelledStat: "Скасовано.",
    errorStat: "Помилка: {message}.",
    noTextLayersStat: "Текстові шари не знайдено.",
    languagesStat: "Мови: {list}.",
    changesStat: "Змін: {n}.",
    affectedStat: "Змінено вузлів: {n}.",
    skippedFontsStat: "Пропущено за шрифтом: {n}.",
    skippedLongStat: "Пропущено задовгих вузлів: {n}.",
    limitStat: "Оброблено перші {limit} з {total}.",
    undoHint: "Ctrl/⌘+Z — скасувати",
    scanning: "Сканування…",
    processing: "Обробка…",
    cancelling: "Скасування…",
    cancelButton: "Скасувати",
  },
  de: {
    doneStat: "Fertig.",
    cancelledStat: "Abgebrochen.",
    errorStat: "Fehler: {message}.",
    noTextLayersStat: "Keine Textebenen gefunden.",
    languagesStat: "Sprachen: {list}.",
    changesStat: "Änderungen: {n}.",
    affectedStat: "Betroffene Knoten: {n}.",
    skippedFontsStat: "Übersprungen (Schrift): {n}.",
    skippedLongStat: "Übersprungen (zu lang): {n}.",
    limitStat: "{limit} von {total} verarbeitet.",
    undoHint: "Ctrl/⌘+Z zum Rückgängigmachen",
    scanning: "Scannen…",
    processing: "Verarbeitung…",
    cancelling: "Abbruch…",
    cancelButton: "Abbrechen",
  },
  es: {
    doneStat: "Listo.",
    cancelledStat: "Cancelado.",
    errorStat: "Error: {message}.",
    noTextLayersStat: "No se encontraron capas de texto.",
    languagesStat: "Idiomas: {list}.",
    changesStat: "Cambios: {n}.",
    affectedStat: "Nodos afectados: {n}.",
    skippedFontsStat: "Omitidos (fuente): {n}.",
    skippedLongStat: "Omitidos (demasiado largos): {n}.",
    limitStat: "Procesados los primeros {limit} de {total}.",
    undoHint: "Ctrl/⌘+Z para deshacer",
    scanning: "Escaneando…",
    processing: "Procesando…",
    cancelling: "Cancelando…",
    cancelButton: "Cancelar",
  },
  bcs: {
    doneStat: "Gotovo.",
    cancelledStat: "Otkazano.",
    errorStat: "Greška: {message}.",
    noTextLayersStat: "Tekstualni slojevi nisu pronađeni.",
    languagesStat: "Jezici: {list}.",
    changesStat: "Izmjene: {n}.",
    affectedStat: "Izmijenjeni čvorovi: {n}.",
    skippedFontsStat: "Preskočeno (font): {n}.",
    skippedLongStat: "Preskočeno (preduga): {n}.",
    limitStat: "Obrađeno prvih {limit} od {total}.",
    undoHint: "Ctrl/⌘+Z za poništavanje",
    scanning: "Skeniranje…",
    processing: "Obrada…",
    cancelling: "Otkazivanje…",
    cancelButton: "Otkaži",
  },
  it: {
    doneStat: "Fatto.",
    cancelledStat: "Annullato.",
    errorStat: "Errore: {message}.",
    noTextLayersStat: "Nessun livello di testo trovato.",
    languagesStat: "Lingue: {list}.",
    changesStat: "Modifiche: {n}.",
    affectedStat: "Nodi modificati: {n}.",
    skippedFontsStat: "Saltati (font): {n}.",
    skippedLongStat: "Saltati (troppo lunghi): {n}.",
    limitStat: "Elaborati i primi {limit} di {total}.",
    undoHint: "Ctrl/⌘+Z per annullare",
    scanning: "Scansione…",
    processing: "Elaborazione…",
    cancelling: "Annullamento…",
    cancelButton: "Annulla",
  },
  pl: {
    doneStat: "Gotowe.",
    cancelledStat: "Anulowano.",
    errorStat: "Błąd: {message}.",
    noTextLayersStat: "Nie znaleziono warstw tekstowych.",
    languagesStat: "Języki: {list}.",
    changesStat: "Zmiany: {n}.",
    affectedStat: "Zmienione węzły: {n}.",
    skippedFontsStat: "Pominięto (czcionka): {n}.",
    skippedLongStat: "Pominięto (zbyt długie): {n}.",
    limitStat: "Przetworzono pierwsze {limit} z {total}.",
    undoHint: "Ctrl/⌘+Z aby cofnąć",
    scanning: "Skanowanie…",
    processing: "Przetwarzanie…",
    cancelling: "Anulowanie…",
    cancelButton: "Anuluj",
  },
  pt: {
    doneStat: "Concluído.",
    cancelledStat: "Cancelado.",
    errorStat: "Erro: {message}.",
    noTextLayersStat: "Nenhuma camada de texto encontrada.",
    languagesStat: "Idiomas: {list}.",
    changesStat: "Alterações: {n}.",
    affectedStat: "Nós afetados: {n}.",
    skippedFontsStat: "Ignorados (fonte): {n}.",
    skippedLongStat: "Ignorados (muito longos): {n}.",
    limitStat: "Processados os primeiros {limit} de {total}.",
    undoHint: "Ctrl/⌘+Z para desfazer",
    scanning: "Verificando…",
    processing: "Processando…",
    cancelling: "Cancelando…",
    cancelButton: "Cancelar",
  },
  nl: {
    doneStat: "Klaar.",
    cancelledStat: "Geannuleerd.",
    errorStat: "Fout: {message}.",
    noTextLayersStat: "Geen tekstlagen gevonden.",
    languagesStat: "Talen: {list}.",
    changesStat: "Wijzigingen: {n}.",
    affectedStat: "Betrokken knopen: {n}.",
    skippedFontsStat: "Overgeslagen (lettertype): {n}.",
    skippedLongStat: "Overgeslagen (te lang): {n}.",
    limitStat: "Eerste {limit} van {total} verwerkt.",
    undoHint: "Ctrl/⌘+Z om ongedaan te maken",
    scanning: "Scannen…",
    processing: "Verwerken…",
    cancelling: "Annuleren…",
    cancelButton: "Annuleren",
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
    bcs: "BCS",
    it: "итальянский",
    pl: "польский",
    pt: "португальский",
    nl: "голландский",
  },
  en: {
    ru: "Russian",
    en: "English",
    fr: "French",
    de: "German",
    es: "Spanish",
    uk: "Ukrainian",
    bcs: "BCS",
    it: "Italian",
    pl: "Polish",
    pt: "Portuguese",
    nl: "Dutch",
  },
  fr: {
    ru: "russe",
    en: "anglais",
    fr: "français",
    de: "allemand",
    es: "espagnol",
    uk: "ukrainien",
    bcs: "BCS",
    it: "italien",
    pl: "polonais",
    pt: "portugais",
    nl: "néerlandais",
  },
  uk: {
    ru: "російська",
    en: "англійська",
    fr: "французька",
    de: "німецька",
    es: "іспанська",
    uk: "українська",
    bcs: "BCS",
    it: "італійська",
    pl: "польська",
    pt: "португальська",
    nl: "нідерландська",
  },
  de: {
    ru: "Russisch",
    en: "Englisch",
    fr: "Französisch",
    de: "Deutsch",
    es: "Spanisch",
    uk: "Ukrainisch",
    bcs: "BCS",
    it: "Italienisch",
    pl: "Polnisch",
    pt: "Portugiesisch",
    nl: "Niederländisch",
  },
  es: {
    ru: "ruso",
    en: "inglés",
    fr: "francés",
    de: "alemán",
    es: "español",
    uk: "ucraniano",
    bcs: "BCS",
    it: "italiano",
    pl: "polaco",
    pt: "portugués",
    nl: "neerlandés",
  },
  bcs: {
    ru: "ruski",
    en: "engleski",
    fr: "francuski",
    de: "njemački",
    es: "španjolski",
    uk: "ukrajinski",
    bcs: "BCS",
    it: "talijanski",
    pl: "poljski",
    pt: "portugalski",
    nl: "nizozemski",
  },
  it: {
    ru: "russo",
    en: "inglese",
    fr: "francese",
    de: "tedesco",
    es: "spagnolo",
    uk: "ucraino",
    bcs: "BCS",
    it: "italiano",
    pl: "polacco",
    pt: "portoghese",
    nl: "olandese",
  },
  pl: {
    ru: "rosyjski",
    en: "angielski",
    fr: "francuski",
    de: "niemiecki",
    es: "hiszpański",
    uk: "ukraiński",
    bcs: "BCS",
    it: "włoski",
    pl: "polski",
    pt: "portugalski",
    nl: "niderlandzki",
  },
  pt: {
    ru: "russo",
    en: "inglês",
    fr: "francês",
    de: "alemão",
    es: "espanhol",
    uk: "ucraniano",
    bcs: "BCS",
    it: "italiano",
    pl: "polonês",
    pt: "português",
    nl: "holandês",
  },
  nl: {
    ru: "Russisch",
    en: "Engels",
    fr: "Frans",
    de: "Duits",
    es: "Spaans",
    uk: "Oekraïens",
    bcs: "BCS",
    it: "Italiaans",
    pl: "Pools",
    pt: "Portugees",
    nl: "Nederlands",
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
