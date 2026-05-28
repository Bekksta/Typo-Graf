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
    /(\S)\s*\^\s*([A-Za-zА-яЁё0-9+\-−]+)/g,
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
    /(\S)\s*_\s*([A-Za-zА-яЁё0-9\-−]{1,3})(?=(?:\s|[+\-−*/=,.;:()])|$)/g,
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

function applyMathMultiplication(text: string): string {
  let out = text;

  // 1. * → ·  (не трогаем **жирный**)
  out = out.replace(/(?<!\*)\*(?!\*)/g, "·");

  // 2. Привести все варианты точек к стандартной средней
  out = out.replace(/[•⋅]/g, "·");

  // 3. Нормализуем пробелы вокруг средней точки между «символьными»
  //    токенами. Делаем в два шага, иначе цепочка `a·b·c` после одного
  //    прохода застревает на `a · b·c` (regex non-overlapping съедает `b`).
  const SYM = "A-Za-zА-яЁё0-9⁰-₟ʰ-˿ᴬ-ᵿ";
  out = out.replace(/[ \t]*·[ \t]*/g, "·"); // схлопнуть пробелы вокруг ·
  out = out.replace(
    new RegExp(`([${SYM}])·(?=[${SYM}])`, "g"),
    "$1 · "
  );

  return out;
}

function applyMathDivision(text: string): string {
  let out = text;

  const SYM = "A-Za-zА-яЁё0-9⁰-₟ʰ-˿ᴬ-ᵿ";

  // 1) Короткие дроби → юникодные "vulgar fractions"
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

  // 2) Явный знак деления ÷ — пробелы вокруг
  out = out.replace(
    new RegExp(`([${SYM}])\\s*÷\\s*([${SYM}])`, "g"),
    "$1 ÷ $2"
  );

  // 3) Обычное деление "/" — пробелы вокруг между «символьными» токенами
  out = out.replace(
    new RegExp(`([${SYM}])\\s*\\/\\s*([${SYM}])`, "g"),
    "$1 / $2"
  );

  // 4) Плюс внутри скобок: (a+b) → (a + b)
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

  const SYM = "A-Za-zА-яЁё0-9⁰-₟ʰ-˿ᴬ-ᵿ";

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

  // 4) Пробелы вокруг ≈ и ≃
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

  out = out.replace(/\bsqrt\s*\(\s*([^)]+)\s*\)/gi, "√$1");
  // 'pi' конвертим только в нижнем регистре: 'Pi' может быть началом
  // предложения или именем собственным в любом из 7 языков.
  out = out.replace(/\bpi\b/g, "π");
  out = out.replace(/\binf\b/gi, "∞");
  out = out.replace(/\b(sum|Σ)\b/g, "Σ");
  out = out.replace(/\bintegral\b/gi, "∫");

  // \alpha -> α
  out = out.replace(
    /\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/gi,
    (_m, name: string) => GREEK_MAP[name.toLowerCase()] || _m
  );

  return out;
}

function applyMathOperators(text: string): string {
  let out = text;

  // 1) sin/cos (...) → sin x / cos x
  out = out.replace(/\b(sin|cos)\s*\(\s*([^)]+?)\s*\)/gi, (_m, f, arg) => `${f} ${arg}`);

  // 2) log с основанием: log10(x) → log₁₀ x
  out = out.replace(
    /\blog\s*([0-9]+)\s*\(\s*([^)]+?)\s*\)/gi,
    (_m, base, arg) => `log${toSubscriptAll(base)} ${arg}`
  );
  // обычный log(x) → log x
  out = out.replace(/\blog\s*\(\s*([^)]+?)\s*\)/gi, (_m, arg) => `log ${arg}`);

  // 3) lim(x→0) → limₓ→₀
  out = out.replace(
    /\blim\s*\(\s*([A-Za-z])\s*→\s*([^)]+?)\s*\)/g,
    (_m, v, to) => `lim${toSubscriptAll(v)}→${toSubscriptAll(asciiMinusToUnicode(to))}`
  );

  // 4) Сигма с верхним/нижним пределом
  out = out.replace(
    /∑\s*_\s*\(\s*([A-Za-z])\s*=\s*([^)]+?)\s*\)\s*\^\s*([A-Za-z0-9]+)\s*/g,
    (_m, v, from, to) =>
      `∑${toSubscriptAll(`${v}=${asciiMinusToUnicode(from)}`)}${toSuperscriptAll(to)} `
  );
  out = out.replace(
    /∑\s*_\s*\(\s*([A-Za-z])\s*=\s*([^)]+?)\s*\)/g,
    (_m, v, from) =>
      `∑${toSubscriptAll(`${v}=${asciiMinusToUnicode(from)}`)}`
  );

  // 5) vec(a) → a⃗  (combining arrow U+20D7 ставится ПОСЛЕ символа).
  // Исправлено: было `\b\?vec` — `\b` перед опциональным '\' проверял word-boundary
  // относительно backslash (не word-char) и работал некорректно. Стрелка ставилась ДО буквы.
  out = out.replace(
    /(?:\\vec|\bvec)\s*\(\s*([A-Za-zΑ-ω])\s*\)/g,
    (_m, v) => `${v}⃗`
  );

  return out;
}

// ——— единая точка входа ———
export function applyMath(text: string): string {
  let out = applyMathPowers(text);
  out = applyMathSubscripts(out);
  out = applyMathMultiplication(out);
  out = applyMathDivision(out);
  out = applyMathEquality(out);
  out = applyMathSigns(out);
  out = applyMathConstants(out);
  out = applyMathOperators(out);
  return out;
}
