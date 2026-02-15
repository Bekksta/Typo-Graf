import { Language } from '../types';


export const QUOTES: Record<Language, { open: string; close: string; singleOpen?: string; singleClose?: string; frGuillemets?: boolean; narrowInner?: boolean; }>
= {
ru: { open: '«', close: '»' },
en: { open: '“', close: '”', singleOpen: '‘', singleClose: '’' },
fr: { open: '«', close: '»', frGuillemets: true, narrowInner: true },
es: { open: '“', close: '”' },
de: { open: '„', close: '“' },
uk: { open: '«', close: '»' },
bcs:{ open: '„', close: '“' }
};


export const LANG_LABEL: Record<Language, string> = {
  ru: "русский",
  en: "английский",
  fr: "французский",
  de: "немецкий",
  es: "испанский",
  uk: "украинский",
  bcs: "боснийско-хорватско-сербский",
};


export const NNBSP = '\u202F';
export const NBSP = "\u00A0";
export const NBH = "\u2011"; // неразрывный дефис

// export const EN_DASH = "–";
// export const EM_DASH = "—";
// export const ELLIPSIS = "…";

export const EN_DASH = "\u2013";
export const EM_DASH = "\u2014";
export const ELLIPSIS = "\u2026";

export const SP_ANY_CLASS = /[ \u00A0\u2009\u202F\t]/;
export const SP_ANY_SRC = "[ \\u00A0\\u2009\\u202F\\t]";

export const THIN = "\u2009";
export const PRIME   = "\u2032"; // ′
export const DBL_PRM = "\u2033"; // ″
export const L_DQ = "\u201C";    // “
export const R_DQ = "\u201D";    // ”
export const L_SQ = "\u2018";    // ‘
export const R_SQ = "\u2019";    // ’ (apostrophe/closing single)