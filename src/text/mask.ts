// src/text/mask.ts
// Равнодлинная маска URL/Email — индексы правил совпадают с оригиналом
export type Mask = { start: number; end: number; placeholder: string; value: string };

const PUA_START = 0xe000; // приватная плоскость Юникода

const URL_RE =
  /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z][\w+.-]*:\/\/[^\s]+)/gi;
const EMAIL_RE =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export function maskSensitive(input: string) {
  const masks: Mask[] = [];
  let out = input;
  let i = 0;

  const apply = (re: RegExp) => {
    out = out.replace(re, (m: string, ...rest: any[]) => {
      const offset: number = rest[rest.length - 2]; // last-but-one is index from .replace
      const ch = String.fromCharCode(PUA_START + (i % 512));
      const placeholder = ch.repeat(m.length); // ВАЖНО: та же длина, что и оригинал
      masks.push({ start: offset, end: offset + m.length, placeholder, value: m });
      i++;
      return placeholder;
    });
  };

  apply(URL_RE);
  apply(EMAIL_RE);
  return { masked: out, masks };
}

export function unmask(input: string, masks: Mask[]): string {
  let out = input;
  for (const { placeholder, value } of masks) {
    const re = new RegExp(placeholder.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
    out = out.replace(re, value);
  }
  return out;
}
