# Pencil puzzles 鉛筆: Kazu's grid puzzles

**Status: added 2026-10-05, four games; Akari, Loop and Hitori and the site's first extra hard level added the same day, seven games** (board rows
`pencil-puzzles-a-new-family-with-kazu-1-2-0-s-new-grid-puzzles-and-jirai`,
`jirai-minesweeper-on-the-site-in-pencil-puzzles`,
`pencil-puzzles-ships-four-rectangles-cross-sums-regions-and-jirai`,
`kazu-harder-akari-slitherlink-and-hitori-and-easy-medium-hard-and-extra-hard-for` and
`pencil-puzzles-an-extra-hard-level-on-the-site-and-akari-slitherlink-and-hitori`).
Source package: `@johnmorrisdotca/kazu` 1.3.0, pinned exactly in `package.json`
(github.com/johnmorrisdotca/kazu, MIT, no dependencies). 1.3.0 (2026-10-05) made the six grid generators
random instead of a few layouts, gave each four levels (easy, medium, hard, extra hard, rated by solving the board
the way a person does) and more sizes; **a seed makes a different board from 1.2.0's**, which the site takes as it
comes (a beta: no compatibility layer, a kept run of the old boards may not fit its seed's new board).

Kazu 1.2.0 added twelve grid-puzzle engines beside the six number puzzles the site
already played from 1.0.0. The six are unchanged: 8,280 puzzles (every kind, size and
level, sixty-nine seeds, today's daily seed and the largest a seed can be) were made,
checked, solved, hinted and drawn on 1.0.0 and 1.2.0 and compared, and none differed;
`kazu.test.ts` still pins them. Six of the twelve are on the site, with Jirai, in a family
of their own, **Pencil puzzles** (key `pencil`): **Shikaku**, **Akari**, **Loop** (Kazu's Slitherlink), **Hitori**,
**Cross Sums** (Kazu's Kakuro) and **Regions** (Kazu's Fillomino). Plain names for coined ones, and ordinary Japanese
words stay (John, 2026-10-05: "it's weird that we can't have a game called Shikaku? that is a basic Japanese
word"); each of the three coined says what it is known as elsewhere on its rules page, and nowhere else.
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
| A board is a string of marks | A code is one character a mark place: a cell for most, an edge for Loop (`2 × n × (n + 1)`), `progressLength`. So a kept run, a step log, the scrubber and a finished page's replay work unchanged | `codes.ts`, `puzzleProgress.ts` (`progressLength`, `progressFits`) |
| Shikaku's rectangles | A letter a rectangle, touching rectangles never alike, so a run of one letter is one rectangle | `shikaku.ts` |
| Givens | A character a cell: Shikaku's areas (base 36), Regions' numbers; Cross Sums' are longer than its cells (`#` and two two-digit sums for a black one), so its black cells are read off the code | each kind's file |
| The answer is the code | Handed in as it stands; the check restates the rules through Kazu (`checkShikaku`, `checkKakuro`, `checkFillomino`), never the solver that made the board | `puzzleCheck.ts` |
| A seed with no puzzle | Kazu 1.3.0 never throws for one (1.2.0's Cross Sums seed 97 did, one in a hundred; if a level cannot be made it makes the next level down, rated on the board it returns). The way out stays, for a package that does: the seed names the next that has one, as a winnable Solitaire's does, and the page puts the address right | `generate.ts` |
| Sizes and levels | Four levels at every size, from easy (the rules alone, most numbers printed) to **extra hard** (the site's first: it needs the most supposing, the fewest numbers). Shikaku 5, 7, 10, 14; Cross Sums and Regions 6, 8, 10, 12 (Kazu's `SHIKAKU_SIZES`, `KAKURO_SIZES`, `FILLOMINO_SIZES`, which `pencil.test.ts` holds the site to). Measured on a Mac in node over eight seeds a kind, size and level, the slowest board took 0.54 s (Cross Sums 12, extra hard) and every other under 0.35 s | `pencil.constants.ts` |
| Points | A puzzle's own score is five a cell the answer decides (`work`), less fifty a help; its IP is its price on the ladder (`ladder.constants.ts`, PTS-05): Shikaku and Akari 50, 70, 95, 125 at 5, 7, 10, 14; Loop 50, 85, 125 at 5, 7, 10; Hitori 50, 70, 90, 125 at 5, 7, 9, 12; Regions 50, 75, 100, 125 at 6, 8, 10, 12; Cross Sums 50, 75, 100, 125 at 6, 8, 10, 12; Jirai 50, 65, 95, 125 at 7, 9, 12, 16; a level adds 0, 10, 25 or, for extra hard, 40, never past the ceiling of 150, so the biggest size's Hard and Extra hard are both 150. Rungs are spaced by the work in a size | `ladder.constants.ts`, `puzzlePoints.ts` |
| Hints, Check and Show | As a Number Place's: against the answer this tab holds; Show is paid for from the Check allowance; Hint is chosen on the set-up | `PencilSolve.tsx` |

## Jirai 地雷 (board row `jirai-minesweeper-on-the-site-in-pencil-puzzles`)

Minesweeper that never needs a guess, from `@johnmorrisdotca/jirai` 0.3.0 (pinned exactly), the family's
fourth card. It is not a Kazu board and has its own module (`src/lib/puzzles/jirai/`), board
(`JiraiBoard.tsx`) and solve (`JiraiSolve.tsx`), on the same footing otherwise: a puzzle of one answer, a code of
one character a square, kept runs, steps, Check, Show, Hint, the clock.

| Decision | What | Where |
| --- | --- | --- |
| Variants and shapes are settings | One card. The neighbours a number counts (eight, four, hexagons, wraparound) and the shape (rectangle, heart, star, hexagon: a flat board of at least 9×9) are chosen on the set-up and said by the seed, in twelve blocks of a million seeds from 1,900,000,000 (`JIRAI_SEED_BLOCK`); every ordinary seed is the classic board. Until a seed is drawn the address carries `grid=` and `shape=` | `jirai/variants.ts`, `puzzleAddress.ts`, `JiraiSetUpOptions.tsx` |
| The board is dealt upfront and opened at its middle | The package deals a board after the first uncover; a puzzle has to exist before it is played, so the site deals it from the seed, opens the active square nearest the middle with a clear opening, and shows that position. `givens` are the recipe and the opening (`j:s:r:9x9:13:40:7:<cells>`); `solution` is the board uncovered | `jirai/board.ts` (`jiraiMake`) |
| Sizes and levels | 7, 9, 12, 16 (7 is rectangles only); a level is the share of squares that are mines: 12%, 16%, 20% and, for extra hard (0.3.0), 25%, the share of the package's own 40×24 board with 240 mines. The package's sides are 9, 16, 30×16 and 40×24; the site keeps its squares, which a phone and a desk both hold. Every way to play, shape and level is dealt at the very seed asked for (`jirai.test.ts`); 0.3.0 deals the same boards as 0.2.1 for the same seeds, so a kept run is untouched | `jirai.constants.ts`, `JIRAI_DENSITY` |
| The server's check is O(squares) and cannot deal the board again | Dealing a no-guess board is a search. The check asks that the answer is a board that holds together: shape and opening kept, exactly as many covered squares as mines, every uncovered number the count of covered squares round it. A forged board that does is accepted, as a forged grid is for every puzzle here (the browser holds the answer) | `jiraiCheck` |
| A mine uncovered does not end it | It is flagged where it lies and counted as a mistake, charged as a Hint is. A slip of a thumb is not a bad guess, and a puzzle's ending unsolved would need the give-up path, the lost board's page and a record of it | `jiraiPress`, `useHints.charge` |
| Touch | A tap uncovers (or chords on a number), Flag turns taps into flags, a finger held 450 ms flags, a right click flags; the keyboard has Enter, Space or F, and the arrows. Nothing needs hover | `JiraiBoard.tsx` |
| Hint | Jirai's own, which reads no flags and no answer (`hintFor`); a wrong flag over the square is lifted first | `jiraiFix` |
| Points | Five a safe square the opening leaves covered is its own score (a medium 9×9 has about 30); its IP is its ladder price, 50, 65, 95, 125 by size | `ladder.constants.ts` |

## Akari, Loop and Hitori

They were held back on 1.2.0 (John, 2026-10-05: "ship four now"), because that Kazu's generators for them were small
families of layouts: an Akari 7×7 always had ten white squares, a Slitherlink clued every cell and mostly with 0, a Hitori
shaded three or four squares. 1.3.0 makes them from scratch at four levels, and they came back the same day. Their
names: **Akari** 明かり (slug `akari`), **Loop** 輪 (Kazu's Slitherlink, kind key and slug `loop`) and **Hitori** 一人
(slug `hitori`). Loop is drawn on its edges, so a press means the edge nearest (`edgeAt`), a code has a character an edge
(`2 × n × (n + 1)`), and its steps are said as lines and columns (`edgeWords`). Akari 5, 7, 10, 14; Loop 5, 7, 10;
Hitori 5, 7, 9, 12 (Kazu makes any side from 4 to 12, and offers 5 to 10 and 12). Hitori's numbers past nine are letters.
Pictures: Akari 7×7 seed 20261005 (6 marks), Loop 7×7 seed 20261005 (16 edges), Hitori 7×7 seed 20261005 (5 shades).

## Kazu 1.3.0's last resort, and what the site does about it

When Kazu cannot find a random board of a level within its attempts it falls back, without saying so (a board's `level`
stays the one asked), to the level below and in the end to the fixed layouts of 1.2.0. Looking at every size and level
found one place it matters here: **Akari at 12×12 and bigger, easy and sometimes medium**, comes back as the old fixed lattice
of black rooms (74% black) for about half the seeds at 14×14 easy (27 of 60), 3 of 60 medium, 10 of 60 at 12×12 easy, and none at 10×10
or smaller or at hard and extra hard. `akari.ts` refuses such a board, so that seed has no puzzle and the page uses the next
(`generatePencil`, as for any seed with none): no Akari is a pattern. Every other kind, size and level offered was checked over
25 to 60 seeds for the same (shares of numbers, shaded squares, black squares, clues and zeros) and none looked like a
template. Kazu should be told: its rating of the lattice is a valid easy board, so its own count of fallbacks (none in 20,800 boards) cannot see it.

The levels are what Kazu says they are, measured by solving: easy and medium need only the rules (easy keeps more numbers),
hard needs supposing something (depth 1), extra hard the most of that. On the boards looked at, hard and extra hard both have
depth 1 (a rare 2 on Regions), so extra hard differs from hard by how much supposing, not by a deeper kind.

## Not done, and why

Heyawake, Nurikabe, Masyu, Yajilin, Juosan and Ripple Effect are in Kazu 1.2.0 and not here: the
first five make few distinct puzzles or tiny boards. Ripple Effect looked better than Akari, Loop and Hitori did on 1.2.0.
