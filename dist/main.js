"use strict";

// src/stats.ts
function withReplaceCounter(fn) {
  const origReplace = String.prototype.replace;
  const origReplaceAll = String.prototype.replaceAll;
  let count = 0;
  function countMatches(str, search) {
    var _a;
    if (search instanceof RegExp) {
      const hasG = (_a = search.flags) == null ? void 0 : _a.includes("g");
      const re = hasG ? search : new RegExp(search.source, search.flags + "g");
      const m = str.match(re);
      return m ? m.length : 0;
    } else if (typeof search === "string") {
      if (search === "") return 0;
      let from = 0, c = 0;
      for (; ; ) {
        const i = str.indexOf(search, from);
        if (i === -1) break;
        c++;
        from = i + search.length;
      }
      return c;
    }
    return 0;
  }
  String.prototype.replace = function(search, replacer) {
    const before = String(this);
    const matches = countMatches(before, search);
    const out = origReplace.apply(this, [search, replacer]);
    if (matches > 0 && out !== before) count += matches;
    return out;
  };
  if (origReplaceAll) {
    String.prototype.replaceAll = function(search, replacer) {
      const before = String(this);
      const matches = countMatches(before, search);
      const out = origReplaceAll.apply(this, [search, replacer]);
      if (matches > 0 && out !== before) count += matches;
      return out;
    };
  }
  try {
    const result = fn();
    return { result, count };
  } finally {
    String.prototype.replace = origReplace;
    if (origReplaceAll) String.prototype.replaceAll = origReplaceAll;
  }
}
function processTextWithStats(raw, langProc, fns) {
  var _a;
  const { mask, unmask, math, common } = fns;
  const { masked, parts } = mask(raw);
  const mathRes = withReplaceCounter(() => math(masked));
  let accText = mathRes.result;
  let accChanges = mathRes.count;
  const commonRes = withReplaceCounter(() => common(accText));
  accText = (_a = commonRes.result.text) != null ? _a : commonRes.result;
  accChanges += commonRes.count;
  const langRes = withReplaceCounter(() => langProc(accText));
  accText = langRes.result;
  accChanges += langRes.count;
  const finalText = unmask(accText, parts);
  return { text: finalText, changes: accChanges };
}

// src/lang/detect.ts
var CYR = /[\u0400-\u04FF]/;
var LAT = /[A-Za-z]/;
var HAS = {
  es: /[ñáéíóúü]/i,
  fr: /[çàâäæèéêëîïôœùûüÿ«»]/i,
  de: /[äöüß]/,
  uk: /[іїєґ]/i,
  bcs: /[čćšđž]/i,
  srCy: /[ђћј]/i
};
function detectLanguage(text) {
  const cyr = CYR.test(text);
  if (cyr) {
    if (HAS.uk.test(text)) return "uk";
    if (HAS.srCy.test(text)) return "ru";
    return "ru";
  }
  if (HAS.fr.test(text)) return "fr";
  if (HAS.de.test(text)) return "de";
  if (HAS.es.test(text)) return "es";
  if (HAS.bcs.test(text)) return "bcs";
  if (LAT.test(text)) return "en";
  return LAT.test(text) ? "en" : "ru";
}

// src/lang/maps.ts
var LANG_LABEL = {
  ru: "\u0440\u0443\u0441\u0441\u043A\u0438\u0439",
  en: "\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
  fr: "\u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u0438\u0439",
  de: "\u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439",
  es: "\u0438\u0441\u043F\u0430\u043D\u0441\u043A\u0438\u0439",
  uk: "\u0443\u043A\u0440\u0430\u0438\u043D\u0441\u043A\u0438\u0439",
  bcs: "\u0431\u043E\u0441\u043D\u0438\u0439\u0441\u043A\u043E-\u0445\u043E\u0440\u0432\u0430\u0442\u0441\u043A\u043E-\u0441\u0435\u0440\u0431\u0441\u043A\u0438\u0439"
};
var NBSP = "\xA0";
var NBH = "\u2011";
var EN_DASH = "\u2013";
var EM_DASH = "\u2014";
var ELLIPSIS = "\u2026";
var SP_ANY_CLASS = /[ \u00A0\u2009\u202F\t]/;
var SP_ANY_SRC = "[ \\u00A0\\u2009\\u202F\\t]";
var PRIME = "\u2032";
var DBL_PRM = "\u2033";
var L_DQ = "\u201C";
var R_DQ = "\u201D";
var L_SQ = "\u2018";
var R_SQ = "\u2019";

