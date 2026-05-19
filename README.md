# Typo Graf

**English** · [Русский](README.ru.md)

A Figma plugin that brings layout text to typographic standards — places non-breaking spaces, smart quotes, dashes, superscripts, units, fixes apostrophes and Russian `ё`-fication. Eleven languages, URL/email/brand protection, style preservation, offline.

## Why it

- **Lightweight.** Bundle < 1 MB — including a built-in ё-fication dictionary of ~107,000 word forms. No UI frameworks, no splash screens, no onboarding.
- **No friction.** Opens instantly: a progress bar and a Cancel button — that's all that's on screen.
- **Offline.** All rules, dictionaries and logic ship inside the bundle. `networkAccess: none` in the manifest — nothing leaves your machine.
- **Preserves styles.** `bold`, `italic`, fonts, sizes and colors stay in place — edits are applied through ranges, not by rewriting node text.
- **Leaves URLs, emails and brand names alone.** Protected with equal-length masks during the rule pass.
- **One run — one undo.** All changes are reverted with a single `Ctrl/⌘+Z`.
- **One click and it works.** No settings, no dialogs, no mode picker.
- **Idempotent.** Running the plugin twice on the same text never adds drift — repeated passes are no-ops.

## How to use

1. **Plugins → Typo Graf** in the Figma menu. If something is selected, the plugin processes text nodes inside the selection (including nested). If nothing is selected, it sweeps every text node on the current page.
2. Wait for it to finish (or hit Cancel).
3. When done, the plugin shows a summary: how many edits, on how many nodes, in which languages.

Limit per run — 2000 nodes. Nodes with text longer than 5000 characters are skipped and counted in the final summary.

## Languages

Detected automatically per text layer in two stages. URLs and emails are masked before detection, so addresses don't tip the result:

1. **Unique markers** — if a text contains a character that's used in only one of the supported languages, that language wins immediately. No counting needed.
2. **Soft scoring** — if no unique marker is found, the plugin sums two signals per language: shared diacritics (`é`, `à`, `è`, …) at weight 1 per char, and frequent characteristic words (`perché`, `der/die/das`, `het/een`, …) at weight 5 per word. Highest score wins. Ties go by a priority approximating worldwide speaker counts: `en` > `es` > `pt` > `fr` > `de` > `it` > `pl` > `nl`.

| Language | Unique markers (instant) | Soft markers (scoring) |
|----------|--------------------------|------------------------|
| `ru` | Cyrillic (fallback) | — |
| `uk` | `і ї є ґ` | — |
| `sr-Cyrl` | `ђ ћ ј љ њ` | — |
| `en` | Latin (fallback) | — |
| `de` | `ä ö ü ß` | — |
| `es` | `ñ ¿ ¡` | `á í ó ú ü` |
| `fr` | `ç œ ÿ æ` | `à â è é ê ë î ï ô ù û` |
| `it` | `ò ì` (grave on o/i) | `à è ì ò ù` |
| `pt` | `ã õ` (nasal tildes) | `â ê ô` |
| `pl` | `ą ę ł ń ś ź ż` | `ó` |
| `nl` | frequent words: `het`, `een`, `van`, `zijn`, `niet`, `maar` | — |
| `bcs` | `č š ž` (`bs`/`hr`/`sr` Latin) | — |

For mixed scripts the **dominant** wins (Cyrillic vs Latin letter count). E.g. «It is awesome, but мир exists» → `en`, «Привет, hello, как дела?» → `ru`. Ties go to Cyrillic.

## Rules

### Common (all languages)

- `...` → `…` (U+2026), surrounding extra spaces cleaned up.
- `10-12` → `10–12` (en dash for numeric ranges).
- Double spaces (and after `.!?`) → single space.
- `12 kg`, `20 %`, `300 $`, `100 МГц`, `470 Ом` → NBSP between number and unit/currency/percent.
- `12''` → `12″`, `12'` → `12′` (primes).
- `45 deg` → `45°`.
- `(c)`/`(C)` → `©`, `(r)`/`(R)` → `®`, `(tm)`/`(TM)` → `™` (case-insensitive).
- CRLF / lone CR → LF. NFC normalization on input (`e` + combining acute → `é`).
- Long numbers (≥5 digits) get thousands grouping with the locale's preferred separator (see per-language sections).

