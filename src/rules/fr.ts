// rules/fr.ts — французская типографика (ТЗ §3.4)
// - Перед ; : ? ! и закрывающей » — узкий NBSP (NNBSP, U+202F)
// - Гийеметы « … » с узкими NBSP внутри
// - Число + единица/валюта/% → узкий NBSP
import { NNBSP, NBSP, SP_ANY_SRC } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);

// Перед ;:?! ставим NNBSP. Не трогаем `:` внутри URL/email — они замаскированы.
const PUNCT_BEFORE_RE = new RegExp(`${SP_ANY_SRC}*([;:!?»])`, "g");

// 1) Нормализуем ASCII " → « »
function placeGuillemets(text: string): string {
  let out = "";
  let open = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      out += open ? "«" : "»";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}

// 2) Узкие NBSP сразу после « и перед »
const OPEN_GUILLEMET_SPACE_RE = new RegExp(`«${SP_ANY_SRC}*`, "g");
const CLOSE_GUILLEMET_SPACE_RE = new RegExp(`${SP_ANY_SRC}*»`, "g");

function tightenGuillemets(text: string): string {
  return text
    .replace(OPEN_GUILLEMET_SPACE_RE, "«" + NNBSP)
    .replace(CLOSE_GUILLEMET_SPACE_RE, NNBSP + "»");
}

// 3) Number + unit/currency/% — узкий NBSP
function tightenUnitsFr(text: string): string {
  return text.replace(UNIT_RE, (m, n: string, _u: string) => {
    const unitStart = n.length;
    return n + NNBSP + m.slice(unitStart).replace(/^\s+/, "");
  });
}

// 4) Перед ;:?!» — узкий NBSP, но НЕ внутри URL/email и не если уже NNBSP
function narrowNbspBeforePunct(text: string): string {
  return text.replace(PUNCT_BEFORE_RE, (_m, p: string) => NNBSP + p);
}

export function applyFrenchRules(input: string): string {
  let t = input;
  t = placeGuillemets(t);
  t = tightenGuillemets(t);
  t = narrowNbspBeforePunct(t);
  t = tightenUnitsFr(t);
  // обычный NBSP в общих правилах уже мог сработать — заменим на NNBSP для FR
  t = t.replace(new RegExp(`(\\d)${NBSP}`, "g"), `$1${NNBSP}`);
  return t;
}
