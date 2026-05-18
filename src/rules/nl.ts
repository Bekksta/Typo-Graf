// rules/nl.ts — нидерландская типографика
// - Кавычки „…" (стандарт; '…' тоже допустимо для одиночных)
// - NBSP перед единицами / валютой
// - Десятичная запятая 3,14 не трогается
// - В нидерландской типографике короткие предлоги/артикли (de, het, een,
//   van, op, te, in, met) НЕ требуют NBSP — оставляем обычные пробелы.
import { NBSP, SP_ANY_SRC } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);

const ASCII_QUOTE_NORMALIZE_RE = /[“‟]/g;

function placeDutchQuotes(text: string): string {
  // Если уже стоят „…" — оставляем.
  if (/[„]/.test(text)) return text;
  let t = text.replace(ASCII_QUOTE_NORMALIZE_RE, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '"') {
      out += open ? "„" : "”";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}

function groupThousandsNl(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  );
}

export function applyDutchRules(input: string): string {
  let t = input;
  t = placeDutchQuotes(t);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousandsNl(t);
  return t;
}