### Math

Works on inline expressions, doesn't touch LaTeX/MathML blocks.

- **Powers:** `x^2 → x²`, `y^10 → y¹⁰`, `10^-3 → 10⁻³`, `e^(x) → eˣ`, `(a+b)^n → (a+b)ⁿ`.
- **Subscripts:** `x_1 → x₁`, `log_10(x) → log₁₀ x`.
- **Multiplication:** `a*b → a · b`, chains `a*b*c → a · b · c`. Bold (`**...**`) is preserved.
- **Division:** `a/b → a / b`, `1/2 → ½`, `(a+b)/(c+d)` without replacing `/` with `÷`.
- **Comparisons:** `!= → ≠`, `<= → ≤`, `>= → ≥`, `= → =` (with spaces), spaces around `≈ ≃`.
- **Signs:** `+- → ±`, `-+ → ∓`.
- **Arrows:** `-> → →`, `<- → ←`, `--> → ⟶`, `=> → ⇒`, `<=> → ⇔`.
- **Constants and functions:** lowercase `pi → π`, `sqrt(x) → √x`, `inf → ∞`, `\alpha → α` (and the rest of Greek), `sin(x) → sin x`, `log10(x) → log₁₀ x`, `lim(x→0) → limₓ→₀`, `vec(a) → a⃗`.
- Uppercase `Pi` is **not** converted (could be a proper noun, e.g. "Pi calculation").
- Em-dashes (`—`) between non-digits are preserved as typographic dashes; only ASCII `-`/`–` between alphanumerics become the math minus `−` (U+2212).

### Russian (`ru`)

