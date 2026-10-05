# Meikyuu 迷宮: a maze to draw a line through

**Status: added 2026-10-02** (board row
`meikyuu-a-maze-game-of-a-thousand-levels-in-many-shapes-drawn-through-by-finger-or-mouse`).
Source package: `@johnmorrisdotca/meikyuu` 2.1.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/meikyuu, MIT, no dependencies; tall levels, `ratio`, `orientation`, the gutters, Move and edge panning are 2.0; the colossal levels and stones are 2.1). The site started on 1.0.0 (1,000
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
| The answer is the line | One character a step: the place of the next cell among the neighbours of the one before (base 36), from the start; 5,009 characters at the longest (a colossal maze; 2,434 before them). A kept run is the same code, half written, with its stones after a `~` (see "Stones"). `mostCells` is 6,000: the longest answer and room after it for a kept run's stones | `meikyuu/steps.ts`, `puzzles.constants.ts` |
| The server walks the line | `checkMeikyuu` holds the givens to a level of that size, then walks the answer from the maze's start through open passages to the goal. A maze has exactly one way through, so the line that is left is it. Keys picked up on a detour are not in it, and are not asked about | `meikyuu/check.ts` |
| Points | Five a cell of the way through for the level's own board. In IP a level is priced on the ladder: its size's rung (55 for a small level to 150 for a huge one and 160 for a colossal one; 50 to 100 for a tall one and 110 for the colossal tall one) plus 0 to 50 by its place among the size's levels, never past the 200 a family of levels reaches (so the hardest third of the colossal square list all pay 200). A kept solve names the third of its list it was in and is priced at the middle of it, as on every size, whether the list has 256 levels or 128 | `puzzlePoints.ts`, `points/ladder.ts` |
| A kept run is taken back whole | The package's board takes a kept run as it was (`mount.restore`, 2.1: the line and its stones), and a code that is not a run of this maze leaves the board as it was made. Until 2.1 the board could not be handed a line and a kept one was drawn on again as a finger draws it, a pointer event through each cell (`meikyuuReplay.ts`, removed): a line of five thousand cells would have been five thousand events. The keys a run had picked up and then drawn back from are not kept, only the line | `MeikyuuBoard.tsx` |
| Solves are found by the maze | No table of its own: a level is known by its recipe, which a solve keeps as its givens, so a level renumbered later keeps its solves | `server/meikyuuRecords.ts` |
| Solved levels in a browser | `localStorage` `itsutsu.meikyuu.solved`, by recipe, for somebody with no account | `meikyuuKept.ts` |
| Browser only | The drawing and the board are three entries of the package fetched in the browser alone (`typeof window`, `meikyuu/browser.ts`), the list of 1,024 recipes is one chunk (`meikyuu/levels.ts`; a server reads it through `levelsModule.ts`), and the play screen is loaded `ssr: false` like every puzzle's. What a page's server build reaches is written down in `pageFunction.coverage.test.ts` | `meikyuu/browser.ts` |
| Every level is open | Tsunagi and Suido open a block of sixteen when the one before is solved. A maze is not a lesson, so nothing is locked; Start plays the first level not yet solved. What encourages finishing instead is the count of solved levels of each size and a mark when a size is whole ("Finishing a size", below) | `MeikyuuSetUp.tsx` |
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

## Colossal mazes 巨 (2026-10-05)

Board row `meikyuu-colossal-mazes-of-about-100x100`. The package's third list (`@johnmorrisdotca/meikyuu/levels/colossal`, 2.1): 128 square mazes of 9,514 to 11,995 cells (a hundred across or so, every shape) and 128 tall ones, 64 across and 96 down for a square one (6,059 to 6,144 cells), each a recipe that builds in tens of milliseconds, never stored as a drawing. Their efforts run 1,744 to 9,762 and 1,224 to 6,008, so the biggest is harder than any huge level; their way through is up to 5,009 steps.

| Decision | What | Where |
| --- | --- | --- |
| Sizes | The square list is size **5**, the next place after huge; the tall one is **6496** (64×96, kept as the tall sizes are: width then height in two digits each). 128 levels each, eight blocks of sixteen; a level is its place in its list, as ever, and the third it is in is its band (`meikyuuLevelBand` reads the count of the size) | `meikyuu/sizes.ts`, `levelCounts.ts` |
| On the set-up: a third shape | Square has four tiles, Tall six on a shelf of four, and **Colossal is a shape of its own** beside them with two tiles ("Colossal", "Colossal tall"), so no shape ever has more than four boards and nothing that was there moved (the alternatives were a fifth tile, which `set-up-steady` forbids, or replacing Small, which would have taken away the quickest level). The progress rows under the tiles keep four rows of room (`holds`), the options do not change height, and `?size=5` or `?size=64x96` opens the shape | `MeikyuuSetUp.tsx`, `MeikyuuProgress.tsx` |
| Its list | Its own script of 17 KB, fetched by a browser when a colossal size is asked for and read by the server only for a colossal size a page has something to say of (`loadMeikyuuLevelsFromModule`), written down in `pageFunction.coverage.test.ts`; the server function's size did not grow | `meikyuu/levels.ts`, `levelsModule.ts` |
| The answer and the check | `mostCells` is 6,000 (it was 2,600), and the checks accept an answer of up to 5,200 steps. `PUZZLE_CODE_LONGEST` is the longest of any kind, and a step log (`stepLog.ts`, a scrubber's) takes its ceiling from the kinds that keep one (`PUZZLE_LOGGED_CODE_LONGEST`), so Meikyuu's longer codes did not raise what a log may be. The longest answer is 5,009 characters in a request of about 5.2 KB and is checked in tens of milliseconds (`e2e/meikyuu-colossal.spec.ts` prints both) | `puzzles.constants.ts`, `meikyuu/progress.ts` |
| Points | Rung 160 for the square list (size 5) and 110 for the tall one, on the ladder's two series; see the Points row above | `points/ladder.constants.ts` |
| Drawing | The package's board draws and plays it as any other: the walls in tiles drawn only while on screen, zoom, gutters, two-finger and edge panning. The package stays SVG: the 5,009-step line was the cost (every pointer event rebuilt it whole), fixed in 2.1 by writing the line incrementally once a frame; measured on a phone-sized Chromium at four times slower, 7 ms a frame while drawing against 22 before, and 16.7 ms frames while zooming and panning (the package's `docs/LEVELS.md`) | the package |
| The set-up's preview and a finished page | The preview draws the maze with `drawMaze`, an SVG of about 400 KB of path text for a colossal maze: still a live picture in the one box | `MeikyuuStill.tsx` |

Held by `levels.test.ts` (the sizes and counts, every colossal level made, answered, refused wrongly and the longest answer inside what the routes take), `ladder.coverage.test.ts`, `e2e/meikyuu-colossal.spec.ts` (the set-up, a whole colossal line solved and paid, the longest answer's size and check time, the tall one on a phone) and the colossal plays in `e2e/bare-board.spec.ts`.

## Stones 石 (2026-10-05)

Board row `meikyuu-lay-a-stone-to-block-a-dead-end-only-next-to-your-line`. John, 2026-10-05: "an option to allow marking or blocking a route... you can lay a stone which prevents the path to be used... a helper to let you know that a given path is exhausted/useless/dead end... I chose marbles as I didn't want people to start painting the map and just placing anywhere... it has to be a carefully placed item that you must lay adjacent to your existing path." The package (2.1) has the rules (`stones.ts`): a stone goes on an open passage cell beside the line (within two cells along the passages of a cell of the line, not through another stone), never on the line, the start or the goal, while stones are left, and not once the maze is solved; the line cannot enter it; a tap on it takes it up.

| Decision | What | Where |
| --- | --- | --- |
| On every maze, limited by default | Stones are offered on every Meikyuu level, never unlocked. A setting on the set-up's options, kept on this device (`itsutsu.meikyuu.stones`): **A few** (the package's count for the maze's size, `stoneLimitFor`: 4 for a small maze, 9 for a huge one, 13 for a colossal one) or **As many as I like**. It keeps its place and height whatever size is chosen | `MeikyuuStones.tsx`, `meikyuuStonesStore.ts`, `meikyuu/stones.ts` |
| The Stone press | Beside Undo and Restart, as Move is beside Fit: a toggle with the same styling and tap height, labelled "Stone", `aria-pressed`, reachable by keyboard. While it is on, a tap lays a stone beside the line (or takes one up) and nothing draws; "Stones left: 3" (or "Stones laid: 3" with no limit) is beside it, in a fixed room. Press and hold a finger on a cell for half a second does the same with no mode on (touch and mouse), and Shift and an arrow at the end of the line lays one from the keyboard: both said in the set-up's option note and the press's hover | `MeikyuuSolve.tsx`, `MeikyuuBoard.tsx` (`MeikyuuHandle.stoneMode`) |
| A stone is never the answer | What is handed in and checked is the line alone (`wayOfRun`); an answer with a `~` is refused by the server (a test hands one in). Stones move no score and no check | `meikyuu/steps.ts`, `meikyuu/check.ts` |
| Kept with the run | A run kept half way is the package's `encodeRun`: the line's steps, a `~`, the stones' cells in base 36 joined by dots (`0231~1a.2f`). The route accepts the alphabet and no more than 800 characters of stones (`runFits`); a resumed run is taken back whole (`mount.restore`), and a lower limit than the run was kept under takes no stone off | `meikyuu/progress.ts`, `steps.ts` |
| Colours | The look gives a stone a colour of its own and the walls' colour as its rim (`resolveLook`): 3:1 on the paper, 1.5:1 from its rim and 1.25:1 from the line and the goal, proved for all 132 paper and ink pairs, on top of the package's own for the default look (`--mkl-stone`, `globals.css`). The Colours window's little maze shows one | `meikyuu/look.ts`, `look.constants.ts` |
| Words | "Stone", "Stones left" and "Stones laid" (`docs/plans/plain-english/GLOSSARY.md`), said where a stone goes (beside the line) and that it is a helper and not a pen | `meikyuu.constants.ts` (`STONE_COPY`) |

Held by `look.test.ts`, `levels.test.ts` (a run's text), the package's `stones.test.ts` (the rules: reach, a wall-separated cell, an occupied cell, the limit, Undo, the line refusing to enter a stone, saving and restoring), `e2e/meikyuu-stones.spec.ts` (the press and the mode with a mouse, a real touch held on a cell at 390 wide, the keyboard, the setting, a run kept and resumed with its stone, readable on five sets) and the package's own browser tests.

## Getting about a big maze (touch, 2026-10-05)

John, 2026-10-02: "the ability for mobile users to easily navigate from the top of the map to a bottom... allow users to zoom out enough that they can see the body easily on the left and right hand sides." The package's 2.0 board is built for it, and the site wires its own buttons to it:

- **Zoom out and in** are the site's own − and + (`MeikyuuHandle.zoomOut`, `zoomIn`). Zoom out first shrinks the maze to a little past its fit, and then widens the **page beside the board**, a step at a time to 72 px each side; Zoom in brings it back first; **Fit** puts it all back. The package leaves page beside the box, but the wood round it is the site's, so the wood follows the gutter (`data-gutter` on the board, observed in `MeikyuuBoard`): at the most, 62 px of page shows on each side of the wood on a 390 px phone, which is what a swipe scrolls the page by.
- **Only the maze's box takes touches.** `touch-action: none` is the package's, on `.mk-box` alone; the board's host is `pan-y pinch-zoom`, and nothing of the site's sets it (`e2e/meikyuu-touch.spec.ts` walks the board's ancestors and fails on any `none` outside the box). A swipe on the wood or the margin is the page's.
- **Move** (beside Fit) makes every one-finger drag move the view and draw nothing (`pan`), for a finger that cannot find the line's end; two fingers always move it, and a pinch zooms it.
- **Edge sliding** is the package's `edgePan`, on by default (gentle: nothing within 44 px of the edge, rising to 7 px a frame at it), with a switch in the Colours window ("Slide the view when the line reaches the edge"), kept on the device only (`meikyuuEdgeStore.ts`, `itsutsu.meikyuu.edgepan`).
- Held by `e2e/meikyuu-touch.spec.ts` on real touches (CDP) at 390×844 and 360×740: the biggest tall maze drawn from its start to its goal, Zoom out widening and Fit restoring the gutters, a swipe on the margin scrolling the page, Move and two fingers, and the edge switch. A kept line drawn again on a board lying down is in `e2e/meikyuu-tall.spec.ts`.

## Finishing a size (2026-10-05)

John, 2026-10-02: "are any levels locked? I like the small levels being all playable I think but encouraging people to finish them all." So nothing is locked, and the encouragement is progress you can see (`meikyuu/completion.ts`, pure, tested):

- **"N of 256 solved" for every size**, on the set-up (one row a size on show, four whichever shape is chosen, so nothing changes height: `MeikyuuProgress` under the size tiles) and on the front door (every one of the ten sizes: `MeikyuuProgressLine`). The account's solves are the one read the page already makes (`meikyuuSolvedBy` returns every size; the front door reads it at request time in a Suspense of its own, so its prerendered shell stays prerendered and a stranger costs no read), this browser's are added once it has hydrated, and a level solved in both counts once. A stranger or a new member sees the rows at nought: an empty table is data.
- **A whole size is marked and cheered in a line, never a window.** The row gets a ✓ and its bar turns moss; the preview's caption says "Every small level is solved: all 256. Well done!"; and the solve that finishes a size says so under the level (`meikyuu-size-done`, only when this solve is the one that made it whole, `completesSize`). The board of levels stays open, every level can still be looked at and played again.
- Only current levels count: a solved maze that is no level now (see below) is a record and is not in the 256.

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
