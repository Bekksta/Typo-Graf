import { Replacement } from "../types";
import { NBSP, NNBSP } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

export function rulesFR(text: string): Replacement[] {
  const reps: Replacement[] = [];
  const RE = makeNumberUnitRegex(NUM_UNIT.eu);

  // перед ; : ? ! — узкий NBSP
  text.replace(/\s*(;|:|\?|!)/g, (m, p, offset) => {
    // заменим весь матч на NNBSP + знак
    reps.push({
      start: offset,
      end: offset + m.length,
      text: NNBSP + p,
      reason: "fr thin nbsp before ;:?!",
    });
    return m;
  });

  // число + ед/валюта/% → узкий NBSP
  text.replace(RE, (m, n, unit, offset) => {
    const start = offset + String(n).length;
    reps.push({
      start,
      end: start + 1,
      text: NBSP,
      reason: "en nbsp number+unit",
    });
    return m;
  });

  return reps;
}
