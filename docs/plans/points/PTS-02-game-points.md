# PTS-02 Points for games

**Needs John's yes on the prices, and a migration: take a Neon branch and a
dump to the DiskStation first (AGENTS.md, "Back It Up Before You Migrate It").**

## What it is

A finished game pays points to each of the two who played it, and those points
join the site total from PTS-01. The Completed tab shows them beside what each
game earned in XP and rating.

## The prices (proposed)

| How it went | Points |
|---|---|
| Won | 100 |
| Drawn | 50 |
| Lost, having played it out | 20 |
| Lost by resigning before the tenth move, abandoned, or cancelled | 0 |

The same for every game and every board, rated or not, against a person or a
program. A program earns them too (AGENTS.md: programs are players), and the
board's People / Computers / Everyone keeps them apart.

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
