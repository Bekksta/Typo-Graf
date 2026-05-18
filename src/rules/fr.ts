// rules/fr.ts — французская типографика (ТЗ §3.4)
// - Перед ; : ? ! и закрывающей » — узкий NBSP (NNBSP, U+202F)
// - Гийеметы « … » с узкими NBSP внутри
// - Число + единица/валюта/% → узкий NBSP
import { NNBSP, NBSP, SP_ANY_SRC, EM_DASH } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

const UNIT_RE = makeNumberUnitRegex(NUM_UNIT.eu);

// Перед ;:?! ставим NNBSP. Не трогаем `:` внутри URL/email — они замаскированы.
const PUNCT_BEFORE_RE = new RegExp(`${SP_ANY_SRC}*([;:!?»])`, "g");

// Smart apostrophe для liaison: l', d', n', s', c', j', m', t', qu', jusqu', etc.
// Заменяем ASCII ' (или naive ' ') на ’ (U+2019) между буквами с одной
// и/или другой стороны. Делается ДО guillemets, чтобы не путать с одиночными
// кавычками.
function smartApostropheFr(text: string): string {
  // буква + ' + буква (любая liaison: l'arbre, d'accord, n'est, qu'on)
  return text.replace(/(\p{L})['’'](\p{L})/gu, "$1’$2");
}

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

// Em-dash во французской типографике — с обычными пробелами по обе стороны.
// Преобразуем `--` и одиночный `-` между не-цифровыми токенами.
function normalizeEmDashFr(text: string): string {
  // двойной дефис → em dash
  text = text.replace(/\s*--\s*/g, ` ${EM_DASH} `);
  // дефис между не-цифровыми токенами с пробелами
  text = text.replace(
    /([^\d\s])\s[-–]\s([^\d\s])/g,
    (_m, a: string, b: string) => `${a} ${EM_DASH} ${b}`
  );
  // нормализуем уже стоящий em-dash до симметричных пробелов (но не digit—digit)
  text = text.replace(
    /(\S)[    \t]*—[    \t]*(\S)/g,
    (m, a: string, b: string) => {
      if (/\d/.test(a) && /\d/.test(b)) return m;
      return `${a} ${EM_DASH} ${b}`;
    }
  );
  return text;
}

// Группировка тысяч (5+ цифр) узким NBSP: 1234567 → 1 234 567.
function groupThousandsFr(text: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP)
  );
}

export function applyFrenchRules(input: string): string {
  let t = input;
  t = smartApostropheFr(t);
  t = placeGuillemets(t);
  t = tightenGuillemets(t);
  t = normalizeEmDashFr(t);
  t = narrowNbspBeforePunct(t);
  t = tightenUnitsFr(t);
  // обычный NBSP в общих правилах уже мог сработать — заменим на NNBSP для FR
  t = t.replace(new RegExp(`(\\d)${NBSP}`, "g"), `$1${NNBSP}`);
  t = groupThousandsFr(t);
  return t;
}
