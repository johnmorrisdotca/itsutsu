# NUM-10. Number Place at 16×16

Board key: `number-place-at-16-16-the-giant-size`. Kind: feature. Needs
NUM-07 and NUM-08 landed (they change the same files).

## Why

John, 2026-09-24, looking at PuzzleMadness's daily 16×16 Giant Sudoku: "we
should probably allow 16x16." It is a real and popular size: 4×4 boxes, and
sixteen symbols, written there as 1–9 then A–G. The same site also offers
12×12 (boxes three by four) and Samurai (five overlapping 9×9s); neither is
planned here.

## The decision

- **A fourth size of Number Place**, not a new puzzle: the shelf is full at
  eight, and a size is not a game. Sizes 4, 6, 9, 16: exactly the four boards
  the set-up screen holds. Name on its tile: "Giant" 特大.
- **Symbols 1–9 then A–G**, as PuzzleMadness writes them, one character a
  cell. `decodeCells` reads digits only today; it needs the letters for a side
  above nine, and `stepEntry`, the keys and the keyboard need them too (A–G
  typed, 16 keys plus clear, in two rows on a phone).
- **Offered on a phone, with a word.** At 390px a 16×16 cell is about 21px,
  under a fingertip. The set-up line under the size says it is best on a
  tablet or computer; nothing is hidden.
- **Measured before it ships.** Generation, uniqueness and the level rating
  must run in the browser's time at every level (`puzzles.coverage.test.ts`
  allows three seconds a make); if hard cannot, 16×16 offers the levels that
  can, as Hidden Stones offers two.
- Diagonal, Jigsaw and Sum Cages stay at their sizes.

## Acceptance

- The coverage gate at 16 for Number Place, `puzzleCodeLength.test.ts`
  (`mostCells` becomes 256), the picture gate, and a browser case that fills a
  16×16 easy grid with letter keys.

## Release summary

"Number Place comes in a Giant size: 16×16, with boxes four by four and the letters A to G after 9."
