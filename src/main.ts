import { detectLanguage } from "./lang/detect";
import { Language, Replacement } from "./types";
import { detectUILocale, langName, t, UILocale } from "./i18n";

import { applyCommonRules } from "./rules/common";
import { applyMath } from "./rules/math";
import { applyRussianRules } from "./rules/ru";
import { applyEnglishRules } from "./rules/en";
import { applyFrenchRules } from "./rules/fr";
import { applyUkrainianRules } from "./rules/uk";
import { applyGermanRules } from "./rules/de";
import { applySpanishRules } from "./rules/es";
import { applyBCSRules } from "./rules/bcs";

import { maskSensitive } from "./text/mask";
import { diffLCS, extractFreeSegments } from "./text/diff";
import { applyReplacements } from "./text/ranges";

const MAX_NODES = 2000;
const BATCH_SIZE = 150;
const PIPELINE_MAX_PASSES = 3;
// LCS-таблица — O(n²) по памяти. На один свободный сегмент ставим лимит,
// очень длинные узлы (макет с целым параграфом текста) — пропускаем целиком.
const MAX_SEGMENT_LENGTH = 5000;
// Сколько ждём init-сообщение от UI до фолбэка на 'en'.
const INIT_TIMEOUT_MS = 1500;

type LangProcessor = (text: string) => string;
const NOOP: LangProcessor = (s) => s;

function getLangProcessor(lang: Language): LangProcessor {
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
    default:
      return NOOP;
  }
}

function isTextNode(n: BaseNode): n is TextNode {
  return n.type === "TEXT";
}

function collectTargets(): TextNode[] {
  const selection = figma.currentPage.selection;
  const out: TextNode[] = [];

  if (selection.length) {
    for (const node of selection) {
      if (isTextNode(node)) {
        out.push(node);
      } else if ("findAll" in node) {
        const found = (node as ChildrenMixin).findAll(isTextNode) as TextNode[];
        out.push(...found);
      }
    }
    return out;
  }

  return figma.currentPage.findAll(isTextNode) as TextNode[];
}

async function loadFontsForNode(node: TextNode): Promise<boolean> {
  if (!node.characters) return true;
  try {
    if (node.fontName !== figma.mixed) {
      await figma.loadFontAsync(node.fontName as FontName);
      return true;
    }
    const fonts = node.getRangeAllFontNames(0, node.characters.length);
    await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
    return true;
  } catch {
    return false;
  }
}

function transformSegment(text: string, lang: Language): string {
  const langProc = getLangProcessor(lang);
  let prev = text;
  for (let i = 0; i < PIPELINE_MAX_PASSES; i++) {
    let s = applyMath(prev);
    s = applyCommonRules(s);
    s = langProc(s);
    if (s === prev) return s;
    prev = s;
  }
  return prev;
}

function planReplacements(before: string, lang: Language): Replacement[] | null {
  const { masked, masks } = maskSensitive(before);
  const segments = extractFreeSegments(masked, masks);

  const out: Replacement[] = [];
  for (const seg of segments) {
    if (seg.text.length > MAX_SEGMENT_LENGTH) return null;
    const after = transformSegment(seg.text, lang);
    if (after === seg.text) continue;
    const local = diffLCS(seg.text, after);
    for (const r of local) {
      out.push({
        start: seg.start + r.start,
        end: seg.start + r.end,
        text: r.text,
        reason: r.reason,
      });
    }
  }
  return out;
}

function yieldControl(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function formatLangList(uiLocale: UILocale, stats: Map<Language, number>): string {
  const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.map(([lang]) => langName(uiLocale, lang)).join(", ");
}

function postProgress(current: number, total: number, label: string) {
  figma.ui.postMessage({ type: "progress", current, total, label });
}

// ─── Состояние, разделяемое между обработчиком UI и run() ──────────────────
let uiLocale: UILocale = "en";
let cancelled = false;
let initResolve: (() => void) | null = null;

figma.ui.onmessage = (msg) => {
  if (!msg) return;
  if (msg.type === "init") {
    uiLocale = detectUILocale(msg.locale);
    if (initResolve) {
      initResolve();
      initResolve = null;
    }
  } else if (msg.type === "cancel") {
    cancelled = true;
  }
};

function waitForInit(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    initResolve = resolve;
    setTimeout(() => {
      if (initResolve) {
        initResolve();
        initResolve = null;
      }
    }, timeoutMs);
  });
}

async function run(): Promise<string> {
  await waitForInit(INIT_TIMEOUT_MS);

  // После получения локали — переводим стартовые лейблы UI.
  figma.ui.postMessage({
    type: "labels",
    cancel: t(uiLocale, "cancelButton"),
    scanning: t(uiLocale, "scanning"),
  });

  const allNodes = collectTargets();
  if (!allNodes.length) {
    return t(uiLocale, "noTextLayersStat");
  }

  const nodes = allNodes.slice(0, MAX_NODES);
  const truncated = allNodes.length > MAX_NODES;

  postProgress(0, nodes.length, t(uiLocale, "scanning"));

  let totalChanges = 0;
  let affectedNodes = 0;
  let skippedFonts = 0;
  let skippedTooLong = 0;
  const langStats = new Map<Language, number>();

  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    if (cancelled) break;

    const batch = nodes.slice(i, i + BATCH_SIZE);

    for (const node of batch) {
      if (cancelled) break;

      const before = node.characters;
      if (!before) continue;
      if (before.length > MAX_SEGMENT_LENGTH) {
        skippedTooLong++;
        continue;
      }

      const lang = detectLanguage(before);
      langStats.set(lang, (langStats.get(lang) ?? 0) + 1);

      const replacements = planReplacements(before, lang);
      if (replacements === null) {
        skippedTooLong++;
        continue;
      }
      if (!replacements.length) continue;

      const ok = await loadFontsForNode(node);
      if (!ok) {
        skippedFonts++;
        continue;
      }

      try {
        applyReplacements(node, replacements);
        totalChanges += replacements.length;
        affectedNodes++;
      } catch {
        skippedFonts++;
      }
    }

    const processed = Math.min(i + BATCH_SIZE, nodes.length);
    postProgress(
      processed,
      nodes.length,
      t(uiLocale, cancelled ? "cancelling" : "processing")
    );
    await yieldControl();
  }

  // Каждое предложение — отдельное, разделитель — пробел.
  // Подсказка про Ctrl+Z — на новой строке.
  const stats: string[] = [];
  stats.push(t(uiLocale, cancelled ? "cancelledStat" : "doneStat"));
  if (langStats.size) {
    stats.push(t(uiLocale, "languagesStat", { list: formatLangList(uiLocale, langStats) }));
  }
  stats.push(t(uiLocale, "changesStat", { n: totalChanges }));
  stats.push(t(uiLocale, "affectedStat", { n: affectedNodes }));
  if (skippedFonts) stats.push(t(uiLocale, "skippedFontsStat", { n: skippedFonts }));
  if (skippedTooLong) stats.push(t(uiLocale, "skippedLongStat", { n: skippedTooLong }));
  if (truncated) {
    stats.push(t(uiLocale, "limitStat", { limit: MAX_NODES, total: allNodes.length }));
  }

  return stats.join(" ") + "\n" + t(uiLocale, "undoHint");
}

figma.showUI(__html__, { width: 320, height: 160, themeColors: true });

figma.on("run", async () => {
  let result = "";
  try {
    result = await run();
  } catch (e) {
    const msgText = e instanceof Error ? e.message : String(e);
    result = t(uiLocale, "errorStat", { message: msgText });
  } finally {
    figma.closePlugin(result);
  }
});
