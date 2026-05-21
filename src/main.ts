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
import { applyItalianRules } from "./rules/it";
import { applyPolishRules } from "./rules/pl";
import { applyPortugueseRules } from "./rules/pt";
import { applyDutchRules } from "./rules/nl";
import { applySerbianCyrillicRules } from "./rules/srCyrl";

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
// Финальный нотис: достаточно времени, чтобы прочитать сводку.
const FINAL_NOTICE_TIMEOUT_MS = 10000;
// Минимальный интервал между перевыставлениями loading-нотиса с обновлённым
// процентом. figma.notify обновлять in-place нельзя — только cancel+re-issue,
// поэтому слишком частые апдейты дают моргание. Ниже ~80 мс начинает мерцать.
const PROGRESS_UPDATE_MS = 700;

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
  // NFC: декомпозиционные формы (combining-acute и т.п.) превращаются в
  // precomposed. Иначе посимвольные regex-правила могут увидеть «e + ́»
  // как два символа и неправильно сработать. Стоит дёшево, делается раз.
  // CRLF/CR → LF — Figma внутри использует LF, но импорт из текстовых
  // файлов может прийти с другими переносами.
  let prev = text.normalize("NFC").replace(/\r\n?/g, "\n");
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

    // Если сразу за сегментом начинается маска URL/email — добавляем
    // один PUA-символ как «контекст справа», чтобы lookahead-ы правил
    // (предлоги, абревиатуры) видели его как непробельный «следующий».
    // После прохода правил суффикс удаляем; диффуем уже без него.
    const maskAfter = masks.find((m) => m.start === seg.end);
    const suffix = maskAfter ? maskAfter.placeholder[0] : "";
    const padded = suffix ? seg.text + suffix : seg.text;

    const transformed = transformSegment(padded, lang);
    const after =
      suffix && transformed.endsWith(suffix)
        ? transformed.slice(0, -1)
        : transformed;

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

