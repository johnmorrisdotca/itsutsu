# NUM-11. Puzzle leaderboards, prominent and easy to read

Board key: `puzzle-leaderboards-as-prominent-as-puzzlemadness-s`. Kind:
feature, HIGH. About row: `about-sites-worth-knowing-add-puzzlemadness`.

## Why

John, 2026-09-24, on PuzzleMadness (puzzlemadness.co.uk): "I want
leaderboards, which we have... but these are so prominent and easy to read…
Find out how they score these."

## What PuzzleMadness does (read 2026-09-24)

- **Every puzzle's page carries two boards**, All-time and Monthly, ten rows
  each: Rank, Player, Total score. Under each, "View complete board", a page
  of every player (477 on the 16×16 board that day). No tabs, no filters: one
  number per player, big and plain.
- **A star beside every name** for puzzles finished: blue 5, red 10, green 25,
  orange 50, purple 100, gold 250, white 500, black 1,000 (their FAQ).
- **The score, from their own script** (`getScore` in the sudoku bundle):
  `5 × cells the solver filled − 50 × hints`, and the only hint is "Create
  Pencil Marks". Printed cells score nothing. There is **no time element**: a
  harder puzzle is worth more only because fewer numbers are printed. Checked
  against the boards: 20,759,875 over 30,664 16×16 puzzles is 677 a puzzle,
  about 135 cells filled.
- **Only a puzzle's best score counts**, and only positive scores count
  ("you are not penalised for scores less than 0"). The monthly board counts
  puzzles finished this month, whenever they were published.

## What we have

`PuzzleFastest` on a puzzle's front door: the fastest solves, by time. XP pays
25 a solve, capped at six a day, which is effort across the site, not a board
for one puzzle.

## The proposal

- **Points per solve**, like theirs: 5 per cell not printed, minus 50 per
  Check pressed (our only help), never below 0. For Hidden Stones and Black
  and White every cell not printed counts, since each is decided. A puzzle's
  best counts once (the same grid is one `givens`).
- **Two boards on every puzzle's front door**, All time and This month, ten
  rows: rank, player (`PlayerName`, with the level badge we already draw
  where they draw a star), total. A "Whole board" page under the puzzle. The
  family page gets the same two for Numbers as a whole. Fastest stays, beside
  them.
- **Every total links to the solves behind it** (Nothing Is A Dead End), and
  a stranger sees the shut state, as the ladders do.
- **Cost**: read at request time, never polled. Summing every solve on every
  view is the per-request recompute John's rules forbid, so each solve stores
  its points when it is kept (a `points` column, a migration with a Neon
  branch first), and the board is one grouped query over an index.
- **Open for John**: whether points should also reward the level or the
  clock. Theirs rewards neither directly, and the boards still read well.

## For About (the cloud agent's row)

A paragraph for "Sites worth knowing", checked 2026-09-24:

> PuzzleMadness (puzzlemadness.co.uk) is the one to open if you like the
> Numbers shelf here. It prints a fresh puzzle every day at five levels, Easy
> to Tough and Mixed, across nearly forty kinds of Sudoku, from the 16×16
> Giant with letters for the numbers past nine to Samurai's five overlapping
> grids, and close to sixty other logic puzzles besides: Nonograms, Kakuro,
> Slitherlink, Star Battle, Futoshiki, Towers. Its leaderboards are the thing
> to learn from. Every puzzle has an all-time and a monthly board on its own
> page, plain enough to read at a glance, and a star beside each name says how
> many that player has finished, blue at five up to black at a thousand. A
> score is five points for every cell you fill in, less fifty if you ask it to
> pencil in the candidates, so a harder puzzle is simply worth more and the
> clock never costs you anything.
