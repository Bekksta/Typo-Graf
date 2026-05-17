"use strict";

// src/lang/detect.ts
var CYR = /[Ѐ-ӿ]/;
var LAT = /[A-Za-z]/;
var HAS = {
  es: /[ñáéíóúü¿¡]/i,
  fr: /[çàâäæèéêëîïôœùûüÿ]|«|»/i,
  de: /[äöüß]/,
  uk: /[іїєґ]/i,
  bcs: /[čćšđž]/i,
  // ђћјљњ — характерные сербские кириллические буквы
  srCy: /[ђћјљњ]/i
};
function detectLanguage(text) {
  if (CYR.test(text)) {
    if (HAS.uk.test(text)) return "uk";
    if (HAS.srCy.test(text)) return "ru";
    return "ru";
  }
  if (HAS.fr.test(text)) return "fr";
  if (HAS.de.test(text)) return "de";
  if (HAS.es.test(text)) return "es";
  if (HAS.bcs.test(text)) return "bcs";
  if (LAT.test(text)) return "en";
  return "ru";
}

// src/i18n.ts
var SUPPORTED = ["ru", "en", "fr", "uk", "de", "es", "bcs"];
function detectUILocale(navLang) {
  const lc = (navLang || "").toLowerCase().split(/[-_]/)[0];
  if (lc === "ru") return "ru";
  if (lc === "uk") return "uk";
  if (lc === "fr") return "fr";
  if (lc === "de") return "de";
  if (lc === "es") return "es";
  if (lc === "hr" || lc === "sr" || lc === "bs") return "bcs";
  if (SUPPORTED.indexOf(lc) !== -1) return lc;
  return "en";
}
var T = {
  ru: {
    doneStat: "\u0413\u043E\u0442\u043E\u0432\u043E.",
    cancelledStat: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u043E.",
    errorStat: "\u041E\u0448\u0438\u0431\u043A\u0430: {message}.",
    noTextLayersStat: "\u0422\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0435 \u0441\u043B\u043E\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B.",
    languagesStat: "\u042F\u0437\u044B\u043A\u0438: {list}.",
    changesStat: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439: {n}.",
    affectedStat: "\u0417\u0430\u0442\u0440\u043E\u043D\u0443\u0442\u043E \u0443\u0437\u043B\u043E\u0432: {n}.",
    skippedFontsStat: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E \u043F\u043E \u0448\u0440\u0438\u0444\u0442\u0443: {n}.",
    skippedLongStat: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E \u0434\u043B\u0438\u043D\u043D\u044B\u0445 \u0443\u0437\u043B\u043E\u0432: {n}.",
    limitStat: "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D \u043B\u0438\u043C\u0438\u0442 {limit} \u0438\u0437 {total}.",
    undoHint: "Ctrl/\u2318+Z \u2014 \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C",
    scanning: "\u0421\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435\u2026",
    processing: "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430\u2026",
    cancelling: "\u041E\u0442\u043C\u0435\u043D\u0430\u2026",
    cancelButton: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C"
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
    undoHint: "Ctrl/\u2318+Z to undo",
    scanning: "Scanning\u2026",
    processing: "Processing\u2026",
    cancelling: "Cancelling\u2026",
    cancelButton: "Cancel"
  },
  fr: {
    doneStat: "Termin\xE9.",
    cancelledStat: "Annul\xE9.",
    errorStat: "Erreur : {message}.",
    noTextLayersStat: "Aucun calque de texte trouv\xE9.",
    languagesStat: "Langues : {list}.",
    changesStat: "Modifications : {n}.",
    affectedStat: "N\u0153uds modifi\xE9s : {n}.",
    skippedFontsStat: "Ignor\xE9s (police) : {n}.",
    skippedLongStat: "Ignor\xE9s (trop longs) : {n}.",
    limitStat: "{limit} premiers trait\xE9s sur {total}.",
    undoHint: "Ctrl/\u2318+Z pour annuler",
    scanning: "Analyse\u2026",
    processing: "Traitement\u2026",
    cancelling: "Annulation\u2026",
    cancelButton: "Annuler"
  },
  uk: {
    doneStat: "\u0413\u043E\u0442\u043E\u0432\u043E.",
    cancelledStat: "\u0421\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u043E.",
    errorStat: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430: {message}.",
    noTextLayersStat: "\u0422\u0435\u043A\u0441\u0442\u043E\u0432\u0456 \u0448\u0430\u0440\u0438 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E.",
    languagesStat: "\u041C\u043E\u0432\u0438: {list}.",
    changesStat: "\u0417\u043C\u0456\u043D: {n}.",
    affectedStat: "\u0417\u043C\u0456\u043D\u0435\u043D\u043E \u0432\u0443\u0437\u043B\u0456\u0432: {n}.",
    skippedFontsStat: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E \u0437\u0430 \u0448\u0440\u0438\u0444\u0442\u043E\u043C: {n}.",
    skippedLongStat: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E \u0437\u0430\u0434\u043E\u0432\u0433\u0438\u0445 \u0432\u0443\u0437\u043B\u0456\u0432: {n}.",
    limitStat: "\u041E\u0431\u0440\u043E\u0431\u043B\u0435\u043D\u043E \u043F\u0435\u0440\u0448\u0456 {limit} \u0437 {total}.",
    undoHint: "Ctrl/\u2318+Z \u2014 \u0441\u043A\u0430\u0441\u0443\u0432\u0430\u0442\u0438",
    scanning: "\u0421\u043A\u0430\u043D\u0443\u0432\u0430\u043D\u043D\u044F\u2026",
    processing: "\u041E\u0431\u0440\u043E\u0431\u043A\u0430\u2026",
    cancelling: "\u0421\u043A\u0430\u0441\u0443\u0432\u0430\u043D\u043D\u044F\u2026",
    cancelButton: "\u0421\u043A\u0430\u0441\u0443\u0432\u0430\u0442\u0438"
  },
  de: {
    doneStat: "Fertig.",
    cancelledStat: "Abgebrochen.",
    errorStat: "Fehler: {message}.",
    noTextLayersStat: "Keine Textebenen gefunden.",
    languagesStat: "Sprachen: {list}.",
    changesStat: "\xC4nderungen: {n}.",
    affectedStat: "Betroffene Knoten: {n}.",
    skippedFontsStat: "\xDCbersprungen (Schrift): {n}.",
    skippedLongStat: "\xDCbersprungen (zu lang): {n}.",
    limitStat: "{limit} von {total} verarbeitet.",
    undoHint: "Ctrl/\u2318+Z zum R\xFCckg\xE4ngigmachen",
    scanning: "Scannen\u2026",
    processing: "Verarbeitung\u2026",
    cancelling: "Abbruch\u2026",
    cancelButton: "Abbrechen"
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
    undoHint: "Ctrl/\u2318+Z para deshacer",
    scanning: "Escaneando\u2026",
    processing: "Procesando\u2026",
    cancelling: "Cancelando\u2026",
    cancelButton: "Cancelar"
  },
  bcs: {
    doneStat: "Gotovo.",
    cancelledStat: "Otkazano.",
    errorStat: "Gre\u0161ka: {message}.",
    noTextLayersStat: "Tekstualni slojevi nisu prona\u0111eni.",
    languagesStat: "Jezici: {list}.",
    changesStat: "Izmjene: {n}.",
    affectedStat: "Izmijenjeni \u010Dvorovi: {n}.",
    skippedFontsStat: "Presko\u010Deno (font): {n}.",
    skippedLongStat: "Presko\u010Deno (preduga): {n}.",
    limitStat: "Obra\u0111eno prvih {limit} od {total}.",
    undoHint: "Ctrl/\u2318+Z za poni\u0161tavanje",
    scanning: "Skeniranje\u2026",
    processing: "Obrada\u2026",
    cancelling: "Otkazivanje\u2026",
    cancelButton: "Otka\u017Ei"
  }
};
var LANG_NAMES = {
  ru: {
    ru: "\u0440\u0443\u0441\u0441\u043A\u0438\u0439",
    en: "\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    fr: "\u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0439",
    de: "\u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439",
    es: "\u0438\u0441\u043F\u0430\u043D\u0441\u043A\u0438\u0439",
    uk: "\u0443\u043A\u0440\u0430\u0438\u043D\u0441\u043A\u0438\u0439",
    bcs: "BCS"
  },
  en: {
    ru: "Russian",
    en: "English",
    fr: "French",
    de: "German",
    es: "Spanish",
    uk: "Ukrainian",
    bcs: "BCS"
  },
  fr: {
    ru: "russe",
    en: "anglais",
    fr: "fran\xE7ais",
    de: "allemand",
    es: "espagnol",
    uk: "ukrainien",
    bcs: "BCS"
  },
  uk: {
    ru: "\u0440\u043E\u0441\u0456\u0439\u0441\u044C\u043A\u0430",
    en: "\u0430\u043D\u0433\u043B\u0456\u0439\u0441\u044C\u043A\u0430",
    fr: "\u0444\u0440\u0430\u043D\u0446\u0443\u0437\u044C\u043A\u0430",
    de: "\u043D\u0456\u043C\u0435\u0446\u044C\u043A\u0430",
    es: "\u0456\u0441\u043F\u0430\u043D\u0441\u044C\u043A\u0430",
    uk: "\u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430",
    bcs: "BCS"
  },
  de: {
    ru: "Russisch",
    en: "Englisch",
    fr: "Franz\xF6sisch",
    de: "Deutsch",
    es: "Spanisch",
    uk: "Ukrainisch",
    bcs: "BCS"
  },
  es: {
    ru: "ruso",
    en: "ingl\xE9s",
    fr: "franc\xE9s",
    de: "alem\xE1n",
    es: "espa\xF1ol",
    uk: "ucraniano",
    bcs: "BCS"
  },
  bcs: {
    ru: "ruski",
    en: "engleski",
    fr: "francuski",
    de: "njema\u010Dki",
    es: "\u0161panjolski",
    uk: "ukrajinski",
    bcs: "BCS"
  }
};
function t(locale, key, params) {
  var _a, _b;
  let msg = (_b = (_a = T[locale]) == null ? void 0 : _a[key]) != null ? _b : T.en[key];
  if (params) {
    for (const k of Object.keys(params)) {
      msg = msg.replace(`{${k}}`, String(params[k]));
    }
  }
  return msg;
}
function langName(uiLocale2, lang) {
  var _a, _b, _c;
  return (_c = (_b = (_a = LANG_NAMES[uiLocale2]) == null ? void 0 : _a[lang]) != null ? _b : LANG_NAMES.en[lang]) != null ? _c : lang;
}

