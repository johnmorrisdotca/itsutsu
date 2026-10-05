# PTS-05 The puzzle ladder: every puzzle priced on one scale

John, 2026-10-05, approved "Option B" from the pricing audit: puzzle IP on one
ladder, 50 for the smallest and easiest offering of a puzzle, about 100 for a
standard one, 150 for the hardest, and 200 for the top of the three families of
256 fixed levels. It replaces the per-kind weights of PTS-01 (`PUZZLE_IP_WEIGHT`,
removed) that scaled each puzzle's own points and left a Number Place 16x16 at
280 IP, a Picture logic 20x20 at 400 and a Cube 2x2 at 44.

## What changed, and what did not

- **A puzzle's own score is unchanged.** `PuzzleSolve.points` is still
  PuzzleMadness's rule (five a cell, less fifty a help; `puzzlePoints.ts`) and is
  still what each puzzle's own leaderboard ranks.
- **IP is the price, not the score.** What a solve is worth in IP is
  `solveIp` in `src/lib/points/ladder.ts`, from the kind, size and level.
- **Nothing is stored.** IP for a puzzle is worked out when a board is drawn
  (`ipBoards.ts`, in SQL through `ladderSql.ts`), as it was before, so a change to
  a price reprices every solve ever kept. There is no migration.
- A member's best solve of each grid counts once, as before.

## The price

`price(kind, size, level, rank?)`:

1. **Size rung.** From 50 at the smallest size a kind offers to 125 at the
   largest, spaced geometrically by the work a size measured to take (the mean
   of what its solves were worth under the old weights, over every level),
   rounded to the nearest 5. The tables are in `ladder.constants.ts`. A size a
   kind makes but does not offer sits between its neighbours.
2. **Level.** Easy adds 0, Medium 10, Hard 25. A kind made at one level only
   (FreeCell, Spider) adds nothing, and Hidden Stones, which has no medium,
   adds 0 or 25. So an ordinary puzzle never pays more than 150.
3. **Fixed-level families (Meikyuu, Suido, Tsunagi).** The rung runs 50 to 150
   by size and the level's place among its size's 256 adds 0 to 50 (to the
   nearest 5), so the top is 200. Their rungs round to 5 up to 100 and to 10
   above it. A kept solve says which third of the levels it was in, not its
   number, so a solve read back is priced at the middle of its third (levels 43,
   128 and 213: +10, +25, +40). `price` takes the exact `rank` where a caller
   has one.
4. **Words.** Gomoji, Mot and Wort: 4, 5 and 6 letters are 50, 90 and 125; Kana
   3, 4 and 5 the same; Pop 3 to 6 are 50, 80, 105 and 125 (7 stays at 125).
5. **Kumimoji.** The rung is read from the tiles in the bag, 50 at 40 tiles to
   125 at 288, then the level adds.
6. **Koushi.** 100, 110 and 125 by level.
7. **Cards.** Solitaire: Draw 1 is 100, Draw 3 110, then the level adds (passes
   through the stock). FreeCell: 4, 3 and 2 free cells are 50, 100 and 150.
   Spider: 1, 2 and 4 suits are 50, 100 and 150.
8. **Tobiishi.** 3, 6 and 9 jumps are 50, 85 and 125, and no level adds: a length's
   levels are boards and goals, not difficulty. It paid 30, 60 and 90 before.

Measured table (rung at the smallest to largest offered size, Easy):

| Puzzle | Rungs |
|---|---|
| Number Place 4, 6, 9, 16 | 50, 75, 100, 125 |
| Jigsaw 5, 6, 7, 9 | 50, 70, 90, 125 |
| Diagonal, Sum Cages 6, 9 | 50, 125 |
| More or Less, Towers 4 to 7 | 50, 80, 105, 125 |
| Hidden Stones 4, 7, 9, 12 | 50, 90, 105, 125 |
| Black and White 6, 8, 10, 12 | 50, 80, 105, 125 |
| Bridges 7, 9, 11, 13 | 50, 85, 105, 125 |
| Picture logic 5, 10, 15, 20 | 50, 90, 110, 125 |
| Mahjong 8, 9, 10, 15 | 50, 90, 110, 125 |
| Cube 2 to 5 | 50, 85, 105, 125 |
| Shikaku 5, 7, 9, 12 | 50, 70, 90, 125 |
| Regions 4, 5, 6 | 50, 80, 125 |
| Cross Sums 10 (one size, one level) | 100 |
| Jirai 7, 9, 12, 16 | 50, 65, 95, 125 |
| Meikyuu small, medium, large, huge | 55, 95, 120, 150 (to 105, 145, 170, 200) |
| Meikyuu tall 6x9 to 20x30 | 50, 60, 70, 80, 90, 100 (to 100 ... 150) |
| Suido 5x5 to 14x14 | 50 to 150 (to 100 ... 200); long boards 65, 90, 120 |
| Tsunagi 4 to 15 | 50 to 150 (to 100 ... 200) |

## What help and play do to it

`solveIp(facts)`, repeated in SQL:

- **A puzzle scored by the cell** (the grids, Bridges, Picture logic, Cube, the
  cards, Mahjong, Suido, Meikyuu) keeps the price times the share of its own score
  that help left, score / (score + 50 for each Check or Hint), so a help still
  costs. A helped solve (`helped`) scores nothing and so pays nothing.
- **A word, Kumimoji and Koushi** are scored by speed and tidiness as well as by
  finishing. A finished one pays 0.5 + 0.5 times its share of a good solve's
  points (160 a letter; 15 a tile; 880), the share never above 1. A word that ran
  out of guesses (`solved` false) pays only the share.
- Each solve rounds to the nearest 5, and one that scored anything pays at least 5.
- A word of more than one board (Futago, Yotsugo) is priced by its letters like
  any other and so earns the same price for more work; its share reaches 1 sooner.

## Held by

- `ladder.coverage.test.ts`: every `PuzzleKind` has a pricing (a `Record`, so a
  new kind does not compile without one) and a rung for each size it can be
  made at; every size and level is priced between 50 and 150 (200 for the
  families), to the nearest 5, and rises with size and level; the ranked
  families rise through all 256 levels; the stated tables.
- `ladderSql.play.test.ts` (`LADDER_SQL=1`, on a development database): the SQL
  gives `solveIp`'s figure for 1,900 seeded solves, helps and lost words included.
- A new puzzle adds its row to `PUZZLE_PRICING`
  and its rungs from a measurement of its sizes, as above.
