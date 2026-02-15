import { processTextWithStats } from "./stats";
import { detectLanguage } from "./lang/detect";
import { LANG_LABEL } from "./lang/maps";
import { Language } from "./types";

import {
  applyCommonRules,
  maskUrlsAndEmails,
  unmaskUrlsAndEmails,
} from "./rules/common";

import { applyMath } from "./rules/math";
import { applyRussianRules } from "./rules/ru";
import { applyEnglishRules } from "./rules/en";
// import { applySerbianRules } from "./rules/sr"; // когда появится

// ---------- UTILS ----------
async function loadAllFontsForNode(root: SceneNode | PageNode | DocumentNode) {
  const textNodes: TextNode[] = [];
  if ("findAll" in root) {
    (root as PageNode)
      .findAll((n: SceneNode) => n.type === "TEXT")
      .forEach((n) => textNodes.push(n as TextNode));
  } else if (root.type === "TEXT") {
    textNodes.push(root as TextNode);
  }

  // собираем все сочетания шрифтов
  const fonts = new Set<string>();
  for (const t of textNodes) {
    try {
      if (t.fontName !== figma.mixed) {
        const f = t.fontName as FontName;
        fonts.add(JSON.stringify(f));
      } else {
        t.getRangeAllFontNames(0, t.characters.length).forEach((f) =>
          fonts.add(JSON.stringify(f))
        );
      }
    } catch {
      /* ignore nodes without characters */
    }
  }

  for (const f of fonts) {
    const fn = JSON.parse(f) as FontName;
    try {
      await figma.loadFontAsync(fn);
    } catch {
      /* skip missing fonts */
    }
  }
}

type LangProcessor = (text: string) => string;
let lastResultMessage: string | null = null;

/** Вернёт функцию преобразования для языка (безопасный no-op если модуль не подключён). */
function getLangProcessor(lang: Language): LangProcessor {
  switch (lang) {
    case "ru":
      return (t) => applyRussianRules(t);
    case "en":
      return (t) => applyEnglishRules(t);
    // case "sr": return (t) => applySerbianRules(t); // когда появится
    default:
      return (t) => t; // ничего не делаем для неизвестных/пока не реализованных языков
  }
}

// function transformTextOnce(
//   raw: string,
//   lang: Language
// ): { text: string; changes: number } {
//   const langProc = getLangProcessor(lang);
//   return processTextWithStats(raw, langProc, {
//     mask: maskUrlsAndEmails,
//     unmask: unmaskUrlsAndEmails,
//     // 1) математика и общие правила — до языковых
//     math: applyMath,
//     common: (s) => applyCommonRules(s), // поддерживаются string и {text}
//   });
// }

function transformTextOnce(raw: string, lang: Language): { text: string; changes: number } {
  const langProc = getLangProcessor(lang);

  let prev = raw;
  let totalChanges = 0;

  // Максимум 3 прохода: почти все наши правила стабилизируются за 1–2
  for (let i = 0; i < 3; i++) {
    const { text, changes } = processTextWithStats(prev, langProc, {
      mask:   maskUrlsAndEmails,
      unmask: unmaskUrlsAndEmails,
      math:   applyMath,
      common: (s) => applyCommonRules(s),
      // если в TS-версии есть ещё поле units — просто передай tightenUnitsAndPercents сюда
    });

    totalChanges += changes;

    if (text === prev) {
      // дошли до фикс-точки, дальше ничего не меняется
      return { text, changes: totalChanges };
    }

    prev = text;
  }

  // на всякий случай: если за 3 итерации не стабилизировалось, возвращаем последнее
  return { text: prev, changes: totalChanges };
}

// ---------- MAIN ----------
async function runHeadless() {
  const selection = figma.currentPage.selection;

  // собираем текстовые узлы
  // собираем текстовые узлы
  const nodes: TextNode[] = [];

  const isTextNode = (n: SceneNode): n is TextNode => n.type === "TEXT";

  for (const node of selection) {
    if ("findAll" in node) {
      // важно: не указывать тип параметра у колбэка, чтобы не ловить перегрузки
      const found = node.findAll((n) => n.type === "TEXT").filter(isTextNode);
      nodes.push(...found); // тут уже TextNode[]
    } else if (node.type === "TEXT") {
      nodes.push(node as TextNode);
    }
  }

  if (!nodes.length) {
    figma.notify("На странице не обнаружено текстовых слоев", {
      timeout: 2000,
    });
    return;
  }

  // 1) собрать небольшой корпус текста для детекта
  const sample = nodes
    .map((n) => n.characters ?? "")
    .join("\n")
    .slice(0, 4000); // более чем достаточно для детекта

  // 2) определить язык
  const lang = detectLanguage(sample) as Language;
  const langLabel = LANG_LABEL[lang] ?? lang;

  // 3) загрузить шрифты (как было)
  await loadAllFontsForNode(figma.currentPage);

  // 4) применить преобразование, посчитать изменения
  let changes = 0;

  for (const n of nodes) {
    const before = n.characters ?? "";
    const res = transformTextOnce(before, lang);
    if (before !== res.text) {
      n.characters = res.text;
      changes += res.changes;
    }
  }

  // 5) подготовить сообщение для нотифая/закрытия
  lastResultMessage = `Язык: ${langLabel}. Внесено изменений: ${changes}`;
}

figma.on("run", async () => {
  // HEADLESS режим. Если хотите UI — покажите его и не закрывайте плагин до клика:
  // figma.showUI(__html__, { width: 360, height: 420 });
  // figma.ui.onmessage = (msg) => { if (msg?.type === "process") runHeadless(); if (msg?.type === "close") figma.closePlugin(); };

  try {
    await runHeadless();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    figma.notify("Ошибка: " + msg, { timeout: 3000 });
  } finally {
    // ГАРАНТИРОВАННО останавливаем «Running…»
    figma.closePlugin(lastResultMessage ?? "Готово");
  }
});
