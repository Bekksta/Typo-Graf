// Объявление модуля для импорта .txt как строки.
// Загружается esbuild'ом (--loader:.txt=text) в проде и кастомным
// vite-плагином в тестах (см. vitest.config.ts).
declare module "*.txt" {
  const text: string;
  export default text;
}
