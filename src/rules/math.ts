import { SUPER_MAP, SUB_MAP, GREEK_MAP } from "../lib/mathLib";

const asciiMinusToUnicode = (s: string) => s.replace(/-/g, "−");

const toSuperscriptAll = (s: string) =>
  s
    .split("")
    .map((ch) => SUPER_MAP[ch] ?? ch)
    .join("");

const toSubscriptAll = (s: string) =>
  s
    .split("")
    .map((ch) => SUB_MAP[ch] ?? ch)
    .join("");

// ——— ^ степени ———
function applyMathPowers(text: string): string {
  let out = text;

  // base^(...) — если внутри 1 символ, скобки убираем
  out = out.replace(
    /(\S)\s*\^\s*\(([^)]+)\)/g,
    (_m, base: string, inside: string) => {
      const trimmed = inside.trim();
      const sup = toSuperscriptAll(asciiMinusToUnicode(trimmed));
      return trimmed.length === 1
        ? base + sup
        : base + toSuperscriptAll("(" + trimmed + ")");
    }
  );

  // base^-?\d+  (и с юникодным минусом)
  out = out.replace(
    /(\S)\s*\^\s*([\-−]?\d+)/g,
    (_m, base: string, exp: string) =>
      base + toSuperscriptAll(asciiMinusToUnicode(exp))
  );

  // base^token (буквы/цифры/знаки, без скобок)
  out = out.replace(
    /(\S)\s*\^\s*([A-Za-zА-Яа-яЁё0-9+\-−]+)/g,
    (_m, base: string, token: string) =>
      base + toSuperscriptAll(asciiMinusToUnicode(token))
  );

  return out;
}

// ——— _ индексы ———
function applyMathSubscripts(text: string): string {
  let out = text;

  // base_(...) — если внутри 1 символ, скобки убираем
  out = out.replace(
    /(\S)\s*_\s*\(([^)]+)\)/g,
    (_m, base: string, inside: string) => {
      const trimmed = inside.trim();
      const sub = toSubscriptAll(asciiMinusToUnicode(trimmed));
      return trimmed.length === 1
        ? base + sub
        : base + toSubscriptAll("(" + trimmed + ")");
    }
  );

  // Короткий индекс-«токен» (1–3 символа). Длинные — только через _( ... )
  out = out.replace(
    /(\S)\s*_\s*([A-Za-zА-Яа-яЁё0-9\-−]{1,3})(?=(?:\s|[+\-−*/=,.;:()])|$)/g,
    (_m, base: string, token: string) =>
      base + toSubscriptAll(asciiMinusToUnicode(token))
  );

  // чисто числовой (перекрывается правилом выше — оставлен на всякий случай)
  out = out.replace(
    /(\S)\s*_\s*([\-−]?\d+)/g,
    (_m, base: string, n: string) =>
      base + toSubscriptAll(asciiMinusToUnicode(n))
  );

  return out;
}

// ——— меняем дефис на минус, чтоб его не трогал языковой линтер ———
function protectMathMinus(text: string): string {
  // латиница, цифры, скобки, над/подстрочные, модифайеры
  const MOD = "\u02B0-\u02FF\u1D2C-\u1DBF\u2070-\u209F";
  const L = `[A-Za-z0-9)\\]${MOD}]`;
  const R = `[A-Za-z0-9(\\[${MOD}]`;

  return text.replace(
    new RegExp(`(${L})\\s*[\\-\\u2010-\\u2014]\\s*(${R})`, "g"),
    (m, a, b) => (/[0-9]/.test(a) && /[0-9]/.test(b) ? m : `${a} \u2212 ${b}`)
  );
}

