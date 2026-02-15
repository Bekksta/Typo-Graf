import { Replacement } from "../types";
import { NBSP, NNBSP } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

export function rulesUK(text: string): Replacement[] {
  const reps: Replacement[] = [];
  const RE = makeNumberUnitRegex(NUM_UNIT.eu);

  // Короткі прийменники 1–2 символи → NBSP
  text.replace(/\b(в|у|з|із|й|та)\s+(?=\p{L})/giu, (m, w, offset) => {
    const start = offset + w.length;
    reps.push({ start, end: start + 1, text: NBSP, reason: "uk short prep" });
    return m;
  });

  // №/§/стор./рис./м. + слово/число → узький NBSP
  text.replace(/\b(№|§|стор\.|рис\.|м\.)\s+/g, (m, token, offset) => {
    const start = offset + token.length;
    reps.push({
      start,
      end: start + 1,
      text: NNBSP,
      reason: "uk thin nbsp after token",
    });
    return m;
  });

  // число + од./валюта/% → NNBSP
  text.replace(RE, (m, n, unit, offset) => {
    const start = offset + String(n).length;
    reps.push({
      start,
      end: start + 1,
      text: NNBSP,
      reason: "uk thin nbsp number+unit",
    });
    return m;
  });

  return reps;
}
