import { Replacement } from "../types";

export function applyToString(input: string, repls: Replacement[]) {
  let s = input;
  const sorted = [...repls].sort((a, b) => a.start - b.start).reverse();
  for (const r of sorted) {
    s = s.slice(0, r.start) + r.text + s.slice(r.end);
  }
  return s;
}
