# PTS-02 Points for games

**Needs John's yes on the prices, and a migration: take a Neon branch and a
dump to the DiskStation first (AGENTS.md, "Back It Up Before You Migrate It").**

## What it is

A finished game pays points to each of the two who played it, and those points
join the site total from PTS-01. The Completed tab shows them beside what each
game earned in XP and rating.

## The prices (proposed)

A game's points are its result times its weight:

| How it went | Base |
|---|---|
| Won | 100 |
| Drawn | 50 |
| Lost, having played it out | 20 |
| Lost by resigning before the tenth move, abandoned, or cancelled | 0 |

Rated or not, against a person or a program, it pays the same. A program earns
points too (AGENTS.md: programs are players), and the board's People /
Computers / Everyone keeps them apart.

## The weights (proposed 2026-09-25, for John to approve)

The weight measures how much a game asks: how long it runs and how deep it is.
Gomoku on 15×15 is 1.0. A game's weight is at its default board; where a game
offers other sizes, the size column says what each is worth. Kept in one
table, `GAME_POINTS_WEIGHT` in `gomoku.constants.ts`, typed as a Record, so a
new game cannot ship without one.

| Family | Game | Weight | By size |
|---|---|---|---|
| Five in a row | Gomoku | 1.0 | 9×9 0.7, 13×13 0.9, 15×15 1.0, 19×19 1.2 |
| | Tournament Gomoku | 1.0 | as Gomoku |
| | Renju | 1.1 | as Gomoku, +0.1 |
| | Omok | 1.0 | as Gomoku |
| | Caro | 1.0 | as Gomoku |
| | Connect6 | 1.2 | as Gomoku, +0.2 |
| | Misère Five | 1.0 | as Gomoku |
| | Hex Five | 1.0 | 7: 0.6, 9: 0.8, 11: 1.0, 13: 1.2 |
| Drops | Drop Four and its seven variants (Ring, Hole, Hot, Clear, Giveaway, Edge, Wormhole) | 0.6 | 7 wide 0.5, 9: 0.6, 10: 0.7 |
| Turn and take | Reversi, Classic Reversi, Anti-Reversi | 1.0 | |
| | Mini Reversi | 0.5 | 4×4 0.25, 6×6 0.5, 8×8 1.0 |
| | Grand Reversi | 1.3 | |
| | Honeycomb | 1.0 | 7: 0.6, 9: 0.8, 11: 1.0, 13: 1.2 |
| | Ninuki-renju, Sannuki-renju | 1.1 | as Gomoku, +0.1 |
| Strange boards | Toroidal Five, Obstacle Five | 1.0 | as Gomoku |
| | Domino Five, Block Five | 1.1 | 13: 1.0, 15: 1.1, 19: 1.3 |
| | Twist Five | 0.7 | |
| | Twist Four | 0.4 | |
| Checkers | Checkers, Brazilian, Russian, Pool | 1.0 | |
| | International Draughts (10×10) | 1.4 | |
| | Canadian Checkers (12×12) | 1.6 | |
| Territory and races | Go | 2.0 at 19×19 | 9×9 0.8, 13×13 1.2, 19×19 2.0 |
| | Hex | 1.0 at 11×11 | 11: 1.0, 13: 1.2, 19: 1.6 |
| | Halma | 1.6 at 16×16 | 8: 0.6, 10: 0.9, 16: 1.6 |
| | Chinese Checkers | 1.4 | |
| Small boards | Tic-tac-toe, Wild Tic-tac-toe | 0.1 | |
| | Notakto | 0.15 | |
| | Trap Three, Square Four | 0.3 | |
| | Maker and Breaker | 0.4 | |

So a Go win on 19×19 is 200 points, a Gomoku win 100, a Drop Four win 60 and a
tic-tac-toe win 10. Nothing is worth farming: the quickest games pay the least
per game, and about the same per minute as the long ones.

The puzzles' weights are in PTS-01. They are set so a medium solve at a
puzzle's default size is about 100, the same as a Gomoku win.

## Read first

- `src/lib/xp/awardXp.ts` and wherever `recordResult` is called: the one
  game-end write this rides on.
- `src/lib/history/gameResult.ts`: how a result and an ending are read.
- AGENTS.md: "The deploy window drifts it". A column the old code cannot write
  is left null for games that end during the deploy, and the backfill below
  covers them.

## What changes

- `prisma/schema.prisma`: `Game.blackPoints Int?` and `Game.whitePoints Int?`.
  Null means not priced, never "scored nothing" (AGENTS.md: "prefer null over a
  value that happens to be in range"). A migration adds them. It writes nothing,
  since the backfill does that.
- `src/lib/points/gamePoints.ts` (new): `gamePointsFor(result, ending,
  moveCount)` returns a `{ black, white }` pair, pure and tested. Written in the
  same update that files the result.
- `sitePoints.ts`: adds each member's game points (the seat's column), and this
  month's where `finishedAt` is in the month.
- `MyGameRow`: "+100 points" beside the XP a game earned.
- A backfill runner, `src/lib/points/gamePointsBackfill.play.test.ts`, in the
  pattern of the XP backfill. It is run in process and never through the site,
  on your own database first. It prices every finished game whose columns are
  null.

## Tests

- `gamePoints.test.ts`: each row of the price table, and a resign before move
  ten paying nothing.
- `e2e/game-points.spec.ts`: two members of its own play a short game to a win.
  The Completed tab shows +100 and +20, and `/points` adds them.

## Acceptance

- Every game finished after the deploy has both columns set.
- The backfill leaves no finished game null. Run on production only with John's
  word, after a branch and a dump.

## Not

- Not a second game-end write: the columns go in the update that already files
  the result.
- Not XP. Nothing here reads or writes the XP ledger.
