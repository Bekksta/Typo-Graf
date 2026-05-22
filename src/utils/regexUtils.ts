// Утилиты для работы с регулярными выражениями.

const REGEX_METACHARS_RE = /[.*+?^${}()|[\]\\]/g;

/**
 * Экранирует regex-метасимволы в строке, чтобы её можно было безопасно
 * подставить в `new RegExp(...)` как литерал. Покрывает .*+?^${}()|[]\.
 */
export function escapeRegex(s: string): string {
  return s.replace(REGEX_METACHARS_RE, "\\$&");
}
