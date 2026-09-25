# NUM-08. Black and White

Board key: `black-and-white-joins-the-numbers-family`. Kind: feature, HIGH.
Built after NUM-07, on its branch.

## Why

John, 2026-09-24: "Yes to all 3 of these." The stone puzzle of the three, and
the one that belongs most to a site about five in a row: here three in a row
is the thing you may not make.

## The decision

- **Black and White 白黒.** Fill an even-sided grid with black and white
  stones: half of each in every row and column, never three of one colour in
  a line across or down, and no two rows alike, no two columns alike. Our
  version of Takuzu / Binairo (both names are trademarks in the EU; LinkedIn
  plays it daily as Tango, a name LinkedIn holds). `inspiredBy: "Takuzu"`,
  `alsoKnownAs: ["Binairo", "Tango"]`. Placeholder name, as for the others.
- **Sizes 6, 8, 10, 12**, default 8; easy, medium, hard graded like Towers:
  easy by what is seen at a glance (a pair forces the cells either side, a gap
  between two alike takes the other colour, a line with its half of one colour
  fills with the other), medium one guess, hard any unique puzzle.
- **The tap grid is Hidden Stones'**: a tap on an open cell cycles empty,
  black, white, empty. Printed stones cannot be changed and are drawn so they
  read as printed.

## Exact changes

- `src/lib/puzzles/blackAndWhite/`: `code.ts` (row-major, `.` `b` `w`; the
  answer is the full grid), `solve.ts`, `generate.ts` (a seeded full grid,
  then givens taken away while unique and within the level), tests.
- `checkSolution`: counts, no run of three, rows and columns all different,
  givens kept.
- Spec (`mostCells` 144), copy, size names, slug `black-and-white`, the
  shelf's eighth place beside Hidden Stones, `RULES_ATTRIBUTION`.
- A solve component on `useSolve` (Check allowance, Pause, the idle
  question), the grid inside `PuzzleBoard`, the set-up preview in
  `PuzzleBoardPreview`, a screenshot scene, `e2e/black-and-white.spec.ts`.

## Release summary

"Black and White joins Numbers: fill the grid with black and white stones, half of each in every line and never three in a row."
