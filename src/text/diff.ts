import type { Replacement } from "../types";
import type { Mask } from "./mask";

/**
 * Классический LCS-дифф (O(n·m) по времени и памяти).
 * Использует Uint32Array для экономии памяти.
 */
export function diffLCS(before: string, after: string): Replacement[] {
  const n = before.length;
  const m = after.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ start: 0, end: 0, text: after, reason: "lcs" }];
  if (m === 0) return [{ start: 0, end: n, text: "", reason: "lcs" }];

  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const idx = i * w + j;
      if (before.charCodeAt(i) === after.charCodeAt(j)) {
        dp[idx] = dp[(i + 1) * w + (j + 1)] + 1;
      } else {
        const a = dp[(i + 1) * w + j];
        const b = dp[i * w + (j + 1)];
        dp[idx] = a > b ? a : b;
      }
    }
  }

  const reps: Replacement[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && before.charCodeAt(i) === after.charCodeAt(j)) {
      i++;
      j++;
      continue;
    }
    const start = i;
    const insStart = j;

    while (i < n && (j >= m || dp[i * w + j] === dp[(i + 1) * w + j])) i++;
    while (j < m && (i >= n || dp[i * w + j] === dp[i * w + (j + 1)])) j++;

    reps.push({
      start,
      end: i,
      text: after.slice(insStart, j),
      reason: "lcs",
    });
  }

  // склейка смежных патчей
  const merged: Replacement[] = [];
  for (const r of reps) {
    const last = merged[merged.length - 1];
    if (last && last.end === r.start) {
      last.end = r.end;
      last.text += r.text;
    } else {
      merged.push(r);
    }
  }
  return merged;
}

/** Свободные сегменты вне масок. */
export type FreeSegment = { start: number; end: number; text: string };

export function extractFreeSegments(
  masked: string,
  masks: Mask[]
): FreeSegment[] {
  const ms = [...masks].sort((a, b) => a.start - b.start);
  const out: FreeSegment[] = [];
  let p = 0;
  for (const m of ms) {
    if (p < m.start) {
      out.push({ start: p, end: m.start, text: masked.slice(p, m.start) });
    }
    p = Math.max(p, m.end);
  }
  if (p < masked.length) {
    out.push({ start: p, end: masked.length, text: masked.slice(p) });
  }
  return out;
}
