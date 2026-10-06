# ENJA-03. One language a line: the hand-written English and kanji pairs switch with the reader

Board key: `one-language-a-line-hand-written-english-and-kanji-pairs-switch-with-the-reader`.
Kind: fix. Priority normal. Needs ENJA-02.

## Why

About 200 `font-mincho` spans in about 170 files write "English 漢字" by hand,
outside `Paired` and `OneName`, so a Japanese reader sees both halves and an
English reader sees kanji where the component would have chosen. AGENTS.md
already says a label is one language on one line, through `OneName`.

## Do

1. `grep -rn "font-mincho" src/app src/components`; each hand pair becomes
   `Paired`/`OneName`/`pairName`, reading the speaker.
2. A game's kanji name beside its English name is the site's look and stays
   for English readers; for a Japanese reader the kanji is the name.
3. Add a check (beside `gamePictures.coverage.test.ts`) that fails on a new
   hand-written pair outside the components.

## Done when

The check passes with no exceptions left unexplained, and the home page,
/learn, a player's page and /about read in one language each way, clicked in
a browser both ways (AGENTS.md: test the way back).
