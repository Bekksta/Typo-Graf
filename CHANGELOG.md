# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] — 2026-06-08

Second smoke-test pass on long «landing-style» texts (canvas 166:2 in the Figma project). See [`docs/smoke-test-v1.0.2.md`](docs/smoke-test-v1.0.2.md) for the full audit; 7 issues fixed below.

### Fixed
- **Common (all languages).** Space between `…` and an opening quotation mark / parenthesis was being eaten by the ellipsis compact-rule — `слово… "цитата"` collapsed to `слово…"цитата"`. The `ELLIPSIS_SPACE_RIGHT_RE` lookahead now also covers `" ' « „ “ ‘ (`, so the inter-word space is restored.
- **Common (all languages).** `-2 °C`, `-15 %`, `-300 ₽` and similar minus-prefixed numbers now correctly get NBSP between the signed number and the unit. The capture group in `COMMON_UNITS_RE` was widened from `\d+` to `[-−]?\d+`. `°C`, `°F`, `°` added to the common units alternation (they were not in any per-language list and slipped through).
- **Russian / Serbian Cyrillic.** `60 км/ч. Все права…` no longer glues `ч.` to the next word. The unit-abbreviation rule now recognises that an abbreviation preceded by `/` or word-joiner is part of a composite unit (`км<WJ>/<WJ>ч.`), not a standalone abbreviation.
- **Ukrainian.** Composite units `Мбіт/с`, `Кбіт/с`, `Гбіт/с`, `Мбіт/сек`, `Кбіт/сек`, `Гбіт/сек`, `км/год` are now protected from `applyMathDivision` (which would otherwise insert spaces around `/`). Previously only the Russian and Latin spellings (`Мбит/с`, `Mbit/s`, `км/ч`, `km/h`) were in the dictionary.
- **BCS (Bosnian / Croatian / Serbian Latin).** Thousands grouping with NBSP was not applied (`1234567` stayed solid). `applyBCSRules` now calls `groupThousands(t, NBSP)` after quotes and unit-NBSP.
- **English.** Single quotation marks: opening `'I` now becomes `‘I` (left curly U+2018) instead of `’I` (right curly U+2019); closing `inches.'` now becomes `inches.’` instead of staying ASCII `'`. Apostrophe-inside-word and word-end behaviours unchanged.
- **Language detection.** Italian texts without unique markers (`ò`, `ì`) used to lose to French or Spanish on shared diacritics. Added Italian-specific markers: `-iamo` verbs (`abbiamo, siamo, andiamo, vediamo, sappiamo`), connectives (`oppure, dunque, tuttavia, disse, tutti/a/o/e`) and business honorifics (`Dott`, `Sig`, `Egr`).

### Docs
- New [`docs/smoke-test-v1.0.2.md`](docs/smoke-test-v1.0.2.md) — landing-text audit with codepoint-level diffs and per-bug source-pointers.
- Russian-quotation note in §2.2 corrected: punctuation (`.`, `,`, `…`) stays outside the closing guillemet, per Розенталь, not inside — the previous wording contradicted both the cited source and the actual implementation.

## [1.0.1] — 2026-05-29

Pre-release smoke-test pass (see [`docs/smoke-test-v1.0.0.md`](docs/smoke-test-v1.0.0.md) for full audit).

### Fixed
- **Russian.** Consecutive proclitics (`и в почте`) — only the first was getting NBSP because the matching boundary character was being consumed; now both get NBSP via lookbehind (`и<NBSP>в<NBSP>почте`).
- **Russian.** Proclitics now glue before typographic symbols `№ § © ® ™ ¢ £ ¥ € ₽ $ −` (lookahead extended). Previously `по № 5` stayed with a regular space; now becomes `по<NBSP>№<NBSP>5`.
- **English.** Single-letter Latin variables in math contexts (`a · b`, `A → B`, `I — that`) are no longer mistakenly glued as articles. The proclitic lookahead was tightened from any non-whitespace to letters/digits/smart-quote-opening, and the case-insensitive flag was dropped (Title-case forms are listed explicitly).
- **English.** As a symmetric side-effect: `the iPhone` no longer adds NBSP between `the` and the masked brand — same behavior as Russian.
- **Serbian Cyrillic.** Closing quotation mark switched from U+201D (`"`, English right double) to U+201C (`"`, left double — the canonical mirror partner of `„` per *Pravopis srpskog jezika*).

