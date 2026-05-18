import { describe, test, expect } from "vitest";
import { detectLanguage } from "../src/lang/detect";
import { recordCase } from "./_helpers/registry";

const M = "detect";
function expectLang(rule: string, input: string, expected: string): void {
  const actual = detectLanguage(input);
  const status = actual === expected ? "pass" : "fail";
  recordCase({
    module: M,
    rule,
    status,
    input,
    expected,
    actual,
    mismatch:
      status === "fail"
        ? [
            {
              index: 0,
              expected,
              expectedCode: "lang",
              actual,
              actualCode: "lang",
            },
          ]
        : [],
  });
  expect(actual, `[detect/${rule}] input=${JSON.stringify(input)}`).toBe(
    expected
  );
}

describe("detect: cyrillic", () => {
  test("plain ru text", () =>
    expectLang("cyrRu", "Привет, как дела?", "ru"));
  test("ukrainian markers", () =>
    expectLang("uk", "Я працюю у Києві", "uk"));
});

describe("detect: latin scripts", () => {
  test("plain en text", () =>
    expectLang("en", "Hello world", "en"));
  test("french diacritics", () =>
    expectLang("fr", "Ça va très bien", "fr"));
  test("german diacritics", () =>
    expectLang("de", "Schöne Grüße", "de"));
  test("spanish markers", () =>
    expectLang("es", "¿Cómo estás? Muy bien", "es"));
  test("bcs diacritics", () =>
    expectLang("bcs", "Čokolada je slatka", "bcs"));
});

describe("detect: fallbacks", () => {
  test("digits-only → ru (per TZ)", () =>
    expectLang("fallback", "12345", "ru"));
});
