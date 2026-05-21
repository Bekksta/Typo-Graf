// Повторяет логику main.ts.transformSegment + planReplacements,
// но без Figma API (никаких deleteCharacters/insertCharacters).
// Используется в интеграционных тестах, чтобы проверять, что
// маскирование URL/email и многопроходный пайплайн работают в связке.

import { applyCommonRules } from "../../src/rules/common";
import { applyMath } from "../../src/rules/math";
import { applyRussianRules } from "../../src/rules/ru";
import { applyEnglishRules } from "../../src/rules/en";
import { applyFrenchRules } from "../../src/rules/fr";
import { applyUkrainianRules } from "../../src/rules/uk";
import { applyGermanRules } from "../../src/rules/de";
import { applySpanishRules } from "../../src/rules/es";
import { applyBCSRules } from "../../src/rules/bcs";
import { applyItalianRules } from "../../src/rules/it";
import { applyPolishRules } from "../../src/rules/pl";
import { applyPortugueseRules } from "../../src/rules/pt";
import { applyDutchRules } from "../../src/rules/nl";
import { applySerbianCyrillicRules } from "../../src/rules/srCyrl";
import { detectLanguage } from "../../src/lang/detect";
import { maskSensitive, unmask } from "../../src/text/mask";
import { extractFreeSegments } from "../../src/text/diff";
import type { Language } from "../../src/types";

const PIPELINE_MAX_PASSES = 3;

type LangProc = (s: string) => string;
const NOOP: LangProc = (s) => s;

function langProc(lang: Language): LangProc {
  switch (lang) {
    case "ru":
      return applyRussianRules;
    case "en":
      return applyEnglishRules;
    case "fr":
      return applyFrenchRules;
    case "uk":
      return applyUkrainianRules;
    case "de":
      return applyGermanRules;
    case "es":
      return applySpanishRules;
    case "bcs":
      return applyBCSRules;
    case "it":
      return applyItalianRules;
    case "pl":
      return applyPolishRules;
    case "pt":
      return applyPortugueseRules;
    case "nl":
      return applyDutchRules;
    case "sr-Cyrl":
      return applySerbianCyrillicRules;
    default:
      return NOOP;
  }
}

function transformSegment(text: string, lang: Language): string {
  const proc = langProc(lang);
  // NFC + CRLF→LF (зеркалит прод-пайплайн).
  let prev = text.normalize("NFC").replace(/\r\n?/g, "\n");
  for (let i = 0; i < PIPELINE_MAX_PASSES; i++) {
    let s = applyMath(prev);
    s = applyCommonRules(s);
    s = proc(s);
    if (s === prev) return s;
    prev = s;
  }
  return prev;
}

/**
 * Прогоняет полный пайплайн: detect → mask → segments → rules → unmask.
 * Если `lang` явно задан — пропускает detect.
 */
export function runPipeline(input: string, lang?: Language): string {
  const { masked, masks } = maskSensitive(input);
  // Детект ПОСЛЕ маскирования — иначе латиница URL/email перевешивает.
  const language = lang ?? detectLanguage(masked);
  const segments = extractFreeSegments(masked, masks);

  // Собираем результат, чередуя свободные сегменты и оригинальные маски.
  // Гарантируем, что маска (URL/email) приходит в выходную строку нетронутой
  // — это эквивалентно тому, что делает applyReplacements + unmask в проде.
  const sortedMasks = [...masks].sort((a, b) => a.start - b.start);
  let cursor = 0;
  let out = "";
  let segIdx = 0;
  while (cursor < masked.length) {
    const seg = segments[segIdx];
    const mask = sortedMasks.find((m) => m.start === cursor);
    if (mask) {
      out += mask.value;
      cursor = mask.end;
    } else if (seg && seg.start === cursor) {
      // Зеркалим прод-логику: если за сегментом идёт маска — добавляем
      // PUA-суффикс, чтобы lookahead-ы правил его «видели».
      const maskAfter = sortedMasks.find((m) => m.start === seg.end);
      const suffix = maskAfter ? maskAfter.placeholder[0] : "";
      const padded = suffix ? seg.text + suffix : seg.text;
      const transformed = transformSegment(padded, language);
      const after =
        suffix && transformed.endsWith(suffix)
          ? transformed.slice(0, -1)
          : transformed;
      out += after;
      cursor = seg.end;
      segIdx++;
    } else {
      out += masked[cursor];
      cursor++;
    }
  }
  // Срез сиротных переносов в конце узла — зеркалит финальный шаг main.ts.
  return unmask(out, masks).replace(/[\n\r]+$/, "");
}
