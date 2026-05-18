// Прогоняет показательные строки через полный пайплайн плагина
// (detect → mask → segments → rules → unmask), печатает before → after
// с явной разметкой невидимых символов. Запуск: `npm run showcase`.

import { runPipeline } from "../tests/_helpers/pipeline";
import { detectLanguage } from "../src/lang/detect";
import type { Language } from "../src/types";

type Case = { group: string; lang?: Language; input: string };

const CORPUS: Case[] = [
  // ───────── Общие правила ─────────
  { group: "common: ellipsis", input: "Это просто... и вот ещё..." },
  { group: "common: ranges", input: "Возьмите 10-12 кг муки." },
  { group: "common: number+unit", input: "Заплатил 300 ₽ и съел 20 %." },
  { group: "common: degree", input: "Сегодня 25 deg по Цельсию." },
  { group: "common: primes", input: "Высота 5' 11''." },
  { group: "common: double spaces", input: "Два  пробела  внутри." },

  // ───────── Математика ─────────
  { group: "math: powers", input: "Формула: x^2 + y^3 = z^10." },
  { group: "math: subscripts", input: "Молекула H_2O и log_10(x)." },
  { group: "math: fractions", input: "Дробь 1/2 и 3/4 и 7/8." },
  { group: "math: arrows", input: "A -> B, C <- D, E => F, G <=> H." },
  { group: "math: signs", input: "Допуск +- 0.5, инверсия -+ 1." },
  { group: "math: constants", input: "Дано pi ≈ 3.14, sqrt(2) ≈ 1.41, inf." },
  { group: "math: functions", input: "sin(x) + cos(x) = 1; lim(x→0)." },
  { group: "math: comparison", input: "Если a!=b и x<=y и x>=y, то x=2." },
  { group: "math: greek", input: "Углы \\alpha, \\beta и \\gamma." },
  { group: "math: multiplication", input: "Площадь = a*b, объём = a*b*c." },

  // ───────── Русский ─────────
  { group: "ru: initials", lang: "ru", input: "А. С. Пушкин — поэт." },
  { group: "ru: short preps", lang: "ru", input: "в дом, на улице, по плану." },
  { group: "ru: smart quotes", lang: "ru", input: 'Он сказал: "Привет, мир".' },
  { group: "ru: hyphenated abbr", lang: "ru", input: "г-н Иванов и д-р Петров." },
  { group: "ru: composite abbr", lang: "ru", input: "и т.д., т.е., до н.э." },
  { group: "ru: №/§", lang: "ru", input: "См. № 5, § 104 устава." },
  { group: "ru: particles", lang: "ru", input: "Сделал ли я это? Если бы..." },
  { group: "ru: em-dash", lang: "ru", input: "Москва -- столица, Питер - вторая." },
  { group: "ru: yo-fix", lang: "ru", input: "Шел ребенок, ёлка светилась." },
  { group: "ru: yo-fix biz", lang: "ru", input: "Учет за весь квартал и зачет долгов." },
  { group: "ru: yo-fix omonym", lang: "ru", input: "Все эти все остались на полке." },
  { group: "ru: spaces before punct", lang: "ru", input: "Слово , далее ! И что ?" },

  // ───────── English ─────────
  { group: "en: smart quotes", lang: "en", input: 'He said "hello, world".' },
  { group: "en: apostrophes", lang: "en", input: "Don't touch the lovers' books." },
  { group: "en: primes", lang: "en", input: "Height 5' 11'' tall." },
  { group: "en: em-dash", lang: "en", input: "Foo -- bar; baz--quux." },
  { group: "en: ranges", lang: "en", input: "Distance 10-12 km away." },
  { group: "en: currency", lang: "en", input: "Cost $1234.5 or $300, also 300 $." },
  { group: "en: units", lang: "en", input: "Speed 60 mph, weight 10 kg, area 20 %." },
  { group: "en: service words", lang: "en", input: "A dog and the cat, of London." },

  // ───────── Французский ─────────
  { group: "fr: guillemets", lang: "fr", input: 'Il dit "bonjour" à tous.' },
  { group: "fr: narrow nbsp", lang: "fr", input: "Bonjour ! Comment ça va ?" },
  { group: "fr: number + unit", lang: "fr", input: "Il fait 20 % et 5 km." },

  // ───────── Немецкий ─────────
  { group: "de: quotes", lang: "de", input: 'Er sagte "Hallo" und ging.' },
  { group: "de: number + unit", lang: "de", input: "Schöne Grüße: 5 km, 20 %." },
  { group: "de: decimal untouched", lang: "de", input: "Pi ist 3,14 — ungefähr." },

  // ───────── Испанский ─────────
  { group: "es: quotes", lang: "es", input: 'Él dijo "hola" en español.' },
  { group: "es: inverted punct", lang: "es", input: "¿Cómo estás? ¡Muy bien!" },
  { group: "es: number + unit", lang: "es", input: "Cuesta 5 km y 20 %." },

  // ───────── Украинский ─────────
  { group: "uk: short preps", lang: "uk", input: "в дім, у Києві, з другом." },
  { group: "uk: tokens №/стор.", lang: "uk", input: "Див. № 5, стор. 12, рис. 3." },
  { group: "uk: number + unit", lang: "uk", input: "Швидкість 60 km і 20 %." },

  // ───────── BCS ─────────
  { group: "bcs: quotes", lang: "bcs", input: 'On je rekao "zdravo" svima.' },
  { group: "bcs: number + unit", lang: "bcs", input: "Brzina 60 km i 20 %." },

  // ───────── Защита URL/email ─────────
  { group: "guard: URL", lang: "ru", input: "См. https://example.com/a-b?x=1... сегодня." },
  { group: "guard: email", lang: "ru", input: "Пишите на user@example.com сегодня." },
  { group: "guard: mixed", lang: "en", input: "Visit https://example.com or email foo@bar.com today." },

  // ───────── Микс/реалистичный текст ─────────
  {
    group: "mix: ru long",
    lang: "ru",
    input:
      "ребенок 20 кг и А. С. Пушкин — поэт. Купите № 5 за 300 ₽ -- доставка 10-12 км.",
  },
  {
    group: "mix: en long",
    lang: "en",
    input: "He said \"hello!\" and 10-12 km away there's a 20 % discount for the lovers.",
  },
  {
    group: "mix: fr long",
    lang: "fr",
    input: 'Il dit "bonjour !" à 20 % et 5 km avant midi : c\'est tout.',
  },
];

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

