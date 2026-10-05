# Tobiishi 飛び石: peg solitaire

**Status: added 2026-10-05** (board row
`tobiishi-peg-solitaire-on-the-site-in-small-boards`).
Source package: `@johnmorrisdotca/tobiishi` 0.2.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/tobiishi, MIT, no dependencies).

Peg solitaire is a puzzle (a `PuzzleKind`, `src/lib/puzzles/tobiishi/`), never a row in
`VARIANT_SPECS`: one player, no turns, no colours, nothing the engine, the simulator or a
ladder can do anything with. It follows `docs/plans/numbers/README.md` and mirrors the
puzzle of fixed levels before it, Meikyuu (`docs/plans/meikyuu/README.md`).

## What is played

Jump a peg over the peg next to it into the empty hole beyond, and take the peg jumped.
Leave one peg, in the dashed goal hole. A tap on a peg rings the holes it can reach and a
tap on one of those jumps; a drag from a peg to a ringed hole does the same; the arrow keys,
Enter and Escape play it from the keyboard. The package's engine allows only legal jumps
(`jumpAt` hands the same game back for any other), so the site never decides whether a jump
is legal. The levels have no hint and no clock, so a time on one is one anybody can be raced
on; the clock starts with the first jump.

## How it is put on the site

| Decision | What | Where |
| --- | --- | --- |
| A size is a length | `size` is 3, 6 or 9: the jumps in the shortest way, which the package's three difficulties are (easy 3, medium 6, hard 9). The big number on a tile is the jumps. A size is exactly one band (`levelsAt`), so `level` follows from it | `tobiishi/sizes.ts` |
| A level is its place in its length | 27 a length: the package's nine boards in its order, three goal holes each, in theirs (level 4 is the second board's first goal). The seed IS that number, as Meikyuu's is. 81 levels in all | `tobiishi/levelCounts.ts`, `tobiishi/levels.ts` |
| The name is the puzzle | `givens` is the level's name, `board:goal:jumps` (`english:centre:3`, 25 characters at most). The package makes the starting position again from it, the same every time (a challenge is seeded from its own name), in a fraction of a millisecond, so there is no list to fetch and no position is stored | `tobiishi/levels.ts` |
| The answer is the run | Four characters a jump: the column and row of the hole the peg left and of the hole it landed in, each base 36, so a hole is named by where it is and not by its place in the package's list. At most nine jumps, 36 characters. A kept run is the same code, half written. `mostCells` is 40 | `tobiishi/way.ts`, `puzzles.constants.ts` |
| The server replays the run | `checkTobiishi` holds the givens to a level of that length, replays the jumps from the level's own position (every one legal where the run had got to) and asks the package whether the game is solved: one peg, in the goal. Any legal run to the goal is accepted, not only the package's own. Nothing is searched | `tobiishi/check.ts` |
| Points | Five a jump of the shortest way (`cellsFilled` is the size), weight 2: 15, 30 or 45 points, about 30, 60 or 90 IP. Under the 100 a medium solve of the puzzles that take longer is worth, because a level takes a minute | `puzzlePoints.ts`, `points.constants.ts` |
| A kept run is played again | The run is replayed on the level's own board when opened; a run that is not legal there is ignored and the level opens as dealt | `TobiishiBoard.tsx` |
| Solves are found by the level's name | No table of its own: a level is known by its name, which a solve keeps as its givens | `server/tobiishiRecords.ts` |
| Solved levels in a browser | `localStorage` `itsutsu.tobiishi.solved`, by the level's name, for somebody with no account | `tobiishiKept.ts` |
| The board | The package's drawing (`draw`, pure SVG) on white paper in the wood every board has (`PuzzleBoard`, no coordinates), with a button over each hole for taps, drags (pointer events, so a finger and a mouse alike) and the keyboard. The package's cream tray is cleared by CSS (`PACKAGE_TRAY_OFF`): the wood is the frame. A wide board fills the paper's width and a tall one its height | `TobiishiBoard.tsx`, `TobiishiStill.tsx` |
| Every level is open | Nothing is locked; Start plays the first level not yet solved | `TobiishiSetUp.tsx` |
| The set-up | Meikyuu's screen: the chosen level's own board live in the preview box, three length tiles, all twenty-seven levels of the length in one picker of three rows of nine (`LevelPicker`'s `across`), Start, and chips naming the level's board, goal hole and pegs | `TobiishiSetUp.tsx` |
| The family | At home in Numbers (eight of eight now) and listed on Small boards as a guest. A puzzle's home must be a family of puzzles (`puzzles.coverage.test.ts`), and Logic puzzles is full. Small boards held seven games and Mini Reversi as a guest, and a shelf shows eight at most, so Mini Reversi's listing left it (it is still at home in Turn and take) | `families.data.ts`, `familyShelves.ts` |
| The package in a function | The engine and the drawing are about 20 KB; the check reaches them from the pages (a finished level's page), so they are written down in `pageFunction.coverage.test.ts`. The player and the custom element, which the site does not import, are not shipped | `pageFunction.coverage.test.ts` |

## The gates it meets

`puzzles.coverage.test.ts` (a generator, a check that refuses a wrong run, copy, a rules
page, a unit test, a browser spec, a picture), `puzzleArt.coverage.test.ts` (the picture
stamp: `tobiishi/way.ts`, `TobiishiBoard.tsx` and the package's version are in
`PUZZLE_ART_FILES`), `pageFunction.coverage.test.ts`, `bareSurvey.coverage.test.ts` (two
plays in `e2e/bare-board.spec.ts`), `gameEnding.coverage.test.ts` (New game beside Pause),
the dead-end and picture gates, `openSource.test.ts` (the credit under the game),
`gameAdded.coverage.test.ts` and the plain-English gate. `e2e/tobiishi.spec.ts` opens the
set-up, plays levels by tapping and by dragging, keeps and resumes a half-played one,
checks the server's answer and plays on a phone with a finger.

## Not done

- **Hints.** The package has a proved hint along a level's own answer; a level offers none
  so its times stay comparable. A Hint that costs points would be the way if a long level
  wants one.
- **The package's own boards and generator.** The English cross and the triangle as the
  classic single-vacancy games, and "New challenge" (a fresh solvable position grown on
  any board), are in the package and not on the site: only its named levels are.
- **Materials** (stone, wood, glass) and the package's Japanese. The site's words are
  English only, and the pegs are the package's stone.
- **Colours.** Meikyuu lets the player choose the frame and the paper; Tobiishi does not.
