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

describe("mask: versions (opaque-token защита от NUM_RANGE_RE)", () => {
  function maskedValues(input: string): string[] {
    const { masks } = maskSensitive(input);
    return masks.map((m) => m.value);
  }

  test("v2.0.0-alpha маскируется целиком", () => {
    const got = maskedValues("Releasing v2.0.0-alpha now");
    record(
      "verV",
      got.includes("v2.0.0-alpha") ? "pass" : "fail",
      "Releasing v2.0.0-alpha now",
      "[v2.0.0-alpha masked]",
      JSON.stringify(got)
    );
    expect(got).toContain("v2.0.0-alpha");
  });

  test("1.2.3 (semver, 3 parts) маскируется", () => {
    const got = maskedValues("Version 1.2.3 shipped");
    expect(got).toContain("1.2.3");
  });

  test("0.10-rc1 (2 parts + letter suffix) маскируется", () => {
    const got = maskedValues("tag 0.10-rc1");
    expect(got).toContain("0.10-rc1");
  });

  test("1.2.3-rc1 (3+ parts + suffix) маскируется", () => {
    const got = maskedValues("Tag 1.2.3-rc1");
    expect(got).toContain("1.2.3-rc1");
  });

  test("3.14 (decimal) НЕ маскируется", () => {
    const got = maskedValues("pi ≈ 3.14");
    expect(got).not.toContain("3.14");
  });

  test("1.2 (2 parts only) НЕ маскируется", () => {
    const got = maskedValues("Price 1.2 USD");
    expect(got).not.toContain("1.2");
  });

  test("1.2-3 (2 parts + digit-only suffix) НЕ маскируется — ambiguous", () => {
    const got = maskedValues("range 1.2-3");
    expect(got).not.toContain("1.2-3");
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