### Changed
- **English (potentially breaking).** Latin abbreviations `e.g.` and `i.e.` are now Chicago Manual / Garner's-style: written solid as `e.g.`, `i.e.` (no internal NBSP) with NBSP only before the following word. Previous behavior was German-style `e. g.` (NBSP inside). If you have v1.0.0 layouts in Figma with `e. g.`, running the plugin again will normalize them to `e.g.`.

### Docs
- Russian proclitic list in [`docs/typography-rules.md`](docs/typography-rules.md) §2.2 synced with [`src/lib/ruLib.ts`](src/lib/ruLib.ts) (added `перед, меж, то, как, чтоб, чтобы, зато, однако, мол, дескать, там, тут, так, где, ну`).
- `г-н Иванов` example in §2.2 corrected (was using `<NBH>` tag, code does `<NBSP>`).
- Multi-space collapsing (`/ {2,}/g`) added to common rules in §2.1.
- §2.9 clarified: brand names are masked **before** detect (not only URL/email) — otherwise brand-heavy Russian text could be misdetected as Portuguese.
- New `docs/smoke-test-v1.0.0.md` — full bug-by-bug audit with Figma-board sources and verification scripts.

## [1.0.0] — 2026-05-28

First public release.

### Added

#### Languages
- Typography rules for **11 languages**: Russian, English, French, German, Spanish, Italian, Polish, Portuguese, Dutch, Ukrainian, BCS (Bosnian / Croatian / Serbian Latin), plus Serbian Cyrillic as a Russian-rules variant.
- Automatic language detection per text layer: unique markers (`ä ö ü ß` → de, `ñ ¿ ¡` → es, etc.) for instant resolution, soft-scoring fallback (shared diacritics × 1 + frequent characteristic words × 5).
- URL/email masking happens **before** detection so addresses don't tip the result toward Latin.

#### Common rules (all languages)
- `...` → `…` (U+2026) with surrounding-space cleanup.
- `10-12` → `10–12` (en-dash for numeric ranges).
- Double spaces collapsed to single.
- Number + unit/currency/percent → NBSP. Wide units coverage: SI, time, frequency, electricity, light/sound, pressure, energy, digital (bit/byte and prefixes), imaging/UI, all major currencies.
- Composite units with `/` (`Мбит/с`, `км/ч`, `об/мин`, `кг/м²`, `руб/шт`, …) — slash wrapped in U+2060 (Word Joiner) by a curated dictionary, so they don't get split by the math `/` rewriter.
- ISO 8601 dates (`2024-12-31`, `2024-12-31T23:59:59+03:00`) and year-month (`2024-12`) protected via U+2060 so they don't break into en-dash and stay unbreakable in layout.
- Version strings (`v2.0.0-alpha`, `1.2.3`, `1.2.3-rc1`, `0.10-rc1`) protected as opaque tokens.
- Primes: `12''` → `12″`, `12'` → `12′`.
- `45 deg` → `45°`.
- `(c)/(C)` → `©`, `(r)/(R)` → `®`, `(tm)/(TM)` → `™`.
- CRLF / lone CR → LF. NFC normalization on input. Trailing orphan line breaks stripped (paragraph breaks preserved).
- Thousands grouping for ≥5-digit numbers with the locale's preferred separator.

