# Meikyuu 迷宮: a maze to draw a line through

**Status: added 2026-10-02** (board row
`meikyuu-a-maze-game-of-a-thousand-levels-in-many-shapes-drawn-through-by-finger-or-mouse`).
Source package: `@johnmorrisdotca/meikyuu` 2.0.1, pinned exactly in `package.json`
(github.com/johnmorrisdotca/meikyuu, MIT, no dependencies; tall levels, `ratio`, `orientation`, the gutters, Move and edge panning are 2.0). The site started on 1.0.0 (1,000
maze levels in sizes of 217, 231, 285 and 267) and moved to 2.0.x on 2026-10-02, which renumbered
the list: see "Old solves" below.

A maze is a puzzle (a `PuzzleKind`, `src/lib/puzzles/meikyuu/`), never a row in
`VARIANT_SPECS`: one line, no turns, no colours, nothing the engine, the
simulator or a ladder can do anything with. It follows `docs/plans/numbers/README.md`
and mirrors the two puzzles of fixed levels before it, Tsunagi and Suido.

## What is played

Press the start dot and drag (or tap, which runs the line to the next fork). The
line follows the corridors, cannot pass a wall, and drawing back shortens it. A
big maze is zoomed with a pinch, the wheel or the + and − buttons, moved with
two fingers, or with one finger while Move is on, and a line drawn to the edge of
a zoomed board slides the view along (see "Getting about a big maze"). The package's own board does all of that (`mountMeikyuu`, fetched in
the browser only); the site adds the wood round it, the clock, Pause, Undo,
Restart, Fit, the kept run and the check. A level has no hint and no clock, as a
Suido level has none, so a time on it is one anybody can be raced on.

The levels are the package's 1,024 mazes, 256 to each of four sizes: squares, hexagons, triangles, circles
and shapes cut out of them (a heart, a leaf, a star, a ring, a diamond, a cross,
a moon, a big hexagon, a pyramid), in four ways to play (in and out through the
wall, find the goal, out from the middle, collect the keys). The arrow and mixed
puzzles the package also has are not on the site yet (see "Not done").

## How it is put on the site

