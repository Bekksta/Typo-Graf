import { preserveCase } from "../utils/caseUtils";
// eyo-safe.txt — словарь «безопасных» ёфикаций из e2yo/eyo-kernel (MIT).
// Подтягивается esbuild'ом через --loader:.txt=text, разворачивается
// в Map при инициализации модуля.
// Формат: <base>(suf1|suf2|...) [# комментарий]
// Префикс '_' — спорные / не-safe, пропускаем.
// @ts-ignore — text-loader esbuild возвращает строку.
import safeText from "../dict/eyo-safe.txt";

// without-yo (lowercase) → canonical with-yo (lowercase)
const YO_MAP = (() => {
  const map = new Map<string, string>();
  for (let line of (safeText as string).split("\n")) {
    line = line.split("#")[0].trim();
    if (!line || line.startsWith("_")) continue;
    const m = line.match(/^([^(]+)\(([^)]*)\)\s*$/);
    const forms = m
      ? m[2].split("|").map((suf) => m[1] + suf)
      : [line];
    for (const form of forms) {
      if (!/[ёЁ]/.test(form)) continue;
      const key = form.toLowerCase().replace(/ё/g, "е");
      map.set(key, form.toLowerCase());
    }
  }
  return map;
})();

// Захватываем кириллические слова целиком, чтобы не задеть соседние буквы
// и не путать с латиницей (бывают смешанные слои).
const WORD_RE = /[А-Яа-яЁё]+/g;

export function applyYoFix(text: string): string {
  return text.replace(WORD_RE, (word) => {
    const key = word.toLowerCase().replace(/ё/g, "е");
    const canon = YO_MAP.get(key);
    if (!canon) return word;
    return preserveCase(canon, word, "first", "ru");
  });
}
