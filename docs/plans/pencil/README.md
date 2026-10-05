# Pencil puzzles 鉛筆: Kazu's grid puzzles

**Status: added 2026-10-05** (board rows
`pencil-puzzles-a-new-family-with-kazu-1-2-0-s-new-grid-puzzles-and-jirai` and
`jirai-minesweeper-on-the-site-in-pencil-puzzles`).
Source package: `@johnmorrisdotca/kazu` 1.2.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/kazu, MIT, no dependencies).

Kazu 1.2.0 added twelve grid-puzzle engines beside the six number puzzles the site
already played from 1.0.0. The six are unchanged: 8,280 puzzles (every kind, size and
level, sixty-nine seeds, today's daily seed and the largest a seed can be) were made,
checked, solved, hinted and drawn on 1.0.0 and 1.2.0 and compared, and none differed;
`kazu.test.ts` still pins them. Six of the twelve are on the site, in a family of their
own, **Pencil puzzles** (key `pencil`): Shikaku, Akari, Slitherlink, Hitori, Fillomino and
Kakuro. A puzzle here is a `PuzzleKind` (`src/lib/puzzles/pencil/`), never a row in
`VARIANT_SPECS`, and follows `docs/plans/numbers/README.md`.

## What is the site's and what is Kazu's

| Kazu | The site |
| --- | --- |
| The board, its generator (one answer, proved), its solver, its check of a finished board, its drawing as SVG | The kinds' addresses, sizes, names and copy; the codes a board is kept in; what a press does; the clock, Pause, Check, Show, Hint, the kept run, the points; the wood round the board |

The package's own players (`mountShikaku` and the rest) are not used: they bring their
own buttons, status line and dialog, which the site already has, and a kept run, a step
log and a replay need the board as a string. The site draws Kazu's SVG in its board
(`PuzzleBoard`) and reads a press from where it lands (`geometry.ts`).

## How it is put on the site

| Decision | What | Where |
| --- | --- | --- |
| One engine interface | `PencilEngine`: make, read, blank, fits, check, solve, wrong, missing, fix, work. The server's check and the browser's play are the same functions | `lib/puzzles/pencil/pencil.types.ts`, one file a kind |
| A board is a string of marks | A code is one character a mark place: a cell for most, an edge for Slitherlink (`2 × n × (n + 1)`), `progressLength`. So a kept run, a step log, the scrubber and a finished page's replay work unchanged | `codes.ts`, `puzzleProgress.ts` (`progressLength`, `progressFits`) |
| Shikaku's rectangles | A letter a rectangle, touching rectangles never alike, so a run of one letter is one rectangle | `shikaku.ts` |
| Givens | A character a cell: Shikaku's areas (base 36), Akari's `.` `#` `0`-`4`, Slitherlink's `.` `0`-`3`, Hitori's digits, Fillomino's numbers; Kakuro's are longer than its cells (`#` and two two-digit sums for a black one), so its black cells are read off the code | each kind's file |
| The answer is the code | Handed in as it stands; the check restates the rules through Kazu (`checkShikaku`, `checkAkari`, ...), never the solver that made the board | `puzzleCheck.ts` |
| A seed with no puzzle | Kazu throws when it cannot prove a board (Kakuro seed 97: one in a hundred). The seed names the next that has one, as a winnable Solitaire's does; the page puts the address right | `generate.ts` |
| Sizes and levels | Shikaku 5, 7, 9, 12 at easy, medium, hard; Akari 5, 7, 9, 12; Slitherlink 4, 5, 7, 10; Hitori 5, 7; Fillomino 4, 5, 6 at easy and medium (6×6 easy only: its medium took up to 1.7 seconds to make); Kakuro 10 | `pencil.constants.ts` |
| Points | Five a cell the answer decides (`work`), weight set so a medium solve at the default size is about 100 IP | `points.constants.ts` |
| Hints, Check and Show | As a Number Place's: against the answer this tab holds; Show is paid for from the Check allowance; Hint is chosen on the set-up | `PencilSolve.tsx` |

## Not done, and why

Heyawake, Nurikabe, Masyu, Yajilin, Juosan and Ripple Effect are in Kazu 1.2.0 and not
here: the family shows at most eight games and keeps room for Jirai. Of the six on the
site, Akari, Slitherlink and Hitori come from small families of layouts rather than a
general generator (Akari 7×7 always has ten white squares; Slitherlink clues every cell,
mostly 0; Hitori shades three or four squares), which are honest puzzles with one answer
and easy ones. A better generator in Kazu is a new version of the package and a bump here.
