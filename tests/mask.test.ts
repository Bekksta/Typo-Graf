import { describe, test, expect } from "vitest";
import { maskSensitive, unmask } from "../src/text/mask";
import { recordCase } from "./_helpers/registry";

const M = "mask";

function record(
  rule: string,
  status: "pass" | "fail",
  input: string,
  expected: string,
  actual: string
): void {
  recordCase({
    module: M,
    rule,
    status,
    input,
    expected,
    actual,
    mismatch: [],
  });
}

describe("mask: URLs", () => {
  test("https URL is replaced with same-length placeholder", () => {
    const input = "see https://example.com/foo for info";
    const { masked, masks } = maskSensitive(input);
    const ok =
      masked.length === input.length &&
      masks.length === 1 &&
      masks[0].value === "https://example.com/foo";
    record(
      "urlMask",
      ok ? "pass" : "fail",
      input,
      "[url masked same length, 1 mask]",
      `len=${masked.length}, masks=${masks.length}, value=${masks[0]?.value}`
    );
    expect(ok).toBe(true);
  });

  test("unmask restores original", () => {
    const input = "a https://example.com b";
    const { masked, masks } = maskSensitive(input);
    const restored = unmask(masked, masks);
    const ok = restored === input;
    record("unmaskUrl", ok ? "pass" : "fail", input, input, restored);
    expect(restored).toBe(input);
  });
});

describe("mask: emails", () => {
  test("email masked with same length", () => {
    const input = "send to foo@bar.com today";
    const { masked, masks } = maskSensitive(input);
    const ok =
      masked.length === input.length &&
      masks.length === 1 &&
      masks[0].value === "foo@bar.com";
    record(
      "emailMask",
      ok ? "pass" : "fail",
      input,
      "[email masked same length, 1 mask]",
      `len=${masked.length}, masks=${masks.length}, value=${masks[0]?.value}`
    );
    expect(ok).toBe(true);
  });
});

describe("mask: multiple", () => {
  test("two URLs get distinct placeholders", () => {
    const input = "a https://aaa.com and https://bbb.com";
    const { masked, masks } = maskSensitive(input);
    const ok =
      masks.length === 2 &&
      masks[0].placeholder !== masks[1].placeholder &&
      masked.length === input.length;
    record(
      "distinct",
      ok ? "pass" : "fail",
      input,
      "[two distinct placeholders, same total length]",
      `masks=${masks.length}, lenMatches=${masked.length === input.length}`
    );
    expect(ok).toBe(true);
  });
});
