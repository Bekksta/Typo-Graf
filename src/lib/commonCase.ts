// src/lib/commonCase.ts
const FIRST_LETTER_RE = /\p{L}/u;

export type CaseMode = "first" | "all" | "title";

export function preserveCase(
  canon: string,
  sample: string,
  mode: CaseMode = "first",
  locale = "ru"
): string {
  const m = sample.trim().match(FIRST_LETTER_RE);
  if (!m) return canon;
  const firstSample = m[0];

  const isLetter = firstSample.toLocaleUpperCase(locale) !== firstSample.toLocaleLowerCase(locale);
  const isUpper  = isLetter && firstSample === firstSample.toLocaleUpperCase(locale);
  const isAllCaps = sample === sample.toLocaleUpperCase(locale);

  if ((mode === "first" || mode === "title") && isUpper) {
    const i = canon.search(FIRST_LETTER_RE);
    if (i === -1) return canon;
    const firstCanon = canon[i].toLocaleUpperCase(locale);
    return canon.slice(0, i) + firstCanon + canon.slice(i + 1);
  }

  if (mode === "all" && isAllCaps) {
    return canon.replace(/\p{L}/gu, ch => ch.toLocaleUpperCase(locale));
  }

  return canon;
}
