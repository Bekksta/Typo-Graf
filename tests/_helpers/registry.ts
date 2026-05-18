import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export type CaseStatus = "pass" | "fail";

export type CaseRecord = {
  module: string;
  rule: string;
  status: CaseStatus;
  input: string;
  expected: string;
  actual: string;
  mismatch: Array<{
    index: number;
    expected: string;
    expectedCode: string;
    actual: string;
    actualCode: string;
  }>;
};

const DIR = resolve(process.cwd(), "test-results");
const LOG_PATH = resolve(DIR, `_log-${process.pid}.jsonl`);
let inited = false;

function ensureDir(): void {
  if (inited) return;
  mkdirSync(DIR, { recursive: true });
  inited = true;
}

export function recordCase(rec: CaseRecord): void {
  ensureDir();
  appendFileSync(LOG_PATH, JSON.stringify(rec) + "\n", "utf-8");
}

function describeChar(ch: string | undefined): {
  text: string;
  code: string;
} {
  if (ch === undefined) return { text: "∅", code: "EOF" };
  const code = ch.codePointAt(0) ?? 0;
  return {
    text: ch,
    code: "U+" + code.toString(16).toUpperCase().padStart(4, "0"),
  };
}

export function charDiff(
  expected: string,
  actual: string
): CaseRecord["mismatch"] {
  const out: CaseRecord["mismatch"] = [];
  const max = Math.max(expected.length, actual.length);
  for (let i = 0; i < max; i++) {
    const e = expected[i];
    const a = actual[i];
    if (e !== a) {
      const ed = describeChar(e);
      const ad = describeChar(a);
      out.push({
        index: i,
        expected: ed.text,
        expectedCode: ed.code,
        actual: ad.text,
        actualCode: ad.code,
      });
      if (out.length >= 20) break;
    }
  }
  return out;
}
