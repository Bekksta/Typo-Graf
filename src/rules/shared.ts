// src/rules/shared.ts
// Общие утилиты и словари для number+unit
export function makeNumberUnitRegex(opts: { units?: string[]; currencies?: string[] }) {
  const units = (opts.units ?? []).join("|");
  const curr  = (opts.currencies ?? []).join("|");
  const tail  = [units, curr].filter(Boolean).join("|");
  return new RegExp(`(\\d[\\d\\s.,]*)\\s+(${tail})\\b`, "g");
}

export const NUM_UNIT = {
  ru: {
    units: [
      "мм", "см", "м", "км",
      "г", "кг", "т",
      "мл", "л",
      "px", "pt", "dpi", "em", "rem",
      "°C", "°F",
      "МБ", "ГБ",
      "%"
    ],
    currencies: ["₽", "€", "\\$"]
  }
  // добавишь en/fr/es/de/uk/bcs по мере готовности
};
