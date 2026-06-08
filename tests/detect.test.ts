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
  test("italian markers (ò/ì grave — Italian-only)", () =>
    expectLang("it", "Però è bellissimo a Roma", "it"));
  test("polish markers (ąęłńżźć)", () =>
    expectLang("pl", "Cześć, jak się masz?", "pl"));
  test("portuguese markers (ã/õ unique)", () =>
    expectLang("pt", "São Paulo é uma cidade enorme", "pt"));
  test("dutch markers (frequent words)", () =>
    expectLang("nl", "Het is een mooie dag", "nl"));
  test("serbian Cyrillic markers (ђћјљњ)", () =>
    expectLang("sr-Cyrl", "Љубав је највећа", "sr-Cyrl"));
});

describe("detect: es-strong vs fr (overlap on é/è/à...)", () => {
  test("'Él dijo en español' → es (ñ — strong es marker)", () =>
    expectLang("esVsFr", "Él dijo en español", "es"));
  test("'Cómo estás?' → es (¿/¡ или ñ перевешивают)", () =>
    expectLang("esVsFrPunct", "Cómo estás? Él respondió.", "es"));
  test("'café français' (без es-маркеров) → fr", () =>
    expectLang("frPure", "café français est bon", "fr"));
});

describe("detect: word-list scoring catches ambiguous cases", () => {
  test("italian without ò/ì but with 'perché' — это it", () =>
    expectLang("itWords", "Andiamo perché è bello a casa", "it"));
  test("dutch without diacritics — 'Het is een' выигрывает", () =>
    expectLang("nlWords", "Het is een mooie dag", "nl"));
  test("'der die das und' — это de даже без ä/ö/ü/ß", () =>
    expectLang("deWords", "der Mann und die Frau", "de"));
  test("'jest się że' — pl", () =>
    expectLang("plWords", "to jest tylko ten przykład", "pl"));
  // Smoke-test v1.0.2 #L7: эти кейсы раньше отдавались fr/es, потому что
  // `la`/`le` (fr) и `el`/`son` (es) перевешивали единственное IT-слово `sono`.
  test("italian 'Abbiamo lanciato' (verb -iamo) — это it (не fr)", () =>
    expectLang(
      "itAbbiamo",
      "Abbiamo lanciato un nuovo servizio per la casa intelligente. Tutti i diritti riservati.",
      "it"
    ));
  test("italian 'Il Dott./Sig.' (honorifics) — это it (не fr)", () =>
    expectLang(
      "itHonorifics",
      "Il Dott. Rossi e il Sig. Bianchi aprirono un piccolo museo.",
      "it"
    ));
});

describe("detect: mixed scripts — dominant wins", () => {
  test("основной текст английский + одно русское слово → en", () =>
    expectLang("dominantEn", "It is awesome, but мир exists", "en"));
  test("основной текст русский + одно англ. слово → ru", () =>
    expectLang("dominantRu", "Привет, hello, как дела?", "ru"));
  test("равное количество → кириллица побеждает (практичный дефолт)", () =>
    expectLang("tieCyr", "ru ru ru en en en", "en"));
});

describe("detect: fallbacks", () => {
  test("digits-only → ru (per TZ)", () =>
    expectLang("fallback", "12345", "ru"));
});
