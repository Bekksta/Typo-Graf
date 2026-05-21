// Общие типографические правила (порядок важен).
// Маскирование URL/email вынесено в src/text/mask.ts (length-preserving),
// чтобы LCS-diff работал на равных индексах.
import { NBSP, EN_DASH, ELLIPSIS, SP_ANY_SRC } from "../lang/maps";

const WJ = "⁠"; // word joiner — невидимый zero-width неразрывный связыватель

// ISO 8601 даты и время: `2024-12-31`, `2024-12-31T23:59`, `2024-12-31T23:59:59Z`,
// `2024-12-31T23:59:59+03:00`. Без защиты `NUM_RANGE_RE` ниже превращает дефисы
// в en-dash и ломает формат. Решение: оборачиваем дефисы внутри ДАТНОЙ части
// (первые 10 символов) словесным соединителем U+2060 — он невидим, но
// блокирует все regex'ы, ищущие `\d+\s*-\s*\d+`. Часть со временем (T...)
// не трогаем — дефис в timezone-офсете (`-03:00`) случайно не задевается,
// потому что общие правила требуют цифру С ОБЕИХ сторон дефиса.
const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+\-]\d{2}:?\d{2})?)?\b/g;
function protectIsoDates(text: string): string {
  return text.replace(ISO_DATE_RE, (m) => {
    const datePart = m.slice(0, 10).replace(/-/g, `${WJ}-${WJ}`);
    return datePart + m.slice(10);
  });
}

// Базовый набор единиц для number+unit; языковые правила могут расширять.
// Расширен SI-юнитами и ru-сокращениями годов/веков (`гг.` / `вв.`),
// которые должны быть «прижаты» к предшествующему числу.
// Расширенный набор единиц: цифровые, изображение/UI, давление, энергия,
// дополнительные валюты. Длинные варианты идут ПЕРВЫМИ в группе чередования —
// чтобы regex брал `мегапикселей`, а не короткий `Мп`, если оба применимы.
const COMMON_UNITS_RE = new RegExp(
  `(\\d+)${SP_ANY_SRC}+(` +
    // SI: масса, длина, объём, время (общеупотребительные)
    `кг|мг|г|т|мкм|нм|см|мм|м|км|л|мл|млн|тыс\\.?|` +
    `ч\\.?|мин\\.?|сек\\.?|мкс|нс|мс|` +
    // Валюты
    `₽|€|\\$|£|¥|¢|₸|₴|₪|%|‰|` +
    // Частоты, электричество
    `Гц|кГц|МГц|ГГц|мкА|мА|А|В|кВ|мВ|Вт|кВт|МВт|мВт|Ом|кОм|МОм|` +
    // Освещённость, акустика
    `дБА|дБ|лм|лк|` +
    // Давление, энергия
    `кПа|МПа|ГПа|Па|бар|атм|кДж|МДж|Дж|ккал|кал|` +
    // Цифровые: цельнословные формы (бит/байт) и краткие префиксные (Кб/Мб/...)
    // Префиксные ВЕРХНИЙ регистр (МБ/ГБ/ТБ — старые ГОСТовские),
    // плюс смешанный регистр (Кб/Мб/Гб/Тб — современный де-факто).
    `Тбайт|Гбайт|Мбайт|Кбайт|байт|бит|Тб|Гб|Мб|Кб|ТБ|ГБ|МБ|КБ|` +
    `Мбит|Кбит|Гбит|` +
    // Изображение/UI
    `мегапикселей|мегапикселя|мегапиксели|мегапиксель|пикселей|пикселя|пиксели|пиксель|` +
    `Мпикс|Мп|px|dpi|ppi|fps|` +
    // Закрывающие сокращения «годами»/«веками» — привязка к числу
    `гг\\.?|вв\\.?` +
    `)(?![A-Za-zА-Яа-яЁё])`,
  "g"
);

const ELLIPSIS_UNITS_RE = new RegExp(
  `…${SP_ANY_SRC}+(см\\.?|мм|м|км|г|кг|л|%|₽|€|\\$)`,
  "g"
);

const DOUBLE_PRIME_RE = new RegExp(`(\\d)${SP_ANY_SRC}*''(?!')`, "g");
const SINGLE_PRIME_RE = new RegExp(`(\\d)${SP_ANY_SRC}*'(?!')`, "g");
const DEG_RE = /\b(\d+)\s*deg\b/gi;

const ELLIPSIS_COMPACT_RE = /\s*\.{3}\s*/g;
const ELLIPSIS_TRIM_LEFT_RE = /\s+…/g;
const ELLIPSIS_SPACE_RIGHT_RE = /…(?=[A-Za-zА-Яа-яЁё0-9])/g;
const PERCENT_ELLIPSIS_RE = /%\s*…/g;
const NUM_RANGE_RE = /(\d+)\s*-\s*(\d+)/g;
const DOUBLE_SP_RE = / {2,}/g;

// Знаки копирайта/торговой марки. Регистронезависимо: (c)/(C)/(tm)/(TM)/...
const COPY_RE = /\((?:c|C)\)/g;
const REG_RE = /\((?:r|R)\)/g;
const TM_RE = /\((?:tm|TM|Tm|tM)\)/g;

export function applyCommonRules(input: string): string {
  let text = input;

  // Защита ISO-дат ДО NUM_RANGE_RE — иначе `2024-12-31` сломается на en-dash.
  text = protectIsoDates(text);

  text = text
    .replace(ELLIPSIS_COMPACT_RE, ELLIPSIS)
    .replace(ELLIPSIS_TRIM_LEFT_RE, ELLIPSIS)
    .replace(ELLIPSIS_SPACE_RIGHT_RE, ELLIPSIS + " ");

  text = text.replace(PERCENT_ELLIPSIS_RE, "%" + WJ + ELLIPSIS);

  text = text.replace(NUM_RANGE_RE, `$1${EN_DASH}$2`);
  text = text.replace(DOUBLE_SP_RE, " ");
  text = text.replace(COMMON_UNITS_RE, (_m, n, u) => `${n}${NBSP}${u}`);
  text = text.replace(ELLIPSIS_UNITS_RE, (_m, u) => `${ELLIPSIS}${NBSP}${u}`);

  text = text.replace(DOUBLE_PRIME_RE, "$1″");
  text = text.replace(SINGLE_PRIME_RE, "$1′");
  text = text.replace(DEG_RE, "$1°");

  // (tm) ДО (r), иначе "(r)" внутри "(tm)" уже не поймать; и оба ДО (c) — на всякий.
  text = text.replace(TM_RE, "™");
  text = text.replace(REG_RE, "®");
  text = text.replace(COPY_RE, "©");

  return text;
}
