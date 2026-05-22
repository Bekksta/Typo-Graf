// rules/bcs.ts — bs/hr/sr латиница (ТЗ §3.8)
// - Кавычки „…" или «…» — нормализуем по встреченному варианту
//   (если есть «…» — оставляем; если „…" — оставляем; иначе по умолчанию „…")
// - Число + единица/валюта/% → NBSP
import { NBSP, ANY_SPACE_SRC } from "../lang/maps";
import { makeNumberUnitRegex, UNITS_BY_LANG } from "./shared";

const UNIT_RE = makeNumberUnitRegex(UNITS_BY_LANG.eu);

function placeBCSQuotes(text: string): string {
  if (/[«»]/.test(text)) return text;
  if (/[„“]/.test(text)) return text;

  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? "„" : "“";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}

export function applyBCSRules(input: string): string {
  let t = input;
  t = placeBCSQuotes(t);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  return t;
}
