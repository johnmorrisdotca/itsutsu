# Houseki 宝石: a fifth kind of game

**Status: built 2026-10-06 for the five games of `@johnmorrisdotca/houseki`
(0.3.0 at the time), which the site takes from npm at an exact version.**

Houseki is five gem and stone puzzles for one person, from the open-source
package of that name: Falling Triplets (100 levels), Colour Chains (50 levels
in each of three campaigns: Classic, Shizen and Arashi), Stone Collapse (100),
Gem Swap (50) and Magnetic Blocks (50). Every level is graded from one to five
marks, every game has three guided lessons, and all but Magnetic Blocks have a
Daily. All are played alone, a level at a time, on a phone or a desk.

## Why a fifth kind

The catalogue joins its games through `GameKey` (`src/lib/catalogue/gameKeys.ts`).

| Kind | Kept | Counted |
|---|---|---|
| `RuleVariant` | a `Game` row and its moves | rated, on a ladder of players |
| `PuzzleKind` | a solve | points, XP, fastest times |
| `PartyKind` | in the browser, or a table on the server | never |
| `CasualKind` (Karakuri) | in the browser | never, no points |
| `HousekiKind` | in the browser while it is played; a won level or Daily as one row | points, no XP |

A Houseki game sits between a casual game and a puzzle. Like a casual game it
is played in the browser and asks the site for nothing while it goes. Like a
puzzle a won level is worth points, so the server cannot take the browser's word
for it. What is sent is the finished game's save, and the server plays it again.

## How a win is counted

The package's `decodeGame` replays a save's recorded actions through the engine
from the start, so a save that does not replay to the same state is refused, and
one that replays to a win is a win. `src/lib/houseki/housekiVerify.ts` is that
check, pure and tested; `server/housekiWin.ts` keeps the row; the route is
`POST /api/houseki/win`, behind the session (a stranger plays and is told that
points need an account) and rate limited.

- It refuses a save of another game or level than the one named, a game not won,
  a Daily not of today's date (UTC) or not finished, and anything over 400 KB.
- A level counts once, and a better score replaces the stored one. The row is
  `HousekiWin`, one per member, game and level (the migration only adds a table).
- A lesson and a free game earn nothing and are never sent.
- `houseki.coverage.test.ts` plays every one of the 450 levels' recorded winning
  plans through the server's check, so a package update that breaks a level fails
  the build here, not in a player's hand.

## Points

On the puzzle ladder's scale (PTS-05), priced by a level's marks and nothing
else, and read when a board is drawn, never stored: marks 1 to 5 are 50, 70, 90,
110 and 130; Shizen adds 10 and Arashi 20 (so the dearest level is exactly 150,
an ordinary game's ceiling); a Daily is a flat 60, once a day.
`src/lib/points/housekiLadder.ts` holds the table and `housekiLadderSql.ts` the
same prices as a join, so a board sums in the database. The games join the
points scope (`ipScope.ts`, `ipBoards.ts`, `ipHref.ts`). There is no XP and no
wins page: the figure is a plain number on the points boards and the header.

## What a reader gets

A family (`/games/houseki`, answered by the game page's route like Karakuri's)
and one front door for each game under `/games/<slug>`, with `/rules`,
`/family`, `/new` and `/play`. The set-up chooses Levels (the campaign, and a
grid of levels showing which are won), Lessons, Daily or Free play (a size from
at most four, a colour count, and Relaxed or Arcade where the game has a clock),
and never changes height. A game part way through is kept in the browser, one
for each thing asked for, and waits on My games (`HousekiCards`). Every game
offers Just the board and the desktop sizes, and is kept for offline play.

- **Relaxed and Arcade.** Relaxed has no clock; Arcade drops the pieces on one,
  pauses when the page is left, and gives a count of three on Continue.
- **Keys and touch.** Each falling game has its keys and on-screen buttons, held
  to repeat; Stone Collapse and Gem Swap are played by choosing, with the arrow
  keys moving between cells. Every control is a real button with a name.
- **Colour is never alone.** Each gem carries its own symbol.
- **Phones.** The well scales to the column's width and a tall one reserves room
  for its controls (`--tall-reserve`, beside Suido's `--suido-ratio`).

## What was left out of the package's own demo

Four sizes at most per game on the set-up (the packages' own larger presets are
not offered), the demo's settings for sounds, shapes, tools and theming, and its
save slots. Nothing is hidden behind an unlock: every size and mode is offered to
everyone.

## Held by

- `src/lib/houseki/houseki.coverage.test.ts`: the New Game Gate for the kind
  (levels and lessons are the package's own, every witness is accepted at a legal
  price, pictures and their stamp, copy in both languages, a rules page, a family
  no award counts, an address and its four pages, offline, a browser spec, the
  day it arrived, nothing on the server while it is played).
- `housekiVerify.test.ts`, `housekiProgress.test.ts`, `housekiAddress.test.ts`,
  `points/housekiLadder.test.ts`.
- `e2e/houseki-wins.spec.ts` plays each game to a win with the page's own
  presses and checks the server counted it; the shared specs (set-up-steady,
  bare-board, wide-mode, game-pictures, offline) loop over the games.
- Pictures: `pnpm screenshots:houseki`, stamped by `housekiArt.data.ts`.

## Adding a sixth

Add the kind to `HousekiKind`, a row in `HOUSEKI_SPECS`, its engine in
`HousekiGameClient` and `housekiVerify.ts` (the replay), copy in
`phrases.houseki.constants.ts` and its Japanese, a slug, the family, and run
`pnpm screenshots:houseki` and `pnpm games:added`.
