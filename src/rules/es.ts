// rules/es.ts — испанская типографика (ТЗ §3.5)
// - Кавычки по умолчанию "…" (или «…» если уже встречены — оставляем)
// - Число + единица/валюта/% → NBSP
// - ¿ ¡ оставляем, пробелы вокруг :;!? искусственно НЕ добавляем
import { NBSP, ANY_SPACE_SRC, LEFT_DQUOTE, RIGHT_DQUOTE } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);
const ASCII_QUOTE_NORMALIZE_RE = /[„‟]/g;

function placeSpanishQuotes(text: string): string {
  // Если уже стоят «…» — НЕ трогаем (ТЗ).
  if (/[«»]/.test(text)) return text;

  let t = text.replace(ASCII_QUOTE_NORMALIZE_RE, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '"') {
      out += open ? LEFT_DQUOTE : RIGHT_DQUOTE;
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}

// Парная нормализация ¿…? / ¡…!. Добавляем `¿`/`¡` в начало предложения,
// если оно заканчивается на `?`/`!`, начинается с заглавной и НЕ имеет
// `¿`/`¡` внутри. Срабатывает только на чистых предложениях — без
// интерпунктуации внутри (что отсекает большинство риторических конструкций).
const SPANISH_PAIR_RE =
  /(^|[.!?…\n]\s*)([A-ZÁÉÍÓÚÑÜ][^.!?¿¡\n]*?)([?!])/gu;

function pairSpanishQuestionExclamation(text: string): string {
  return text.replace(SPANISH_PAIR_RE, (_m, prefix: string, body: string, end: string) => {
    const opener = end === "?" ? "¿" : "¡";
    return prefix + opener + body + end;
  });
}

// Группировка тысяч (5+ цифр) NBSP-разделителем. RAE рекомендует
// неразрывный пробел вместо точки/запятой, чтобы избежать путаницы между
// форматами es-ES (`1.234.567`) и es-MX/es-419 (`1,234,567`). Без детекта
// локали NBSP — единственный безопасный выбор: его узнают и в ES, и в LatAm.
function groupThousandsEs(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  );
}

export function applySpanishRules(input: string): string {
  let t = input;
  t = placeSpanishQuotes(t);
  t = pairSpanishQuestionExclamation(t);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousandsEs(t);
  return t;
}
