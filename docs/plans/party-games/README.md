# Party games: a third kind of game

**Status: the kind and its first game, Dots and Boxes, built 2026-09-28 on
branch `party-dots`; Superghost, the second, the same day on `party-ghost`;
and Mancala (Kalah and Oware), the third, the same day on `party-mancala`.**

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
| `PartyKind` | a table of people round one device (`src/lib/party/`) | the browser, pass and play | only in that browser (`keptInBrowser`); never rated, never sent to the server |

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

## Superghost, the second

Superghost (`src/lib/party/superghost/`) went in as the rows above ask, and
asked three things of the kind that Dots and Boxes had not:

- **Words.** Its rules judge with a word list the browser fetches, so the
  contract has an optional `prepare` (fetch what the rules read before they
  judge a move): the table waits for it, and the gate awaits it before playing
  out. The rules take the list as a `GhostJudge` handed in, so they hold none,
  and a kept game carries its verdicts in its moves (a `!` after a letter that
  spelled a word) — read back, it replays with those, and My games shows it
  without fetching a dictionary. The lists are Kumimoji's (`tileWords.ts`):
  SCOWL for English, JMdict's readings in the 45 base kana for Japanese.
- **Languages.** `PartySpec.languages`, and a third, optional argument to
  `start`; the gate plays every language as it plays every board.
- **Eight players.** `PARTY_MARBLES` has eight now: orange and sky blue, the
  two of Okabe and Ito's set left, each with its own letter.

A word of four letters or more loses (`sizes: [4]`, the one "size" offered);
the loss letters are GHOST, or おばけだぞ in Japanese. A word named in answer to
a challenge that is not taken is handed back to try again, and "I can't name
one" gives the round up. The random player of the gate takes every letter at
either end and the challenge with equal chance: fragments grow into nonsense
until a challenge nobody can answer, so every round ends and every game does.

## Adding the next one

1. Add its key to `PartyKind`, `PARTY_KINDS`, `PARTY_KIND_LIST`,
   `PARTY_DISPLAY`, `PARTY_SPECS` and `PARTY_SLUGS`; the compiler lists the
   rest (`PartyPlays`, `PARTY_RULES`, `PARTY_KIND_TABLES`, `GAME_ADDED`, and
   in `partyRulesPage.ts` `OFFERED_WORDS` and `TABLE_WORDS`).
2. Write its rules under `src/lib/party/<game>/` against `PartyRules`, with
   tests. A word game's list comes from a real dictionary (AGENTS.md).
3. Its table, card and Play offer under `src/components/party/`, drawn inside
   `BoardFrame` if it has a board, with `AskIfAway` and a `readyMark`.
4. Put it in the Party games family, a scene in `e2e/party-screenshots.spec.ts`,
   run `pnpm screenshots:party` and `pnpm games:added`, and write its browser
   spec. The gate says what is still missing.

## Mancala: two rule sets as two boards

Mancala (board row mancala-kalah-oware-pass-and-play; John, 2026-09-28: "I
think more games is nice") is the third party game, for two passing one
device. It offers the two best-known sowing games, and was added as rows,
not a second mechanism:

- **The rule set is the board.** `PartySpec.sizes` is the one per-game
  choice the gate plays out at every value, so Mancala's sizes count the
  holes a seed is sown into: 14 on Kalah's board (twelve pits and both
  stores) and 12 on Oware's (the pits alone; its stores only keep captures).
  `MANCALA_BOARDS` names them, and the gate plays sixty games of each.
- **What a front door and a rules page say of a table is a row** in
  `partyRulesPage.ts`, as Superghost made it: `OFFERED_WORDS` ("by Kalah
  (the default) or Oware rules", read from the spec's sizes) and
  `TABLE_WORDS` (how a turn is taken, and that every hole shows its count).
- **Rules**: `src/lib/party/mancala/` — `sowing.ts` sows once under each
  rule set, `mancala.ts` settles the turn and the end and keeps the game as
  its board, table and sowings. `mancala.test.ts` tests each rule below.
- **Kalah** (the default): four seeds a pit; sow counter-clockwise into your
  own store but never your opponent's, and on laps back into the pit you
  left; last seed in your store, sow again; last seed alone in an empty pit
  of yours with seeds opposite, take both (nothing opposite, nothing taken);
  over the moment either row is empty, each player taking what is left on
  their side; most seeds wins, level is a draw.
- **Oware, by the Abapa rules**: four seeds a pit; never sown into a store;
  twelve or more seeds skip the pit sown from; the last seed making two or
  three in an opponent's pit takes them and every consecutive pit before it
  on their row holding two or three; a capture that would take all the
  opponent's seeds takes none (grand slam); an empty row must be fed if any
  sowing can, and if none can the player to move takes the seeds on their
  side and the game ends; 25 wins, 24 each is a draw. Where Abapa leaves an
  endless cycle to the players' agreement, the table is given a rule: the
  same position (every pit, same player to move) a third time since the last
  capture ends it, each player taking the seeds on their side.
- **The screen**: `MancalaBoard` inside `BoardFrame`, the first player's row
  along the bottom and store on the right, each hole's count as a number, the
  sowing drawn seed by seed in about half a second (`useSowing`; none under
  reduced motion), the game kept before the first seed is drawn.

## Decisions to review

- Dots and Boxes lives in Party games rather than a family of its own, and
  Party games stays out of every XP count.
- Superghost: four letters as the shortest losing word, in both languages;
  おばけだぞ for the Japanese loss letters; a word not taken may be tried again;
  a named word must be four letters or more; the table offers no choice of
  length; 幽霊 for its kanji; the seventh and eighth marbles orange (O) and sky
  blue (S).
- A box carries its owner's colour letter (R, B, Y, G, P, W, the letter on
  their marble) rather than the first letter of their name, so it is unique
  at every table.
- Boards 3×3 to 6×6 boxes; two players and 4×4 are the defaults.
- The kanji 陣取り ("taking ground") for Dots and Boxes.
- `/games/dots-and-boxes/family` answers nothing, since its family has its
  own page.
- Mancala: Kalah is the default, since most sets sold as Mancala in North
  America follow it; Oware is the second choice. No other rule sets.
- Mancala's rule set is chosen as its "board size" (14 Kalah, 12 Oware), not
  through a new kind of set-up choice.
- Kalah takes nothing when the pit opposite is empty (the last seed stays).
- Kalah ends as soon as either row is empty, whoever is to move.
- Oware's endless cycle ends at the third repetition of a position, each
  player taking their own side's seeds; there is no "agree to end" button.
- The board is drawn the same way round for both players (first player at
  the bottom) rather than turning for whoever holds the device.
- The kanji 種まき ("sowing seeds") for Mancala, and no country flag, since
  the family is played on three continents.
