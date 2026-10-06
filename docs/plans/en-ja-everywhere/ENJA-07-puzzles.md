# ENJA-07. Every puzzle's words in English and Japanese

Board key: `every-puzzle-s-words-in-english-and-japanese`.
Kind: feature. Priority normal. Needs ENJA-05.

## Where

`src/lib/puzzles/puzzles.constants.ts` (about 180 strings), `src/components/puzzles/`
(about 180 inline), the pencil, Meikyuu, Suido, Tobiishi, Mahjong and Number
Place screens, hints, the kept-run notes in My games, and the race pages.

## Watch

- `puzzles.coverage.test.ts` asks every puzzle the New Game Gate's questions. Add "has Japanese copy".
- The names already settled: Shikaku, Akari, Hitori (plain Japanese words), and Cross Sums, Regions, Loop (plain English, because the Japanese brand names are trademarks). The reviewer checks the Japanese for each against the trademark rule, and does not translate a brand back in.
- Word puzzles (Gomoji, Kumimoji) already choose their language as a setting. That stays; this ticket is their screen words.

## Done when

These paths are off the pending list, and one of each kind has been solved in Japanese.
