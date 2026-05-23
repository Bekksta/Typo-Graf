// Общие утилиты и словари для number+unit.

// Группировка тысяч (5+ цифр) переданным разделителем: `1234567` → `1<sep>234<sep>567`.
// Порог 5 цифр — чтобы не задеть 4-значные года/версии (1991, 1024).
// Языки используют разные разделители: NBSP (ru/es/it/pl/nl/pt), NNBSP (fr/uk), `,` (en).
// Немецкий (`.`) не подходит под эту функцию — там нужен стрикт-гард
// `(?<![\d.,])...(?![\d.,])`, чтобы не задеть `1.0.0` и `3,14`.
export function groupThousands(text: string, separator: string): string {
  return text.replace(/\b\d{5,}\b/g, (n) =>
    n.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  );
}

export function makeNumberUnitRegex(opts: { units?: string[]; currencies?: string[] }) {
  const units = (opts.units ?? []).join("|");
  const curr = (opts.currencies ?? []).join("|");
  const tail = [units, curr].filter(Boolean).join("|");
  // Заменяем \b на явный negative lookahead: \b после '%', '€', '$' и пр.
  // в JS не срабатывает (это не word-боундари). Универсальный признак конца
  // юнита — отсутствие алфавитно-цифрового продолжения.
  return new RegExp(
    `(\\d[\\d\\s.,]*)\\s+(${tail})(?![A-Za-zЀ-ӿ0-9])`,
    "g"
  );
}

const SI_UNITS = [
  "mm", "cm", "m", "km",
  "g", "kg", "t",
  "ml", "l",
  "px", "pt", "dpi", "em", "rem",
  "MB", "GB", "TB",
  "%",
  // Время / частоты
  "µs", "ns", "ms", "s",
  "Hz", "kHz", "MHz", "GHz",
  // Электричество / электроника
  "µm", "µA", "mA", "A",
  "V", "kV", "mV",
  "W", "kW", "MW", "mW",
  "Ω", "kΩ", "MΩ",
  // Звук / свет
  "dB", "lm", "lx",
];

export const UNITS_BY_LANG = {
  ru: {
    units: [
      "мм", "см", "м", "км",
      "г", "кг", "т",
      "мл", "л",
      "px", "pt", "dpi", "em", "rem",
      "°C", "°F",
      "МБ", "ГБ", "ТБ",
      "%",
      // Время / частоты
      "мкс", "нс", "мс", "с",
      "Гц", "кГц", "МГц", "ГГц",
      // Электричество
      "мкА", "мА", "А", "мкм",
      "В", "кВ", "мВ",
      "Вт", "кВт", "МВт", "мВт",
      "Ом", "кОм", "МОм",
      // Звук / свет
      "дБ", "лм", "лк",
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
