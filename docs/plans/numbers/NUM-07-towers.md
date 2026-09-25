# NUM-07. Towers

Board key: `towers-joins-the-numbers-family`. Kind: feature, HIGH. Needs
NUM-02 on `main`; built on the Sum Cages branch (`its-killer`), because both
change the same puzzle files.

## Why

John, 2026-09-24, choosing three more puzzles for Numbers after the research
(Sum Cages, Towers, Black and White): "Yes to all 3 of these." Numbers goes to
eight with the three, the most a shelf holds (`picker.test.ts`).

## The decision

- **Towers 塔.** Fill an N×N square so every row and column holds 1..N once;
  each number is a tower's height, and a clue outside the edge says how many
  towers show from there, a taller one hiding every shorter one behind it.
  Our version of Skyscrapers (`inspiredBy: "Skyscrapers"`,
  `alsoKnownAs: ["Skyscrapers", "Building Heights"]`, country JP). The name
  is a placeholder under `name-the-new-puzzles-properly`.
- **Sizes 4 to 7**, all four offered, default 5; three levels.
- **Levels are graded by what a person sees, not by what the solver can
  prove.** The solver narrows a clued line by every ordering of 1..N that
  fits it (`lines`), which proves a 7×7 unique in milliseconds and is far
  stronger than anybody's eye: graded by it, nearly every puzzle came out
  easy. So levels use `edges`: a 1 means the tallest is next to it, a clue of
  N means they climb, a clue of `c` caps the `k`th cell at `N − c + k`, and a
  line with three or fewer open cells has every order tried. Easy is solved
  by that alone, medium needs one guess, hard is any unique puzzle.
- **Clues stand in a ring on the wood.** The board is drawn at `size + 2`
  (`TowerRing`), with the square on its white paper in the middle and no
  coordinates, in the solve and the set-up preview alike. The frame's rim is
  too thin to hold a number.

## What changed

- `src/lib/puzzles/towers/`: `code.ts` (cells then 4·N clue characters:
  top, bottom, left, right), `solve.ts`, `generate.ts` (a Latin square from
  More or Less's `latinSquare`, every clue, givens only if needed, then givens
  and clues taken away while it stays unique and within its level),
  `generate.test.ts`.
- `puzzleCheck.ts`: `checkTowers`, with the Latin-square part shared with More
  or Less as `checkLatinSquare` and the counting restated rather than
  borrowed from the solver.
- Spec (`mostCells` 77), copy, size names, slug `towers`, the family's shelf
  (number puzzles together, then Hidden Stones), `RULES_ATTRIBUTION`.
- `NumberSolve` reads the clues; `PuzzleGrid` draws the ring; Escape lets a
  chosen cell go.
- Pictures: `e2e/puzzle-screenshots.spec.ts` has a Towers scene, and every
  scene now presses Escape and drops focus before the shot. Before this, every
  number puzzle's picture on the live site showed its last cell lit green
  (clicking the clock chose nothing), and Hidden Stones' showed a focus ring
  round a cross. All seven pictures re-taken, thumbs cut, stamp written.
- `e2e/towers.spec.ts`: the front door, the ring drawn as the code says, a
  solve to "Solved", and the route refusing a square turned upside down.

## Acceptance

- `puzzles.coverage.test.ts`, `puzzleArt.coverage.test.ts`, `picker.test.ts`,
  the full unit suite, and the Towers, set-up and number-puzzle specs green.

## Release summary

"Towers joins Numbers: every number is a tower's height, and the clues around the edge say how many you can see."
