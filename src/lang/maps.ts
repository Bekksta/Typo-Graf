// Типографические константы общего назначения.
// Невидимые символы записаны через TS escape, чтобы исключить путаницу
// в исходнике (NBSP, NNBSP, TAB и т. п. визуально неотличимы от пробела).

export const NBSP = " ";
export const NNBSP = " ";
export const NBH = "‑"; // неразрывный дефис

export const EN_DASH = "–";
export const EM_DASH = "—";
export const ELLIPSIS = "…";

export const PRIME = "′";
export const DBL_PRM = "″";
export const L_DQ = "“";
export const R_DQ = "”";
export const L_SQ = "‘";
export const R_SQ = "’";

// Любой «пробельный» символ нашей типографики: space, NBSP, THIN, NNBSP, TAB.
export const SP_ANY_CLASS = /[    \t]/;
export const SP_ANY_SRC = "[ \\u00A0\\u2009\\u202F\\t]";