function formatLangList(): string {
  const sorted = Array.from(langStats.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.map(([lang]) => langName(uiLocale, lang)).join(", ");
}

// ─── Состояние плагина (module-level) ─────────────────────────────────
// Стейт держим на верхнем уровне, чтобы close-hook мог собрать сводку
// в любой момент: при «нормальном» завершении, нажатии Cancel, клике × на
// нотисе, или при системном «Running Typo Graf · Cancel».
let uiLocale: UILocale = "en";
let cancelled = false;
let initResolve: (() => void) | null = null;

let runStarted = false;
let noTextLayers = false;
let hasError = false;
let errorMessage = "";
let summaryShown = false;

let totalChanges = 0;
let affectedNodes = 0;
let skippedFonts = 0;
let skippedTooLong = 0;
let truncated = false;
let totalAllNodes = 0;
const langStats = new Map<Language, number>();

// Loading-нотис: всегда виден от запуска до завершения, чтобы Figma не
// поднимала свой системный «Running Typo Graf» (он появляется, когда у
// плагина нет видимого фидбэка).
// activeHandler хранит «текущий» нотис: при re-issue для обновления
// процента старый handler уже не активен, поэтому его onDequeue
// игнорируется через сравнение по идентичности.
let activeHandler: NotificationHandler | null = null;
let loadingActive = false;
let lastProgressUpdateAt = 0;

figma.ui.onmessage = (msg) => {
  if (msg && msg.type === "init") {
    uiLocale = detectUILocale(msg.locale);
    if (initResolve) {
      initResolve();
      initResolve = null;
    }
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

function formatLoadingText(percent: number | null): string {
  const base = t(uiLocale, "loadingNotice");
  return percent === null ? base : `${base} ${percent}%`;
}

function openLoadingNotify(text: string): NotificationHandler {
  // Локально захватываем handle, чтобы в onDequeue сравнить «дёрнули
  // именно этот нотис» с activeHandler. Если они не равны — этот нотис
  // уже устаревший (перевыставили для обновления процента), игнорируем.
  let self: NotificationHandler;
  self = figma.notify(text, {
    timeout: Infinity,
    onDequeue: (reason) => {
      if (self !== activeHandler) return;
      if (!loadingActive) return;
      // × на текущем нотисе — единственный способ отмены через UI.
      if (reason === "dismiss") {
        cancelled = true;
        loadingActive = false;
        activeHandler = null;
      }
    },
  });
  return self;
}

function startLoadingNotify(): void {
  loadingActive = true;
  activeHandler = openLoadingNotify(formatLoadingText(null));
}

function updateLoadingProgress(percent: number): void {
  if (!loadingActive || !activeHandler) return;
  const now = Date.now();
  if (now - lastProgressUpdateAt < PROGRESS_UPDATE_MS) return;
  lastProgressUpdateAt = now;
  // Порядок важен: сначала выставляем новый activeHandler, потом гасим
  // старый. Тогда onDequeue старого увидит self !== activeHandler и
  // не воспримет programmatic-cancel как пользовательский dismiss.
  const old = activeHandler;
  activeHandler = openLoadingNotify(formatLoadingText(percent));
  old.cancel();
}

function closeLoadingNotify(): void {
  loadingActive = false;
  if (activeHandler) {
    const h = activeHandler;
    activeHandler = null;
    h.cancel();
  }
}

async function run(): Promise<void> {
  await waitForInit(INIT_TIMEOUT_MS);

  const allNodes = collectTargets();
  totalAllNodes = allNodes.length;
  if (!allNodes.length) {
    noTextLayers = true;
    return;
  }

  const nodes = allNodes.slice(0, MAX_NODES);
  truncated = allNodes.length > MAX_NODES;
  runStarted = true;

  // Нотис открываем СРАЗУ — пока он висит, Figma не поднимет системный
  // «Running …», и мельтешения не будет. Для быстрых прогонов он просто
  // мелькнёт меньше чем на секунду — это нормально, это нативный notify.
  startLoadingNotify();

  // Счётчик «посмотренных» узлов — растёт безусловно, чтобы прогресс был
  // линейным даже при пропусках (по шрифту / длине). updateLoadingProgress
  // сам троттлит частоту перевыставлений через PROGRESS_UPDATE_MS.
  let visited = 0;

  try {
    for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
      if (cancelled) break;

      const batch = nodes.slice(i, i + BATCH_SIZE);

      for (const node of batch) {
        if (cancelled) break;

        visited++;
        updateLoadingProgress(Math.round((visited / nodes.length) * 100));

        const before = node.characters;
        if (!before) continue;
        if (before.length > MAX_SEGMENT_LENGTH) {
          skippedTooLong++;
          continue;
        }

        // Детектим язык ПОСЛЕ маскирования URL/email — иначе латиница URL
        // перевешивает текст ("см. https://example.com" определялся бы как en).
        // Маска уже length-preserving, поэтому индексы не сдвигаются.
        const { masked: maskedForDetect } = maskSensitive(before);
        const lang = detectLanguage(maskedForDetect);
        langStats.set(lang, (langStats.get(lang) ?? 0) + 1);

        const replacements = planReplacements(before, lang);
        if (replacements === null) {
          skippedTooLong++;
          continue;
        }

        // Сиротные переносы в конце узла — мусор от ручного редактирования.
        // Переносы МЕЖДУ абзацами (Para 1\n\nPara 2) не трогаем — они осмысленные;
        // срезается только хвост.
        const trailing = before.match(/[\n\r]+$/);
        if (trailing) {
          replacements.push({
            start: before.length - trailing[0].length,
            end: before.length,
            text: "",
            reason: "trailing-newline",
          });
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

      await yieldControl();
    }
  } finally {
    closeLoadingNotify();
  }
}

function buildSummaryLines(): string[] {
  const lines: string[] = [];
  const statusKey = cancelled ? "cancelledStat" : "doneStat";
  const summary = t(uiLocale, "summaryStat", {
    changes: totalChanges,
    nodes: affectedNodes,
  });
  lines.push(t(uiLocale, statusKey) + " " + summary);
  if (langStats.size) {
    lines.push(t(uiLocale, "languagesStat", { list: formatLangList() }));
  }
  if (skippedFonts) lines.push(t(uiLocale, "skippedFontsStat", { n: skippedFonts }));
  if (skippedTooLong) lines.push(t(uiLocale, "skippedLongStat", { n: skippedTooLong }));
  if (truncated) {
    lines.push(t(uiLocale, "limitStat", { limit: MAX_NODES, total: totalAllNodes }));
  }
  lines.push(t(uiLocale, "undoHint"));
  return lines;
}

function showFinalSummary(): void {
  if (summaryShown) return;
  summaryShown = true;
  if (hasError) {
    figma.notify(t(uiLocale, "errorStat", { message: errorMessage }), {
      error: true,
      timeout: FINAL_NOTICE_TIMEOUT_MS,
    });
    return;
  }
  if (noTextLayers) {
    figma.notify(t(uiLocale, "noTextLayersStat"), { timeout: FINAL_NOTICE_TIMEOUT_MS });
    return;
  }
  if (!runStarted) {
    // Закрыли раньше, чем что-либо началось (например, до init). Молчим.
    return;
  }
  // figma.notify не интерпретирует \n — отображает одной строкой и режет
  // на 100 символах. Склеиваем через пробел: каждая часть уже с точкой,
  // undoHint в самом конце.
  figma.notify(buildSummaryLines().join(" "), { timeout: FINAL_NOTICE_TIMEOUT_MS });
}

// UI — пустой iframe, нужен только ради navigator.language (в plugin
// sandbox локали системы нет). visible: false навсегда.
figma.showUI(__html__, { visible: false });

// Любой способ закрытия (× на нотисе, системный Cancel в «Running Typo
// Graf», ⌘ + /) идёт через этот хук — там рисуем сводку. Хук синхронный,
// async-кода быть не должно; figma.notify здесь допустим и переживает
// завершение плагина.
figma.on("close", showFinalSummary);

figma.on("run", async () => {
  try {
    await run();
  } catch (e) {
    hasError = true;
    errorMessage = e instanceof Error ? e.message : String(e);
  } finally {
    figma.closePlugin();
  }
});