function applyMathMultiplication(text: string): string {
  let out = text;

  // 1. * → ·  (не трогаем **жирный**)
  out = out.replace(/(?<!\*)\*(?!\*)/g, "·");

  // 2. Привести все варианты точек к стандартной средней
  out = out.replace(/[•⋅]/g, "·");

  // 3. Нормализуем пробелы вокруг средней точки между «символьными» токенами
  const SYM = "A-Za-zА-Яа-яЁё0-9\\u2070-\\u209F\\u02B0-\\u02FF\\u1D2C-\\u1D7F";
  out = out.replace(
    new RegExp(`([${SYM}])\\s*·\\s*([${SYM}])`, "g"),
    "$1 · $2"
  );

  return out;
}

function applyMathDivision(text: string): string {
  let out = text;

  // ── 0) Вспомогательные классы символов (как в умножении)
  const SYM = "A-Za-zА-Яа-яЁё0-9\\u2070-\\u209F\\u02B0-\\u02FF\\u1D2C-\\u1D7F";

  // ── 1) Короткие дроби → юникодные "vulgar fractions"
  const FRAC_MAP: Record<string, string> = {
    "1/2": "½",
    "1/3": "⅓",
    "2/3": "⅔",
    "1/4": "¼",
    "3/4": "¾",
    "1/5": "⅕",
    "2/5": "⅖",
    "3/5": "⅗",
    "4/5": "⅘",
    "1/6": "⅙",
    "5/6": "⅚",
    "1/8": "⅛",
    "3/8": "⅜",
    "5/8": "⅝",
    "7/8": "⅞",
  };
  out = out.replace(/\b([123457])\s*\/\s*([236458])\b/g, (_m, a, b) => {
    const key = `${a}/${b}`;
    return FRAC_MAP[key] ?? `${a}/${b}`;
  });

  // ── 2) Явный знак деления ÷ — нормализуем пробелы вокруг
  out = out.replace(
    new RegExp(`([${SYM}])\\s*÷\\s*([${SYM}])`, "g"),
    "$1 ÷ $2"
  );

  // ── 3) Обычное деление "/" — ставим пробелы вокруг между «символьными» токенами
  // URL/почта уже замаскированы раньше в пайплайне
  out = out.replace(
    new RegExp(`([${SYM}])\\s*\\/\\s*([${SYM}])`, "g"),
    "$1 / $2"
  );

  // ── 4) Чуть причешем "плюс" внутри скобок: (a+b) → (a + b)
  out = out.replace(/\(([ \t]*)([^\)]+?)([ \t]*)\)/g, (_m, lsp, inner, rsp) => {
    const fixed = inner.replace(
      new RegExp(`([${SYM}])\\+([${SYM}])`, "g"),
      "$1 + $2"
    );
    return `(${lsp}${fixed}${rsp})`;
  });

  return out;
}

function applyMathEquality(text: string): string {
  let out = text;

  const SYM = "A-Za-zА-Яа-яЁё0-9\\u2070-\\u209F\\u02B0-\\u02FF\\u1D2C-\\u1D7F";

  // 1) != → ≠
  out = out.replace(
    new RegExp(`([${SYM}])\\s*!=\\s*([${SYM}])`, "g"),
    "$1 ≠ $2"
  );

  // 2) <= / >=
  out = out.replace(
    new RegExp(`([${SYM}])\\s*<=\\s*([${SYM}])`, "g"),
    "$1 ≤ $2"
  );
  out = out.replace(
    new RegExp(`([${SYM}])\\s*>=\\s*([${SYM}])`, "g"),
    "$1 ≥ $2"
  );

  // 3) = (после ≤/≥/≠, чтобы их не трогать)
  out = out.replace(
    new RegExp(`([${SYM}])\\s*=\\s*([${SYM}])`, "g"),
    "$1 = $2"
  );

  // 4) Нормализуем пробелы вокруг ≈ и ≃ (символы оставляем как есть)
  out = out.replace(
    new RegExp(`([${SYM}])\\s*(≈|≃)\\s*([${SYM}])`, "g"),
    "$1 $2 $3"
  );

  return out;
}

