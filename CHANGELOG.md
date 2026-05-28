# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/Bekksta/Typo-Graf/releases/tag/v1.0.0
