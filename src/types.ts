export type Language = "ru" | "en" | "fr" | "es" | "de" | "uk" | "bcs";

export type Replacement = {
  start: number;
  end: number;
  text: string;
  reason?: string;
};

export type Plan = {
  nodeId: string;
  replacements: Replacement[];
  lang: Language;
  before: string;
  after: string;
};
