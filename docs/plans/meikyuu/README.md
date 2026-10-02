# Meikyuu 迷宮: a maze to draw a line through

**Status: added 2026-10-02** (board row
`meikyuu-a-maze-game-of-a-thousand-levels-in-many-shapes-drawn-through-by-finger-or-mouse`).
Source package: `@johnmorrisdotca/meikyuu` 1.0.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/meikyuu, MIT, no dependencies).

A maze is a puzzle (a `PuzzleKind`, `src/lib/puzzles/meikyuu/`), never a row in
`VARIANT_SPECS`: one line, no turns, no colours, nothing the engine, the
simulator or a ladder can do anything with. It follows `docs/plans/numbers/README.md`
and mirrors the two puzzles of fixed levels before it, Tsunagi and Suido.

## What is played

Press the start dot and drag (or tap, which runs the line to the next fork). The
line follows the corridors, cannot pass a wall, and drawing back shortens it. A
big maze is zoomed with a pinch, the wheel or the + and − buttons and moved with
two fingers. The package's own board does all of that (`mountMeikyuu`, fetched in
the browser only); the site adds the wood round it, the clock, Pause, Undo,
Restart, Fit, the kept run and the check. A level has no hint and no clock, as a
Suido level has none, so a time on it is one anybody can be raced on.

The levels are the package's 1,000 mazes: squares, hexagons, triangles, circles
and shapes cut out of them (a heart, a leaf, a star, a ring, a diamond, a cross,
a moon, a big hexagon, a pyramid), in four ways to play (in and out through the
wall, find the goal, out from the middle, collect the keys). The arrow and mixed
puzzles the package also has are not on the site yet (see "Not done").

## How it is put on the site

| Decision | What | Where |
| --- | --- | --- |
| A size is the package's word for how big a maze is | `size` 1 to 4 is small, medium, large, huge (`sizeOf`: under 150, 800 and 4,000 cells, then more). A maze has no side, so the number is only the size's place; the set-up draws it as the big number on the tile like every size. 217, 231, 285 and 267 levels | `meikyuu/sizes.ts`, `meikyuu/levelCounts.ts` |
| A level is its place in its size | The seed IS the level's number in its size, as Tsunagi's is (`fixedLevels`), in the package's order, so no level is easier than the one before. The level's third of its size is its easy, medium or hard | `meikyuu/levels.ts`, `puzzleAddress.ts` |
| The recipe is the puzzle | `givens` is the level's recipe (`square:12x9:wilson:to-goal:48213`, 45 characters at most): a maze is rebuilt from it in every browser and on the server, never stored as a drawing | `meikyuu/way.ts` |
| The answer is the line | One character a step: the place of the next cell among the neighbours of the one before (base 36), from the start; 2,434 characters at the longest. A kept run is the same code, half written. `mostCells` is 2,600 | `meikyuu/steps.ts`, `puzzles.constants.ts` |
| The server walks the line | `checkMeikyuu` holds the givens to a level of that size, then walks the answer from the maze's start through open passages to the goal. A maze has exactly one way through, so the line that is left is it. Keys picked up on a detour are not in it, and are not asked about | `meikyuu/check.ts` |
| Points | Five a cell of the way through, weight 0.3 (a medium level's middle way is 64 cells: 320 points, about 100 IP) | `puzzlePoints.ts`, `points.constants.ts` |
| A kept run is drawn again | The package's board starts empty and cannot be handed a line, so a kept line is drawn on it as a finger draws it (pointer events through the middle of each cell). The board follows its own rules, so a line that is no way through is not drawn, and a line the board did not take whole is cleared. The keys a run had picked up and then drawn back from are not kept, only the line | `components/puzzles/meikyuuReplay.ts`, `MeikyuuBoard.tsx` |
| Solves are found by the maze | No table of its own: a level is known by its recipe, which a solve keeps as its givens, so a level renumbered later keeps its solves | `server/meikyuuRecords.ts` |
| Solved levels in a browser | `localStorage` `itsutsu.meikyuu.solved`, by recipe, for somebody with no account | `meikyuuKept.ts` |
| Browser only | The drawing and the board are three entries of the package fetched in the browser alone (`typeof window`, `meikyuu/browser.ts`), the list of 1,000 recipes is one chunk (`meikyuu/levels.ts`; a server reads it through `levelsModule.ts`), and the play screen is loaded `ssr: false` like every puzzle's. What a page's server build reaches is written down in `pageFunction.coverage.test.ts` | `meikyuu/browser.ts` |
| Every level is open | Tsunagi and Suido open a block of sixteen when the one before is solved. A maze is not a lesson, so nothing is locked; Start plays the first level not yet solved | `MeikyuuSetUp.tsx` |
| The set-up | The same screen as Suido's levels (`LevelPicker`, `LevelChips`, `LevelFastestTable`): the chosen level's own maze live in the preview box, four size tiles, a block of sixteen, Start. Chips under it name the level's shape, its way to play, its cells and its difficulty | `MeikyuuSetUp.tsx` |
| The family | Numbers (seven of eight). Logic puzzles, where it belongs by temper (it sits beside Tsunagi, whose lines it draws), is full at eight, and moving a game out of a shelf is John's to decide. The note is on the Numbers row in `families.data.ts` | `families.data.ts` |

## The gates it meets

`puzzles.coverage.test.ts` (a generator, one answer at every size and level, a
check that refuses a wrong line, copy, a rules page, a unit test, a browser spec,
a picture), `puzzleArt.coverage.test.ts` (the picture stamp: `meikyuu/way.ts`,
`MeikyuuBoard.tsx` and the package's version are in `PUZZLE_ART_FILES`),
`pageFunction.coverage.test.ts`, `bareSurvey.coverage.test.ts` (two plays in
`e2e/bare-board.spec.ts`), `levelScreens.coverage.test.ts`,
`gameEnding.coverage.test.ts` (New game beside Pause), the dead-end and picture
gates (`GameName`, `GameThumb`), `openSource.test.ts` (the credit under the game),
`gameAdded.coverage.test.ts` (`pnpm games:added`), and the plain-English gate.
`e2e/meikyuu.spec.ts` opens the set-up, draws a level through by mouse and by a
real touch, keeps and resumes a half-drawn one, zooms a huge maze and checks the
server's answer.

## Not done

- **The arrow puzzles (300) and the mixed ones (100)** the package also has.
  They are played by tapping, not drawing, and want their own kinds of level and
  their own copy; the package's `mountMeikyuu` already plays them.
- **Hints.** The package has one; a level offers none so its times stay
  comparable. A Hint that costs points, chosen on the set-up as other puzzles
  have it, would be the way if a huge maze wants one.
- **Keys on a detour are not in the answer**, so a server cannot tell a line
  that collected every key from one that did not. Honest play is trusted, as it
  is for every puzzle (a member who reads the answer out of the page has cheated
  themselves of a puzzle). The way to fix it is for the package to give back the
  walk and not only the line.
- **The package could take a line**: `mountMeikyuu({ line })` would replace
  the pointer replay a kept run uses.
- The package's Japanese is "not yet reviewed by a native reader"; the site's
  words are English only, so none of it is shown here.
