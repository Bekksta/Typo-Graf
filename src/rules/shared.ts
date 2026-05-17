// Общие утилиты и словари для number+unit.
export function makeNumberUnitRegex(opts: { units?: string[]; currencies?: string[] }) {
  const units = (opts.units ?? []).join("|");
  const curr = (opts.currencies ?? []).join("|");
  const tail = [units, curr].filter(Boolean).join("|");
  return new RegExp(`(\\d[\\d\\s.,]*)\\s+(${tail})\\b`, "g");
}

const SI_UNITS = [
  "mm", "cm", "m", "km",
  "g", "kg", "t",
  "ml", "l",
  "px", "pt", "dpi", "em", "rem",
  "MB", "GB", "TB",
  "%",
];

export const NUM_UNIT = {
  ru: {
    units: [
      "мм", "см", "м", "км",
      "г", "кг", "т",
      "мл", "л",
      "px", "pt", "dpi", "em", "rem",
      "°C", "°F",
      "МБ", "ГБ",
      "%",
    ],
    currencies: ["₽", "€", "\\$"],
  },
  eu: {
    units: SI_UNITS,
    currencies: ["€", "\\$", "£"],
  },
  en: {
    units: [
      ...SI_UNITS,
      "mi", "yd", "ft", "in",
      "lb", "oz",
      "gal",
      "h", "min", "s",
      "mph", "km/h",
      "°C", "°F", "°",
    ],
    currencies: ["\\$", "£", "€"],
  },
};
