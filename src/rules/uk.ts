// rules/uk.ts — украинская типографика (ТЗ §3.7)
// - Короткие предлоги (в, у, з, із, й, та, а, і) → NBSP
// - №/§/стор./рис./м. + число/слово → узкий NBSP
// - Число + единица/валюта/% → узкий NBSP
// - Кавычки «…»
import { NBSP, NNBSP, SP_ANY_SRC } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);

// \b в JS не понимает границ Unicode-слов даже с флагом 'u' — используем
// явный lookbehind по non-letter/non-digit.
const PROCLITICS_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(в|у|з|із|й|та|а|і)${SP_ANY_SRC}+(?=\\S)`,
  "giu"
);

const TOKEN_NUM_RE = new RegExp(
  `(№|§|стор\\.|рис\\.|м\\.)${SP_ANY_SRC}+(?=\\S)`,
  "g"
);

const QUOTE_NORMALIZE_RE = /[“”„‟]/g;

function placeGuillemetsUk(text: string): string {
  let t = text.replace(QUOTE_NORMALIZE_RE, '"');
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

// Группировка тысяч (5+ цифр) узким NBSP: 1234567 → 1 234 567.
function groupThousandsUk(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP)
  );
}

export function applyUkrainianRules(input: string): string {
  let t = input;
  t = placeGuillemetsUk(t);
  t = t.replace(PROCLITICS_RE, (_m, w: string) => w + NBSP);
  t = t.replace(TOKEN_NUM_RE, (_m, tok: string) => tok + NNBSP);
  // Число + единица/валюта/% → NNBSP
  t = t.replace(UNIT_RE, (m, n: string) => {
    return n + NNBSP + m.slice(n.length).replace(/^\s+/, "");
  });
  t = groupThousandsUk(t);
  return t;
}