// Делает невидимые символы видимыми с цветом.
function reveal(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    switch (code) {
      case 0x00a0: out += `${CYAN}·${RESET}`; break;       // NBSP
      case 0x202f: out += `${CYAN}˙${RESET}`; break;       // NNBSP
      case 0x2009: out += `${CYAN}˘${RESET}`; break;       // THIN SPACE
      case 0x2011: out += `${YELLOW}‑${RESET}`; break;     // NB-HYPHEN
      case 0x2013: out += `${YELLOW}–${RESET}`; break;     // EN-DASH
      case 0x2014: out += `${YELLOW}—${RESET}`; break;     // EM-DASH
      case 0x2026: out += `${YELLOW}…${RESET}`; break;     // ELLIPSIS
      case 0x00ab: out += `${GREEN}«${RESET}`; break;
      case 0x00bb: out += `${GREEN}»${RESET}`; break;
      case 0x201c: out += `${GREEN}“${RESET}`; break;
      case 0x201d: out += `${GREEN}”${RESET}`; break;
      case 0x201e: out += `${GREEN}„${RESET}`; break;
      default:
        if (code >= 0xe000 && code <= 0xf8ff) {
          out += `${RED}▓${RESET}`; // PUA — не должны попадать в финал
        } else {
          out += ch;
        }
    }
  }
  return out;
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s;
  return s + " ".repeat(n - s.length);
}

function countChanges(a: string, b: string): number {
  // Очень грубо — длина симметрической разности после посимвольной диффы.
  let diff = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) diff++;
  return diff;
}

let total = 0;
let changed = 0;
let unchanged = 0;
const perLang = new Map<string, number>();
const pua: Array<{ group: string; out: string }> = [];

console.log(BOLD + "\nTypo Graf — showcase прогон по корпусу\n" + RESET);
console.log(DIM + "Легенда: " + RESET +
  CYAN + "·" + RESET + "=NBSP " +
  CYAN + "˙" + RESET + "=NNBSP " +
  YELLOW + "–" + RESET + "=en-dash " +
  YELLOW + "—" + RESET + "=em-dash " +
  YELLOW + "‑" + RESET + "=NB-hyphen " +
  RED + "▓" + RESET + "=PUA-leak (BUG)\n");

for (const c of CORPUS) {
  total++;
  const detected = detectLanguage(c.input);
  const lang = c.lang ?? detected;
  perLang.set(lang, (perLang.get(lang) ?? 0) + 1);

  const out = runPipeline(c.input, lang);
  const n = countChanges(c.input, out);
  if (n === 0) unchanged++;
  else changed++;

  // Сигнал утечки PUA-плейсхолдеров в финал — это явный баг.
  if (/[-]/.test(out)) pua.push({ group: c.group, out });

  const tag = `${pad(c.group, 28)} ${DIM}lang=${lang}${RESET}` +
    (lang !== detected && !c.lang ? "" : "") +
    (c.lang ? "" : `${DIM} (detected)${RESET}`);
  console.log(BOLD + tag + RESET);
  console.log(`  in : ${reveal(c.input)}`);
  console.log(`  out: ${reveal(out)}`);
  console.log(DIM + `  Δ  : ${n} char diffs` + RESET);
  console.log();
}

console.log(BOLD + "Сводка" + RESET);
console.log(`  total cases : ${total}`);
console.log(`  ${GREEN}changed${RESET}     : ${changed}`);
console.log(`  ${DIM}untouched${RESET}   : ${unchanged}`);
console.log(`  по языкам   : ${[...perLang.entries()].map(([l,n])=>`${l}=${n}`).join(", ")}`);
if (pua.length) {
  console.log(`  ${RED}PUA leak    : ${pua.length} (см. ниже)${RESET}`);
  for (const p of pua) console.log(`    - ${p.group}: ${JSON.stringify(p.out)}`);
} else {
  console.log(`  ${GREEN}PUA leak    : 0${RESET}`);
}
console.log();
