# Pencil puzzles 鉛筆: Kazu's grid puzzles

**Status: added 2026-10-05, four games** (board rows
`pencil-puzzles-a-new-family-with-kazu-1-2-0-s-new-grid-puzzles-and-jirai`,
`jirai-minesweeper-on-the-site-in-pencil-puzzles` and
`pencil-puzzles-ships-four-rectangles-cross-sums-regions-and-jirai`; the rest are waiting on
`kazu-harder-akari-slitherlink-and-hitori-and-easy-medium-hard-and-extra-hard-for` and
`pencil-puzzles-an-extra-hard-level-on-the-site-and-akari-slitherlink-and-hitori`).
Source package: `@johnmorrisdotca/kazu` 1.2.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/kazu, MIT, no dependencies).

Kazu 1.2.0 added twelve grid-puzzle engines beside the six number puzzles the site
already played from 1.0.0. The six are unchanged: 8,280 puzzles (every kind, size and
level, sixty-nine seeds, today's daily seed and the largest a seed can be) were made,
checked, solved, hinted and drawn on 1.0.0 and 1.2.0 and compared, and none differed;
`kazu.test.ts` still pins them. Three of the twelve are on the site, with Jirai, in a family
of their own, **Pencil puzzles** (key `pencil`): **Shikaku**, **Cross Sums** (Kazu's Kakuro) and
**Regions** (Kazu's Fillomino). Plain names for coined ones, and ordinary Japanese words stay
(John, 2026-10-05: "it's weird that we can't have a game called Shikaku? that is a basic Japanese
word"); each of the two says what it is known as elsewhere on its rules page, and nowhere else.
A puzzle here is a `PuzzleKind` (`src/lib/puzzles/pencil/`), never a row in
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
| A board is a string of marks | A code is one character a mark place: a cell for most, an edge for Loop (`2 × n × (n + 1)`), held, `progressLength`. So a kept run, a step log, the scrubber and a finished page's replay work unchanged | `codes.ts`, `puzzleProgress.ts` (`progressLength`, `progressFits`) |
| Shikaku's rectangles | A letter a rectangle, touching rectangles never alike, so a run of one letter is one rectangle | `shikaku.ts` |
| Givens | A character a cell: Shikaku's areas (base 36), Regions' numbers; Cross Sums' are longer than its cells (`#` and two two-digit sums for a black one), so its black cells are read off the code | each kind's file |
| The answer is the code | Handed in as it stands; the check restates the rules through Kazu (`checkShikaku`, `checkKakuro`, `checkFillomino`), never the solver that made the board | `puzzleCheck.ts` |
| A seed with no puzzle | Kazu throws when it cannot prove a board (Cross Sums seed 97: one in a hundred). The seed names the next that has one, as a winnable Solitaire's does; the page puts the address right | `generate.ts` |
| Sizes and levels | Shikaku 5, 7, 9, 12 at easy, medium, hard; Regions 4, 5, 6 at easy and medium (6×6 easy only: its medium took up to 1.7 seconds to make); Cross Sums 10 | `pencil.constants.ts` |
| Points | A puzzle's own score is five a cell the answer decides (`work`), less fifty a help; its IP is its price on the ladder (`ladder.constants.ts`, PTS-05): Shikaku 50, 70, 90, 125 at 5, 7, 9, 12; Regions 50, 80, 125 at 4, 5, 6; Cross Sums 100 (one size, one level); Jirai 50, 65, 95, 125 at 7, 9, 12, 16; a level adds 0, 10 or 25. Rungs are spaced by the work in a size | `ladder.constants.ts`, `puzzlePoints.ts` |
| Hints, Check and Show | As a Number Place's: against the answer this tab holds; Show is paid for from the Check allowance; Hint is chosen on the set-up | `PencilSolve.tsx` |

## Jirai 地雷 (board row `jirai-minesweeper-on-the-site-in-pencil-puzzles`)

Minesweeper that never needs a guess, from `@johnmorrisdotca/jirai` 0.2.1 (pinned exactly), the family's
fourth card. It is not a Kazu board and has its own module (`src/lib/puzzles/jirai/`), board
(`JiraiBoard.tsx`) and solve (`JiraiSolve.tsx`), on the same footing otherwise: a puzzle of one answer, a code of
one character a square, kept runs, steps, Check, Show, Hint, the clock.

| Decision | What | Where |
| --- | --- | --- |
| Variants and shapes are settings | One card. The neighbours a number counts (eight, four, hexagons, wraparound) and the shape (rectangle, heart, star, hexagon: a flat board of at least 9×9) are chosen on the set-up and said by the seed, in twelve blocks of a million seeds from 1,900,000,000 (`JIRAI_SEED_BLOCK`); every ordinary seed is the classic board. Until a seed is drawn the address carries `grid=` and `shape=` | `jirai/variants.ts`, `puzzleAddress.ts`, `JiraiSetUpOptions.tsx` |
| The board is dealt upfront and opened at its middle | The package deals a board after the first uncover; a puzzle has to exist before it is played, so the site deals it from the seed, opens the active square nearest the middle with a clear opening, and shows that position. `givens` are the recipe and the opening (`j:s:r:9x9:13:40:7:<cells>`); `solution` is the board uncovered | `jirai/board.ts` (`jiraiMake`) |
| Sizes and levels | 7, 9, 12, 16 (7 is rectangles only); a level is the share of squares that are mines: 12%, 16%, 20% | `jirai.constants.ts`, `JIRAI_DENSITY` |
| The server's check is O(squares) and cannot deal the board again | Dealing a no-guess board is a search. The check asks that the answer is a board that holds together: shape and opening kept, exactly as many covered squares as mines, every uncovered number the count of covered squares round it. A forged board that does is accepted, as a forged grid is for every puzzle here (the browser holds the answer) | `jiraiCheck` |
| A mine uncovered does not end it | It is flagged where it lies and counted as a mistake, charged as a Hint is. A slip of a thumb is not a bad guess, and a puzzle's ending unsolved would need the give-up path, the lost board's page and a record of it | `jiraiPress`, `useHints.charge` |
| Touch | A tap uncovers (or chords on a number), Flag turns taps into flags, a finger held 450 ms flags, a right click flags; the keyboard has Enter, Space or F, and the arrows. Nothing needs hover | `JiraiBoard.tsx` |
| Hint | Jirai's own, which reads no flags and no answer (`hintFor`); a wrong flag over the square is lifted first | `jiraiFix` |
| Points | Five a safe square the opening leaves covered is its own score (a medium 9×9 has about 30); its IP is its ladder price, 50, 65, 95, 125 by size | `ladder.constants.ts` |

## Held, and why

Akari, Slitherlink and Hitori work end to end here, and are not offered (John, 2026-10-05: "ship
four now"). Kazu 1.2.0's generators for them are small families of layouts: Akari 7×7 always has ten
white squares, Slitherlink clues every cell (mostly with 0), Hitori shades three or four squares.
They wait for a harder Kazu and an extra-hard level (rows
`kazu-harder-akari-slitherlink-and-hitori-and-easy-medium-hard-and-extra-hard-for` and
`pencil-puzzles-an-extra-hard-level-on-the-site-and-akari-slitherlink-and-hitori`).

Their names for when they come: **Akari** 明かり (slug `akari`), **Loop** 輪 (Kazu's Slitherlink; slug `loop`)
and **Hitori** 一人 (slug `hitori`). Their engines, tables, drawing, presses and geometry are kept
tested (`src/lib/puzzles/pencil/held.ts`, `held.constants.ts`, `held.test.ts`,
`src/components/puzzles/pencil/heldDraw.ts`), and nothing the site runs imports them. No kind of
theirs is a `PuzzleKind`, so no page, card, link, picture, date or XP award reaches one. The list of what
to move to bring one back is the header of `held.constants.ts`. Their pictures were taken
and removed; the scenes were Akari 9×9 seed 20261005 (5 marks), Slitherlink 7×7 seed 20261065 (14 edges)
and Hitori 5×5 seed 20261005 (3 shades).

## Not done, and why

Heyawake, Nurikabe, Masyu, Yajilin, Juosan and Ripple Effect are in Kazu 1.2.0 and not here: the
first five make few distinct puzzles or tiny boards. Ripple Effect looked better than the held three.
