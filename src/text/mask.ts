// Равнодлинная маска URL/Email — индексы правил совпадают с оригиналом.
// КАЖДАЯ маска получает уникальный PUA-символ, чтобы unmask по placeholder
// не путал две маски с одинаковой длиной/символом.
export type Mask = { start: number; end: number; placeholder: string; value: string };

const PUA_START = 0xe000;
const PUA_END = 0xf8ff; // 6400 кодов — хватит на любой реалистичный узел

const URL_RE =
  /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z][\w+.-]*:\/\/[^\s]+)/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

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
