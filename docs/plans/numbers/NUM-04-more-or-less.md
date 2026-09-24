# NUM-04. More or Less

Board key: `a-second-number-puzzle-beside-sudoku`. Kind: feature. Needs
NUM-02 on `main`.

## Why

John: "If there is another number type of game we can add like Sudoku, that
would be great." The family has room for eight, and a second number puzzle
makes Numbers a shelf rather than a single card.

## The decision

- **More or Less 大小.** Fill the square so every row and column holds each
  number once, and every "more than" mark between two cells is true. Our
  version of Futoshiki 不等式 (Tamaki Seimiya, published by Nikoli, 2001);
  `inspiredBy: "Futoshiki"`, `alsoKnownAs: ["Futoshiki", "Unequal"]`,
  country JP. 大小 is "big and small", which is what every mark says.
- **Why this one and not Kakuro or a Calcudoku.** Kakuro's name is Nikoli's
  and its grids need word-search-style shapes and sum tables; a Calcudoku
  needs cages with arithmetic, a third kind of grid and four operators to
  explain. More or Less is a Latin square with marks: it shares Number
  Place's grid, its number keys and most of its solver, so it is the one that
  is a solid game in a day rather than a rule in a day.
- **Sizes 4 to 7**, three levels by the same rating as Number Place (singles
  only, one guess, more).

## Exact changes

- `src/lib/puzzles/moreOrLess/generate.ts`: a seeded Latin square, then add
  marks and givens in a seeded order until `solve.ts` counts one solution,
  then take away what is not needed while it stays unique. `solve.ts`: cell
  by cell with row, column and mark constraints, singles pass for the rating.
- `puzzleCode.ts`: givens row-major, then the marks as a list of
  `r,c,dir` (`>` to the right or `v` downward).
- `checkSolution`: rows and columns are permutations, every mark holds,
  every given kept.
- Spec, copy, slug `more-or-less`, the family row's third game, the grid
  with marks drawn between cells, screenshot, thumb, stamp,
  `e2e/more-or-less.spec.ts`.

## Acceptance

- `puzzles.coverage.test.ts` green for the third kind; every gate in NUM-02's
  list green.

## Release summary

"More or Less joins Numbers: fill the square so every row and column holds each number once and every more-than mark is true."