- NBSP after short prepositions and conjunctions: `в дом`, `на улице`, `и т. п.`
- NBSP before particles `бы`, `ли`, `же`.
- Initials: `А. С. Пушкин` — NBSP between initials and surname.
- Abbreviations with a dot: `г. Москва`, `ул. Ленина`, `№ 8`, `§ 104`, `1981 г.` — NBSP after.
- Year/century closing abbreviations `гг.` / `вв.` — NBSP **before** only (to keep `1991<NBSP>гг.` together), regular space after (these are closing tokens, breaking before the next word is fine).
- Compound abbreviations: `и т. д.`, `т. е.`, `до н. э.` — normalized together with NBSP.
- Hyphenated abbreviations without a dot: `г-н`, `г-жа`, `д-р`, `р-н` — non-breaking hyphen (U+2011) inside and NBSP after.
- Angle quotes `«…»`. Punctuation pulled inside the closing quote.
- Dashes: double hyphen `--` and single `-` between non-numeric tokens → `—`, with the pattern `word<NBSP>—<space>word`.
- Date ranges with em-dash, no spaces: `1991-1995` → `1991—1995`, `январь-март` → `январь—март` (works with nominative and genitive month forms).
- Unicode minus `−` (U+2212) for negative financial values: `-300 ₽` → `−300 ₽`, `-15 %` → `−15 %`. Bullet-list hyphens are left alone.
- `и / или` → `и/или` (no spaces around the slash).
- Thousands grouping with NBSP for numbers ≥5 digits: `1234567` → `1 234 567`. Years (`1991`) and 4-digit IDs stay.
- **Ё-fication on ~107,000 word forms** from the [eyo-kernel](https://github.com/e2yo/eyo-kernel) dictionary. Only "safe" forms are replaced — those without a same-spelling homograph that lacks `ё`. So `ребенок → ребёнок`, `учет → учёт`, `шел → шёл`, but `все` stays as is (homograph of the plural of «весь»). No guessing edits.

### English (`en`)

- Smart quotes: `"..."` → `“…”`, nested `'...'` → `‘…’`.
- Apostrophes inside and at word end: `don't` → `don’t`, `lovers'` → `lovers’`.
- Primes: `12''` → `12″`, `12'` → `12′`.
- `--` → `—` without forcing surrounding spaces (follows source style).
- Ranges: `10-12 km` → `10–12 km`.
- Currency: `$1234.5` → `$1,234.5` (US format). `$ 300` / `300 $` order preserved, NBSP added.
- NBSP after service words (`a`, `an`, `the`, `and`, `but`, `or`, `to`, `of`, `in`, `on`, `at`, `by`, `as`, `I`).
- NBSP before units: `15 km`, `20 %`, `60 mph`, `5 dB`, `100 MHz`.
- Latin abbreviations: `e.g.` → `e. g.`, `i.e.` → `i. e.` (with NBSP inside), then NBSP between the abbr and the next word: `e.g. for example` → `e. g. for example`. Same for `etc.` and `vs.`
- Honorifics + NBSP: `Dr. Smith` → `Dr. Smith`, also `Mr.`, `Mrs.`, `Ms.`, `Prof.`, `St.`, `Sr.`, `Jr.`, `Rev.`, `Capt.`, `Lt.`, `Col.`, `Gen.` — only when followed by a capitalized name. At the end of a sentence the abbreviation is left alone.

### French (`fr`)

- Guillemets `« … »` with narrow NBSP (U+202F) inside.
- Narrow NBSP before `; : ? ! »`.
- Number + unit/currency/percent → narrow NBSP.
- Smart liaison apostrophe: `l'arbre` → `l’arbre`, `d'accord` → `d’accord`, `qu'on` → `qu’on`, `Aujourd'hui` → `Aujourd’hui`.
- Em-dash from `--` and from `-` between non-digit words, surrounded by **regular** spaces (not NBSP, unlike Russian).
- Thousands grouping with narrow NBSP.

### Ukrainian (`uk`)

- Quotes `«…»`.
- NBSP after short prepositions: `в`, `у`, `з`, `із`, `й`, `та`, `а`, `і`.
- Narrow NBSP after `№`, `§`, `стор.`, `рис.`, `м.`.
- Number + unit/currency/percent → narrow NBSP.
- Thousands grouping with narrow NBSP.

### Italian (`it`)

- Guillemets `«…»` (default; keeps `“…”` if already present).
- NBSP after articles (`il`, `la`, `lo`, `i`, `gli`, `le`, `un`, `una`, `uno`) and short prepositions/conjunctions (`di`, `a`, `da`, `in`, `con`, `su`, `per`, `fra`, `tra`, `e`, `o`, `ma`, `se`).
- Abbreviations with a dot + NBSP before a capitalized name: `Sig. Rossi`, `Dott. Verdi`, `Prof. Bianchi`, etc.
- NBSP before units/currency/percent.
- Thousands grouping with NBSP.

### Polish (`pl`)

- Quotes `„…”`.
- NBSP after single-letter prepositions/conjunctions: `i`, `a`, `o`, `u`, `w`, `z`, plus the phonetic forms `ze`, `we`.
- NBSP before units, currency, percent (including `zł`).
- Decimal comma (3,14) is not touched.
- Thousands grouping with NBSP.

### Portuguese (`pt`)

- Smart quotes `“…”` (default; keeps `«…»` if already present — PT-PT tradition).
- NBSP before units, currency (`R$`, `$`, `€`), percent.
- Thousands grouping with NBSP.

### Dutch (`nl`)

- Quotes `„…”`.
- NBSP before units, currency, percent.
- Decimal comma is not touched.
- Thousands grouping with NBSP.
- Detection is by frequent words (`het`, `een`, `van`, `zijn`, …) — Dutch rarely uses diacritics. If your text is short and ambiguous, set the layer language manually in Figma if needed.

### German (`de`)

- Quotes `„…“`. If `»…«` is already used in the text — left alone.
- NBSP before units and currency.
- Decimal comma is not touched.
- Thousands grouping with **dot**: `1234567` → `1.234.567`. Version strings (`1.0.0`) and decimals (`3,14`) are skipped because they already contain dots/commas.
- Compound abbreviations: `z.B.` → `z. B.`, `u.a.` → `u. a.`, `d.h.` → `d. h.`, `u.ä.` → `u. ä.`, `n.Chr.`/`v.Chr.` — NBSP inside, then NBSP before the next word. Also `bzw.`, `usw.`, `etc.` get NBSP after.

### Spanish (`es`)

- Quotes `“…”` by default. If `«…»` is already used — left alone.
- NBSP before units and currency.
- Paired `¿…?` and `¡…!`: if a sentence ends with `?` or `!`, starts with a capital letter and doesn't already contain `¿`/`¡`, the opening mark is added. Only single-sentence cases are touched, so rhetorical fragments with mid-sentence punctuation aren't accidentally rewritten.

### BCS (`bs`/`hr`/`sr` Latin)

- Quotes normalized to the variant found in text (`«…»` or `„…“`). Default — `„…“`.
- NBSP before units and currency.

### Serbian Cyrillic (`sr-Cyrl`)

- Same rules as Russian (initials, short prepositions, em-dash, units, …) **except** quotes (`„…“` instead of `«…»`) and **without** ё-fication (the Serbian Cyrillic alphabet has no `ё`).

## What the plugin does NOT do

- **Doesn't touch URLs and emails.** Masked with equal-length placeholders, restored after the rule pass.
- **Doesn't break line breaks.** `\n` is preserved, no merging across lines.
- **Doesn't poke LaTeX/MathML blocks.** Only short inline operands.
- **Doesn't edit character selection inside a node.** Whole text nodes only.
- **Doesn't ё-fy words with homographs.** So «все» doesn't turn into «всё» where the plural of «весь» was meant.
- **Doesn't touch brand names.** Tokens from `src/dict/brands.txt` (iPhone, JavaScript, Booking.com, Figma, etc.) are protected — case-sensitive: `iPhone` is preserved, but `iphone` is treated as regular text. Add your own brands by editing the file and rebuilding.
- **Doesn't load custom fonts.** Nodes using a font Figma can't access are skipped and counted in the final summary.

## Interface

Window 320×160 px:

- Progress bar.
- Current operation (`Scanning…`, `Processing…`, `Cancelling…`).
- Counter of processed nodes: `X / Y`.
- Cancel button — stops after the current node; whatever has already been applied stays (revert with a single `Ctrl/⌘+Z`).

The final notify is localized to the Figma UI language:

```
Done. Languages: Russian, English. Changes: 142. Nodes affected: 38.
Ctrl/⌘+Z to undo
```

## Localization

UI labels and final notify are localized in nine languages, picked by Figma's `navigator.language`:

| Locale | `navigator.language` match |
|--------|---------------------------|
| English | `en-*` and any unrecognized locale (fallback) |
| Русский | `ru-*` |
| Français | `fr-*` |
| Українська | `uk-*` |
| Deutsch | `de-*` |
| Español | `es-*` |
| Italiano | `it-*` |
| Polski | `pl-*` |
| Português | `pt-*` |
| Nederlands | `nl-*` |
| BCS (Bosnian / Croatian / Serbian Latin) | `hr-*`, `sr-*`, `bs-*` |

## Install (for development)

```bash
npm install
npm run build       # one-shot build
npm run dev         # watch-mode build
```

Then in Figma desktop → **Plugins → Development → Import plugin from manifest** → pick `manifest.json` at the repo root.

## Tests

```bash
npm test            # full test suite (incl. property-based idempotency, ~9800 assertions)
npm run test:watch  # watch mode
npm run showcase    # run a realistic corpus, print before/after with invisible-char hints
npm run bench       # baseline performance benchmark
```

After `npm test` a detailed diagnostic lands in `test-results/report.json`: per rule — input, expected/actual output and the exact mismatch positions with Unicode code points. `npm run showcase` prints clear before → after for a representative corpus, highlighting invisible characters. `npm run bench` reports throughput per language and string size — useful to catch regressions when changing rules.

CI (GitHub Actions) runs the full suite on every push and pull request and uploads `test-results/report.json` as an artifact.

## License

MIT — see [LICENSE](LICENSE).

## Limitations

- Selection works at the node level, not at individual characters inside a node.
- Limit — 2000 text nodes per run; nodes longer than 5000 characters are skipped.
- Nodes with unavailable Figma fonts are skipped.
- Undo — native `Ctrl/⌘+Z` (one undo group per run).
- Mixed-language text gets the rules of the dominant script. For short mixed strings detection is best-effort; URLs and emails are excluded from the count, so they don't tip the result.
