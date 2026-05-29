// PROCLITICS — слова, тянущие к себе следующее слово. NBSP справа.
// Регистр учитывается явно: lowercase + Title-case (без ALL-CAPS — там
// чаще встречается аббревиатура «AN» как имя/инициалы, а не артикль).
// Раньше регекс ходил с флагом `gi`, который ловил `A`/`I` посреди матики
// (`a · b`, `A → B`), см. smoke-test v1.0.0 bug #3.
export const PROCLITICS = [
  "a", "A",
  "an", "An",
  "the", "The",
  "and", "And",
  "but", "But",
  "or", "Or",
  "nor", "Nor",
  "so", "So",
  "as", "As",
  "at", "At",
  "by", "By",
  "in", "In",
  "of", "Of",
  "on", "On",
  "to", "To",
  "i", "I",
];

export const UNITS_EN = [
  "km",
  "m",
  "cm",
  "mm",
  "mi",
  "yd",
  "ft",
  "in",
  "kg",
  "g",
  "mg",
  "lb",
  "oz",
  "l",
  "ml",
  "gal",
  "h",
  "min",
  "s",
  "°C",
  "°F",
  "°",
  "mph",
  "km/h",
];