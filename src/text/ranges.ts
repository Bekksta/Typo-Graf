// src/text/ranges.ts
import { Replacement } from "../types";

function sanitize(reps: Replacement[], textLength: number): Replacement[] {
  const v = reps
    .map((r) => ({
      start: Math.max(0, Math.min(textLength, Number((r as any).start))),
      end: Math.max(0, Math.min(textLength, Number((r as any).end))),
      text: String(r.text ?? ""),
      reason: r.reason ?? "",
    }))
    .filter(
      (r) =>
        Number.isFinite(r.start) &&
        Number.isFinite(r.end) &&
        r.end >= r.start
    );
  return v.sort((a, b) => a.start - b.start).reverse(); // справа-налево
}

export function applyReplacements(node: TextNode, replacements: Replacement[]) {
  if (!replacements?.length) return;
  const sorted = sanitize(replacements, node.characters.length);
  for (const r of sorted) {
    // если нет изменений — пропускаем
    if (r.start === r.end && r.text === "") continue;

    // удаляем и вставляем (NBSP/NNBSP сохраняются как есть)
    const insert = (r.text || "").replace(/[\uE000-\uF8FF]/g, ""); // маски-заменители — вон
    if (r.start !== r.end) node.deleteCharacters(r.start, r.end);
    if (insert) node.insertCharacters(r.start, insert);
  }
}
