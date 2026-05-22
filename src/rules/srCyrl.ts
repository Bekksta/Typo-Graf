// rules/srCyrl.ts — српска ћирилица (Serbian Cyrillic) typography.
// Похоже на ru, НО:
// - Кавычки „…" (как в bcs), а не «…».
// - Нет ёфикации (буквы «ё» в сербском алфавите нет).
// - Остальные правила (предлоги, инициалы, em-dash, единицы) — как ru.
//
// Реализация повторно использует уже отлаженные блоки ru-правил
// и просто заменяет smart-quotes на „…".
import { applyRussianRules } from "./ru";
import { NBSP, ANY_SPACE_SRC } from "../lang/maps";

// Заменяем ёлочки «…», поставленные ru-обработчиком, на „…" (открывающая
// нижняя, закрывающая верхняя — стандартная сербская типографика).
// Делается ПОСЛЕ ru-rules, чтобы не дублировать всю их логику.
function replaceQuotesWithSrStyle(text: string): string {
  // «X» → „X"
  // Чередуем только то, что уже расставлено как «»; ASCII кавычки уже
  // нормализованы внутри smartQuotesRu.
  let out = "";
  for (const ch of text) {
    if (ch === "«") out += "„";
    else if (ch === "»") out += "”";
    else out += ch;
  }
  return out;
}

export function applySerbianCyrillicRules(input: string): string {
  // Прогоняем ru-правила БЕЗ ёфикации (yoFix: false), затем перекавычиваем
  // ёлочки «…» в сербские „…".
  let t = applyRussianRules(input, { yoFix: false });
  t = replaceQuotesWithSrStyle(t);
  return t;
}
