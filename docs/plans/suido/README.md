# Suido 水道: the pipe puzzle

**Status: levels and boards since 2026-10-01; expanded 2026-10-05** (huge boards, big pieces, blocks that turn as one).
Source package: `@johnmorrisdotca/suido` 1.4.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/suido, MIT, no dependencies).

A pipe puzzle is a puzzle (a `PuzzleKind`, `src/lib/puzzles/suido/`), never a row in
`VARIANT_SPECS`: pieces that are only turned, a pump, and water that runs through every
opening that meets another. It follows `docs/plans/numbers/README.md` and is, with Tsunagi,
one of the two puzzles of fixed levels the later ones (Meikyuu, Tobiishi) mirror.

## What is played

- **Levels**: 256 fixed boards at each of 13 sizes (5×5 to 14×14, and the long 5×7, 6×10 and 8×14) and
  **64 at each of the three huge ones** (20×20, 28×28 and the long 20×50), the same for everybody, in blocks of sixteen that open
  one after another. Twists a level declares: drains, several pumps, locked pieces, walls, edges that join, inlet to outlet.
  The huge sizes teach drains, pumps and wrap, one to a block (locked pieces and walls only make a board easier than the
  boards it is ranked among, so they cannot sit at the top of a size's range).
- **Make a board**: a new board from a seed, at any of the sixteen sizes, four tiles a shelf.

## The huge boards (2026-10-05, package 1.4.0)

| Decision | What | Where |
| --- | --- | --- |
| Sixteen sizes, four shelves of four | The set-up keeps room for four boards (`picker.test.ts`): the tiles are `5–8`, `9–12`, `13, 14, 20, 28` and the long `507, 610, 814, 2050`, one press turns to the next. Make a board uses the same shelves (`PuzzleSizes`, now N shelves, was two): Pop Gomoji's five sizes are the two it had | `suido/sizes.ts`, `components/puzzles/sizeShelves.ts`, `PuzzleBoardAndSizes.tsx` |
| The 20×50 is size 2050 | A long board's width and then its height in two digits each, as 507 is 5×7 | `suido/sizes.ts` |
| 64 levels, four blocks | `suidoLevelCount` says 256 or 64; the third a level is in (easy, medium, hard) follows its size's count | `suido/levelCounts.ts` |
| A server never carries the huge boards | The three files are 53, 103 and 130 KB, over what a function may grow by (0.2 MB, `functions:size`). The server's copy of `suido/levels.ts` reads the thirteen sizes it always has, each by its own entry (`levels-5x5` …), and the counts, blocks and marks from the package's `levels-info`, which carries no board; the package's `levels` entry, with the loader that names all sixteen, is reached only by the browser, inside `typeof window`. A server knows a huge level by the hash and first forty characters of its board (`hugeLevels.data.ts`, 206 lines, `node scripts/suido-huge-hashes.ts`), which is all a check, the list of a member's solves and a level's fastest times need; the answer is checked in full by the package whatever the hash says | `suido/levels.ts`, `suido/boardHash.ts`, `suido/hugeLevels.data.ts`, `server/suidoRecords.ts`, `PuzzleSolvePage.tsx`, `prepareOnServer.ts` |
| Codes up to 1,300 characters | A 20×50 level is 1,008 characters, a board made at the most squares the set-up asks for a little under 1,300 (`SUIDO_CODE_MOST`, which is `mostCells`, so what a route accepts of a Suido code, and was 400). Every route's own cap is the largest of the specs' (`PUZZLE_CODE_LONGEST`, Meikyuu's 2,600), so no route's body limit moved, and neither did the steps log's (`STEP_LOG_LONGEST`): a Suido tap writes 3 characters, or 12 for a square of four pieces | `suido/sizes.ts`, `puzzles.constants.ts` |
| The ladder | The three huge sizes take the top rung (150): a level family's ceiling is 200, which is the top rung and the 50 a level's place adds, so they pay what the 14×14 pays at its hardest and no more. A kept solve pays by its third, as every size does | `points/ladder.constants.ts` |
| Made huge boards in a browser's time | `generateSuido` asks the package for two boards, not sixty, from 400 cells up, and within 12 of the level's aim: a 20×50 drains board is made in about 0.3 s on a laptop (it was 20 s). The package's drains solver is faster too (1.4.0) | `suido/generate.ts` |
| Zoom and pan | A huge board is looked at through the package's own view (`attachSuidoView`): a pinch, a drag once zoomed in, the wheel with control held, and three buttons under it (− + Whole board), a press that moved never a tap. The 10 to 14 wide boards keep Tsunagi's box (`TsunagiViewport`) and its pad | `SuidoBoard.tsx`, `SuidoZoomBar.tsx`, `SuidoSolve.tsx` |
| A tap to the screen on a big board | `paintSuido` writes only what changed, and dry arms and drips are hidden a moment after the water leaves them: about 56 ms on a 28×28 and 70 ms on a 20×50 with Chromium's CPU slowed four times, from about 90 and 125 | the package's `paint.ts`, `style.ts` |

Not done: levels with big pieces or blocks (a fixed level keeps its board for good, and the three huge sizes were made before
those existed).
