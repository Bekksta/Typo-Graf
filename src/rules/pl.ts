// rules/pl.ts — польская типографика
// - Кавычки „…" (главные; «…» как вторичные допустимы)
// - NBSP после однобуквенных слов: i, a, o, u, w, z (польская «висячая буква»)
//   и пары z/ze, w/we — стандарт польской типографики.
// - NBSP перед единицами / валютой (zł, %, €, $)
// - Десятичная запятая (3,14) не трогается.
import { NBSP, SP_ANY_SRC } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex({
  units: [...(NUM_UNIT.eu.units ?? []), "zł", "gr"],
  currencies: [...(NUM_UNIT.eu.currencies ?? []), "zł"],
});

// Однобуквенные предлоги и союзы, после которых ставится NBSP.
// Включаем варианты 'ze', 'we' — фонетические формы 'z/w' перед стечениями согласных.
const SHORT_PREP_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(i|a|o|u|w|z|ze|we)${SP_ANY_SRC}+(?=[\\p{L}\\p{N}])`,
  "giu"
);

const ASCII_QUOTE_NORMALIZE_RE = /[“”‟]/g;

function placePolishQuotes(text: string): string {
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

// Группировка тысяч (5+ цифр) NBSP-разделителем (как ru).
function groupThousandsPl(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  );
}

export function applyPolishRules(input: string): string {
  let t = input;
  t = placePolishQuotes(t);
  t = t.replace(SHORT_PREP_RE, (_m, w: string) => w + NBSP);
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousandsPl(t);
  return t;
}
