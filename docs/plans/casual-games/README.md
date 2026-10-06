# Casual games: a fourth kind of game

**Status: built 2026-10-05 for Karakuri's eight (`@johnmorrisdotca/karakuri`),
which the site takes from npm at an exact version (0.1.0 at the time).**

Board row: `karakuri-on-itsutsu-com-the-family-eight-front-doors-levels-and-pictures`.

Karakuri からくり is eight small games for a finger, from the open-source
package of that name: Grid Escape (slide blocks to free the key block), Tube
Sort (pour coloured layers until each tube is one colour), Nuts and Bolts
(unscrew plates in the right order), Pin Rescue (pull pins in the right order),
Rope Cut (swipe ropes so the load reaches its target), Save the Character (draw
one stroke that shelters a character), Stretch Grabber (an elastic arm that
reaches round pegs) and Choice Story (pick the right tool at each of three
stages). Each has five levels that step up, four stories for Choice Story. All
are played alone, a minute or two a level, on a phone or a desk.

## Why a fourth kind

The catalogue joins its games through `GameKey`
(`src/lib/catalogue/gameKeys.ts`). Before this there were three kinds:

| Kind | What it is | Kept |
|---|---|---|
| `RuleVariant` | a game between two colours, played by the engine, rated | a `Game` row and its moves |
| `PuzzleKind` | one solver, one grid, one answer, checked by the server and paid in points | a solve |
| `PartyKind` | a table of people round one device | in that browser, or as a table on the server |

A casual game is none of them. It has no two colours and no engine, so it is
not a variant. It is not a puzzle either: a puzzle here is generated or checked
by the server, earns points and XP and has fastest times, and a casual game's
levels are fixed, its physics runs in the browser, and nothing about a play
reaches the server. And it is not a party game, which is about who is sitting
round the table. Stretching any of the three to hold it would put a game in
every place that kind is read (the ladder, the record, the XP tour, the solve
checker) each needing an exception.

So it is the smallest honest fourth kind:

| Kind | What it is | Played by | Kept |
|---|---|---|---|
| `CasualKind` | one person, a level at a time (`src/lib/casual/`) | the browser, by the package | which levels are won and which is in progress, in that browser only (`itsutsu.casual.v1`); never rated |

`GameKey = RuleVariant | PuzzleKind | PartyKind | CasualKind`. The places that
only make sense for one kind ask `isRuleVariant`, `isPuzzleKind`, `isPartyKind`
or `isCasualKind` by name and say what they skip.

## The rules of the kind

- **No points, no XP, no rating, no record.** A casual game is never in
  `RECORDED_GAME_KEYS` or `RECORDED_FAMILIES`, has no ladder, and calls no
  server. `casual.coverage.test.ts` reads the source of `src/lib/casual/` and
  `src/components/casual/` and fails if either reaches for the database, `fetch`,
  an `/api/` route, `awardXp` or the points ladder.
- **Progress is the browser's.** `casualProgress.ts` is pure: a save is, for
  each game, the levels won and the level in progress. It is read back
  tolerantly (a browser may keep anything) and kept by `casualStore.ts` on
  `useSyncExternalStore`, so every page hears a change. Clearing site data
  clears it, and it follows no account to another device. That is stated on the
  game's rules page and under every set-up, so nobody is surprised.
- **It waits in My games.** "Anything a person plays is kept until it is
  finished, and waits in My games" (AGENTS.md). `CasualCards` lists a card for
  each game with a level won or in progress on the Pass and play tab, beside the
  other games kept in this browser, leading to the level to play next.
- **Its family is Karakuri.** All eight are at home in one family, the
  second family (after Party games) that no recorded game calls home, so
  `familyKeepsRecords` is false for it, `familyPagePath` is `/games/karakuri`
  (answered by `/games/[slug]`, not a folder of its own: see below) and it is left off the two-player
  set-up screen with a reason (`notOnSetUp`). A casual game's own `/family` is
  not answered, as a party game's is not.

## What was built

| Piece | Where |
|---|---|
| The kind, its eight specs and copy | `src/lib/casual/casual.types.ts`, `casual.constants.ts` |
| The rules page, in the game template | `casualRulesPage.ts` |
| The save, pure | `casualProgress.ts` (and its test) |
| The save, in the browser | `src/components/casual/casualStore.ts` |
| The package's board, mounted | `CasualBoard.tsx`, loaded by `CasualBoardClient.tsx` with `next/dynamic` and `ssr: false`, so the package is in no server function |
| Front door `/games/<slug>` | `CasualFrontDoor.tsx` (open to a stranger, as a game's page is) |
| Rules `/games/<slug>/rules` | the shared rules page, built by `casualRulesPage` |
| Set-up `/games/<slug>/new` | `CasualSetUpPage.tsx`, `CasualSetUp.tsx`: five level tiles, the live board at the level chosen beside them, and Start |
| Play `/games/<slug>/play?level=N` | `CasualPlayPage.tsx`, `CasualPlay.tsx` |
| The family's page | `CasualFamilyPage.tsx`, answered by the game page's own route at `/games/karakuri` rather than a folder of its own (a route adds about 35 KB of manifests to the one function the server pages share, and that function is at its ceiling) |
| My games | `CasualCard.tsx` |
| Pictures | `e2e/casual-screenshots.spec.ts`, `pnpm screenshots:casual`, stamped by `scripts/casual-art-stamp.ts` into `casualArt.data.ts` |
| The gate | `src/lib/casual/casual.coverage.test.ts` |
| Browser specs | `e2e/casual.spec.ts` (390 and 1280 wide), `e2e/casual-wins.spec.ts` (the six games `casual.spec.ts` does not win, each won at its first level), `e2e/casual-gate.spec.ts` (a stranger), the survey in `e2e/bare-board.spec.ts` |

Play uses the site's shared controls: Restart by the board (Just the board keeps
it), Give up and New game in the one `GameEnding` row (Give up leaves the level
unsolved; New game goes to the set-up and leaves the level where it is), "Are you
still there?" (`AskIfAway`), the page going quiet while a level is played
(`PlayingNow`), Just the board and the desktop board sizes (`BoardScaled`,
`data-scale-board`, `data-bare-board`), and offline keeping: the set-up and every
level's play page are in `offlineGameAddresses`, because a casual game asks
nothing of the site once its page is open.

## The two things to know

- **The dependency is the package from npm, pinned exactly**, like the other
  packages. A new version of it is a bump of that one line, then
  `pnpm screenshots:casual`, because the pictures' stamp hashes the package's
  `package.json`, theme and style.
- **The mounted game is on its element** (`element.karakuri`, the package's own
  handle). The browser specs read where a tube or a card is from it and press
  there with a finger (phone width) or the mouse (desk width); the moves are the
  ones the package's own tests proved (`casual.spec.ts` wins Tube Sort and Choice
  Story, `casual-wins.spec.ts` the other six), so a level is won by the real thing.

## Adding a ninth

Add it to the package, then a `CasualKind` key, a row in `CASUAL_SPECS` and
`CASUAL_DISPLAY`, a slug in `CASUAL_SLUGS`, an entry in the Karakuri family (at
most eight to a family, so a ninth is the question of what to fold or move), a
picture (`pnpm screenshots:casual`), `pnpm games:added`, and a case in
`e2e/casual.spec.ts` or `e2e/casual-wins.spec.ts`. `casual.coverage.test.ts` fails until each is there.
