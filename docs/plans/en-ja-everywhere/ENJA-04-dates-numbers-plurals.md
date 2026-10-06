# ENJA-04. Dates, numbers and counts in the reader's language

Board key: `dates-numbers-and-counts-in-the-reader-s-language-with-no-en-us-or-en-gb-written`.
Kind: fix. Priority normal. Needs ENJA-02.

## Why

- `toLocaleString("en-US")` is written into `MemberStrip.tsx`, `MyXp.tsx` and `FeedLine.tsx`, and `"en-GB"` into `PhraseSetup.tsx` and `rating/figures.ts`.
- English month and day names are hard-coded in `SectionedDocument.tsx`, `recordMonth.ts` and `daysOff.ts`.
- About 194 counts are pluralised by hand (`=== 1 ?`, `+ "s"`). Japanese has no plural but needs counter words (1局, 3手, 5人, 2回).

## Do

1. `src/lib/ui/when.ts` avoids `Intl` on purpose: Node and Chromium disagree, and `Intl` in render is a hydration bug (AGENTS.md). Keep that. Add per-language month and day tables and a number grouper beside it, and have every caller pass the speaker's locale.
2. One count helper: a phrase with `{count}`, English one/other, Japanese with its counter. Replace the hand-built plurals.
3. Extend the ENJA-02 gate to fail on `toLocale*("en` and on `=== 1 ?` plurals.

## Done when

The gate holds both patterns at zero, and a Japanese reader sees 2026年10月6日 and 3局 where English shows 6 Oct 2026 and 3 games.