// src/lang/maps.ts
var NBSP = "\xA0";
var NNBSP = "\u202F";
var NBH = "\u2011";
var EN_DASH = "\u2013";
var EM_DASH = "\u2014";
var ELLIPSIS = "\u2026";
var PRIME = "\u2032";
var DBL_PRM = "\u2033";
var L_DQ = "\u201C";
var R_DQ = "\u201D";
var L_SQ = "\u2018";
var R_SQ = "\u2019";
var SP_ANY_CLASS = /[    \t]/;
var SP_ANY_SRC = "[ \\u00A0\\u2009\\u202F\\t]";

// src/rules/common.ts
var WJ = "\u2060";
var COMMON_UNITS_RE = new RegExp(
  `(\\d+)${SP_ANY_SRC}+(\u043A\u0433|\u0433|\u0441\u043C|\u043C\u043C|\u043C\u0433|\u043C|\u043B|\u043A\u043C|\u0442|\u043C\u043B|\u043C\u043B\u043D|\u0442\u044B\u0441\\.?|\u20BD|\u20AC|\\$|%|\u0447\\.?|\u043C\u0438\u043D\\.?|\u0441\u0435\u043A\\.?)(?![A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451])`,
  "g"
);
var ELLIPSIS_UNITS_RE = new RegExp(
  `\u2026${SP_ANY_SRC}+(\u0441\u043C\\.?|\u043C\u043C|\u043C|\u043A\u043C|\u0433|\u043A\u0433|\u043B|%|\u20BD|\u20AC|\\$)`,
  "g"
);
var DOUBLE_PRIME_RE = new RegExp(`(\\d)${SP_ANY_SRC}*''(?!')`, "g");
var SINGLE_PRIME_RE = new RegExp(`(\\d)${SP_ANY_SRC}*'(?!')`, "g");
var DEG_RE = /\b(\d+)\s*deg\b/gi;
var ELLIPSIS_COMPACT_RE = /\s*\.{3}\s*/g;
var ELLIPSIS_TRIM_LEFT_RE = /\s+…/g;
var ELLIPSIS_SPACE_RIGHT_RE = /…(?=[A-Za-zА-Яа-яЁё0-9])/g;
var PERCENT_SPACE_RE = /(\d)\s+%/g;
var PERCENT_ELLIPSIS_RE = /%\s*…/g;
var NUM_RANGE_RE = /(\d+)\s*-\s*(\d+)/g;
var DOUBLE_SP_RE = / {2,}/g;
function applyCommonRules(input) {
  let text = input;
  text = text.replace(ELLIPSIS_COMPACT_RE, ELLIPSIS).replace(ELLIPSIS_TRIM_LEFT_RE, ELLIPSIS).replace(ELLIPSIS_SPACE_RIGHT_RE, ELLIPSIS + " ");
  text = text.replace(PERCENT_SPACE_RE, "$1%");
  text = text.replace(PERCENT_ELLIPSIS_RE, "%" + WJ + ELLIPSIS);
  text = text.replace(NUM_RANGE_RE, `$1${EN_DASH}$2`);
  text = text.replace(DOUBLE_SP_RE, " ");
  text = text.replace(COMMON_UNITS_RE, (_m, n, u) => `${n}${NBSP}${u}`);
  text = text.replace(ELLIPSIS_UNITS_RE, (_m, u) => `${ELLIPSIS}${NBSP}${u}`);
  text = text.replace(DOUBLE_PRIME_RE, "$1\u2033");
  text = text.replace(SINGLE_PRIME_RE, "$1\u2032");
  text = text.replace(DEG_RE, "$1\xB0");
  return text;
}

// src/lib/mathLib.ts
var SUPER_MAP = {
  "0": "\u2070",
  "1": "\xB9",
  "2": "\xB2",
  "3": "\xB3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
  "+": "\u207A",
  "-": "\u207B",
  "\u2212": "\u207B",
  "=": "\u207C",
  "(": "\u207D",
  ")": "\u207E",
  a: "\u1D43",
  b: "\u1D47",
  c: "\u1D9C",
  d: "\u1D48",
  e: "\u1D49",
  f: "\u1DA0",
  g: "\u1D4D",
  h: "\u02B0",
  i: "\u2071",
  j: "\u02B2",
  k: "\u1D4F",
  l: "\u02E1",
  m: "\u1D50",
  n: "\u207F",
  o: "\u1D52",
  p: "\u1D56",
  q: "q",
  r: "\u02B3",
  s: "\u02E2",
  t: "\u1D57",
  u: "\u1D58",
  v: "\u1D5B",
  w: "\u02B7",
  x: "\u02E3",
  y: "\u02B8",
  z: "\u1DBB",
  // верхний регистр латиницы в Unicode почти не представлен — оставляем как есть
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  H: "H",
  I: "I",
  J: "J",
  K: "K",
  L: "L",
  M: "M",
  N: "N",
  O: "O",
  P: "P",
  Q: "Q",
  R: "R",
  S: "S",
  T: "T",
  U: "U",
  V: "V",
  W: "W",
  X: "X",
  Y: "Y",
  Z: "Z"
};
var SUB_MAP = {
  "0": "\u2080",
  "1": "\u2081",
  "2": "\u2082",
  "3": "\u2083",
  "4": "\u2084",
  "5": "\u2085",
  "6": "\u2086",
  "7": "\u2087",
  "8": "\u2088",
  "9": "\u2089",
  "+": "\u208A",
  "-": "\u208B",
  "\u2212": "\u208B",
  "=": "\u208C",
  "(": "\u208D",
  ")": "\u208E",
  a: "\u2090",
  e: "\u2091",
  h: "\u2095",
  i: "\u1D62",
  j: "\u2C7C",
  k: "\u2096",
  l: "\u2097",
  m: "\u2098",
  n: "\u2099",
  o: "\u2092",
  p: "\u209A",
  r: "\u1D63",
  s: "\u209B",
  t: "\u209C",
  u: "\u1D64",
  v: "\u1D65",
  x: "\u2093",
  b: "\u1D66"
  // ᵦ (подстрочная beta; пригодится для химии)
};
var GREEK_MAP = {
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
  delta: "\u03B4",
  epsilon: "\u03B5",
  zeta: "\u03B6",
  eta: "\u03B7",
  theta: "\u03B8",
  iota: "\u03B9",
  kappa: "\u03BA",
  lambda: "\u03BB",
  mu: "\u03BC",
  nu: "\u03BD",
  xi: "\u03BE",
  omicron: "\u03BF",
  pi: "\u03C0",
  rho: "\u03C1",
  sigma: "\u03C3",
  tau: "\u03C4",
  upsilon: "\u03C5",
  phi: "\u03C6",
  chi: "\u03C7",
  psi: "\u03C8",
  omega: "\u03C9"
};

