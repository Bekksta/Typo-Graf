// Чистит test-results/ перед прогоном и агрегирует JSONL-логи воркеров
// в один отчёт test-results/report.json после прогона.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

type CaseRecord = {
  module: string;
  rule: string;
  status: "pass" | "fail";
  input: string;
  expected: string;
  actual: string;
  mismatch: unknown[];
};

const DIR = resolve(process.cwd(), "test-results");
const REPORT = resolve(DIR, "report.json");

export default function setup() {
  try {
    rmSync(DIR, { recursive: true, force: true });
  } catch {
    /* noop */
  }
  mkdirSync(DIR, { recursive: true });

  return async () => {
    if (!existsSync(DIR)) return;
    const records: CaseRecord[] = [];
    for (const f of readdirSync(DIR)) {
      if (!f.startsWith("_log-") || !f.endsWith(".jsonl")) continue;
      const raw = readFileSync(resolve(DIR, f), "utf-8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          records.push(JSON.parse(trimmed) as CaseRecord);
        } catch {
          /* skip malformed */
        }
      }
    }

    const total = records.length;
    const passed = records.filter((r) => r.status === "pass").length;

    const byModule = new Map<string, Map<string, CaseRecord[]>>();
    for (const r of records) {
      if (!byModule.has(r.module)) byModule.set(r.module, new Map());
      const m = byModule.get(r.module)!;
      if (!m.has(r.rule)) m.set(r.rule, []);
      m.get(r.rule)!.push(r);
    }

    const modules = Array.from(byModule.entries())
      .map(([module, rules]) => {
        const rulesArr = Array.from(rules.entries())
          .map(([rule, cases]) => {
            const p = cases.filter((c) => c.status === "pass").length;
            return {
              rule,
              total: cases.length,
              passed: p,
              failed: cases.length - p,
              failures: cases.filter((c) => c.status === "fail"),
            };
          })
          .sort((a, b) => b.failed - a.failed || a.rule.localeCompare(b.rule));
        const totalN = rulesArr.reduce((s, r) => s + r.total, 0);
        const passN = rulesArr.reduce((s, r) => s + r.passed, 0);
        return {
          module,
          total: totalN,
          passed: passN,
          failed: totalN - passN,
          rules: rulesArr,
        };
      })
      .sort((a, b) => b.failed - a.failed || a.module.localeCompare(b.module));

    const report = {
      generatedAt: new Date().toISOString(),
      summary: { total, passed, failed: total - passed },
      modules,
    };
    writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf-8");

    // Печатаем короткую сводку в консоль — заодно сразу видно «топ-провалов».
    const lines: string[] = [];
    lines.push("");
    lines.push("─── Typo Graf diagnostic report ".padEnd(60, "─"));
    lines.push(
      `total: ${total}  passed: ${passed}  failed: ${total - passed}`
    );
    for (const m of modules) {
      if (!m.failed) continue;
      lines.push(`  [${m.module}] failed ${m.failed} / ${m.total}`);
      for (const r of m.rules.filter((r) => r.failed)) {
        lines.push(`    - ${r.rule}: ${r.failed} fail / ${r.total}`);
      }
    }
    lines.push(`report: ${REPORT}`);
    lines.push("─".repeat(60));
    // eslint-disable-next-line no-console
    console.log(lines.join("\n"));
  };
}
