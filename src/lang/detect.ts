import { Language } from '../types';


const CYR = /[\u0400-\u04FF]/;
const LAT = /[A-Za-z]/;


// Маркеры диакритик/символов
const HAS = {
    es: /[ñáéíóúü]/i,
    fr: /[çàâäæèéêëîïôœùûüÿ«»]/i,
    de: /[äöüß]/,
    uk: /[іїєґ]/i,
    bcs: /[čćšđž]/i,
    srCy: /[ђћј]/i
};


export function detectLanguage(text: string): Language {
    const cyr = CYR.test(text);
    if (cyr) {
        if (HAS.uk.test(text)) return 'uk';
        if (HAS.srCy.test(text)) return 'ru'; // упрощённо, позже можно выделить sr-cyrl
    return 'ru';
    }
    if (HAS.fr.test(text)) return 'fr';
    if (HAS.de.test(text)) return 'de';
    if (HAS.es.test(text)) return 'es';
    if (HAS.bcs.test(text)) return 'bcs';
    if (LAT.test(text)) return 'en';
    // фолбэк
    return LAT.test(text) ? 'en' : 'ru';
}