// src/rules/math.ts
var asciiMinusToUnicode = (s) => s.replace(/-/g, "\u2212");
var toSuperscriptAll = (s) => s.split("").map((ch) => {
  var _a;
  return (_a = SUPER_MAP[ch]) != null ? _a : ch;
}).join("");
var toSubscriptAll = (s) => s.split("").map((ch) => {
  var _a;
  return (_a = SUB_MAP[ch]) != null ? _a : ch;
}).join("");
function applyMathPowers(text) {
  let out = text;
  out = out.replace(
    /(\S)\s*\^\s*\(([^)]+)\)/g,
    (_m, base, inside) => {
      const trimmed = inside.trim();
      const sup = toSuperscriptAll(asciiMinusToUnicode(trimmed));
      return trimmed.length === 1 ? base + sup : base + toSuperscriptAll("(" + trimmed + ")");
    }
  );
  out = out.replace(
    /(\S)\s*\^\s*([\-−]?\d+)/g,
    (_m, base, exp) => base + toSuperscriptAll(asciiMinusToUnicode(exp))
  );
  out = out.replace(
    /(\S)\s*\^\s*([A-Za-zА-яЁё0-9+\-−]+)/g,
    (_m, base, token) => base + toSuperscriptAll(asciiMinusToUnicode(token))
  );
  return out;
}
function applyMathSubscripts(text) {
  let out = text;
  out = out.replace(
    /(\S)\s*_\s*\(([^)]+)\)/g,
    (_m, base, inside) => {
      const trimmed = inside.trim();
      const sub = toSubscriptAll(asciiMinusToUnicode(trimmed));
      return trimmed.length === 1 ? base + sub : base + toSubscriptAll("(" + trimmed + ")");
    }
  );
  out = out.replace(
    /(\S)\s*_\s*([A-Za-zА-яЁё0-9\-−]{1,3})(?=(?:\s|[+\-−*/=,.;:()])|$)/g,
    (_m, base, token) => base + toSubscriptAll(asciiMinusToUnicode(token))
  );
  out = out.replace(
    /(\S)\s*_\s*([\-−]?\d+)/g,
    (_m, base, n) => base + toSubscriptAll(asciiMinusToUnicode(n))
  );
  return out;
}
function protectMathMinus(text) {
  const MOD = "\u02B0-\u02FF\u1D2C-\u1DBF\u2070-\u209F";
  const L = `[A-Za-z0-9)\\]${MOD}]`;
  const R = `[A-Za-z0-9(\\[${MOD}]`;
  return text.replace(
    new RegExp(`(${L})\\s*[\\-\\u2010-\\u2014]\\s*(${R})`, "g"),
    (m, a, b) => /[0-9]/.test(a) && /[0-9]/.test(b) ? m : `${a} \u2212 ${b}`
  );
}
function applyMathMultiplication(text) {
  let out = text;
  out = out.replace(new RegExp("(?<!\\*)\\*(?!\\*)", "g"), "\xB7");
  out = out.replace(/[•⋅]/g, "\xB7");
  const SYM = "A-Za-z\u0410-\u044F\u0401\u04510-9\u2070-\u209F\u02B0-\u02FF\u1D2C-\u1D7F";
  out = out.replace(
    new RegExp(`([${SYM}])\\s*\xB7\\s*([${SYM}])`, "g"),
    "$1 \xB7 $2"
  );
  return out;
}
function applyMathDivision(text) {
  let out = text;
  const SYM = "A-Za-z\u0410-\u044F\u0401\u04510-9\u2070-\u209F\u02B0-\u02FF\u1D2C-\u1D7F";
  const FRAC_MAP = {
    "1/2": "\xBD",
    "1/3": "\u2153",
    "2/3": "\u2154",
    "1/4": "\xBC",
    "3/4": "\xBE",
    "1/5": "\u2155",
    "2/5": "\u2156",
    "3/5": "\u2157",
    "4/5": "\u2158",
    "1/6": "\u2159",
    "5/6": "\u215A",
    "1/8": "\u215B",
    "3/8": "\u215C",
    "5/8": "\u215D",
    "7/8": "\u215E"
  };
  out = out.replace(/\b([123457])\s*\/\s*([236458])\b/g, (_m, a, b) => {
    var _a;
    const key = `${a}/${b}`;
    return (_a = FRAC_MAP[key]) != null ? _a : `${a}/${b}`;
  });
  out = out.replace(
    new RegExp(`([${SYM}])\\s*\xF7\\s*([${SYM}])`, "g"),
    "$1 \xF7 $2"
  );
  out = out.replace(
    new RegExp(`([${SYM}])\\s*\\/\\s*([${SYM}])`, "g"),
    "$1 / $2"
  );
  out = out.replace(/\(([ \t]*)([^\)]+?)([ \t]*)\)/g, (_m, lsp, inner, rsp) => {
    const fixed = inner.replace(
      new RegExp(`([${SYM}])\\+([${SYM}])`, "g"),
      "$1 + $2"
    );
    return `(${lsp}${fixed}${rsp})`;
  });
  return out;
}
function applyMathEquality(text) {
  let out = text;
  const SYM = "A-Za-z\u0410-\u044F\u0401\u04510-9\u2070-\u209F\u02B0-\u02FF\u1D2C-\u1D7F";
  out = out.replace(
    new RegExp(`([${SYM}])\\s*!=\\s*([${SYM}])`, "g"),
    "$1 \u2260 $2"
  );
  out = out.replace(
    new RegExp(`([${SYM}])\\s*<=\\s*([${SYM}])`, "g"),
    "$1 \u2264 $2"
  );
  out = out.replace(
    new RegExp(`([${SYM}])\\s*>=\\s*([${SYM}])`, "g"),
    "$1 \u2265 $2"
  );
  out = out.replace(
    new RegExp(`([${SYM}])\\s*=\\s*([${SYM}])`, "g"),
    "$1 = $2"
  );
  out = out.replace(
    new RegExp(`([${SYM}])\\s*(\u2248|\u2243)\\s*([${SYM}])`, "g"),
    "$1 $2 $3"
  );
  return out;
}
function applyMathSigns(text) {
  let out = text;
  out = out.replace(/\+\-/g, "\xB1");
  out = out.replace(/\-\+/g, "\u2213");
  out = out.replace(/<=>/g, "\u21D4");
  out = out.replace(/-->/g, "\u27F6");
  out = out.replace(/<-/g, "\u2190");
  out = out.replace(/->/g, "\u2192");
  out = out.replace(/=>/g, "\u21D2");
  return out;
}
function applyMathConstants(text) {
  let out = text;
  out = out.replace(/\bsqrt\s*\(\s*([^)]+)\s*\)/gi, "\u221A$1");
  out = out.replace(/\bpi\b/gi, "\u03C0");
  out = out.replace(/\binf\b/gi, "\u221E");
  out = out.replace(/\b(sum|Σ)\b/gi, "\u03A3");
  out = out.replace(/\bintegral\b/gi, "\u222B");
  out = out.replace(
    /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/gi,
    (_m, name) => GREEK_MAP[name.toLowerCase()] || _m
  );
  return out;
}
function applyMathOperators(text) {
  let out = text;
  out = out.replace(/\b(sin|cos)\s*\(\s*([^)]+?)\s*\)/gi, (_m, f, arg) => `${f} ${arg}`);
  out = out.replace(
    /\blog\s*([0-9]+)\s*\(\s*([^)]+?)\s*\)/gi,
    (_m, base, arg) => `log${toSubscriptAll(base)} ${arg}`
  );
  out = out.replace(/\blog\s*\(\s*([^)]+?)\s*\)/gi, (_m, arg) => `log ${arg}`);
  out = out.replace(
    /\blim\s*\(\s*([A-Za-z])\s*→\s*([^)]+?)\s*\)/g,
    (_m, v, to) => `lim${toSubscriptAll(v)}\u2192${toSubscriptAll(asciiMinusToUnicode(to))}`
  );
  out = out.replace(
    /∑\s*_\s*\(\s*([A-Za-z])\s*=\s*([^)]+?)\s*\)\s*\^\s*([A-Za-z0-9]+)\s*/g,
    (_m, v, from, to) => `\u2211${toSubscriptAll(`${v}=${asciiMinusToUnicode(from)}`)}${toSuperscriptAll(to)} `
  );
  out = out.replace(
    /∑\s*_\s*\(\s*([A-Za-z])\s*=\s*([^)]+?)\s*\)/g,
    (_m, v, from) => `\u2211${toSubscriptAll(`${v}=${asciiMinusToUnicode(from)}`)}`
  );
  out = out.replace(
    /(?:\\vec|\bvec)\s*\(\s*([A-Za-zΑ-ω])\s*\)/g,
    (_m, v) => `${v}\u20D7`
  );
  return out;
}
function applyMath(text) {
  let out = applyMathPowers(text);
  out = applyMathSubscripts(out);
  out = applyMathMultiplication(out);
  out = applyMathDivision(out);
  out = applyMathEquality(out);
  out = applyMathSigns(out);
  out = applyMathConstants(out);
  out = applyMathOperators(out);
  out = protectMathMinus(out);
  return out;
}

