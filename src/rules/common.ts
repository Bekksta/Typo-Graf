// Общие типографические правила (порядок важен).
// Маскирование URL/email вынесено в src/text/mask.ts (length-preserving),
// чтобы LCS-diff работал на равных индексах.
import { NBSP, EN_DASH, ELLIPSIS, SP_ANY_SRC } from "../lang/maps";

const WJ = "⁠";

// Базовый набор единиц для number+unit; языковые правила могут расширять.
// Расширен SI-юнитами и ru-сокращениями годов/веков (`гг.` / `вв.`),
// которые должны быть «прижаты» к предшествующему числу.
const COMMON_UNITS_RE = new RegExp(
  `(\\d+)${SP_ANY_SRC}+(кг|г|см|мм|мг|м|л|км|т|мл|млн|тыс\\.?|₽|€|\\$|%|` +
    `ч\\.?|мин\\.?|сек\\.?|мкс|нс|мс|Гц|кГц|МГц|ГГц|` +
    `мкА|мА|А|мкм|В|кВ|мВ|Вт|кВт|МВт|мВт|Ом|кОм|МОм|дБ|лм|лк|` +
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