function applyMathSigns(text: string): string {
  let out = text;

  // 1) плюс-минус и минус-плюс
  out = out.replace(/\+\-/g, "±");
  out = out.replace(/\-\+/g, "∓");

  // 2) стрелки (должны идти ДО <= и =>, чтобы не пересекалось)
  out = out.replace(/<=>/g, "⇔"); // эквивалентность
  out = out.replace(/-->/g, "⟶"); // длинная стрелка вправо
  out = out.replace(/<-/g, "←");
  out = out.replace(/->/g, "→");
  out = out.replace(/=>/g, "⇒");

  return out;
}

function applyMathConstants(text: string): string {
  let out = text;

  // Специальные функции и константы
  out = out.replace(/\bsqrt\s*\(\s*([^)]+)\s*\)/gi, "√$1");
  out = out.replace(/\bpi\b/gi, "π");
  out = out.replace(/\binf\b/gi, "∞");
  out = out.replace(/\b(sum|Σ)\b/gi, "Σ");
  out = out.replace(/\bintegral\b/gi, "∫");

  // явная форма: \alpha -> α (всегда)
  out = out.replace(
    /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/gi,
    (_m, name) => GREEK_MAP[name.toLowerCase()] || _m
  );

  return out;
}

function applyMathOperators(text: string): string {
  let out = text;

  // 1) sin/cos (...) → sin x / cos x  (скобки можно опускать)
  out = out.replace(/\b(sin|cos)\s*\(\s*([^)]+?)\s*\)/gi, (_m, f, arg) => `${f} ${arg}`);

  // 2) log с основанием: log10(x) → log₁₀ x
  out = out.replace(/\blog\s*([0-9]+)\s*\(\s*([^)]+?)\s*\)/gi,
    (_m, base, arg) => `log${toSubscriptAll(base)} ${arg}`
  );
  //    обычный log(x) → log x
  out = out.replace(/\blog\s*\(\s*([^)]+?)\s*\)/gi, (_m, arg) => `log ${arg}`);

  // 3) lim(x→0) → limₓ→₀
  out = out.replace(/\blim\s*\(\s*([A-Za-z])\s*→\s*([^)]+?)\s*\)/g,
    (_m, v, to) => `lim${toSubscriptAll(v)}→${toSubscriptAll(asciiMinusToUnicode(to))}`
  );

  // 4) Сигма с нижним/верхним пределом:
  //    ∑_(i=1)^n  →  ∑ᵢ₌₁ⁿ   (пробел после верхнего предела сохраняем)
  out = out.replace(/∑\s*_\s*\(\s*([A-Za-z])\s*=\s*([^)]+?)\s*\)\s*\^\s*([A-Za-z0-9]+)\s*/g,
    (_m, v, from, to) => `∑${toSubscriptAll(`${v}=${asciiMinusToUnicode(from)}`)}${toSuperscriptAll(to)} `
  );
  // вариант только с нижним пределом: ∑_(i=1) → ∑ᵢ₌₁
  out = out.replace(/∑\s*_\s*\(\s*([A-Za-z])\s*=\s*([^)]+?)\s*\)/g,
    (_m, v, from) => `∑${toSubscriptAll(`${v}=${asciiMinusToUnicode(from)}`)}`
  );

  // 5) vec(a) → a⃗  (комбинируемая стрелка U+20D7 ставится ПОСЛЕ символа)
out = out.replace(/\b\\?vec\s*\(\s*([A-Za-z\u0391-\u03C9])\s*\)/g, (_m, v) => `\u20D7${v}`);

  return out;
}

// ——— единая точка входа ———
export function applyMath(text: string): string {
  // порядок важен: степени -> индексы
  let out = applyMathPowers(text);
  out = applyMathSubscripts(out);
  out = applyMathMultiplication(out);
  out = applyMathDivision(out);
  out = applyMathEquality(out);
  out = applyMathSigns(out);
  out = applyMathConstants(out);
  out = applyMathOperators(out);

  out = protectMathMinus(out);
  return out;
}
