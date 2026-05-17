import yoPairs from "../dict/yo-pairs.json";
import { preserveCase } from "../lib/commonCase";

// Ёфикация по белому списку (ТЗ §3.2.2).
// Каждое слово из словаря заменяется только если стоит как отдельное слово
// (нет соседних русских/латинских букв). Сохраняем регистр первой буквы.
const compiled: Array<{ re: RegExp; canon: string }> = (yoPairs as Array<[string, string]>).map(
  ([from, to]) => ({
    re: new RegExp(`(?<![A-Za-zА-Яа-яЁё])${from}(?![A-Za-zА-Яа-яЁё])`, "giu"),
    canon: to,
  })
);

export function applyYoFix(text: string): string {
  let out = text;
  for (const { re, canon } of compiled) {
    out = out.replace(re, (m) => preserveCase(canon, m, "first", "ru"));
  }
  return out;
}
