export type Language = 'ru' | 'en' | 'fr' | 'es' | 'de' | 'uk' | 'bcs';


export type Replacement = {
    start: number; // inclusive
    end: number; // exclusive
    text: string;
    reason: string; // for report
};


export type Plan = {
    nodeId: string;
    replacements: Replacement[];
    lang: Language;
    before: string; // snapshot (masked)
    after: string; // after applying (masked)
};