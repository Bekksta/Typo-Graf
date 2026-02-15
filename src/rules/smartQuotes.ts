import { Language, Replacement } from "../types";
import { QUOTES, NNBSP } from "../lang/maps";

// Простой, но безопасный балансер кавычек: заменяем прямые " и ' на локальные.
// Апостроф внутри слова не трогаем: O'Neill, l'amour.

export function smartQuotes(text: string, lang: Language): Replacement[] {
  const reps: Replacement[] = [];
  const {
    open,
    close,
    singleOpen = "‘",
    singleClose = "’",
    frGuillemets,
    narrowInner,
  } = QUOTES[lang];

  let depthD = 0; // двойные
  let depthS = 0; // одиночные

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      const isOpen = depthD % 2 === 0;
      const rep = isOpen ? open : close;
      reps.push({ start: i, end: i + 1, text: rep, reason: "smart quotes" });
      depthD++;
    } else if (ch === "'") {
      const prev = text[i - 1];
      const next = text[i + 1];
      const isApostrophe =
        /\p{L}/u.test(prev ?? "") && /\p{L}/u.test(next ?? "");
      if (isApostrophe) continue;
      const isOpen = depthS % 2 === 0;
      const rep = isOpen ? singleOpen : singleClose;
      reps.push({
        start: i,
        end: i + 1,
        text: rep,
        reason: "smart single quotes",
      });
      depthS++;
    }
  }

  // FR: добавить узкий NBSP внутри « … »
  if (lang === "fr" && narrowInner) {
    const re = /«(\S)([^»]*?)(\S)»/g;
    text.replace(re, (m, a, mid, b, offset) => {
      reps.push({
        start: offset + 1,
        end: offset + 1,
        text: NNBSP,
        reason: "fr inner thin nbsp",
      });
      reps.push({
        start: offset + m.length - 1,
        end: offset + m.length - 1,
        text: NNBSP,
        reason: "fr inner thin nbsp",
      });
      return m;
    });
  }

  return reps;
}
