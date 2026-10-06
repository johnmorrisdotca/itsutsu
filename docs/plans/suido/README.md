# Suido 水道: the pipe puzzle

**Status: levels and boards since 2026-10-01; expanded 2026-10-05** (huge boards, big pieces, blocks that turn as one); **the big-pieces levels and the piece guide 2026-10-06** (package 1.5.0).
Source package: `@johnmorrisdotca/suido` 1.5.0, pinned exactly in `package.json`
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
| A server never carries a level's board | The sixteen level files are 1.3 MB between them (the huge three alone 53, 103 and 130 KB), far over what a function may grow by (0.2 MB, `functions:size`), and the thirteen ordinary ones were in every page's function until 2026-10-05. No server reads one now: the counts, blocks and marks come from the package's `levels-info`, which carries no board; the package's `levels` entry, with the loader that names all sixteen, is reached only by the browser, inside `typeof window`; a unit test or a spec reads them through `suido/levelsModule.ts`, which no page may import. A server knows every level by the hash of its board and the first few characters of it (`levelBoards.data.ts`, 100 KB, `node scripts/suido-level-hashes.ts`), which is all a check, the list of a member's solves and a level's fastest times need; the answer is checked in full by the package whatever the hash says. `levelBoards.test.ts` holds the table to the package's levels, and `pageFunction.coverage.test.ts` fails if a page reaches a level file | `suido/levels.ts`, `suido/levelsModule.ts`, `suido/boardHash.ts`, `suido/levelBoards.data.ts`, `server/suidoRecords.ts`, `PuzzleSolvePage.tsx`, `prepareOnServer.ts` |
| Codes up to 1,300 characters | A 20×50 level is 1,008 characters, a board made at the most squares the set-up asks for a little under 1,300 (`SUIDO_CODE_MOST`, which is `mostCells`, so what a route accepts of a Suido code, and was 400). Every route's own cap is the largest of the specs' (`PUZZLE_CODE_LONGEST`, Meikyuu's 2,600), so no route's body limit moved, and neither did the steps log's (`STEP_LOG_LONGEST`): a Suido tap writes 3 characters, or 12 for a square of four pieces | `suido/sizes.ts`, `puzzles.constants.ts` |
| The ladder | The three huge sizes take the top rung (150): a level family's ceiling is 200, which is the top rung and the 50 a level's place adds, so they pay what the 14×14 pays at its hardest and no more. A kept solve pays by its third, as every size does | `points/ladder.constants.ts` |
| Made huge boards in a browser's time | `generateSuido` asks the package for two boards, not sixty, from 400 cells up, and within 12 of the level's aim: a 20×50 drains board is made in about 0.3 s on a laptop (it was 20 s). The package's drains solver is faster too (1.4.0) | `suido/generate.ts` |
| Zoom and pan | A huge board is looked at through the package's own view (`attachSuidoView`): a pinch, a drag once zoomed in, the wheel with control held, and three buttons under it (− + Whole board), a press that moved never a tap. The 10 to 14 wide boards keep Tsunagi's box (`TsunagiViewport`) and its pad | `SuidoBoard.tsx`, `SuidoZoomBar.tsx`, `SuidoSolve.tsx` |
| A tap to the screen on a big board | `paintSuido` writes only what changed, and dry arms and drips are hidden a moment after the water leaves them: about 56 ms on a 28×28 and 70 ms on a 20×50 with Chromium's CPU slowed four times, from about 90 and 125 | the package's `paint.ts`, `style.ts` |

## Big pieces (2026-10-05, package 1.4.0)

A piece that fills four squares (a 2×2) and has up to eight openings, two on each side; one tap on any part of it turns the whole piece a quarter,
where it stands. The package has five kinds (`BIG_KINDS`: an end, a hairpin, two pipes side by side, two bending one inside the other, a straight
pipe with a branch) and solves a network of them as one thing with four facings per piece, checks an answer in O(cells) as the board's piece turned
a whole number of quarters, and draws a plate under each and a ring at its middle.

| Decision | What | Where |
| --- | --- | --- |
| Made boards only | A level keeps its board for good, so the 3,520 levels have none. Make a board offers them; the three huge sizes were made before they existed | `SuidoSetUpOptions.tsx` |
| One choice, "Pieces" | Single pieces or Big pieces, under the kind. Big pieces are a network's, so choosing them chooses Network and choosing Drains takes them off: the last choice wins, nothing is ever disabled | `SuidoSetUpOptions.tsx` (`useSuidoChoice`) |
| The seed says it | `SUIDO_BIG_SEED_BLOCK` (1,920,000,000, a hundred million seeds): a kept run, an address and a race carry only the seed. The address says `squares=big` until a seed is drawn, and then not; a board with squares is a network, so the address never also says `pipes=network` | `random.ts`, `suido/seed.ts` (`suidoSquaresOfSeed`), `puzzleAddress.ts` |
| How many | One for about every 32 cells, never fewer than one: 2 on a 7×7, 5 on a 12×12, 25 on a 28×28, 31 on a 20×50 (`suidoBigCount`). A 20×50's code stays under `SUIDO_CODE_MOST` | `suido/generate.ts` |
| The preview is a board of that kind | The set-up's preview is made from a fixed seed in the block that says the kind and the squares (`suidoPreviewSeed`), so choosing Big pieces draws plates on it, and choosing Network draws a network (it drew drains whatever was chosen) | `SuidoPreview.tsx`, `PuzzleBoardAndSizes.tsx` |
| The server | `boardOf` accepts what the package decodes of a network; the check, the points (a board's pieces), the kept run (`gameFromCode`: a big piece turned alone is another board's) and the answer found again (`solve`) all read the package | `suido/check.ts`, `suido/play.ts` |
| A Hint | Lights the whole big piece (its four squares and its plate) and turns it to face the answer (`turnedToFaceAt`) | `SuidoBoard.tsx`, `SuidoSolve.tsx` |
| A row under the board | "Big pieces 大きな駒", like a level's twist chips, with the line that says what it is on a hover or a tap | `SuidoSquaresChips.tsx` |

## Block turns (2026-10-05, package 1.4.0)

Where four pieces sit in a fixed square of cells, one tap on any of them turns all four together a quarter clockwise: each piece moves round
to the next place of the square and turns with it, as a rigid block. A dashed ring marks the square and a turning mark sits at its middle (the
pivot, the corner where the four meet). The four cannot be turned alone. The package solves them as one unit with four facings, so a board has
exactly one answer, and the check is still O(cells): the board as played is the dealt one with each block turned a whole number of quarters.

| Decision | What | Where |
| --- | --- | --- |
| Fixed squares, not any corner | The blocks are chosen when the board is made and never overlap, so a board's answer stays one and the check stays O(cells). A pivot you may pick at any corner would be a different puzzle, and its answer could not be checked this way | the package's `blocks` |
| The same choice as Big pieces | "Pieces" is None, Big pieces or Block turns, one at a time; both make a network, so choosing either chooses Network and choosing Drains takes it off | `SuidoSetUpOptions.tsx` |
| The seed says it | `SUIDO_TURN_SEED_BLOCK` (2,020,000,000, a hundred million seeds, ending under the most a seed can be). The address says `squares=turn` until a seed is drawn | `random.ts`, `suido/seed.ts`, `puzzleAddress.ts` |
| How many | The same count as big pieces: one for about every 32 cells, never fewer than one (`suidoBigCount`) | `suido/generate.ts` |
| Made boards only | A level keeps its board for good, so none has them | |
| A Hint | Lights the block's plate and its four pieces, and turns the block to face the answer | `SuidoBoard.tsx` |
| A row under the board | "Block turns 回転" | `SuidoSquaresChips.tsx` |

## The big-pieces levels and the guide to every piece (2026-10-06, package 1.5.0)

John: "Could we try to make 64 levels, from difficulty 1 through 100 with big pieces integrated?", "why are all the different pieces types not in the documentation?", and "probably should be mixed 1x1 and 2x2 pieces right?". The package made a big piece hold one, two or three separate pipes (699 shapes in 32 families) and a second set of sixty-four levels where every level is a mix of 1×1 and 2×2 pieces, scored 1 to 100 across every size, with more big pieces and trickier ones as the levels climb (`docs/LEVELS.md` and `docs/PIECES.md` in the package).

| Decision | What | Where |
| --- | --- | --- |
| A second set, chosen like Tsunagi's Portals | Two chips under the board on the set-up, Classic and Big pieces (大きな駒). The screen is one (`SuidoSetUpLayout`), drawn from either set's data (`SuidoSetUp` for the sizes' own levels, `SuidoBigSetUp` for the sixty-four), so choosing a set moves nothing. Offered to everyone from the first day, with no unlock | `SuidoSetPicker.tsx`, `SuidoSetUp.tsx`, `SuidoBigSetUp.tsx`, `SuidoSetUpLayout.tsx` |
| Numbered across the sizes, each level at its own size | Level 1 to 64, in blocks of sixteen that open one after another across sizes. The size tiles stay (the set has fourteen of the sixteen: four shelves of four) and are a way about the set: a press goes to the first open level of that size not yet solved, and picking a level makes its size the one shown. A size's levels are not always side by side (the score puts 13×13 and 14×14 in turns), so a size is a list of levels (`suidoBigLevelsAt`) | `suido/bigLevels.ts`, `SuidoBigSetUp.tsx` |
| The seed names the set | The second half of the level block: level N of the set is the block's first seed plus 500 plus N (`SUIDO_BIG_LEVEL_OFFSET`). A size has at most 256 levels, so the two never meet; every record that carries (size, seed) carries a level of either set, so kept runs, solves, races and addresses work as they do. The address says `number=12&set=big` and the size the level is at, whatever size it was asked at | `suido/seed.ts`, `puzzleAddress.ts` |
| A server knows them by hash, as every level | `levelBoards.data.ts` has a `big` entry (the sixty-four, in their order) beside the sizes', written by `scripts/suido-level-hashes.ts` and packed by `pnpm data:pack`; the boards themselves are the browser's (`loadSuidoBigRows`, read from `@johnmorrisdotca/suido/levels-big`), so no server function carries them. `checkSuido` accepts a level of the set at the size it is at | `suido/levels.ts`, `suido/check.ts`, `levelBoards.test.ts` |
| Records | A member's solved levels of the set (`suidoBigSolvedBy`, found by the `;b` every board of the set has) and the fastest on a level (`suidoBigLevelFastest`); this browser's solves are kept with the size's (`keepSolveHere`) and found by the board's hash (`keptBigSolves`). Priced by the ladder as any Suido solve is: the size's rung and the level's third of its set | `server/suidoRecords.ts`, `suidoKept.ts` |
| The guide | A section on the rules page: every piece the package guides (`SUIDO_PIECE_GUIDE`), drawn by the package's own `drawGuidePiece`, with its name and what it does in English and Japanese from the phrase table (`suidoGuideWords.ts`, held to the package's words by `suidoGuide.coverage.test.ts`), then a few big pieces and one of each of the 32 families. It is loaded in the browser only (`SuidoPieceGuideLazy`, `ssr: false`) so no server function carries the package's guide | `SuidoPieceGuide.tsx`, `rules/page.tsx` |
