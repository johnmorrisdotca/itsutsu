# PTS-01 Site points for puzzles, and the /points page

**Needs John's yes on the weights below before it is built.**

## What it is

One board for the whole site, at `/points`: every member's site points, all
time and this month, highest first. Each puzzle's own points board gets a line
under it leading here: "All puzzles and games: the site board →". Games join
the total in PTS-02; until then the page says it counts puzzles.

## The weights (proposed)

A puzzle's board total is multiplied by its weight on the way into the site
total, so that one medium solve at the default size is worth about 100 (see the
README's table):

| Puzzle | Weight | A medium solve at the default size |
|---|---|---|
| Number Place | 0.4 | 250 → 100 |
| Diagonal | 0.37 | 270 → 100 |
| Sum Cages | 0.26 | 390 → 101 |
| Jigsaw | 0.7 | 145 → 102 |
| Black and White | 0.42 | 240 → 101 |
| Hidden Stones | 0.41 | 245 → 100 |
| More or Less | 0.9 | 110 → 99 |
| Towers | 0.83 | 120 → 100 |
| Gomoji, Kana, Mot, Wort | 0.12 | about 800 → 96 |

A bigger board or a harder level is still worth more, since the weight scales
a puzzle's own points and does not replace them.

## Read first

- `src/lib/puzzles/server/puzzleBoards.ts`: `pointsBoardOf`, whose query this
  generalises.
- `src/components/puzzles/PuzzlePoints.tsx`: the board this page looks like.
- `src/lib/xp/xpBoard.ts` and the `/xp` page: People / Computers / Everyone, and
  how a board of players is drawn with its XP column.
- AGENTS.md: "Nothing Is A Dead End", "Every Table Of Players Shows XP", and
  "reading is open means the games, not the people" (the board needs an invite).

## What changes

- `puzzles.constants.ts`: `SITE_POINTS_WEIGHT: Record<PuzzleKind, number>`,
  typed as a Record so a new puzzle cannot ship without one.
- `src/lib/points/sitePoints.ts` (new): `sitePointsBoard(since, pool, take)`.
  It is one query: each member's best solve of each grid (as `pointsBoardOf`),
  times the weight by kind (a `CASE` built from the table), summed per member.
  It returns `{ memberId, points, puzzles }`.
- `src/app/points/page.tsx` (new): All time and This month as tabs, and People /
  Computers / Everyone remembered as `/xp`'s is. It uses `RecordTable`-style
  rows with the XP column, `PlayerName` and a `GameCount`-style link from
  "puzzles" to that member's solves. It is behind the invite, like `/xp`.
- `PuzzlePoints.tsx`: the line leading to `/points`.
- `e2e/siteRoutes`: the new route.

## Tests

- `sitePoints.test.ts`: the weights apply per kind, a grid counts once at its
  best, the month starts at 00:00 UTC on the 1st, and nothing below 1 point
  shows.
- `puzzles.coverage.test.ts`: every kind has a weight above 0.
- `e2e/site-points.spec.ts`: two members of its own, each with solves seeded
  through the route. The page ranks them by weighted points, each name links to
  its player, and the puzzles count links to their solves.

## Acceptance

- `/points` shows both boards, and an empty one says so and offers a puzzle to
  play.
- Each puzzle's board links to it.
- The query is one per board per page view, with nothing polled or cached per
  row.

## Not

- Not a new stored column: puzzle points are stored already.
- Not a change to any puzzle's own board.