#### Math rules (inline, all languages)
- Powers/subscripts: `x^2` → `x²`, `10^-3` → `10⁻³`, `x_1` → `x₁`, `log_10(x)` → `log₁₀ x`.
- Multiplication: `a*b` → `a · b`, chains preserved. Bold `**...**` not touched.
- Division: `a/b` → `a / b`, `1/2` → `½`, common vulgar fractions.
- Comparisons: `!=` → `≠`, `<=` → `≤`, `>=` → `≥`, spaces around `≈ ≃`.
- Signs/arrows: `+-` → `±`, `->` → `→`, `<=>` → `⇔`, `-->` → `⟶`.
- Constants and functions: `pi` → `π` (lowercase only — `Pi` stays as a possible noun), `sqrt(x)` → `√x`, `inf` → `∞`, `\alpha` → `α`, `sin(x)` → `sin x`, `lim(x→0)` → `limₓ→₀`, `vec(a)` → `a⃗`.

#### Language-specific highlights
- **Russian.** Proclitics + NBSP, enclitics (`бы/ли/же/ль`), initials, abbreviations with dot (units vs generic), composite abbreviations (`и т. д.`, `до н. э.`), hyphenated abbreviations (`г-н`, `д-р`, `р-н`) with NBH (U+2011), angle quotes `«…»`, em-dash for date ranges with U+2060 wrap, financial Unicode minus (`-300 ₽` → `−300 ₽`), `и/или` normalization, thousands NBSP.
- **Russian ё-fication.** ~107 000 safe word forms from [eyo-kernel](https://github.com/e2yo/eyo-kernel). Only forms without a `е`-homograph are replaced.
- **English.** Smart quotes with nested handling, smart apostrophes, honorifics (Dr./Mr./Prof./…) + NBSP, Latin abbreviations (e.g./i.e./etc.), em-dash from `--`, US thousands grouping with comma.
- **French.** Guillemets « » with narrow NBSP, narrow NBSP before `;:?!»`, smart liaison apostrophe, thousands with narrow NBSP.
- **German.** Quotes `„…"`, compound abbreviations (`z.B./u.a./d.h./n.Chr.`), thousands with dot.
- **Spanish.** Quotes `"…"`, paired `¿…?`/`¡…!`, thousands NBSP.
- **Italian, Polish, Portuguese, Dutch, Ukrainian, BCS, sr-Cyrl** — quote conventions, proclitic NBSP where applicable, locale-appropriate thousands grouping.

#### Architecture & safety
- URL / email / version / brand-name **masking** via equal-length placeholders in the Unicode Private Use Area (U+E000–U+F8FF) — rules can't accidentally rewrite them; copy-paste preserves valid addresses.
- **Style preservation.** Edits applied via LCS-diff and range-based `node.deleteCharacters`/`insertCharacters` — bold, italic, fonts, sizes, colors stay in place.
- **Idempotent.** Property-based tests (fast-check) verify repeated runs produce no drift.
- **Multi-pass convergence.** Up to 3 iterations of `math → common → lang-specific` until stable (usually 1–2).
- **Offline.** `networkAccess: none` in manifest; nothing leaves the user's machine.

#### Interface
- Native Figma progress notification (`Typografing… 47%`), throttled to ~700 ms to avoid flicker.
- Cancel via `×` on the notification — partial results remain; revert with `Ctrl/⌘+Z` (one undo group per run).
- Final summary localized to UI language: counts of changes, affected nodes, languages used, skipped (font / too-long), and 2000-node truncation if applicable.
- UI labels and notifications in 11 languages, picked by Figma's `navigator.language`.

#### Tests & docs
- 407 vitest unit/integration tests + 9953 diagnostic cases.
- Showcase (`npm run showcase`) renders a representative corpus with before/after and invisible-char markers.
- Bench script for performance regressions.
- `docs/typography-rules.md` — detailed rules reference (sources, what's done, what's intentionally skipped, technical notes).
- `README.md` (English) and `README.ru.md` (Russian) — full user-facing documentation.

### Limitations
- Per-run cap: 2 000 text nodes; nodes longer than 5 000 characters are skipped (counted in summary).
- Nodes with unavailable fonts are skipped.
- Selection works at node level, not at individual characters inside a node.
- Mixed-script text uses rules of the dominant script; on very short ambiguous strings detection is best-effort.

[1.0.1]: https://github.com/Bekksta/Typo-Graf/releases/tag/v1.0.1
[1.0.0]: https://github.com/Bekksta/Typo-Graf/releases/tag/v1.0.0
