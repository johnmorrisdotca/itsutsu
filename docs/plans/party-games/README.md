# Party games: a third kind of game

**Status: the kind and its first game, Dots and Boxes, built 2026-09-28 on
branch `party-dots`. Superghost is next on the board.**

John is filling the Party games 団欒 shelf: games a group plays round one
phone or tablet. Until now that shelf held only guests — Chinese Checkers for
six, Pair Go, Halma for four, Kumimoji for eight — each the pass-and-play MODE
of a game that already had a home and a rated game for two. Dots and Boxes is
not a mode of anything. It needs a real home, and the catalogue had nowhere to
put it.

## Why a third kind

The catalogue joins its games through `GameKey`
(`src/lib/catalogue/gameKeys.ts`). Before this there were two kinds:

| Kind | What it is | Played by | Kept |
|---|---|---|---|
| `RuleVariant` | a game between two colours, a row in `VARIANT_SPECS` | the engine (`src/lib/gomoku/`), rated, with bots | a `Game` row and its moves |
| `PuzzleKind` | one solver, one grid, one answer (`src/lib/puzzles/`) | the browser | a solve, checked and paid by the server |

Dots and Boxes fits neither. The engine plays stones on points between two
colours, one move a turn; Dots and Boxes draws lines, gives an extra turn for
a closed box, and seats two to six. It has no rating, no bots and no ladder,
and it is not a puzzle for one. Stretching either kind to hold it would put a
game in every place that kind is read — the set-up screen, the ladder, the
record, the XP tour, the solve checker — each needing an exception.

So it is a third kind, and the smallest honest one:

| Kind | What it is | Played by | Kept |
|---|---|---|---|
| `PartyKind` | a table of people round one device (`src/lib/party/`) | the browser, pass and play | only in that browser (`keptInBrowser`), or as a table on the server when played on several devices (`docs/plans/party-online/`); never rated |

`GameKey = RuleVariant | PuzzleKind | PartyKind`. The places that only make
sense for one kind ask `isRuleVariant`, `isPuzzleKind` or `isPartyKind` by
name. `isRuleVariant` is new: "not a puzzle" stopped meaning "a variant" the
day a third kind arrived, and a type predicate that says otherwise is not
checked by the compiler, so `boardGamesOf`, `boardGamesShownIn` and the IP
scopes now ask it directly.

## What a party game has, and where

- **Rules**: a pure module under `src/lib/party/<game>/`, with its types in a
  `*.types.ts` beside it and unit tests. Every function returns a new game and
  leaves its input alone, as the engine does. A game is its table and its
  moves, and everything else is read again from them, so a game read back out
  of storage is exactly the game its moves make, or none.
- **The contract** every party game's rules answer: `PartyRules<S, M>` in
  `src/lib/party/party.types.ts` (start, moves, play, over, winners, encode,
  decode), listed in `PARTY_RULES` (`partyRules.ts`), a mapped type over
  `PartyKind`, so a new game does not compile without one.
- **The spec and copy**: `PARTY_SPECS` (players, boards; at most four boards,
  at most six players, the six colours the tables share) and `PARTY_DISPLAY`
  (the `VariantCopy` shape every game uses) in `party.constants.ts`.
- **Addresses**: `PARTY_SLUGS` in `slugs.ts`. `/games/<slug>` is the front
  door (`PartyFrontDoor`), `/games/<slug>/rules` the rules page
  (`partyRulesPage`), `/games/<slug>/background` its background, and
  `/games/<slug>/pass-and-play` the table — the same address every table on
  the site uses, answered through `PARTY_KIND_TABLES`
  (`src/components/party/partyKindTables.ts`). `/new`, `/play`, the record,
  the standings and `/family` answer nothing for a party game: its family has
  its own page.
- **The front door and rules are open to strangers**, as every game's are;
  the table is for members, and a stranger pressing Play is sent to `/join`
  (`src/proxy.ts` already draws that line: `/pass-and-play` is not in
  `OPEN_PATTERNS`).
- **Kept and found again**: the table keeps the game in this browser after
  every move, and its row in `PARTY_KIND_TABLES` names the card that waits on
  My games > Pass and play while one is going.

## Its family

Dots and Boxes lives at home in **Party games** (`GAME_FAMILIES`), beside the
guests. That changed what "a family" had to mean in two places, which are now
two lists rather than one name covering both:

- `HOME_FAMILIES`: every family some game calls home. Party games is one now,
  so the plain list of every game shows Dots and Boxes under it, once.
- `RECORDED_FAMILIES`: the families a recorded game (a variant or a puzzle)
  calls home. The XP awards count these (`everyFamilyPlayed`, the tour), so a
  family whose games never reach the server cannot become a prize nobody can
  finish. Likewise `RECORDED_GAME_KEYS` beside `EVERY_GAME_KEY`:
  `everyVariantPlayed` counts the recorded games only.

A family with no recorded game keeps its own page at `/games/<key>`
(`familyPagePath`), which is why Party games is still at `/games/party`.
`families.coverage.test.ts` holds that shape.

## The gate

`src/lib/party/party.coverage.test.ts` is the New Game Gate for a party game.
It asks every question the gate asks of a variant and a puzzle that applies:

- named by a unit test beside its rules;
- **plays out**: at every board and every number of players it offers, sixty
  seeded random games each end, every move offered is taken, a finished game
  offers none and names its winners, and every seat wins at least once — what
  the simulator asks of a variant;
- kept and read back exactly, and refuses what it cannot play out;
- a table the site can seat (two to six players, at most four boards);
- a picture and a thumbnail (`pnpm screenshots:party`), stamped by
  `partyArt.data.ts` so a change to the board fails until they are re-taken;
- full copy and a rules page with every section filled;
- a family, one no award counts, with its own page;
- an address, with the front door, rules and table routes answering it, and
  My games listing its card;
- driven by a browser spec (`e2e/party-dots.spec.ts` for Dots and Boxes);
- dated (`pnpm games:added`), and named by no kept record from another site
  without a decision in the alias gate.

The dead-end and picture gates already read every page by source, so the new
components are held by them like any other (`gamePictures.coverage.test.ts`
classifies the card and the set-up's board marks); the idle-watch gate now
names `DotsBoard` among the surfaces a person plays on.

## Adding the next one (Superghost)

1. Add its key to `PartyKind`, `PARTY_KINDS`, `PARTY_KIND_LIST`,
   `PARTY_DISPLAY`, `PARTY_SPECS` and `PARTY_SLUGS`; the compiler lists the
   rest (`PartyPlays`, `PARTY_RULES`, `PARTY_KIND_TABLES`, `GAME_ADDED`).
2. Write its rules under `src/lib/party/<game>/` against `PartyRules`, with
   tests. A word game's list comes from a real dictionary (AGENTS.md).
3. Its table, card and Play offer under `src/components/party/`, drawn inside
   `BoardFrame` if it has a board, with `AskIfAway` and a `readyMark`.
4. Put it in the Party games family, a scene in `e2e/party-screenshots.spec.ts`,
   run `pnpm screenshots:party` and `pnpm games:added`, and write its browser
   spec. The gate says what is still missing.

## Decisions to review

- Dots and Boxes lives in Party games rather than a family of its own, and
  Party games stays out of every XP count.
- A box carries its owner's colour letter (R, B, Y, G, P, W, the letter on
  their marble) rather than the first letter of their name, so it is unique
  at every table.
- Boards 3×3 to 6×6 boxes; two players and 4×4 are the defaults.
- The kanji 陣取り ("taking ground") for Dots and Boxes.
- `/games/dots-and-boxes/family` answers nothing, since its family has its
  own page.
