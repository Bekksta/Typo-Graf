import yoPairs from "../dict/yo-pairs.json";
import { Replacement } from "../types";

export function applyYoPairs(text: string): Replacement[] {
  const reps: Replacement[] = [];
  for (const [from, to] of yoPairs) {
    const re = new RegExp(`(?<![А-Яа-яЁё])${from}(?![А-Яа-яЁё])`, "g");
    text.replace(re, (m, offset) => {
      reps.push({
        start: offset,
        end: offset + m.length,
        text: to,
        reason: "yo",
      });
      return m;
    });
  }
  return reps;
}
