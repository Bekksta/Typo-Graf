// rules/it.ts — итальянская типографика
// - Кавычки «…» (стандарт; "…" допустимы как fallback)
// - NBSP после артиклей (il, la, lo, l', i, gli, le, un, una, uno)
// - NBSP после коротких предлогов (di, a, da, in, con, su, per, fra, tra, e, o)
// - Сокращения с точкой (Sig., Sig.ra, Sigg., Dott., Dott.ssa, Egr.) → NBSP после
// - Число + единица/валюта/% → NBSP
import { NBSP, SP_ANY_SRC } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);

// Короткие предлоги/союзы/артикли. ё-стиль (как ru): NBSP после.
const PROCLITICS = [
  // артикли
  "il", "la", "lo", "i", "gli", "le", "un", "una", "uno",
  // предлоги
  "di", "a", "da", "in", "con", "su", "per", "fra", "tra",
  // союзы
  "e", "o", "ma", "se",
];

// \b в JS не понимает Unicode-границы слов даже с 'u' — используем явный
// lookbehind по non-letter/non-digit. Регистронезависимо (Il/IL/il/...).
const PROCLITICS_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(${PROCLITICS.join("|")})${SP_ANY_SRC}+(?=[\\p{L}\\p{N}])`,
  "giu"
);

const DOT_ABBR = ["Sig", "Sigg", "Sig\\.ra", "Sig\\.na", "Dott", "Dott\\.ssa", "Egr", "Prof", "Avv", "Arch", "Ing", "Geom"];
const DOT_ABBR_RE = new RegExp(
  `\\b(${DOT_ABBR.join("|")})\\.${SP_ANY_SRC}+(?=[A-ZÀÁÈÉÌÍÒÓÙÚ])`,
  "g"
);

const ASCII_QUOTE_NORMALIZE_RE = /[“”„‟]/g;

function placeItalianQuotes(text: string): string {
  // Если уже стоят «…» — оставляем.
  if (/[«»]/.test(text)) return text;
  let t = text.replace(ASCII_QUOTE_NORMALIZE_RE, '"');
  let out = "";
  let open = true;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '"') {
      out += open ? "«" : "»";
      open = !open;
    } else {
      out += ch;
    }
  }
  return out;
}

// Группировка тысяч (5+ цифр) NBSP-разделителем.
function groupThousandsIt(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  );
}

export function applyItalianRules(input: string): string {
  let t = input;
  t = placeItalianQuotes(t);
  t = t.replace(PROCLITICS_RE, (_m, w: string) => w + NBSP);
  t = t.replace(DOT_ABBR_RE, (_m, abbr: string) => abbr + "." + NBSP);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousandsIt(t);
  return t;
}