// src/rules/common.ts
var PUA_BASE = 57344;
var MASK_LEN = 10;
var MASK_TOKEN = String.fromCharCode(PUA_BASE) + "x".repeat(MASK_LEN - 1);
var URL_RE = /\bhttps?:\/\/[^\s]+/gi;
var EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;
function maskUrlsAndEmails(input) {
  const parts = [];
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
function unmaskUrlsAndEmails(text, parts) {
  if (!parts.length) return text;
  let i = 0;
  return text.replace(new RegExp(MASK_TOKEN, "g"), () => {
    var _a, _b;
    return (_b = (_a = parts[i++]) == null ? void 0 : _a.raw) != null ? _b : "";
  });
}
function applyCommonRules(input) {
  const replacements = [];
  let text = input;
  text = text.replace(/\s*\.{3}\s*/g, ELLIPSIS).replace(/\s+…/g, ELLIPSIS).replace(/…(?=[A-Za-zА-Яа-яЁё0-9])/g, ELLIPSIS + " ");
  text = text.replace(/(\d)\s+%/g, (_m, d) => `${d}%`);
  const WJ = "\u2060";
  text = text.replace(/%\s*…/g, "%" + WJ + ELLIPSIS);
  text = text.replace(/(\d+)\s*-\s*(\d+)/g, (_m, a, b) => `${a}${EN_DASH}${b}`);
  text = text.replace(/ {2,}/g, " ");
  text = text.replace(
    /(\d+)[ \u00A0\u2009\u202F\t]+(кг|г|см|мм|мг|м|л|км|т|мл|млн|тыс\.?|₽|€|\$|%|ч\.?|мин\.?|сек\.?)(?![A-Za-zА-Яа-яЁё])/g,
    (_m, n, u) => `${n}${NBSP}${u}`
  );
  text = text.replace(/…\s+(см\.?|мм|м|км|г|кг|л|%|₽|€|\$)/g, (_m, u) => `\u2026${NBSP}${u}`);
  const SP_ANY = "[ \\u00A0\\u2009\\u202F\\t]*";
  text = text.replace(new RegExp(`(\\d)${SP_ANY}''(?!')`, "g"), "$1\u2033");
  text = text.replace(new RegExp(`(\\d)${SP_ANY}'(?!')`, "g"), "$1\u2032");
  text = text.replace(/\b(\d+)\s*deg\b/gi, "$1\xB0");
  return { text, replacements };
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
    /(\S)\s*\^\s*([A-Za-zА-Яа-яЁё0-9+\-−]+)/g,
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
    /(\S)\s*_\s*([A-Za-zА-Яа-яЁё0-9\-−]{1,3})(?=(?:\s|[+\-−*/=,.;:()])|$)/g,
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
  const SYM = "A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u04510-9\\u2070-\\u209F\\u02B0-\\u02FF\\u1D2C-\\u1D7F";
  out = out.replace(
    new RegExp(`([${SYM}])\\s*\xB7\\s*([${SYM}])`, "g"),
    "$1 \xB7 $2"
  );
  return out;
}
function applyMathDivision(text) {
  let out = text;
  const SYM = "A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u04510-9\\u2070-\\u209F\\u02B0-\\u02FF\\u1D2C-\\u1D7F";
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
  const SYM = "A-Za-z\u0410-\u042F\u0430-\u044F\u0401\u04510-9\\u2070-\\u209F\\u02B0-\\u02FF\\u1D2C-\\u1D7F";
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
  out = out.replace(/\b\\?vec\s*\(\s*([A-Za-z\u0391-\u03C9])\s*\)/g, (_m, v) => `\u20D7${v}`);
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
    (m, unit, generic, off) => {
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
function normalizePrimes(text) {
  text = text.replace(
    new RegExp(`(\\d)${SP_ANY_SRC}*(?:''|["\u201D]|\\u2033)`, "g"),
    `$1${DBL_PRM}`
  );
  text = text.replace(
    new RegExp(`(\\d)${SP_ANY_SRC}*(?:'|\u2019|\\u2032)(?!['\u201D"\\u2033])`, "g"),
    `$1${PRIME}`
  );
  return text;
}
function smartQuotesEn(input) {
  let text = input.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");
  text = text.replace(
    /\b([A-Za-z]+)'([A-Za-z]+)\b/g,
    `${L_SQ}$1${R_SQ}$2`.replace(L_SQ, "").replace(R_SQ, R_SQ)
  );
  text = text.replace(
    /\b([A-Za-z]+)'([A-Za-z]+)\b/g,
    (_m, a, b) => `${a}${R_SQ}${b}`
  );
  text = text.replace(/\b([A-Za-z]+)'\b/g, (_m, a) => `${a}${R_SQ}`);
  text = text.replace(/\b'([A-Za-z]+)\b/g, (_m, a) => `${R_SQ}${a}`);
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += ch === '"' ? open ? L_DQ : R_DQ : ch;
    if (ch === '"') open = !open;
  }
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
      const seg = nested.slice(nested.lastIndexOf(L_DQ) + 1);
      const opens = (seg.match(new RegExp(L_SQ, "g")) || []).length;
      const closes = (seg.match(new RegExp(R_SQ, "g")) || []).length;
      nested += opens === closes ? L_SQ : R_SQ;
    } else {
      nested += ch;
    }
  }
  out = nested;
  out = out.replace(new RegExp(`${L_DQ}${SP_ANY_SRC}+`, "g"), L_DQ);
  out = out.replace(new RegExp(`${SP_ANY_SRC}+${R_DQ}`, "g"), R_DQ);
  out = out.replace(new RegExp(`${R_DQ}([.,!?:;\u2026])`, "g"), `${R_DQ}$1`);
  return out;
}
function normalizeRangesEn(text) {
  return text.replace(
    /\b(\d+)\s*-\s*(\d+)\b/g,
    (_m, a, b) => `${a}${EN_DASH}${b}`
  );
}
var UNITS = UNIT_LIST.map(
  (u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
).join("|");
function formatCurrencyLeadingSymbol(text) {
  return text.replace(
    /([$£€])\s*([0-9]{1,3}(?:[ .]?[0-9]{3})*|\d+)([.,]\d+)?/g,
    (_m, sym, num, dec) => {
      const rawDigits = num.replace(/[ .,]/g, "");
      const withThousands = rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      let out = withThousands;
      if (dec) {
        out += "." + dec.slice(1);
      }
      return sym + out;
    }
  );
}
function tightenUnitsAndPercentsEn(text) {
  let t = text;
  t = formatCurrencyLeadingSymbol(t);
  t = t.replace(/([$£€]\d{1,3})\.(\d{3})(?!\d)/g, (_m, a, b) => `${a},${b}`);
  t = t.replace(
    new RegExp(`(\\d+)${SP_ANY_SRC}*%`, "g"),
    (_m, n) => `${n}${NBSP}%`
  );
  const reUnit = new RegExp(
    `(\\d+)${SP_ANY_SRC}+(${UNITS})(?![A-Za-z0-9])`,
    "g"
  );
  t = t.replace(reUnit, (_m, n, u) => `${n}${NBSP}${u}`);
  return t;
}
function gluePrepsAndConjs(text) {
  if (!SERVICE_WORDS2.length) return text;
  const alternation = SERVICE_WORDS2.map(
    (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  ).join("|");
  const re = new RegExp(`\\b(${alternation})${SP_ANY_SRC}+(?=\\S)`, "gi");
  return text.replace(re, (_m, w) => w + NBSP);
}
function applyEnglishRules(input) {
  let t = input;
  t = normalizePrimes(t);
  t = smartQuotesEn(t);
  t = normalizeRangesEn(t);
  t = tightenUnitsAndPercentsEn(t);
  t = gluePrepsAndConjs(t);
  return t;
}

// src/main.ts
async function loadAllFontsForNode(root) {
  const textNodes = [];
  if ("findAll" in root) {
    root.findAll((n) => n.type === "TEXT").forEach((n) => textNodes.push(n));
  } else if (root.type === "TEXT") {
    textNodes.push(root);
  }
  const fonts = /* @__PURE__ */ new Set();
  for (const t of textNodes) {
    try {
      if (t.fontName !== figma.mixed) {
        const f = t.fontName;
        fonts.add(JSON.stringify(f));
      } else {
        t.getRangeAllFontNames(0, t.characters.length).forEach(
          (f) => fonts.add(JSON.stringify(f))
        );
      }
    } catch (e) {
    }
  }
  for (const f of fonts) {
    const fn = JSON.parse(f);
    try {
      await figma.loadFontAsync(fn);
    } catch (e) {
    }
  }
}
var lastResultMessage = null;
function getLangProcessor(lang) {
  switch (lang) {
    case "ru":
      return (t) => applyRussianRules(t);
    case "en":
      return (t) => applyEnglishRules(t);
    // case "sr": return (t) => applySerbianRules(t); // когда появится
    default:
      return (t) => t;
  }
}
function transformTextOnce(raw, lang) {
  const langProc = getLangProcessor(lang);
  let prev = raw;
  let totalChanges = 0;
  for (let i = 0; i < 3; i++) {
    const { text, changes } = processTextWithStats(prev, langProc, {
      mask: maskUrlsAndEmails,
      unmask: unmaskUrlsAndEmails,
      math: applyMath,
      common: (s) => applyCommonRules(s)
      // если в TS-версии есть ещё поле units — просто передай tightenUnitsAndPercents сюда
    });
    totalChanges += changes;
    if (text === prev) {
      return { text, changes: totalChanges };
    }
    prev = text;
  }
  return { text: prev, changes: totalChanges };
}
async function runHeadless() {
  var _a, _b;
  const selection = figma.currentPage.selection;
  const nodes = [];
  const isTextNode = (n) => n.type === "TEXT";
  for (const node of selection) {
    if ("findAll" in node) {
      const found = node.findAll((n) => n.type === "TEXT").filter(isTextNode);
      nodes.push(...found);
    } else if (node.type === "TEXT") {
      nodes.push(node);
    }
  }
  if (!nodes.length) {
    figma.notify("\u041D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043D\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u043E \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0445 \u0441\u043B\u043E\u0435\u0432", {
      timeout: 2e3
    });
    return;
  }
  const sample = nodes.map((n) => {
    var _a2;
    return (_a2 = n.characters) != null ? _a2 : "";
  }).join("\n").slice(0, 4e3);
  const lang = detectLanguage(sample);
  const langLabel = (_a = LANG_LABEL[lang]) != null ? _a : lang;
  await loadAllFontsForNode(figma.currentPage);
  let changes = 0;
  for (const n of nodes) {
    const before = (_b = n.characters) != null ? _b : "";
    const res = transformTextOnce(before, lang);
    if (before !== res.text) {
      n.characters = res.text;
      changes += res.changes;
    }
  }
  lastResultMessage = `\u042F\u0437\u044B\u043A: ${langLabel}. \u0412\u043D\u0435\u0441\u0435\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439: ${changes}`;
}
figma.on("run", async () => {
  try {
    await runHeadless();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    figma.notify("\u041E\u0448\u0438\u0431\u043A\u0430: " + msg, { timeout: 3e3 });
  } finally {
    figma.closePlugin(lastResultMessage != null ? lastResultMessage : "\u0413\u043E\u0442\u043E\u0432\u043E");
  }
});