| Decision | What | Where |
| --- | --- | --- |
| A size is the package's word for how big a maze is | `size` 1 to 4 is small, medium, large, huge (`sizeOf`: under 150, 800 and 4,000 cells, then more). A maze has no side, so the number is only the size's place; the set-up draws it as the big number on the tile like every size. 256 levels each, 1,024 in all (John, 2026-10-02: "make the numbers of puzzles more normal numbers... things like 132 or 256") | `meikyuu/sizes.ts`, `meikyuu/levelCounts.ts` |
| A level is its place in its size | The seed IS the level's number in its size (`inSize`), as Tsunagi's is (`fixedLevels`), in the package's order: by a score of how hard a maze is to play (`level.score`, 0 to 100), and none has a lower effort than the one before. The level's third of its size is its easy, medium or hard (86, 85 and 85 levels), and the difficulty marks under a level are its score in fifths. The easy third is no longer trivial: every level has traps, forks and dead ends to get wrong (the package's `isTooEasy`, `easyFloorAt`) | `meikyuu/levels.ts`, `puzzleAddress.ts` |
| The recipe is the puzzle | `givens` is the level's recipe (`square:12x9:wilson:to-goal:48213`, 45 characters at most): a maze is rebuilt from it in every browser and on the server, never stored as a drawing | `meikyuu/way.ts` |
| The answer is the line | One character a step: the place of the next cell among the neighbours of the one before (base 36), from the start; 2,434 characters at the longest. A kept run is the same code, half written. `mostCells` is 2,600 | `meikyuu/steps.ts`, `puzzles.constants.ts` |
| The server walks the line | `checkMeikyuu` holds the givens to a level of that size, then walks the answer from the maze's start through open passages to the goal. A maze has exactly one way through, so the line that is left is it. Keys picked up on a detour are not in it, and are not asked about | `meikyuu/check.ts` |
| Points | Five a cell of the way through, weight 0.3 (a medium level's middle way is 142 cells: 710 points, about 213 IP; the first small level's is 8, and the last huge one's 2,069) | `puzzlePoints.ts`, `points.constants.ts` |
| A kept run is drawn again | The package's board starts empty and cannot be handed a line, so a kept line is drawn on it as a finger draws it (pointer events through the middle of each cell). The board follows its own rules, so a line that is no way through is not drawn, and a line the board did not take whole is cleared. The keys a run had picked up and then drawn back from are not kept, only the line | `components/puzzles/meikyuuReplay.ts`, `MeikyuuBoard.tsx` |
| Solves are found by the maze | No table of its own: a level is known by its recipe, which a solve keeps as its givens, so a level renumbered later keeps its solves | `server/meikyuuRecords.ts` |
| Solved levels in a browser | `localStorage` `itsutsu.meikyuu.solved`, by recipe, for somebody with no account | `meikyuuKept.ts` |
| Browser only | The drawing and the board are three entries of the package fetched in the browser alone (`typeof window`, `meikyuu/browser.ts`), the list of 1,024 recipes is one chunk (`meikyuu/levels.ts`; a server reads it through `levelsModule.ts`), and the play screen is loaded `ssr: false` like every puzzle's. What a page's server build reaches is written down in `pageFunction.coverage.test.ts` | `meikyuu/browser.ts` |
| Every level is open | Tsunagi and Suido open a block of sixteen when the one before is solved. A maze is not a lesson, so nothing is locked; Start plays the first level not yet solved | `MeikyuuSetUp.tsx` |
| The set-up | The same screen as Suido's levels (`LevelPicker`, `LevelChips`, `LevelFastestTable`): the chosen level's own maze live in the preview box, four size tiles, a block of sixteen, Start. Chips under it name the level's shape, its way to play, its cells and its difficulty | `MeikyuuSetUp.tsx` |
| The wallpaper | A solved level offers "Game wallpaper" like every finished puzzle (`PuzzleWallpaper`): the board as the page draws it, taken in the browser (`boardSnapshot.ts`) and laid centred under the title bar in the portrait and landscape canvases. The picture opens full screen from the window (`MosaicFullScreen`: the picture at the size it is saved in, both shapes, Download, Close, Esc). A page offers the one game's picture only; the one combined wallpaper that exists is a member's Kumimoji crosswords. Safari's engine scaled the copy's HTML wrongly (the board drawn at one third in the corner), so the copy is zoomed by CSS `zoom` and not by the SVG's viewBox; `E2E_WEBKIT=1 pnpm exec playwright test e2e/meikyuu-wallpaper.spec.ts` runs it there | `record/boardSnapshot.ts`, `history/MosaicPanel.tsx`, `history/MosaicFullScreen.tsx`, `e2e/meikyuu-wallpaper.spec.ts` |
| Colours | "Colours 色" beside every Meikyuu board (the set-up's Options, the play screen's presses, a solved or finished level, a finished solve's page) opens a window of eight ready-made sets and three rows of swatches: the border (the frame's wood), the background (the paper) and the maze (an ink: walls, line, start, goal). No free picker. Whatever is chosen is drawn readable (`resolveLook`): walls 4.5:1 on the paper, the line 3:1 on the paper and on the walls, the start 3:1, the goal 1.8:1 (it is outlined and the solved line wears it) and apart from the line. A colour that would break it is tuned (lighter or darker, same hue), then replaced by a fallback, and the window says so; `look.test.ts` proves all 132 paper and ink pairs. The frame stays `BoardFrame` (`PuzzleBoard` is given the tokens: `MeikyuuFrame`); the maze is the package's, recoloured through its own custom properties by `--mkl-*` rules in `globals.css`, so the game's picture (default look, byte-identical) is unchanged. Three preferences in the registry (`meikyuuFrame`, `meikyuuPaper`, `meikyuuInk`), also kept on the device (`itsutsu.meikyuu.look`); the account's wins field by field, a silence never overrules the device. A page that reads the account seeds the store with `MeikyuuAccountLook` | `meikyuu/look.ts`, `look.constants.ts`, `components/puzzles/MeikyuuColours.tsx`, `MeikyuuFrame.tsx`, `meikyuuLookStore.ts`, `e2e/meikyuu-colours.spec.ts` |
| The family | Numbers (seven of eight). Logic puzzles, where it belongs by temper (it sits beside Tsunagi, whose lines it draws), is full at eight, and moving a game out of a shelf is John's to decide. The note is on the Numbers row in `families.data.ts` | `families.data.ts` |

## Tall levels 縦 (2026-10-05)

John, 2026-10-02: "Create a whole level of Vertical maps... a vertical container that fits most mobiles... On mobile they can be played vertically. On desktop they can be rotated to horizontal based on screen resolution detection or offer desktop users a choice." The package's second list (`@johnmorrisdotca/meikyuu/levels/tall`): 1,536 portrait mazes, two columns to three rows, in six sizes of 256 (6×9, 8×12, 10×15, 12×18, 16×24, 20×30; squares, hexagons and triangles), ordered by score like the rest.

| Decision | What | Where |
| --- | --- | --- |
| A tall size is its columns and rows in one number | The width and then the height in two digits each, as Suido's long boards are (609 is 6×9, 2030 is 20×30), so a size is still one whole number in an address, a kept run, a solve and the database, with **no migration**. An address says `size=6x9`. No size of the four is a hundred or more, so the two kinds cannot be mistaken. The same recipe is never both: a level is found by its recipe in its own size's list | `meikyuu/sizes.ts` |
| The stored recipe says it | A tall level's givens are its recipe (49 characters at the longest, under `mostCells`) and its answer the same one-character-a-step line (414 at the longest, under `MEIKYUU_MOST_STEPS`); the ratio is the same for every tall level (2:3) and so is not stored. `checkMeikyuu` holds a tall recipe to a level of its tall size, and a square recipe to none of them. Caps in `PUZZLE_CODE_LONGEST` already cover them | `meikyuu/check.ts`, `levels.ts` |
| Its own list, fetched only when asked | The tall list is a script of its own (96 KB): a browser fetches it when a tall size is chosen, a server reads it only for a tall size a page has something to say of (`loadMeikyuuLevelsFromModule(sizes)`), written down in `pageFunction.coverage.test.ts` | `meikyuu/levels.ts`, `levelsModule.ts` |
| The set-up | A Shape choice, Square or Tall, over the size tiles. Tall has six sizes and a set-up keeps room for four tiles, so they are a shelf: the first four, then the last four, a press between (the press keeps its place, hidden, for the squares, so nothing on the screen changes height). A tall tile is the long-board picture (`BoardSizeMark`, "6×9" in a 2:3 lattice). The preview is the live tall maze, upright, in the one preview box, the wood as tall as the box | `MeikyuuSetUp.tsx`, `MeikyuuLevelPreview.tsx`, `MeikyuuFrame.tsx` (`MeikyuuHeld`) |
| Which way up | Auto (the default), Upright, Lying down, remembered on the device only (`itsutsu.meikyuu.wayup`), beside the colours on the set-up and every play and finished screen of a tall maze. The package's `orientation` does the turning (a quarter counter-clockwise, presentation only, so a line is the same line either way up); the site **decides** it (`meikyuu/turn.ts`, the package's own rule: lie down when that makes the maze more than a twelfth bigger) from the room of the board's column and hands the package `portrait` or `landscape`, because the wood round the maze has to follow the answer and the package's own `auto` reads the width of the element it is mounted in, which is that wood. On a phone held upright it is upright; on a desk it lies down where the column is wide enough for that to be bigger; Lying down and Upright are always so | `meikyuu/turn.ts`, `meikyuuWayUpStore.ts`, `MeikyuuStand.tsx` |
| The wood | `MeikyuuFrame` takes a stand (square, upright, lying) and lays the same `BoardFrame` out two columns by three rows (or the other way) with the rim of any other maze (`PuzzleBoard` `rimOf`), so the paper inside is exactly the box the package's board wants. It is as wide as its column and no taller than the window leaves room for (`[data-mk-slot]` in `globals.css`, `--mk-fw` its width over its height; the package is given `reserve: 0` and the window does the limiting). In Just the board the room kept is the modal's, and the modal is as wide as the wood and the controls beside it. The wallpaper is taken of the wood, not of the column round it | `globals.css`, `MeikyuuBoard.tsx` |
| A kept run on a turned board | A kept line is drawn again by pointer events (`meikyuuReplay.ts`), and a board lying down is drawn a quarter turn: the area fitted is the turned one and each cell is where the package shows it (`turnedBox`, `toDisplay`), so the same twelve cells come back whichever way up the board is opened | `meikyuuReplay.ts` |

Held by `levels.test.ts` (the six sizes against the package's, every tall level made, answered and refused wrongly), `turn.test.ts`, `meikyuuStand.test.ts` (the stylesheet's numbers are the wood's shape), `e2e/meikyuu-tall.spec.ts`, the tall plays in `e2e/bare-board.spec.ts`'s survey and the tall wallpaper in `e2e/meikyuu-wallpaper.spec.ts`.

## Getting about a big maze (touch, 2026-10-05)

John, 2026-10-02: "the ability for mobile users to easily navigate from the top of the map to a bottom... allow users to zoom out enough that they can see the body easily on the left and right hand sides." The package's 2.0 board is built for it, and the site wires its own buttons to it:

- **Zoom out and in** are the site's own − and + (`MeikyuuHandle.zoomOut`, `zoomIn`). Zoom out first shrinks the maze to a little past its fit, and then widens the **page beside the board**, a step at a time to 72 px each side; Zoom in brings it back first; **Fit** puts it all back. The package leaves page beside the box, but the wood round it is the site's, so the wood follows the gutter (`data-gutter` on the board, observed in `MeikyuuBoard`): at the most, 62 px of page shows on each side of the wood on a 390 px phone, which is what a swipe scrolls the page by.
- **Only the maze's box takes touches.** `touch-action: none` is the package's, on `.mk-box` alone; the board's host is `pan-y pinch-zoom`, and nothing of the site's sets it (`e2e/meikyuu-touch.spec.ts` walks the board's ancestors and fails on any `none` outside the box). A swipe on the wood or the margin is the page's.
- **Move** (beside Fit) makes every one-finger drag move the view and draw nothing (`pan`), for a finger that cannot find the line's end; two fingers always move it, and a pinch zooms it.
- **Edge sliding** is the package's `edgePan`, on by default (gentle: nothing within 44 px of the edge, rising to 7 px a frame at it), with a switch in the Colours window ("Slide the view when the line reaches the edge"), kept on the device only (`meikyuuEdgeStore.ts`, `itsutsu.meikyuu.edgepan`).
- Held by `e2e/meikyuu-touch.spec.ts` on real touches (CDP) at 390×844 and 360×740: the biggest tall maze drawn from its start to its goal, Zoom out widening and Fit restoring the gutters, a swipe on the margin scrolling the page, Move and two fingers, and the edge switch. A kept line drawn again on a board lying down is in `e2e/meikyuu-tall.spec.ts`.

## Old solves: the first list's numbers

Package 2.0.0 renumbered the maze list. Of the 1,000 levels of 1.0.0, 843 are at the same
place of the same size with the same maze; 157 are not levels any more (117 places hold a
different maze, the last 29 Large and 11 Huge places are gone). The package says where each
went (`@johnmorrisdotca/meikyuu/levels/legacy`). The rule the site follows, decided 2026-10-02
and held by `levels.test.ts`:

- **A solve is a result and is never taken away.** It stays in History, My games and XP, as
  paid. A solve keeps its maze's recipe as its givens, so every page finds a level **by the
  recipe**, never by the number it once had.
- **A maze that is still a level is marked solved at the place it has now** (nothing moved in
  fact: all 843 stayed where they were), by the account's solves (`meikyuuSolvedBy`) and this
  browser's (`keptSolves`) alike.
- **A maze that left the list is a solved record and marks no level**: the picker counts only
  current levels, its solve page names the third it was filed under and not a level number
  (`meikyuuLevelOfSolve` finds none), and no fastest table lists it (a table is per current
  level's maze).
- **A new solve must be of a current level.** `checkMeikyuu` still holds the givens to a
  level of the size, so a retired recipe cannot be handed in again.
- The legacy list (58 KB of data) is read by no page: the recipe lookup answers everything the
  table would, and the test proves they agree on all 1,000. A run kept half way on a place whose maze changed
  is drawn against the new maze and cleared if the line is not a way through it (`MeikyuuBoard`).

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
- **The package could take every colour in its look.** `MeikyuuBoardLook` carries the paper, walls, frame ring and line, but not the start, goal and key, and an inline look beats a stylesheet, so the site's chosen colours go over the package's custom properties with `!important` (`globals.css`, `--mkl-*`). A `start`, `goal` and `key` in the look would let the site hand its colours in and drop the override.
