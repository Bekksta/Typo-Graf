import { detectLanguage } from "./lang/detect";
import { planByLanguage } from "./rules";
import { applyToString } from "./text/apply";
import { maskSensitive, unmask } from "./text/mask";
import { applyReplacements } from "./text/ranges";
import { buildReport } from "./report/build";
import { Plan } from "./types";

function post(type: string, payload: any = {}) {
  figma.ui.postMessage({ type, ...payload });
}

figma.on("run", ({ command }) => {
  if (command !== "run") return;
  run();
});

async function run() {
  figma.showUI(__html__, {
    width: 360,
    height: 360,
    themeColors: true,
    visible: true,
  });
  let cancel = false;
  //   figma.ui.onmessage = (msg) => {
  //     if (msg?.type === "cancel") cancel = true;
  //     if (msg?.type === "undo") {
  //       figma.notify("Press Ctrl+Z (or ⌘Z) to undo recent changes");
  //     }
  //     if (msg?.type === "dryRunText") {
  //       const raw = String(msg.text || "");
  //       const lang = msg.lang === "auto" ? detectLanguage(raw) : msg.lang;
  //       const { masked, masks } = maskSensitive(raw);
  //       const repl = planByLanguage(masked, lang);
  //       const after = applyToString(masked, repl);
  //       const unAfter = unmask(after, masks);
  //       figma.ui.postMessage({
  //         type: "devResult",
  //         before: raw,
  //         after: unAfter,
  //         lang,
  //       });
  //     }
  //   };

  figma.ui.onmessage = (msg) => {
    if (msg && msg.type === "cancel") cancel = true;
    if (msg && msg.type === "undo") {
      figma.notify("Press Ctrl+Z (⌘Z) to undo");
    }
  };

  const textNodes = collectTargets();
  const limit = 2000;
  const targets = textNodes.slice(0, limit);

  post("progress", { progress: 0, nodes: targets.length, label: "Scanning…" });

  const batches = chunk(targets, 150);
  const allPlans: Plan[] = [];
  const nodesById = new Map<string, TextNode>();

  figma.currentPage.selection = [];
  figma.viewport.scrollAndZoomIntoView([]);

  //   try {
  //     for (let i = 0; i < batches.length; i++) {
  //       if (cancel) throw new Error("CANCELED");
  //       const batch = batches[i];
  //       for (const node of batch) nodesById.set(node.id, node);

  //       // DRY-RUN: план замен
  //       const plans: Plan[] = batch.map((node) => {
  //         const original = node.characters;
  //         const { masked, masks } = maskSensitive(original);
  //         const lang = detectLanguage(masked);
  //         const repl = planByLanguage(masked, lang);
  //         // применим к masked строке, чтобы получить preview `after`
  //         const afterMasked = applyToString(masked, repl);
  //         const plan: Plan = {
  //           nodeId: node.id,
  //           replacements: repl,
  //           lang,
  //           before: masked,
  //           after: afterMasked,
  //         };
  //         return plan;
  //       });

  //       // APPLY: к реальным узлам (сохраняя стили)
  //       for (const plan of plans) {
  //         const node = nodesById.get(plan.nodeId)!;
  //         if (!node || plan.replacements.length === 0) continue;
  //         try {
  //           await loadAllFontsForNode(node); // ← ВАЖНО: грузим все шрифты узла
  //           applyReplacements(node, plan.replacements); // правим текст
  //         } catch (err) {
  //           // Если шрифт отсутствует в системе/фигме — пропускаем узел, показываем сообщение
  //           post("progress", {
  //             progress: (i + 1) / batches.length,
  //             nodes: targets.length,
  //             repl: allPlans.reduce((n, p) => n + p.replacements.length, 0),
  //             label: `Skipped node "${node.name}" (font load failed)`,
  //           });
  //           continue;
  //         }
  //       }

  //       allPlans.push(...plans);

  //       post("progress", {
  //         progress: (i + 1) / batches.length,
  //         nodes: targets.length,
  //         repl: allPlans.reduce((n, p) => n + p.replacements.length, 0),
  //         label: `Processing batch ${i + 1}/${batches.length}`,
  //       });
  //       await figma
  //         .loadFontAsync({ family: "Inter", style: "Regular" })
  //         .catch(() => {}); // микро-тик UI
  //     }

  //     // Отчёт
  //     const report = buildReport(allPlans, nodesById);
  //     post("done", { examples: report.examples, total: report.totalRepl });
  //   } catch (e: any) {
  //     if (e && String(e.message) === "CANCELED") {
  //       post("canceled", {});
  //     } else {
  //       post("error", { message: String(e?.message || e) });
  //     }
  //   } finally {
  //     // UI остаётся открытым с отчётом; пользователь может нажать Undo
  //   }

  try {
    for (let i = 0; i < batches.length; i++) {
      if (cancel) throw new Error("CANCELED");
      const batch = batches[i];
      for (const node of batch) nodesById.set(node.id, node);

      // DRY-RUN
      const plans: Plan[] = batch.map((node) => {
        const original = node.characters;
        const { masked, masks } = maskSensitive(original);
        const lang = detectLanguage(masked);
        const repl = planByLanguage(masked, lang);
        const afterMasked = applyToString(masked, repl);
        return {
          nodeId: node.id,
          replacements: repl,
          lang,
          before: masked,
          after: afterMasked,
        };
      });

      // APPLY
      for (const plan of plans) {
        const node = nodesById.get(plan.nodeId)!;
        if (!node || plan.replacements.length === 0) continue;
        await loadAllFontsForNode(node); // ← грузим все шрифты узла
        applyReplacements(node, plan.replacements); // ← реально пишем в слой
      }

      allPlans.push(...plans);
      post("progress", {
        progress: (i + 1) / batches.length,
        nodes: targets.length,
        repl: allPlans.reduce((n, p) => n + p.replacements.length, 0),
        label: `Processing batch ${i + 1}/${batches.length}`,
      });
      // микротик не обязателен; можно убрать
    }

    // Итоги
    const totalRepl = allPlans.reduce((n, p) => n + p.replacements.length, 0);
    const totalNodes = targets.length;

    // Закрываем UI и показываем нотификацию
    figma.closePlugin(
      `Typo Graf: ${totalRepl} replacements in ${totalNodes} node(s). Press Ctrl+Z (⌘Z) to undo.`
    );
  } catch (e: any) {
    if (String(e?.message) === "CANCELED") {
      figma.closePlugin("Typo Graf: canceled");
    } else {
      figma.closePlugin(`Typo Graf error: ${String(e?.message || e)}`);
    }
  }
}

function collectTargets(): TextNode[] {
  const sel = figma.currentPage.selection.filter(
    (n) => n.type === "TEXT"
  ) as TextNode[];
  if (sel.length) return sel;

  const out: TextNode[] = [];
  figma.currentPage
    .findAll((n) => n.type === "TEXT")
    .forEach((n) => out.push(n as TextNode));
  return out;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const loadedFonts = new Set<string>();

async function loadAllFontsForNode(node: TextNode) {
  // Если узел пустой — нечего грузить
  if (!node.characters || node.characters.length === 0) return;

  // Собираем все сегменты с fontName
  const segments = node.getStyledTextSegments(["fontName"]);

  for (const seg of segments) {
    const fn = seg.fontName as FontName; // у сегмента fontName всегда конкретный, не MIXED
    const key = `${fn.family}__${fn.style}`;
    if (loadedFonts.has(key)) continue;

    // Пробуем загрузить; если не вышло — пробрасываем вверх
    await figma.loadFontAsync({ family: fn.family, style: fn.style });
    loadedFonts.add(key);
  }
}
