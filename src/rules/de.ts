// rules/de.ts — немецкая типографика (ТЗ §3.6)
// - Кавычки „unten" — нижняя открывающая „, верхняя закрывающая "
//   (или »…« если уже стоит — оставляем)
// - Число + Einheit/Währung/% → NBSP
// - Десятичную запятую НЕ трогаем
// - Диапазоны 10–12 kg (en dash) — уже сделано в common
import { NBSP, SP_ANY_SRC } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);
const ASCII_QUOTE_NORMALIZE_RE = /[”‟]/g; // экзотические закрывающие → ASCII "

function placeGermanQuotes(text: string): string {
  // Если уже стоят »…« — НЕ трогаем (ТЗ).
  if (/[»«]/.test(text)) return text;

  let t = text.replace(ASCII_QUOTE_NORMALIZE_RE, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '"') {
      out += open ? "„" : "“";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}

// Составные немецкие сокращения: z. B. (zum Beispiel), u. a. (unter anderem),
// d. h. (das heißt), u. ä. (und ähnliche), bzw. (beziehungsweise), etc.
// Внутри двухбуквенных вариантов — NBSP, чтобы пара не разорвалась.
// После всего сокращения перед словом — NBSP.
function tightenGermanAbbrs(text: string): string {
  // z.B. / z. B. → z.NBSPB.
  const pairs: Array<[RegExp, string]> = [
    [/\bz\.\s*B\./g, `z.${NBSP}B.`],
    [/\bu\.\s*a\./g, `u.${NBSP}a.`],
    [/\bd\.\s*h\./g, `d.${NBSP}h.`],
    [/\bu\.\s*ä\./g, `u.${NBSP}ä.`],
    [/\bn\.\s*Chr\./g, `n.${NBSP}Chr.`],
    [/\bv\.\s*Chr\./g, `v.${NBSP}Chr.`],
  ];
  for (const [re, repl] of pairs) text = text.replace(re, repl);
  // NBSP после сокращения перед заглавным словом
  // \s в литерале (без spaces в char class) ВКЛЮЧАЕТ NBSP, так что
  // подходит для уже склеенной формы `z.\u00A0B.`.
  text = text.replace(
    /(z\.\sB\.|u\.\sa\.|d\.\sh\.|u\.\sä\.|n\.\sChr\.|v\.\sChr\.|bzw\.|usw\.|etc\.)\s+(?=\S)/g,
    `$1${NBSP}`
  );
  return text;
}

// Группировка тысяч точкой — немецкий стандарт.
// Только 5+ цифр БЕЗ точек/запятых вокруг (чтобы не задеть версии 1.0.0
// и не путать с десятичной запятой 3,14).
function groupThousandsDe(text: string): string {
  return text.replace(/(?<![\d.,])\d{5,}(?![\d.,])/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

export function applyGermanRules(input: string): string {
  let t = input;
  t = placeGermanQuotes(t);
  t = tightenGermanAbbrs(t);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousandsDe(t);
  return t;
}
