# NUM-03. Hidden Stones

Board key: `a-find-the-stones-logic-puzzle-like-star-battle`. Kind: feature,
HIGH. Needs NUM-02 on `main` (the puzzle library and the pages).

## Why

John: "a variant of sudoku where you have to find the cat where there is a
cat in every group, and cats can never be next to each other and only 1 per
group… but since this is an itsutsu site, no cats, should be something else
like find the Black stone, and give it a nice name."

## The decision

- **Hidden Stones 隠し石.** One black stone is hidden in every row, every
  column and every region; no two stones touch, even at a corner. A stone
  is what this site's games are made of, and 隠し石 reads as "the hidden
  stone" to a Japanese reader.
- **What it is our version of.** The one-star form of Star Battle (Hans
  Eendebak, 2003), which LinkedIn's Queens (2024) made a daily habit under
  a name that belongs to LinkedIn. `inspiredBy: "Star Battle (one star)"`,
  `alsoKnownAs: ["Queens"]`.
- **Sizes 5 to 10**, one level. Difficulty in this puzzle is the shape of
  the regions, not a number of givens; the generator rates a puzzle by how
  many placements survive the row-and-column reasoning before a guess is
  needed, and the set-up offers easy (singles finish it) and hard (the
  rest) — two levels, not three, because there is no third kind of step.

## Exact changes

- `src/lib/puzzles/hiddenStones/generate.ts`: pick a placement (a
  permutation with no two consecutive columns within one of each other,
  seeded), grow the regions from the stones by a seeded flood so every cell
  joins exactly one region, then keep it only if `solve.ts` counts one
  solution; otherwise regrow. `solve.ts`: row by row, a column per row not
  used, not adjacent to the previous row's, one per region; count to two.
- `puzzleCode.ts`: regions as letters row-major (`"aabbc…"`), the answer as
  the column of each row's stone.
- `checkSolution`: N stones, one per row, column and region, none touching.
- `PUZZLE_SPECS.hiddenStones`, `PUZZLE_DISPLAY.hiddenStones`,
  `PUZZLE_SLUGS.hiddenStones: "hidden-stones"`, the family row's second game.
- The grid: regions drawn as coloured cells with heavy borders between
  regions; a tap places a stone, a second tap marks a cross, a third clears.
  Stones are the site's black stone.
- Screenshot at a fixed seed, thumb, stamp; `e2e/hidden-stones.spec.ts`
  places the seed's stones and sees the done card.

## Acceptance

- `puzzles.coverage.test.ts` green for the new kind (which is what proves the
  gate applies to a second puzzle rather than being written for one).
- Generation under the budget at 10×10 in the unit test.
- Every gate in NUM-02's list green.

## Release summary

"Hidden Stones joins Numbers: one black stone hides in every row, column and region, and no two touch."
