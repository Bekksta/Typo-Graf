import type { Replacement } from "../types";
import type { Mask } from "./mask";

/**
 * Классический LCS-дифф (O(n*m), но для текстовых узлов плагина хватает),
 * выдаёт непересекающиеся замены; ничего не "теряет".
 */
function lcsTable(a: string, b: string) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

function diffLCS(before: string, after: string): Replacement[] {
  const dp = lcsTable(before, after);
  const reps: Replacement[] = [];
  let i = 0, j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) { i++; j++; continue; }

    const start = i;
    // продвигаем, пока символы не синхронизируются
    const delStart = i, insStart = j;
    while (i < before.length && (j >= after.length || dp[i][j] === dp[i + 1]?.[j])) i++;
    while (j < after.length && (i >= before.length || dp[i][j] === dp[i]?.[j + 1])) j++;

    const delEnd = i;
    const insStr = after.slice(insStart, j);
    reps.push({ start, end: delEnd, text: insStr, reason: "lcs" });
  }

  // склейка смежных патчей
  const merged: Replacement[] = [];
  for (const r of reps) {
    const last = merged[merged.length - 1];
    if (last && last.end === r.start) { last.end = r.end; last.text += r.text; }
    else merged.push(r);
  }
  return merged;
}

/**
 * Дифф только по "свободным" сегментам (вне масок), чтобы не трогать URL/Email.
 */
export function diffEditsSegmented(beforeMasked: string, afterMasked: string, masks: Mask[]): Replacement[] {
  const ms = [...masks].sort((a,b)=>a.start-b.start);
  const free: Array<{ s: number; e: number }> = [];
  let p = 0;
  for (const m of ms) {
    if (p < m.start) free.push({ s: p, e: m.start });
    p = Math.max(p, m.end);
  }
  if (p < beforeMasked.length) free.push({ s: p, e: beforeMasked.length });

  const out: Replacement[] = [];
  for (const seg of free) {
    const b = beforeMasked.slice(seg.s, seg.e);
    const a = afterMasked.slice(seg.s,  seg.e);
    if (b === a) continue;
    const local = diffLCS(b, a);
    for (const r of local) out.push({ start: seg.s + r.start, end: seg.s + r.end, text: r.text, reason: r.reason });
  }
  return out;
}
