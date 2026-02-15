import { Replacement } from "../types";
import { NBSP } from "../lang/maps";
import { makeNumberUnitRegex, NUM_UNIT } from "./shared";

export function rulesDE(text: string): Replacement[] {
  const reps: Replacement[] = [];
  const RE = makeNumberUnitRegex(NUM_UNIT.eu);

  text.replace(RE, (m, n, unit, offset) => {
    const start = offset + String(n).length;
    reps.push({
      start,
      end: start + 1,
      text: NBSP,
      reason: "de nbsp number+unit",
    });
    return m;
  });

  return reps;
}
