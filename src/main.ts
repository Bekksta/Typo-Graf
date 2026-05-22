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
const MAX_PIPELINE_PASSES = 3;
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
  for (let i = 0; i < MAX_PIPELINE_PASSES; i++) {
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
  const sorted = Array.from(stats.byLang.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.map(([lang]) => langName(state.uiLocale, lang)).join(", ");
}

// ─── Состояние плагина (module-level) ─────────────────────────────────
// Стейт держим на верхнем уровне, чтобы close-hook мог собрать сводку
// в любой момент: при «нормальном» завершении, нажатии Cancel, клике × на
// нотисе, или при системном «Running Typo Graf · Cancel».

// `state` — флаги жизненного цикла прогона и UI-локаль.
const state = {
  uiLocale: "en" as UILocale,
  isCancelled: false,
  isRunStarted: false,
  hasNoTextLayers: false,
  hasError: false,
  errorMessage: "",
  isSummaryShown: false,
  isTruncated: false,
};

// `stats` — счётчики для финальной сводки.
const stats = {
  totalChanges: 0,
  affectedNodes: 0,
  skippedFonts: 0,
  skippedTooLong: 0,
  totalAllNodes: 0,
  byLang: new Map<Language, number>(),
};

// Loading-нотис: всегда виден от запуска до завершения, чтобы Figma не
// поднимала свой системный «Running Typo Graf» (он появляется, когда у
// плагина нет видимого фидбэка).
// `handler` хранит «текущий» нотис: при re-issue для обновления процента
// старый handler уже не активен, поэтому его onDequeue игнорируется через
// сравнение по идентичности.
const loading = {
  handler: null as NotificationHandler | null,
  isActive: false,
  lastUpdateAt: 0,
};

let initResolve: (() => void) | null = null;

figma.ui.onmessage = (msg) => {
  if (msg && msg.type === "init") {
    state.uiLocale = detectUILocale(msg.locale);
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
  const base = t(state.uiLocale, "loadingNotice");
  return percent === null ? base : `${base} ${percent}%`;
}

function openLoadingNotify(text: string): NotificationHandler {
  // Локально захватываем handle, чтобы в onDequeue сравнить «дёрнули
  // именно этот нотис» с loading.handler. Если они не равны — этот нотис
  // уже устаревший (перевыставили для обновления процента), игнорируем.
  let self: NotificationHandler;
  self = figma.notify(text, {
    timeout: Infinity,
    onDequeue: (reason) => {
      if (self !== loading.handler) return;
      if (!loading.isActive) return;
      // × на текущем нотисе — единственный способ отмены через UI.
      if (reason === "dismiss") {
        state.isCancelled = true;
        loading.isActive = false;
        loading.handler = null;
      }
    },
  });
  return self;
}

function startLoadingNotify(): void {
  loading.isActive = true;
  loading.handler = openLoadingNotify(formatLoadingText(null));
}

function updateLoadingProgress(percent: number): void {
  if (!loading.isActive || !loading.handler) return;
  const now = Date.now();
  if (now - loading.lastUpdateAt < PROGRESS_UPDATE_MS) return;
  loading.lastUpdateAt = now;
  // Порядок важен: сначала выставляем новый loading.handler, потом гасим
  // старый. Тогда onDequeue старого увидит self !== loading.handler и
  // не воспримет programmatic-cancel как пользовательский dismiss.
  const old = loading.handler;
  loading.handler = openLoadingNotify(formatLoadingText(percent));
  old.cancel();
}

function closeLoadingNotify(): void {
  loading.isActive = false;
  if (loading.handler) {
    const h = loading.handler;
    loading.handler = null;
    h.cancel();
  }
}

async function run(): Promise<void> {
  await waitForInit(INIT_TIMEOUT_MS);

  const allNodes = collectTargets();
  stats.totalAllNodes = allNodes.length;
  if (!allNodes.length) {
    state.hasNoTextLayers = true;
    return;
  }

  const nodes = allNodes.slice(0, MAX_NODES);
  state.isTruncated = allNodes.length > MAX_NODES;
  state.isRunStarted = true;

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
      if (state.isCancelled) break;

      const batch = nodes.slice(i, i + BATCH_SIZE);

      for (const node of batch) {
        if (state.isCancelled) break;

        visited++;
        updateLoadingProgress(Math.round((visited / nodes.length) * 100));

        const before = node.characters;
        if (!before) continue;
        if (before.length > MAX_SEGMENT_LENGTH) {
          stats.skippedTooLong++;
          continue;
        }

        // Детектим язык ПОСЛЕ маскирования URL/email — иначе латиница URL
        // перевешивает текст ("см. https://example.com" определялся бы как en).
        // Маска уже length-preserving, поэтому индексы не сдвигаются.
        const { masked: maskedForDetect } = maskSensitive(before);
        const lang = detectLanguage(maskedForDetect);
        stats.byLang.set(lang, (stats.byLang.get(lang) ?? 0) + 1);

        const replacements = planReplacements(before, lang);
        if (replacements === null) {
          stats.skippedTooLong++;
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
          stats.skippedFonts++;
          continue;
        }

        try {
          applyReplacements(node, replacements);
          stats.totalChanges += replacements.length;
          stats.affectedNodes++;
        } catch {
          stats.skippedFonts++;
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
  const statusKey = state.isCancelled ? "cancelledStat" : "doneStat";
  const summary = t(state.uiLocale, "summaryStat", {
    changes: stats.totalChanges,
    nodes: stats.affectedNodes,
  });
  lines.push(t(state.uiLocale, statusKey) + " " + summary);
  if (stats.byLang.size) {
    lines.push(t(state.uiLocale, "languagesStat", { list: formatLangList() }));
  }
  if (stats.skippedFonts) lines.push(t(state.uiLocale, "skippedFontsStat", { n: stats.skippedFonts }));
  if (stats.skippedTooLong) lines.push(t(state.uiLocale, "skippedLongStat", { n: stats.skippedTooLong }));
  if (state.isTruncated) {
    lines.push(t(state.uiLocale, "limitStat", { limit: MAX_NODES, total: stats.totalAllNodes }));
  }
  lines.push(t(state.uiLocale, "undoHint"));
  return lines;
}

function showFinalSummary(): void {
  if (state.isSummaryShown) return;
  state.isSummaryShown = true;
  if (state.hasError) {
    figma.notify(t(state.uiLocale, "errorStat", { message: state.errorMessage }), {
      error: true,
      timeout: FINAL_NOTICE_TIMEOUT_MS,
    });
    return;
  }
  if (state.hasNoTextLayers) {
    figma.notify(t(state.uiLocale, "noTextLayersStat"), { timeout: FINAL_NOTICE_TIMEOUT_MS });
    return;
  }
  if (!state.isRunStarted) {
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
    state.hasError = true;
    state.errorMessage = e instanceof Error ? e.message : String(e);
  } finally {
    figma.closePlugin();
  }
});
