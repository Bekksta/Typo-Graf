import { bench, describe } from "vitest";
import { runPipeline } from "./_helpers/pipeline";

// Baseline-производительность пайплайна на реалистичных образцах текста.
// Запуск: `npx vitest bench`. Цифры не для CI-гейтов — это маркер для
// отлова регрессий при будущих изменениях правил.

const SHORT_RU =
  "ребенок 20 кг и А. С. Пушкин — поэт. № 5 за 300 ₽ -- 10-12 км.";
const SHORT_EN =
  "He said \"hello!\" and 10-12 km away there's a 20 % discount.";
const LONG_RU =
  ("Утром в офисе ребенок учет сделал, шел по коридору. " +
    "Все встречи начались в 9.30. Перед обедом он сказал: \"проверьте отчет\". " +
    "Спасибо, до н.э. видели. И т.д. Звонок в Дрезден +49-30-12345.").repeat(5);

describe("pipeline:bench", () => {
  bench("short ru text", () => {
    runPipeline(SHORT_RU, "ru");
  });

  bench("short en text", () => {
    runPipeline(SHORT_EN, "en");
  });

  bench("long ru text (5x repeat)", () => {
    runPipeline(LONG_RU, "ru");
  });

  bench("mixed: 100 short ru segments", () => {
    for (let i = 0; i < 100; i++) runPipeline(SHORT_RU, "ru");
  });
});
