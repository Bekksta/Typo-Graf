export type Language = "ru" | "en" | "fr" | "es" | "de" | "uk" | "bcs" | "it" | "pl" | "pt" | "nl" | "sr-Cyrl";

export type Replacement = {
  start: number;
  end: number;
  text: string;
  reason?: string;
};
