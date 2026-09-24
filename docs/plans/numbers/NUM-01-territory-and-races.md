# NUM-01. The races join Territory

Board key: `races-and-territory-become-one-family`. Kind: feature. Shipped
first: it is what makes room under `FAMILY_MOST_GAMES` (eight shelves) for
the Numbers family.

## Why

John: "merge Races + Territory to mix Go, Halma, etc.. find a good merged
name, if possible. Could still be territory or Races & territory, you can
decide, since we have max 8 items per family [and eight families]."

## The decision

- **Title "Territory and races" 陣地と競走.** What Go, Hex, Halma and Chinese
  Checkers share is that none is won by a line or a capture: each is won by
  where you stand when it ends — the ground surrounded, the edges joined,
  the far camp filled. A single cleverer word would need explaining on every
  shelf; the two-word title in the shape of "Turn and take" says both halves.
- **Key stays `territory`; `races` goes into `FAMILY_ABSORBED`.** A key is a
  thing members have been paid under (`firstOfFamily`), and the fold table
  is how a `races` row on the live ledger is read as the merged family.
  Go leads the family (`picker.test.ts`: the family's first game is what a
  click on it chooses); Hex, Halma and Chinese Checkers follow.
- **The mark** draws both halves: Territory's surrounded stone on the left,
  the Races mark's black piece hopping over a white one up the right side.
  The old "Territory" and "Races" marks are kept, like the three retired
  before them.

## Exact changes

- `src/lib/gomoku/families.ts`: the row, the fold entry, the Chinese Checkers
  listing note.
- `src/components/games/FamilyMark.tsx`: the merged mark.
- `src/lib/xp/xp.constants.ts`: the family count in the XP blurbs is
  interpolated from `GAME_FAMILIES.length` (it said "eight", and "all
  eleven" in one sentence since the last merge).
- Tests that leaned on Races being the two-game family
  (`backfillXp.test.ts`, `xpGameServer.test.ts`) read the smallest family
  from the table; `familiesMerged.test.ts`, `picker.test.ts`,
  `xp.coverage.test.ts` (ceiling 23,290 → 22,840: a family met and a family
  won fewer), `xpGame.test.ts` (seven families).
- `README.md` and `docs/DOCS_UPKEEP.md`: seven families.

## Acceptance

- `pnpm preflight:prod` green.
- `e2e/about.spec.ts`, `family-shelves`, `games-link`, `game-pictures`,
  `learn`, `front-door`, `fits-a-phone`, `page-width`, `tabs`, `masthead`,
  `games-stats`, `card-target` green with `--no-deps`.
- On the live ledger, nobody is paid twice: a member holding `races` and
  `territory` counts one family (`familiesMerged.test.ts`).

## Release summary

"Halma and Chinese Checkers join Go and Hex in one family, Territory and races."
