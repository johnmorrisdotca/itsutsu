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

## And one word for bots

John, 2026-10-06: the bots are コンピュータ in Japanese, everywhere. 機械 (the
Players tab, `WhoFilter`, `memberKind.ts`, the mark beside a bot's name and
rating in `PlayerFigures`, `recordTrailing`, `MyRecord`, `OpenGamesBoard`, the
standings page) and 棋士 (About's chapter and `about.engine.tsx`) change to it.
対コンピュータ stays as the set-up heading. `e2e/set-up-again.spec.ts` and
`e2e/computer-ladder.spec.ts` assert 機械, so they change in the same commit.
The mark beside a name is narrow, so look at it at 390px.

## Done when

The check passes with no exceptions left unexplained, and the home page,
/learn, a player's page and /about read in one language each way, clicked in
a browser both ways (AGENTS.md: test the way back).
