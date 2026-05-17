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

export function applyGermanRules(input: string): string {
  let t = input;
  t = placeGermanQuotes(t);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  return t;
}
