# IP, Itsutsu Points: one score for ability, beside XP for experience

John, 2026-09-25: "we need a site-wide scoring system like that puzzlemaddness..."

Row: `site-wide-points-one-score-for-everything-played-with-all-time-and-monthly-board`.

## XP and IP are two different things, on purpose

John, 2026-09-25: "XP and Points or (IP - Itsutsu Points) should be different
enough to justify… there has to be a reason for people want to collect
either/both. XP is site wide experience and maturity, like in D&D etc... and IP
aka Points is only about games. Pure ability." And: "Yes, ALL games count
towards IP", the puzzles included.

| | XP, experience 経験 | IP, Itsutsu Points 点 |
|---|---|---|
| **What it means** | How long and how widely you have been part of the site | How well you play |
| **Earned by** | Everything: playing, finishing, new games, streaks, visits, buddies, applause | Results only: wins, draws, close losses, and every puzzle solved |
| **A loss** | Still earns XP: you took part | Earns no IP, except a close score (up to 20% of the game's most) |
| **Goes down?** | Never; a lifetime total | Never within a month; each month is a fresh race, and the all-time total stays |
| **Why collect it** | Your level and title beside your name everywhere | The monthly IP board, a champion-of-the-month mark for the top three, and IP by family (best at Five in a row this month) |

Nothing in IP pays for turning up. Anything that does belongs to XP.

## What there is today (read 2026-09-25, at 0.340.1)

- **Every puzzle has its own points board.** `pointsFor` (`src/lib/puzzles/puzzlePoints.ts`)
  prices a solve when it is kept, and the price is stored on `PuzzleSolve.points`.
  `pointsBoardOf` (`src/lib/puzzles/server/puzzleBoards.ts`) sums each member's
  best solve of each grid, all time and since the start of the month, in one
  grouped query. `PuzzlePoints.tsx` draws the two top-tens on the puzzle's page.
- **The number puzzles** use PuzzleMadness's rule: five for every cell filled,
  less fifty for every Check or Hint, never below nought. The clock costs
  nothing.
- **The word puzzles** (Gomoji and its kana, French and German versions) have no
  cells to fill. They score each letter found, earlier guesses paying more, plus
  the word itself, the rows left unused and the time taken (`wordScore`,
  `kanaScore`). A lost word scores what it found.
- **Games score nothing.** A finished game moves a rating and pays XP. The
  Completed tab shows both for each game (`RatingChange`, `xpEarnedIn`). There
  are no game points.
- **XP is not points.** XP is experience, paid for taking part as well as for
  winning, and it is capped per day (`src/lib/xp/`). Points are a score, and
  their board is a leaderboard. This plan keeps the two apart, as PuzzleMadness
  keeps its stars apart from its scores.

## The problem a straight sum would have

The puzzles' points are not on one scale. At each puzzle's default size, with
no help, measured from the generators on 2026-09-25 (a word worked out from
`wordScore`, found on the third guess):

| Puzzle, default size | Easy | Medium | Hard |
|---|---|---|---|
| Number Place 9×9 | 205 | 250 | 285 |
| Diagonal 9×9 | 235 | 270 | 300 |
| Sum Cages 9×9 | 350 | 390 | 380 |
| Jigsaw 7×7 | 120 | 145 | 165 |
| Black and White 8×8 | 240 | 240 | 250 |
| Hidden Stones 7×7 | 245 | — | 245 |
| More or Less 5×5 | 110 | 110 | 110 |
| Towers 5×5 | 120 | 120 | 120 |
| Gomoji, five letters (every language) | about 1,000 | about 800 | about 650 |

A Gomoji takes two minutes and a Sudoku ten, so a site total that simply adds
the boards would be a word-game board. Numbers players would rank below anyone
who plays a few words a day.

## Recommendation (for John to approve or change)

1. **One site score = the sum of each puzzle's board total × that puzzle's
   weight, plus game points.** The weights live in one table,
   `SITE_POINTS_WEIGHT` in `puzzles.constants.ts`. Each is chosen so that one
   medium solve at the puzzle's default size is worth about 100 site points.
   The puzzle's own board keeps its own points, unchanged.
2. **Games: a maximum per game, and each result a share of it** (John: "a
   table of maximum weights per game… and then we work back what someone
   scores"). The maximum is 100 for Gomoku on 15×15, from 10 for tic-tac-toe
   to 200 for Go on 19×19. A win pays 100% of it, a draw 50% each, a loss
   nothing but up to 20% for a close score, and time, resigning and head starts
   have shares of their own. Both tables are in PTS-02.
3. **Programs are players**, as they are for XP (AGENTS.md). The site board
   offers People / Computers / Everyone, as `/xp` does, with People as the
   default, so a program that plays all night does not bury everyone.
4. **All time and this month**, the month starting at 00:00 UTC on the 1st, as
   the puzzle boards already count it.
5. **No new write while anyone plays.** Puzzle points are already stored. Game
   points are written once, in the same game-end write that pays XP. A board is
   one grouped query when its page is drawn, and nothing is polled.

## Tickets, in order

| Ticket | Plan | Needs |
|---|---|---|
| PTS-01 Site points for puzzles, and the /points page | `PTS-01-site-points-page.md` | John's yes on the weights |
| PTS-02 Points for games | `PTS-02-game-points.md` | John's yes on the prices; **a migration**, a Neon branch and a dump first |
| PTS-03 A player's points on their page | `PTS-03-points-on-the-player-page.md` | PTS-01 |

## What not to do

- Do not reprice a puzzle's own board to make the site total work: that board
  is PuzzleMadness's rule and John asked for it as it is. Weight it on the way
  into the site total instead.
- Do not merge points into XP, or pay XP for points: two numbers that mean
  different things.
- Do not compute a player's total per row of a list. One grouped query per page
  over the members on it, as `xpByMemberId` does.
