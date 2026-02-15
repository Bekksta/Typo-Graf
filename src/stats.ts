// stats.ts
// Подсчёт всех реальных замен во время применения правил.
// Идея: на время вызова шага временно перехватываем String.prototype.replace/replaceAll,
// подсчитываем число фактических замен, затем откатываем прототип.

export type ReplaceStats = { text: string; changes: number };

export function withReplaceCounter<T>(fn: () => T): { result: T; count: number } {
  const origReplace = String.prototype.replace;
  const origReplaceAll = (String.prototype as any).replaceAll;

  let count = 0;

  function countMatches(str: string, search: any): number {
    if (search instanceof RegExp) {
      const hasG = search.flags?.includes("g");
      const re = hasG ? search : new RegExp(search.source, search.flags + "g");
      const m = str.match(re);
      return m ? m.length : 0;
    } else if (typeof search === "string") {
      if (search === "") return 0;
      let from = 0, c = 0;
      for (;;) {
        const i = str.indexOf(search, from);
        if (i === -1) break;
        c++; from = i + search.length;
      }
      return c;
    }
    return 0;
  }

  (String.prototype as any).replace = function (search: any, replacer: any) {
    const before = String(this);
    const matches = countMatches(before, search);
    const out = origReplace.apply(this, [search, replacer]);
    if (matches > 0 && out !== before) count += matches;
    return out;
  };

  if (origReplaceAll) {
    (String.prototype as any).replaceAll = function (search: any, replacer: any) {
      const before = String(this);
      const matches = countMatches(before, search);
      const out = origReplaceAll.apply(this, [search, replacer]);
      if (matches > 0 && out !== before) count += matches;
      return out;
    };
  }

  try {
    const result = fn();
    return { result, count };
  } finally {
    String.prototype.replace = origReplace;
    if (origReplaceAll) (String.prototype as any).replaceAll = origReplaceAll;
  }
}

/**
 * Универсальный пайплайн с подсчётом замен.
 * common может возвращать string или { text: string, ... } — поддерживаем оба варианта.
 */
export function processTextWithStats(
  raw: string,
  langProc: (s: string) => string,
  fns: {
    mask: (s: string) => { masked: string; parts: any };
    unmask: (s: string, parts: any) => string;
    math: (s: string) => string;
    common: (s: string) => string | { text: string };
    // units: (s: string) => string;
  }
): ReplaceStats {
  const { mask, unmask, math, common } = fns;

  const { masked, parts } = mask(raw);

  const mathRes   = withReplaceCounter(() => math(masked));
  let accText     = mathRes.result;
  let accChanges  = mathRes.count;

  const commonRes = withReplaceCounter(() => common(accText));
  accText         = (commonRes.result as any).text ?? commonRes.result;
  accChanges     += commonRes.count;

  const langRes   = withReplaceCounter(() => langProc(accText));
  accText         = langRes.result as string;
  accChanges     += langRes.count;

  // const unitsRes  = withReplaceCounter(() => units(accText));
  // accText         = unitsRes.result as string;
  // accChanges     += unitsRes.count;

  const finalText = unmask(accText, parts);
  return { text: finalText, changes: accChanges };
}