// src/lib/ruLib.ts
var HYPHEN_ABBR = [
  "\u0433-\u043D",
  "\u0433-\u043D\u0430",
  "\u0433-\u043D\u0443",
  "\u0433-\u043D\u043E\u043C",
  "\u0433-\u043D\u0435",
  "\u0433-\u0434\u0430",
  "\u0433-\u0434",
  "\u0433-\u0434\u0430\u043C",
  "\u0433-\u0434\u0430\u043C\u0438",
  "\u0433-\u0434\u0430\u0445",
  "\u0433-\u0436\u0430",
  "\u0433-\u0436\u0438",
  "\u0433-\u0436\u0443",
  "\u0433-\u0436\u043E\u0439",
  "\u0433-\u0436\u0435",
  "\u0433-\u0436\u0435\u044E",
  "\u0433-\u0436\u0430\u043C",
  "\u0433-\u0436\u0430\u043C\u0438",
  "\u0433-\u0436\u0430\u0445",
  "\u0433-\u0436",
  "\u0442\u043E\u0432-\u0430",
  "\u0442\u043E\u0432-\u0443",
  "\u0442\u043E\u0432-\u043E\u043C",
  "\u0442\u043E\u0432-\u0435",
  "\u0442\u043E\u0432-\u0449\u0430",
  "\u0442\u043E\u0432-\u0449\u0443",
  "\u0442\u043E\u0432-\u0449\u0435\u043C",
  "\u0442\u043E\u0432-\u0449\u0435",
  "\u0442\u043E\u0432-\u0449\u0438",
  "\u0442\u043E\u0432-\u0449\u0435\u0439",
  "\u0442\u043E\u0432-\u0449\u0430\u043C",
  "\u0442\u043E\u0432-\u0449\u0430\u043C\u0438",
  "\u0442\u043E\u0432-\u0449\u0430\u0445",
  "\u0434-\u0440",
  "\u0434-\u0440\u0430",
  "\u0434-\u0440\u0443",
  "\u0434-\u0440\u043E\u043C",
  "\u0434-\u0440\u0435",
  "\u0434-\u0440\u043E\u0432",
  "\u0434-\u0440\u0430\u043C",
  "\u0434-\u0440\u0430\u043C\u0438",
  "\u0434-\u0440\u0430\u0445",
  "\u043F\u0440\u043E\u0444-\u0430",
  "\u043F\u0440\u043E\u0444-\u0443",
  "\u043F\u0440\u043E\u0444-\u043E\u043C",
  "\u043F\u0440\u043E\u0444-\u0435",
  "\u043F\u0440\u043E\u0444-\u043E\u0432",
  "\u043F\u0440\u043E\u0444-\u0430\u043C",
  "\u043F\u0440\u043E\u0444-\u0430\u043C\u0438",
  "\u043F\u0440\u043E\u0444-\u0430\u0445",
  "\u0434\u043E\u0446-\u0430",
  "\u0434\u043E\u0446-\u0443",
  "\u0434\u043E\u0446-\u043E\u043C",
  "\u0434\u043E\u0446-\u0435",
  "\u0434\u043E\u0446-\u043E\u0432",
  "\u0434\u043E\u0446-\u0430\u043C",
  "\u0434\u043E\u0446-\u0430\u043C\u0438",
  "\u0434\u043E\u0446-\u0430\u0445",
  "\u0438\u043D\u0436-\u0430",
  "\u0438\u043D\u0436-\u0443",
  "\u0438\u043D\u0436-\u043E\u043C",
  "\u0438\u043D\u0436-\u0435",
  "\u0438\u043D\u0436-\u0435\u0440\u044B",
  "\u0438\u043D\u0436-\u0435\u0440\u043E\u0432",
  "\u0438\u043D\u0436-\u0435\u0440\u0430\u043C",
  "\u0438\u043D\u0436-\u0435\u0440\u0430\u043C\u0438",
  "\u0438\u043D\u0436-\u0435\u0440\u0430\u0445",
  "\u0440-\u043D",
  "\u0440-\u043D\u0430",
  "\u0440-\u043D\u0443",
  "\u0440-\u043D\u043E\u043C",
  "\u0440-\u043D\u0435",
  "\u0440-\u043D\u044B",
  "\u0440-\u043D\u043E\u0432",
  "\u0440-\u043D\u0430\u043C",
  "\u0440-\u043D\u0430\u043C\u0438",
  "\u0440-\u043D\u0430\u0445",
  "\u0436-\u0434"
];
var DOT_UNIT_ABBR = [
  "\u043C\u0438\u043D",
  "\u0441\u0435\u043A",
  "\u0447",
  "\u0441\u043C\xB3",
  "\u043C\xB2",
  "\u0441\u043C",
  "\u043C\u043C",
  "\u043C",
  "\u043A\u043C",
  "\u0433",
  "\u043A\u0433",
  "\u0442",
  "\u0442\u044B\u0441",
  "\u043C\u043B\u043D",
  "\u043C\u043B\u0440\u0434"
];
var DOT_GENERIC_ABBR = [
  "\u0433",
  "\u0433\u0433",
  "\u0442\u043E\u0432",
  "\u043F\u0440\u043E\u0444",
  "\u0434\u043E\u0446",
  "\u0438\u043D\u0436",
  "\u0441\u0442",
  "\u043C\u043B",
  "\u0441\u0442\u0430\u0440\u0448",
  "\u043D\u0430\u0447",
  "\u0437\u0430\u043C",
  "\u0433\u0435\u043D",
  "\u0440\u0443\u043A",
  "\u0440\u0435\u0434",
  "\u0437\u0430\u0432",
  "\u0438\u0437\u0434",
  "\u0441\u043E\u0441\u0442",
  "\u043F\u0435\u0440",
  "\u0438\u043B",
  "\u0441\u043C",
  "\u0440\u0438\u0441",
  "\u0442\u0430\u0431\u043B",
  "\u043F\u0440\u0438\u043B",
  "\u0441\u0442\u0440",
  "\u043F",
  "\u043F\u043E\u0434\u043F",
  "\u0433\u043B",
  "\u0440\u0430\u0437\u0434",
  "\u043F\u043F",
  "\u2116",
  "\u0442\u0435",
  "\u0442\u043A",
  "\u043D\u044D",
  "\u0434\u043E \u043D\u044D",
  "\u0434\u0440",
  "\u0442\u0434",
  "\u0442\u043F",
  "\u0438 \u0442\u0434",
  "\u0438 \u0442\u043F",
  "\u0438 \u0434\u0440",
  "\u043E\u043A",
  "\u043F\u0440\u0438\u043C",
  "\u0441\u0440",
  "\u0441\u0432",
  "\u043E\u0431\u043B",
  "\u043F\u043E\u0441",
  "\u0443\u043B",
  "\u043F\u0440",
  "\u043F\u0435\u0440",
  "\u043A\u0432",
  "\u0434",
  "\u043A\u043E\u0440\u043F",
  "\u043B\u0438\u0442",
  "\u044D\u0442",
  "\u0441\u0435\u043A\u0446",
  "\u043F\u043B",
  "\u0431\u0443\u043B",
  "\u043D\u0430\u0431",
  "\u0448",
  "\u0448\u043E\u0441\u0441\u0435",
  "\u043F\u0440\u043E\u0441\u043F",
  "\u043F\u0433\u0442",
  "\u043E\u0431\u043B",
  "\u0420\u0435\u0441\u043F",
  "\u0430\u0432\u0442",
  "\u0441/\u0445"
];
var SERVICE_WORDS = [
  // предлоги
  "\u0432",
  "\u043A",
  "\u0441",
  "\u0443",
  "\u043E",
  "\u043E\u0431",
  "\u043D\u0430",
  "\u0437\u0430",
  "\u0432\u043E",
  "\u043A\u043E",
  "\u0441\u043E",
  "\u043F\u0440\u0438",
  "\u043F\u0440\u043E",
  "\u043F\u043E\u0434",
  "\u043D\u0430\u0434",
  "\u043F\u0435\u0440\u0435\u0434",
  "\u043C\u0435\u0436",
  "\u0431\u0435\u0437",
  "\u0438\u0437",
  "\u043E\u0442",
  "\u0434\u043E",
  "\u043F\u043E",
  // союзы/частицы/наречные маркеры
  "\u0430",
  "\u0438",
  "\u043D\u043E",
  "\u0434\u0430",
  "\u0438\u043B\u0438",
  "\u043B\u0438\u0431\u043E",
  "\u0436\u0435",
  "\u0442\u043E",
  "\u043D\u0435",
  "\u043D\u0438",
  "\u043A\u0430\u043A",
  "\u0447\u0442\u043E\u0431",
  "\u0447\u0442\u043E\u0431\u044B",
  "\u0437\u0430\u0442\u043E",
  "\u043E\u0434\u043D\u0430\u043A\u043E",
  "\u0431\u044B",
  "\u043B\u0438",
  "\u0432\u0435\u0434\u044C",
  "\u0440\u0430\u0437\u0432\u0435",
  "\u043C\u043E\u043B",
  "\u0434\u0435\u0441\u043A\u0430\u0442\u044C",
  "\u0434\u0430\u0436\u0435",
  "\u0442\u043E\u043B\u044C\u043A\u043E",
  "\u043B\u0438\u0448\u044C",
  "\u0432\u043E\u0442",
  "\u0442\u0430\u043C",
  "\u0442\u0443\u0442",
  "\u0442\u0430\u043A",
  "\u0433\u0434\u0435",
  "\u043D\u0443"
];
var COMPOSITE_ABBR_RULES = [
  // т. д., т. п., т. е.
  { re: /(^|[^\p{L}])(?:т[.\s]*д[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0442.\xA0\u0434." },
  { re: /(^|[^\p{L}])(?:т[.\s]*п[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0442.\xA0\u043F." },
  { re: /(^|[^\p{L}])(?:т[.\s]*е[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0442.\xA0\u0435." },
  // и т. д., и т. п. — NBSP после «и» и внутри
  { re: /(^|[^\p{L}])(?:и\s*т[.\s]*д[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0438\xA0\u0442.\xA0\u0434." },
  { re: /(^|[^\p{L}])(?:и\s*т[.\s]*п[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0438\xA0\u0442.\xA0\u043F." },
  // н. э., до н. э.
  { re: /(^|[^\p{L}])(?:н[.\s]*э[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u043D.\xA0\u044D." },
  { re: /(^|[^\p{L}])(?:до\s*н[.\s]*э[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0434\u043E\xA0\u043D.\xA0\u044D." },
  // и др., и пр.
  { re: /(^|[^\p{L}])(?:и\s*др[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0438\xA0\u0434\u0440." },
  { re: /(^|[^\p{L}])(?:и\s*пр[.\s]*)(?=$|[^\p{L}])/giu, canon: "\u0438\xA0\u043F\u0440." }
];

// src/lib/commonCase.ts
var FIRST_LETTER_RE = new RegExp("\\p{L}", "u");
function preserveCase(canon, sample, mode = "first", locale = "ru") {
  const m = sample.trim().match(FIRST_LETTER_RE);
  if (!m) return canon;
  const firstSample = m[0];
  const isLetter = firstSample.toLocaleUpperCase(locale) !== firstSample.toLocaleLowerCase(locale);
  const isUpper = isLetter && firstSample === firstSample.toLocaleUpperCase(locale);
  const isAllCaps = sample === sample.toLocaleUpperCase(locale);
  if ((mode === "first" || mode === "title") && isUpper) {
    const i = canon.search(FIRST_LETTER_RE);
    if (i === -1) return canon;
    const firstCanon = canon[i].toLocaleUpperCase(locale);
    return canon.slice(0, i) + firstCanon + canon.slice(i + 1);
  }
  if (mode === "all" && isAllCaps) {
    return canon.replace(new RegExp("\\p{L}", "gu"), (ch) => ch.toLocaleUpperCase(locale));
  }
  return canon;
}

// src/dict/yo-pairs.json
var yo_pairs_default = [
  ["\u0440\u0435\u0431\u0435\u043D\u043E\u043A", "\u0440\u0435\u0431\u0451\u043D\u043E\u043A"],
  ["\u0432\u0441\u0435", "\u0432\u0441\u0451"],
  ["\u0432\u0435\u0434\u0435\u043C", "\u0432\u0435\u0434\u0451\u043C"],
  ["\u0448\u0435\u043B", "\u0448\u0451\u043B"],
  ["\u0448\u0435\u043F\u043E\u0442", "\u0448\u0451\u043F\u043E\u0442"],
  ["\u0442\u0435\u043C\u043D\u044B\u0439", "\u0442\u0451\u043C\u043D\u044B\u0439"],
  ["\u0436\u0435\u0440\u043D\u043E\u0432", "\u0436\u0451\u0440\u043D\u043E\u0432"]
];

// src/rules/yoPairs.ts
var compiled = yo_pairs_default.map(
  ([from, to]) => ({
    re: new RegExp(`(?<![A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451])${from}(?![A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451])`, "giu"),
    canon: to
  })
);
function applyYoFix(text) {
  let out = text;
  for (const { re, canon } of compiled) {
    out = out.replace(re, (m) => preserveCase(canon, m, "first", "ru"));
  }
  return out;
}

// src/rules/ru.ts
function glueShortPreps(text) {
  const re = new RegExp(
    `(^|[\\s(>])(${SERVICE_WORDS.join(
      "|"
    )})(?:${SP_ANY_SRC})(?=[A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u04510-9\xAB])`,
    "gmi"
  );
  return text.replace(re, (_m, pre, w) => pre + w + NBSP);
}
function fixInitials(text) {
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
function smartQuotesRu(text) {
  text = text.replace(/[“”„‟«»]/g, '"').replace(/'{2}/g, '"');
  let open = true, out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? "\xAB" : "\xBB";
      open = !open;
    } else {
      out += ch;
    }
  }
  out = out.replace(/«[ \t\u00A0\u2009\u202F]+/g, "\xAB").replace(/[ \t\u00A0\u2009\u202F]+»/g, "\xBB");
  out = out.replace(/»([.,!?:;…])/g, "\xBB$1");
  out = out.replace(/»([А-ЯЁA-Z])/g, "\xBB $1");
  return out;
}
function nbspAfterAbbr(text) {
  let out = text;
  out = out.replace(/№[ \u00A0\u2009\u202F\t]+(?=\d)/g, "\u2116" + NBSP);
  out = out.replace(/§[ \u00A0\u2009\u202F\t]+(?=\d)/g, "\xA7" + NBSP);
  out = out.replace(/г\.(?:[ \u00A0\u2009\u202F\t]+)(?=[А-ЯЁ])/g, (m, off) => {
    let i = off - 1;
    while (i >= 0 && SP_ANY_CLASS.test(out[i])) i--;
    const prev = i >= 0 ? out[i] : "";
    if (/\d/.test(prev)) return m;
    return "\u0433." + NBSP;
  });
  out = out.replace(
    /(г-н|г-жа|г-жи|д-р)(?:[ \u00A0\u2009\u202F\t]+)(?=[А-ЯЁ])/gi,
    (_m, abbr) => abbr + NBSP
  );
  const reAbbrDot = new RegExp(
    `(?:(${DOT_UNIT_ABBR.join("|")})|(${DOT_GENERIC_ABBR.join(
      "|"
    )}))\\.(?:${SP_ANY_SRC}+)(?=\\S)`,
    "gi"
  );
  out = out.replace(
    reAbbrDot,
    (m, unit, _generic, off) => {
      let i = off + m.length;
      while (i < out.length && SP_ANY_CLASS.test(out[i])) i++;
      const next = out[i] || "";
      if (unit && /\d/.test(next)) {
        return m.replace(/\u00A0/g, " ");
      }
      return m.replace(new RegExp(`${SP_ANY_SRC}+`, "g"), NBSP);
    }
  );
  out = out.replace(
    /(р-?н)(?:[ \u00A0\u2009\u202F\t]+)(?=\S)/gi,
    (_m, a) => `${a}${NBSP}`
  );
  return out;
}
function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function fixHyphenatedAbbr(text) {
  let out = text;
  const H = "[\\-\\u2013\\u2014\\u2011]";
  for (const raw of HYPHEN_ABBR) {
    const parts = raw.split("-");
    const pattern = parts.map(escRe).join(H);
    const re = new RegExp(
      `${pattern}(?![A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u0451])(?:${SP_ANY_SRC}+)?(?=\\S)`,
      "gi"
    );
    out = out.replace(re, (m, offset) => {
      let glued = m.replace(new RegExp(H, "g"), NBH);
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
function normalizeCompositeAbbr(text) {
  let out = text;
  for (const { re, canon } of COMPOSITE_ABBR_RULES) {
    out = out.replace(re, (m, pre) => (pre != null ? pre : "") + preserveCase(canon, m, "first", "ru"));
  }
  return out;
}
function glueParticles(text) {
  return text.replace(
    /([А-ЯЁа-яёA-Za-z]{2,})[ \u00A0\u2009\u202F\t]+(бы|ли|же)(?=[^А-Яа-яЁёA-Za-z]|$)/gi,
    (_m, w, p) => w + NBSP + p
  );
}
function normalizeEmDash(text) {
  let out = text;
  out = out.replace(new RegExp(`(${SP_ANY_SRC}*)--(${SP_ANY_SRC}*)`, "g"), ` ${EM_DASH} `);
  out = out.replace(
    /([^\d\s])\s[-–]\s([^\d\s])/g,
    (_m, a, b) => `${a} ${EM_DASH} ${b}`
  );
  out = out.replace(
    /(\S)[ \u00A0\u2009\u202F\t]*—[ \u00A0\u2009\u202F\t]*(\S)/g,
    (_m, a, b) => `${a}${NBSP}${EM_DASH} ${b}`
  );
  return out;
}
function removeSpacesBeforePunctuation(text) {
  text = text.replace(new RegExp(`${SP_ANY_SRC}+([.,!?;:])`, "g"), "$1");
  text = text.replace(new RegExp(`${SP_ANY_SRC}+(\\u2026)`, "g"), "$1");
  text = text.replace(new RegExp(`${SP_ANY_SRC}+([)\\xBB])`, "g"), "$1");
  text = text.replace(
    new RegExp(`${SP_ANY_SRC}+([%\\u2030\\u20BD\\u20AC$])`, "g"),
    "$1"
  );
  text = text.replace(/https?:\/\/[^\s]+/g, (m) => m.replace(/ /g, ""));
  return text;
}
function applyRussianRules(input) {
  let text = input;
  text = fixInitials(text);
  text = glueShortPreps(text);
  text = normalizeCompositeAbbr(text);
  text = nbspAfterAbbr(text);
  text = smartQuotesRu(text);
  text = normalizeEmDash(text);
  text = fixHyphenatedAbbr(text);
  text = glueParticles(text);
  text = removeSpacesBeforePunctuation(text);
  text = applyYoFix(text);
  return text;
}

// src/lib/enLib.ts
var SERVICE_WORDS2 = [
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "so",
  "as",
  "at",
  "by",
  "in",
  "of",
  "on",
  "to",
  "i",
  "I"
];
var UNIT_LIST = [
  "km",
  "m",
  "cm",
  "mm",
  "mi",
  "yd",
  "ft",
  "in",
  "kg",
  "g",
  "mg",
  "lb",
  "oz",
  "l",
  "ml",
  "gal",
  "h",
  "min",
  "s",
  "\xB0C",
  "\xB0F",
  "\xB0",
  "mph",
  "km/h"
];

// src/rules/en.ts
var DBL_PRIME_RE = new RegExp(
  `(\\d)${SP_ANY_SRC}*(?:''|["\u201D]|\\u2033)`,
  "g"
);
var SINGLE_PRIME_RE2 = new RegExp(
  `(\\d)${SP_ANY_SRC}*(?:'|\u2019|\\u2032)(?!['\u201D"\\u2033])`,
  "g"
);
function normalizePrimes(text) {
  return text.replace(DBL_PRIME_RE, `$1${DBL_PRM}`).replace(SINGLE_PRIME_RE2, `$1${PRIME}`);
}
function smartQuotesEn(input) {
  let text = input.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");
  text = text.replace(/\b([A-Za-z]+)'([A-Za-z]+)\b/g, `$1${R_SQ}$2`);
  text = text.replace(/\b([A-Za-z]+)'\b/g, `$1${R_SQ}`);
  text = text.replace(/\b'([A-Za-z]+)\b/g, `${R_SQ}$1`);
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? L_DQ : R_DQ;
      open = !open;
    } else {
      out += ch;
    }
  }
  let nested = "";
  let inside = false;
  let openS = true;
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (ch === L_DQ) {
      inside = true;
      openS = true;
      nested += ch;
      continue;
    }
    if (ch === R_DQ) {
      inside = false;
      nested += ch;
      continue;
    }
    if (inside && ch === "'") {
      nested += openS ? L_SQ : R_SQ;
      openS = !openS;
    } else {
      nested += ch;
    }
  }
  out = nested;
  out = out.replace(new RegExp(`${L_DQ}${SP_ANY_SRC}+`, "g"), L_DQ);
  out = out.replace(new RegExp(`${SP_ANY_SRC}+${R_DQ}`, "g"), R_DQ);
  return out;
}
var DOUBLE_DASH_RE = /(\s*)--(\s*)/g;
function normalizeEmDashEn(text) {
  return text.replace(DOUBLE_DASH_RE, (_m, lsp, rsp) => {
    const left = lsp.length ? " " : "";
    const right = rsp.length ? " " : "";
    return `${left}${EM_DASH}${right}`;
  });
}
var UNITS = UNIT_LIST.map(
  (u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|");
var PERCENT_RE = new RegExp(`(\\d+)${SP_ANY_SRC}*%`, "g");
var UNIT_RE = new RegExp(
  `(\\d+)${SP_ANY_SRC}+(${UNITS})(?![A-Za-z0-9])`,
  "g"
);
var LEADING_CURRENCY_RE = /([$£€])\s*([0-9]{1,3}(?:[ .,]?[0-9]{3})*|\d+)([.,]\d+)?/g;
var US_THOUSANDS_RE = /([$£€]\d{1,3})\.(\d{3})(?!\d)/g;
var TRAILING_CURRENCY_RE = new RegExp(
  `(\\d)${SP_ANY_SRC}+([$\xA3\u20AC])`,
  "g"
);
function formatLeadingCurrency(text) {
  return text.replace(LEADING_CURRENCY_RE, (_m, sym, num, dec) => {
    const rawDigits = num.replace(/[ .,]/g, "");
    const withThousands = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const tail = dec ? "." + dec.slice(1) : "";
    return `${sym}${withThousands}${tail}`;
  });
}
function tightenUnitsAndPercentsEn(text) {
  let t2 = text;
  t2 = formatLeadingCurrency(t2);
  t2 = t2.replace(US_THOUSANDS_RE, "$1,$2");
  t2 = t2.replace(PERCENT_RE, (_m, n) => `${n}${NBSP}%`);
  t2 = t2.replace(UNIT_RE, (_m, n, u) => `${n}${NBSP}${u}`);
  t2 = t2.replace(TRAILING_CURRENCY_RE, (_m, n, sym) => `${n}${NBSP}${sym}`);
  return t2;
}
var RANGE_RE = /\b(\d+)\s*-\s*(\d+)\b/g;
function normalizeRangesEn(text) {
  return text.replace(RANGE_RE, `$1${EN_DASH}$2`);
}
var SERVICE_RE = SERVICE_WORDS2.length ? new RegExp(
  `\\b(${SERVICE_WORDS2.map(
    (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|")})${SP_ANY_SRC}+(?=\\S)`,
  "gi"
) : null;
function gluePrepsAndConjs(text) {
  if (!SERVICE_RE) return text;
  return text.replace(SERVICE_RE, (_m, w) => w + NBSP);
}
function applyEnglishRules(input) {
  let t2 = input;
  t2 = normalizePrimes(t2);
  t2 = smartQuotesEn(t2);
  t2 = normalizeEmDashEn(t2);
  t2 = normalizeRangesEn(t2);
  t2 = tightenUnitsAndPercentsEn(t2);
  t2 = gluePrepsAndConjs(t2);
  return t2;
}

// src/rules/shared.ts
function makeNumberUnitRegex(opts) {
  var _a, _b;
  const units = ((_a = opts.units) != null ? _a : []).join("|");
  const curr = ((_b = opts.currencies) != null ? _b : []).join("|");
  const tail = [units, curr].filter(Boolean).join("|");
  return new RegExp(`(\\d[\\d\\s.,]*)\\s+(${tail})\\b`, "g");
}
var SI_UNITS = [
  "mm",
  "cm",
  "m",
  "km",
  "g",
  "kg",
  "t",
  "ml",
  "l",
  "px",
  "pt",
  "dpi",
  "em",
  "rem",
  "MB",
  "GB",
  "TB",
  "%"
];
var NUM_UNIT = {
  ru: {
    units: [
      "\u043C\u043C",
      "\u0441\u043C",
      "\u043C",
      "\u043A\u043C",
      "\u0433",
      "\u043A\u0433",
      "\u0442",
      "\u043C\u043B",
      "\u043B",
      "px",
      "pt",
      "dpi",
      "em",
      "rem",
      "\xB0C",
      "\xB0F",
      "\u041C\u0411",
      "\u0413\u0411",
      "%"
    ],
    currencies: ["\u20BD", "\u20AC", "\\$"]
  },
  eu: {
    units: SI_UNITS,
    currencies: ["\u20AC", "\\$", "\xA3"]
  },
  en: {
    units: [
      ...SI_UNITS,
      "mi",
      "yd",
      "ft",
      "in",
      "lb",
      "oz",
      "gal",
      "h",
      "min",
      "s",
      "mph",
      "km/h",
      "\xB0C",
      "\xB0F",
      "\xB0"
    ],
    currencies: ["\\$", "\xA3", "\u20AC"]
  }
};

// src/rules/fr.ts
var UNIT_RE2 = makeNumberUnitRegex(NUM_UNIT.eu);
var PUNCT_BEFORE_RE = new RegExp(`${SP_ANY_SRC}*([;:!?\xBB])`, "g");
function placeGuillemets(text) {
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? "\xAB" : "\xBB";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}
var OPEN_GUILLEMET_SPACE_RE = new RegExp(`\xAB${SP_ANY_SRC}*`, "g");
var CLOSE_GUILLEMET_SPACE_RE = new RegExp(`${SP_ANY_SRC}*\xBB`, "g");
function tightenGuillemets(text) {
  return text.replace(OPEN_GUILLEMET_SPACE_RE, "\xAB" + NNBSP).replace(CLOSE_GUILLEMET_SPACE_RE, NNBSP + "\xBB");
}
function tightenUnitsFr(text) {
  return text.replace(UNIT_RE2, (m, n, _u) => {
    const unitStart = n.length;
    return n + NNBSP + m.slice(unitStart).replace(/^\s+/, "");
  });
}
function narrowNbspBeforePunct(text) {
  return text.replace(PUNCT_BEFORE_RE, (_m, p) => NNBSP + p);
}
function applyFrenchRules(input) {
  let t2 = input;
  t2 = placeGuillemets(t2);
  t2 = tightenGuillemets(t2);
  t2 = narrowNbspBeforePunct(t2);
  t2 = tightenUnitsFr(t2);
  t2 = t2.replace(new RegExp(`(\\d)${NBSP}`, "g"), `$1${NNBSP}`);
  return t2;
}

// src/rules/uk.ts
var UNIT_RE3 = makeNumberUnitRegex(NUM_UNIT.eu);
var SHORT_PREP_RE = new RegExp(
  `\\b(\u0432|\u0443|\u0437|\u0456\u0437|\u0439|\u0442\u0430|\u0430|\u0456)${SP_ANY_SRC}+(?=\\S)`,
  "giu"
);
var TOKEN_NUM_RE = new RegExp(
  `(\u2116|\xA7|\u0441\u0442\u043E\u0440\\.|\u0440\u0438\u0441\\.|\u043C\\.)${SP_ANY_SRC}+(?=\\S)`,
  "g"
);
var QUOTE_NORMALIZE_RE = /[“”„‟]/g;
function placeGuillemetsUk(text) {
  let t2 = text.replace(QUOTE_NORMALIZE_RE, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t2.length; i++) {
    const ch = t2[i];
    if (ch === '"') {
      out += open ? "\xAB" : "\xBB";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}
function applyUkrainianRules(input) {
  let t2 = input;
  t2 = placeGuillemetsUk(t2);
  t2 = t2.replace(SHORT_PREP_RE, (_m, w) => w + NBSP);
  t2 = t2.replace(TOKEN_NUM_RE, (_m, tok) => tok + NNBSP);
  t2 = t2.replace(UNIT_RE3, (m, n) => {
    return n + NNBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  return t2;
}

// src/rules/de.ts
var UNIT_RE4 = makeNumberUnitRegex(NUM_UNIT.eu);
var ASCII_QUOTE_NORMALIZE_RE = /[”‟]/g;
function placeGermanQuotes(text) {
  if (/[»«]/.test(text)) return text;
  let t2 = text.replace(ASCII_QUOTE_NORMALIZE_RE, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t2.length; i++) {
    const ch = t2[i];
    if (ch === '"') {
      out += open ? "\u201E" : "\u201C";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}
function applyGermanRules(input) {
  let t2 = input;
  t2 = placeGermanQuotes(t2);
  t2 = t2.replace(UNIT_RE4, (m, n) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  return t2;
}

// src/rules/es.ts
var UNIT_RE5 = makeNumberUnitRegex(NUM_UNIT.eu);
var ASCII_QUOTE_NORMALIZE_RE2 = /[„‟]/g;
function placeSpanishQuotes(text) {
  if (/[«»]/.test(text)) return text;
  let t2 = text.replace(ASCII_QUOTE_NORMALIZE_RE2, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t2.length; i++) {
    const ch = t2[i];
    if (ch === '"') {
      out += open ? L_DQ : R_DQ;
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}
function applySpanishRules(input) {
  let t2 = input;
  t2 = placeSpanishQuotes(t2);
  t2 = t2.replace(UNIT_RE5, (m, n) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  return t2;
}

// src/rules/bcs.ts
var UNIT_RE6 = makeNumberUnitRegex(NUM_UNIT.eu);
function placeBCSQuotes(text) {
  if (/[«»]/.test(text)) return text;
  if (/[„“]/.test(text)) return text;
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? "\u201E" : "\u201C";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}
function applyBCSRules(input) {
  let t2 = input;
  t2 = placeBCSQuotes(t2);
  t2 = t2.replace(UNIT_RE6, (m, n) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  return t2;
}

// src/text/mask.ts
var PUA_START = 57344;
var PUA_END = 63743;
var URL_RE = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z][\w+.-]*:\/\/[^\s]+)/gi;
var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
function maskSensitive(input) {
  const masks = [];
  let out = input;
  const apply = (re) => {
    out = out.replace(re, (m, ..._rest) => {
      const offset = _rest[_rest.length - 2];
      const code = PUA_START + masks.length;
      if (code > PUA_END) {
        return m;
      }
      const placeholder = String.fromCharCode(code).repeat(m.length);
      masks.push({ start: offset, end: offset + m.length, placeholder, value: m });
      return placeholder;
    });
  };
  apply(URL_RE);
  apply(EMAIL_RE);
  return { masked: out, masks };
}

// src/text/diff.ts
function diffLCS(before, after) {
  const n = before.length;
  const m = after.length;
  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ start: 0, end: 0, text: after, reason: "lcs" }];
  if (m === 0) return [{ start: 0, end: n, text: "", reason: "lcs" }];
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i2 = n - 1; i2 >= 0; i2--) {
    for (let j2 = m - 1; j2 >= 0; j2--) {
      const idx = i2 * w + j2;
      if (before.charCodeAt(i2) === after.charCodeAt(j2)) {
        dp[idx] = dp[(i2 + 1) * w + (j2 + 1)] + 1;
      } else {
        const a = dp[(i2 + 1) * w + j2];
        const b = dp[i2 * w + (j2 + 1)];
        dp[idx] = a > b ? a : b;
      }
    }
  }
  const reps = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && before.charCodeAt(i) === after.charCodeAt(j)) {
      i++;
      j++;
      continue;
    }
    const start = i;
    const insStart = j;
    while (i < n && (j >= m || dp[i * w + j] === dp[(i + 1) * w + j])) i++;
    while (j < m && (i >= n || dp[i * w + j] === dp[i * w + (j + 1)])) j++;
    reps.push({
      start,
      end: i,
      text: after.slice(insStart, j),
      reason: "lcs"
    });
  }
  const merged = [];
  for (const r of reps) {
    const last = merged[merged.length - 1];
    if (last && last.end === r.start) {
      last.end = r.end;
      last.text += r.text;
    } else {
      merged.push(r);
    }
  }
  return merged;
}
function extractFreeSegments(masked, masks) {
  const ms = [...masks].sort((a, b) => a.start - b.start);
  const out = [];
  let p = 0;
  for (const m of ms) {
    if (p < m.start) {
      out.push({ start: p, end: m.start, text: masked.slice(p, m.start) });
    }
    p = Math.max(p, m.end);
  }
  if (p < masked.length) {
    out.push({ start: p, end: masked.length, text: masked.slice(p) });
  }
  return out;
}

// src/text/ranges.ts
function sanitize(reps, textLength) {
  const v = reps.map((r) => {
    var _a, _b;
    return {
      start: Math.max(0, Math.min(textLength, Number(r.start))),
      end: Math.max(0, Math.min(textLength, Number(r.end))),
      text: String((_a = r.text) != null ? _a : ""),
      reason: (_b = r.reason) != null ? _b : ""
    };
  }).filter(
    (r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end >= r.start
  );
  return v.sort((a, b) => a.start - b.start).reverse();
}
function applyReplacements(node, replacements) {
  if (!(replacements == null ? void 0 : replacements.length)) return;
  const sorted = sanitize(replacements, node.characters.length);
  for (const r of sorted) {
    if (r.start === r.end && r.text === "") continue;
    const insert = (r.text || "").replace(/[\uE000-\uF8FF]/g, "");
    if (r.start !== r.end) node.deleteCharacters(r.start, r.end);
    if (insert) node.insertCharacters(r.start, insert);
  }
}

// src/main.ts
var MAX_NODES = 2e3;
var BATCH_SIZE = 150;
var PIPELINE_MAX_PASSES = 3;
var MAX_SEGMENT_LENGTH = 5e3;
var INIT_TIMEOUT_MS = 1500;
var NOOP = (s) => s;
function getLangProcessor(lang) {
  switch (lang) {
    case "ru":
      return applyRussianRules;
    case "en":
      return applyEnglishRules;
    case "fr":
      return applyFrenchRules;
    case "uk":
      return applyUkrainianRules;
    case "de":
      return applyGermanRules;
    case "es":
      return applySpanishRules;
    case "bcs":
      return applyBCSRules;
    default:
      return NOOP;
  }
}
function isTextNode(n) {
  return n.type === "TEXT";
}
function collectTargets() {
  const selection = figma.currentPage.selection;
  const out = [];
  if (selection.length) {
    for (const node of selection) {
      if (isTextNode(node)) {
        out.push(node);
      } else if ("findAll" in node) {
        const found = node.findAll(isTextNode);
        out.push(...found);
      }
    }
    return out;
  }
  return figma.currentPage.findAll(isTextNode);
}
async function loadFontsForNode(node) {
  if (!node.characters) return true;
  try {
    if (node.fontName !== figma.mixed) {
      await figma.loadFontAsync(node.fontName);
      return true;
    }
    const fonts = node.getRangeAllFontNames(0, node.characters.length);
    await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
    return true;
  } catch (e) {
    return false;
  }
}
function transformSegment(text, lang) {
  const langProc = getLangProcessor(lang);
  let prev = text;
  for (let i = 0; i < PIPELINE_MAX_PASSES; i++) {
    let s = applyMath(prev);
    s = applyCommonRules(s);
    s = langProc(s);
    if (s === prev) return s;
    prev = s;
  }
  return prev;
}
function planReplacements(before, lang) {
  const { masked, masks } = maskSensitive(before);
  const segments = extractFreeSegments(masked, masks);
  const out = [];
  for (const seg of segments) {
    if (seg.text.length > MAX_SEGMENT_LENGTH) return null;
    const after = transformSegment(seg.text, lang);
    if (after === seg.text) continue;
    const local = diffLCS(seg.text, after);
    for (const r of local) {
      out.push({
        start: seg.start + r.start,
        end: seg.start + r.end,
        text: r.text,
        reason: r.reason
      });
    }
  }
  return out;
}
function yieldControl() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
function formatLangList(uiLocale2, stats) {
  const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.map(([lang]) => langName(uiLocale2, lang)).join(", ");
}
function postProgress(current, total, label) {
  figma.ui.postMessage({ type: "progress", current, total, label });
}
var uiLocale = "en";
var cancelled = false;
var initResolve = null;
figma.ui.onmessage = (msg) => {
  if (!msg) return;
  if (msg.type === "init") {
    uiLocale = detectUILocale(msg.locale);
    if (initResolve) {
      initResolve();
      initResolve = null;
    }
  } else if (msg.type === "cancel") {
    cancelled = true;
  }
};
function waitForInit(timeoutMs) {
  return new Promise((resolve) => {
    initResolve = resolve;
    setTimeout(() => {
      if (initResolve) {
        initResolve();
        initResolve = null;
      }
    }, timeoutMs);
  });
}
async function run() {
  var _a;
  await waitForInit(INIT_TIMEOUT_MS);
  figma.ui.postMessage({
    type: "labels",
    cancel: t(uiLocale, "cancelButton"),
    scanning: t(uiLocale, "scanning")
  });
  const allNodes = collectTargets();
  if (!allNodes.length) {
    return t(uiLocale, "noTextLayersStat");
  }
  const nodes = allNodes.slice(0, MAX_NODES);
  const truncated = allNodes.length > MAX_NODES;
  postProgress(0, nodes.length, t(uiLocale, "scanning"));
  let totalChanges = 0;
  let affectedNodes = 0;
  let skippedFonts = 0;
  let skippedTooLong = 0;
  const langStats = /* @__PURE__ */ new Map();
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    if (cancelled) break;
    const batch = nodes.slice(i, i + BATCH_SIZE);
    for (const node of batch) {
      if (cancelled) break;
      const before = node.characters;
      if (!before) continue;
      if (before.length > MAX_SEGMENT_LENGTH) {
        skippedTooLong++;
        continue;
      }
      const lang = detectLanguage(before);
      langStats.set(lang, ((_a = langStats.get(lang)) != null ? _a : 0) + 1);
      const replacements = planReplacements(before, lang);
      if (replacements === null) {
        skippedTooLong++;
        continue;
      }
      if (!replacements.length) continue;
      const ok = await loadFontsForNode(node);
      if (!ok) {
        skippedFonts++;
        continue;
      }
      try {
        applyReplacements(node, replacements);
        totalChanges += replacements.length;
        affectedNodes++;
      } catch (e) {
        skippedFonts++;
      }
    }
    const processed = Math.min(i + BATCH_SIZE, nodes.length);
    postProgress(
      processed,
      nodes.length,
      t(uiLocale, cancelled ? "cancelling" : "processing")
    );
    await yieldControl();
  }
  const stats = [];
  stats.push(t(uiLocale, cancelled ? "cancelledStat" : "doneStat"));
  if (langStats.size) {
    stats.push(t(uiLocale, "languagesStat", { list: formatLangList(uiLocale, langStats) }));
  }
  stats.push(t(uiLocale, "changesStat", { n: totalChanges }));
  stats.push(t(uiLocale, "affectedStat", { n: affectedNodes }));
  if (skippedFonts) stats.push(t(uiLocale, "skippedFontsStat", { n: skippedFonts }));
  if (skippedTooLong) stats.push(t(uiLocale, "skippedLongStat", { n: skippedTooLong }));
  if (truncated) {
    stats.push(t(uiLocale, "limitStat", { limit: MAX_NODES, total: allNodes.length }));
  }
  return stats.join(" ") + "\n" + t(uiLocale, "undoHint");
}
figma.showUI(__html__, { width: 320, height: 160, themeColors: true });
figma.on("run", async () => {
  let result = "";
  try {
    result = await run();
  } catch (e) {
    const msgText = e instanceof Error ? e.message : String(e);
    result = t(uiLocale, "errorStat", { message: msgText });
  } finally {
    figma.closePlugin(result);
  }
});
