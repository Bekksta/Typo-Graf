import { expect } from "vitest";
import { recordCase, charDiff } from "./registry";

export type RunFn = (input: string) => string;

/**
 * Прогоняет `input` через `run`, сверяет с `expected`, в случае
 * расхождения дописывает запись в JSON-репорт и кидает падение через expect.
 *
 * `module` — обычно имя файла правила (ru, en, common, math, …).
 * `rule`   — короткий тег конкретной фичи (initials, smartQuotes, …).
 */
export function expectTransform(
  module: string,
  rule: string,
  input: string,
  expected: string,
  run: RunFn
): void {
  const actual = run(input);
  const status = actual === expected ? "pass" : "fail";
  recordCase({
    module,
    rule,
    status,
    input,
    expected,
    actual,
    mismatch: status === "fail" ? charDiff(expected, actual) : [],
  });
  expect(actual, `[${module}/${rule}] input=${JSON.stringify(input)}`).toBe(
    expected
  );
}
