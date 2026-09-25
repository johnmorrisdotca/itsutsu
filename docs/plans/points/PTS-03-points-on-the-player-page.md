# PTS-03 A player's points on their page

## What it is

A player's page shows their site points beside their level and XP (the row:
"the total beside a player's name where XP is shown"), with their place on the
all-time and this month boards, each a link to that board at their row.

## Read first

- `MemberLevel` and the player page's standing line (AGENTS.md, "A player's
  page opens with their name, their record, and their standing").
- `src/components/players/xpColumn.coverage.test.ts`, which holds where the
  standing is drawn.

## What changes

- `sitePoints.ts`: `sitePointsOf(memberId)` returns the member's totals and
  their two places. It is one query per page, not per row.
- The player page's standing: "2,340 points · 12th this month", both parts
  links to `/points`.

## Tests

- A unit test for `sitePointsOf` over seeded rows. The existing player-page
  spec gains the line.

## Not

- Not a points column in every table of players. XP is the rule there
  (AGENTS.md). Points are on their own board and the player's page, unless John
  asks for more.
