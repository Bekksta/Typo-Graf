// rules/pt.ts — португальская типографика
// - Кавычки “…” по умолчанию (PT-BR; PT-PT использует «…» — оставляем,
//   если уже встречены)
// - NBSP перед единицами / валютой (R$, $, €, %)
// - ¿/¡ не используются; искусственных пробелов вокруг :;!? не добавляем
// - Десятичная запятая 3,14 не трогается
import { NBSP, ANY_SPACE_SRC, LEFT_DQUOTE, RIGHT_DQUOTE } from "../lang/maps";
import { makeNumberUnitRegex, UNITS_BY_LANG, groupThousands } from "./shared";

const UNIT_RE = makeNumberUnitRegex({
  units: [...(UNITS_BY_LANG.eu.units ?? [])],
  currencies: ["R\\$", "\\$", "€", ...(UNITS_BY_LANG.eu.currencies ?? [])],
});

const ASCII_QUOTE_NORMALIZE_RE = /[„‟]/g;

function placePortugueseQuotes(text: string): string {
  // Если уже стоят «…» (PT-PT традиция) — оставляем.
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

// Группировка тысяч — NBSP. В португальском (особенно PT-PT) разделитель
// тысяч — точка, но это конфликтует с decimal — оставляем NBSP как
// безопасный вариант.
export function applyPortugueseRules(input: string): string {
  let t = input;
  t = placePortugueseQuotes(t);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousands(t, NBSP);
  return t;
}
