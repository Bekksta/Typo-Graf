// Типографические константы общего назначения.
// Невидимые символы записаны через TS escape, чтобы исключить путаницу
// в исходнике (NBSP, NNBSP, TAB и т. п. визуально неотличимы от пробела).

export const NBSP = " ";
export const NNBSP = " ";
export const NBH = "‑"; // неразрывный дефис

export const EN_DASH = "–";
export const EM_DASH = "—";
export const ELLIPSIS = "…";

// Word Joiner (U+2060) — невидимый zero-width неразрывный связыватель.
// Запрещает перенос строки в той точке, не оставляя следов в визуальном
// представлении. Используется для дат и числовых диапазонов с em-dash.
export const WORD_JOINER = "⁠";

export const PRIME = "′";
export const DOUBLE_PRIME = "″";
export const LEFT_DQUOTE = "“";
export const RIGHT_DQUOTE = "”";
export const LEFT_SQUOTE = "‘";
export const RIGHT_SQUOTE = "’";

// Любой «пробельный» символ нашей типографики: space, NBSP, THIN, NNBSP, TAB.
// _CLASS — regex literal для прямого использования (`ANY_SPACE_CLASS.test(ch)`).
// _SRC — строка для сборки regex через `new RegExp(...)`.
export const ANY_SPACE_CLASS = /[    \t]/;
export const ANY_SPACE_SRC = "[ \\u00A0\\u2009\\u202F\\t]";
