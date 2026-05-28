// Равнодлинная маска URL/Email/брендов — индексы правил совпадают с оригиналом.
// КАЖДАЯ маска получает уникальный PUA-символ, чтобы unmask по placeholder
// не путал две маски с одинаковой длиной/символом.
// @ts-ignore esbuild/vite text-loader
import brandsRaw from "../dict/brands.txt";
import { escapeRegex } from "../utils/regexUtils";

export type Mask = { start: number; end: number; placeholder: string; value: string };

const PUA_START = 0xe000;
const PUA_END = 0xf8ff; // 6400 кодов — хватит на любой реалистичный узел

const URL_RE =
  /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z][\w+.-]*:\/\/[^\s]+)/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Версии: `v2.0.0-alpha`, `1.2.3`, `1.2.3-rc1`, `0.10-rc1`. Без маски
// `NUM_RANGE_RE` (common.ts) ловит «`2-3`»-подобные части и превращает в
// en-dash, ломая semver. Три альтернативы:
//   1) `v\d+(\.\d+)+(-…)?`        — явный префикс v.
//   2) `\d+(\.\d+){2,}(-…)?`      — 3+ части (1.2.3, 1.2.3.4-rc1).
//   3) `\d+\.\d+-[A-Za-z]\w*`     — 2 части + letter-starting suffix.
// `1.2-3` (две части + цифровой хвост) намеренно НЕ маскируется — без
// контекста неотличим от числового диапазона.
const VERSION_RE =
  /\b(?:v\d+(?:\.\d+)+(?:-[\w.]+)?|\d+(?:\.\d+){2,}(?:-[\w.]+)?|\d+\.\d+-[A-Za-z][\w.]*)\b/g;

// Бренды грузим один раз из brands.txt; сортируем по длине (от длинных к
// коротким), чтобы «Node.js» съел токен раньше, чем правило для «Node».
const BRANDS = (brandsRaw as string)
  .split("\n")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("#"))
  .sort((a, b) => b.length - a.length);

const BRAND_RE = BRANDS.length
  ? new RegExp(
      `(?<![\\p{L}\\p{N}])(?:${BRANDS.map(escapeRegex).join("|")})(?![\\p{L}\\p{N}])`,
      "gu"
    )
  : null;

export function maskSensitive(input: string): { masked: string; masks: Mask[] } {
  const masks: Mask[] = [];
  let out = input;

  const apply = (re: RegExp) => {
    out = out.replace(re, (m: string, ..._rest: unknown[]) => {
      const offset = _rest[_rest.length - 2] as number;
      const code = PUA_START + masks.length;
      if (code > PUA_END) {
        // Не должно случаться на реальных узлах. Защитный no-op.
        return m;
      }
      const placeholder = String.fromCharCode(code).repeat(m.length);
      masks.push({ start: offset, end: offset + m.length, placeholder, value: m });
      return placeholder;
    });
  };

  apply(URL_RE);
  apply(EMAIL_RE);
  apply(VERSION_RE);
  if (BRAND_RE) apply(BRAND_RE);
  return { masked: out, masks };
}

export function unmask(input: string, masks: Mask[]): string {
  if (!masks.length) return input;
  let out = input;
  for (const { placeholder, value } of masks) {
    out = out.split(placeholder).join(value);
  }
  return out;
}
