# Party games: a third kind of game

**Status: the kind and its first game, Dots and Boxes, built 2026-09-28 on
branch `party-dots`; Superghost, the second, the same day on `party-ghost`;
Mancala (Kalah and Oware), the third, the same day on `party-mancala`; and
Tenka 天下, world conquest for two to six, the fourth, on `party-tenka` (see
"Tenka" below).**

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
| `PartyKind` | a table of people round one device (`src/lib/party/`) | the browser, pass and play | in that browser (`keptInBrowser`) and filed in its player's history (`src/lib/party/kept/`), or as a table on the server when played on several devices (`docs/plans/party-online/`); never rated |

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
- **In the history** (2026-09-30, John: "Should contain all games ever… Even
  those that aren't completed or just passed around"): the store is given a
  `KeptRecordRules` (`keptRules.ts`) and files the game with the site when it
  starts, ends or is put away, and when its page is left — through the
  device's queue (`keptOutbox.ts`), so a game played offline is filed once the
  device is back online. The record is a `PartyTable` row under a status of
  its own (`KEPT_STATUS`), listed on My games › History with every other
  game, and opened again at `/games/<slug>/kept/<id>` to be carried on with or
  looked at, on any device. The same History is on each member's player page
  for every other member (`PlayerHistory`), where a filed game opens to be
  looked at and is never offered to the reader's device. A new party game
  passes its own store a record,
  or it is missing from its players' history.

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

## The regroup of 2026-10-01

John regrouped the shelves into fourteen families of four to eight games. Party
games lost Dots and Boxes (to Small boards, a small board at heart) and
Superghost (to Word games), and gained Mexican Train from the dissolved Tiles
family: it holds Mancala, Tenka, Yacht, Pachisi, Dice War and Mexican Train at
home, with Chinese Checkers shown as a guest and room for one more guest. Their
`/family` addresses are their new families', and Party games' own page is still
`/games/party`.

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

## Tenka 天下: a game of chance on a map

John, 2026-09-28, asking for the classic world-conquest game by the name of
its best-known boxed version: "Pass and play first… it should work just like
the real [one], but if there are copyright issues, we change obviously the
Name, the map can just use the modern map and be more Modern". The rules of a
game are nobody's; its name, art and wording are, and none of them is used
anywhere here. Tenka is from 天下取り, tenka-tori, "taking the realm".

- **Rules** (`src/lib/party/tenka/`): the classic ones. Starting armies 40 each
  for two (with a neutral third holding a third of the world and 40 armies,
  which never moves and only defends), 35 for three, 30, 25, 20 for six;
  territories dealt round the table; armies placed at random (the default) or
  by hand one at a time in turn. A turn: one army per three territories (at
  least three) plus continent bonuses plus cards traded; attack as often as
  you like, up to three dice against the defender's up to two (the defender
  always throws the most allowed), ties to the defender, or "roll until
  decided" as one move; move in at least as many as dice thrown; one
  fortifying move through your own land. A card for a turn that took a
  territory; sets of three alike, one of each, or with a wild, trade for 4,
  6, 8, 10, 12, 15 then five more each, two more armies onto a traded card's
  territory you hold; five cards must be traded; knocking a player out takes
  their cards, and six or more are traded at once. The world taken — every
  other player out — wins.
- **Lengths of game** are its sizes: 10 or 20 rounds, most territories at the
  count (most armies breaking a tie), or the whole world, counted at round 60
  if it gets that far.
- **A game of chance is still its moves.** Every shuffle, deal and die is
  drawn from a seeded random whose state is part of the game (`tenkaDice.ts`),
  and the kept text is the table, the seed and the moves; read back, the
  moves are thrown again exactly as they fell. `PartyRules.start` takes a
  fourth, optional argument, `seed`, for this; a game with no dice ignores it.
- **The gate plays it with a sensible random player** (`PartyRules.sensible`,
  `tenkaPolicy.ts`). Chosen uniformly among every move offered — end the
  attack at random, one army at a time on a random territory — a game of
  conquest never ends, as no person plays it. The sensible player still plays
  at random, among the moves a person might make: trade when it can, pile the
  turn's armies on one front, attack only with more armies than the defender,
  move everything in, fortify from behind the lines. The gate holds its move to
  be one offered, and still has the rules take a uniformly random offered move
  at every step. Measured over the gate's 60 games per table: every game ends;
  at the whole-world length all two-player and most three-player games end by
  conquest, and between a quarter and a half of those with four to six are
  decided by the count at round 60 — escalating card sets make armies of thousands that the dice
  wear down slowly.
- **The map** is Natural Earth's admin-0 countries at 1:110m (public domain),
  built by `pnpm map` in the Tenka package's own repository (github.com/johnmorrisdotca/tenka), into two static files: the world the
  rules read (names, continents, neighbours by land and the twenty-two named sea
  links, 5 KB) and the outlines only the browser's board draws (30 KB). The
  script gives every country's polygons to a territory, cuts Canada (97°W),
  the United States (100°W), Russia (59°E and 100°E) and Australia (129°E)
  along meridians, merges each territory's countries into one outline, and
  finds land neighbours from shared edges.
- **The frame.** The map is drawn inside `BoardFrame` like every board, with
  no coordinates, and `BoardFrame` has one typed prop for the shape of its
  wood (`aspect: "square" | "map"`, `BOARD_ASPECTS`): the map's is 4:3 on a
  phone and 2:1 from a laptop, since a square board would be half sea.
- **Played on a phone.** Army counters are 17 pixels tall on the screen however
  far the map is zoomed; at the whole-world view the ones with no room (the
  middle of Europe, the isthmus, Southeast Asia's islands) are dots with the
  owner's letter, the player to move's and anything chosen drawn whole first
  (`laidOutChips`). A row under the map looks at the world or one continent
  with a tap; choosing where an attack or a move comes from frames it and
  what it can reach, close enough for every counter to be whole; a tap on the
  sea goes to the nearest territory within a fingertip; and the phase bar
  carries the dice.

## Yacht 五つ賽: the first dice game, and the Dice shelf

John, 2026-09-30: "Did we create a dice rolling game [where] you just roll a
dice and have fun that way?" None existed; Tenka's battle dice were the only
dice on the site. Yacht is the dice game everybody knows, under the name it
was printed with before a company boxed it (that boxed name appears nowhere).

- **Rules** (`src/lib/party/yacht/`): five dice, up to three rolls a turn,
  holding any dice between rolls; then the dice go into one empty box of the
  thirteen, a zero where they do not make it. Upper half (Ones to Sixes) the
  sum of that number, 35 more at 63; three and four of a kind all five dice;
  full house 25; small straight 30; large straight 40; Yacht 50; Chance all
  five. Highest total wins, level totals share it. `yachtScore.ts` is the
  arithmetic, `yacht.ts` the turns, `yachtCodec.ts` the kept text.
- **Real randomness, never thrown again.** A game's seed is drawn fresh
  (`freshSeed`) and each roll from the seed and how many rolls the game has
  thrown, so nobody knows what is coming and a reload throws exactly what it
  threw.
- **Alone, pass and play, or against the computer.** The table seats one to
  eight (`startYacht`); the party contract's `YACHT_RULES` asks for two or
  more, since the gate refuses a table of one. The computer
  (`yachtComputer.ts`) weighs every way of holding the dice by the best box
  one more roll could make, counted exactly over every fall of the free dice,
  against what each box usually scores.
- **The tray** (`components/party/yacht/DiceTray.tsx`) is the reader's wood in
  `BoardFrame`, wider than tall (the `map` aspect), the dice tumbling and
  flickering for about two thirds of a second after a roll (none under reduced
  motion), a held die ringed in vermilion. Tap a die to hold it; tap the tray
  or Roll to throw. The dice's sound is made in the browser and is off until
  turned on (`diceSound.ts`).
- **The Dice family was folded into Party games on 2026-10-01** (John). It had
  been a shelf of its own (`key: "dice"`, `/games/dice`, mark `Dice`) because
  Party games then showed eight; Yacht, Pachisi and Dice War are now at home
  in Party games, seven with Dots and Boxes, Superghost, Mancala and Tenka.
  `dice` is in `FAMILY_ABSORBED` (mapped to `party`), `/games/dice` is gone
  with no redirect, and the dice mark and the page were deleted. A shelf shows
  eight at most, guests included, so Pair Go, Block Five for four and Kumimoji
  left the shelf as guests (`familyShelves.ts`), each still offered from its
  own page; Chinese Checkers stays. The dice roller (`/dice`) is a tab, not a
  family.

Decisions to review: the kanji 五つ賽 ("five dice") for Yacht and 賽子 for the
family; the thirteen-box sheet with the upper bonus rather than the older
twelve-box Yacht sheet; no extra points for a second Yacht; two players (a
person and the computer) as the set-up's default; alone offered as a table of
one.

## Pachisi 二十五: the race game of the cross and circle

John, relayed 2026-09-30: "I think Parcheesi was another one from the past."
It is here under its own old name, Pachisi (key and address `pachisi`): the
boxed Western game's name is its owner's, as Tenka's and Yacht's are.

- **Rules** (`src/lib/party/pachisi/`): the Western form with two dice. Four
  pawns each; a pawn comes out on a 5 or two dice adding to five, goes round a
  shared track of 68 squares and up its own home path of seven, home by the
  exact count. Twelve safe squares; a lone opponent landed on elsewhere goes
  back to its nest, for 20 to move; a pawn home earns 10. Two pawns of one
  colour are a blockade nobody passes. Doubles throw again, and a third
  double sends the leading pawn on the track home to its nest. A pawn is one
  number, its progress; its square is read from its arm (`squareOf`).
- **Throws** are drawn from the game's seed and how many throws came before,
  as Yacht's are, so a reload throws nothing new. The codec keeps `r`, `e<pawn>`
  and `m<pawn>.<use>`.
- **The computer** (`pachisiComputer.ts`) tries every offered move and keeps
  the one leaving the board best for it: progress, pawns out and home, safe
  squares, out of an opponent's reach, opponents sent back.
- **The board** (`components/party/pachisi/PachisiBoard.tsx`) is nineteen
  cells square inside `BoardFrame`, laid out by `pachisiLayout.ts`: each
  seat's nest, path and corner of the middle in their marble's colour, an arm
  nobody sits at shaded grey. Two players sit on opposite arms.
- **A turn** is a throw and then its values spent one at a time: the values
  are buttons under the dice (the first usable one chosen), and the pawns
  that value can move are ringed. Both dice together enter a pawn when they
  add to five and neither is spent yet.

Decisions to review: the name Pachisi rather than the boxed name; the kanji
二十五 ("twenty-five", what pachisi means); the Western two-dice rules rather
than the Indian cowrie throws; two to four players, no alone game.

## Dice War 賽合戦: the simplest dice game

John, 2026-10-01: "Dice game: war? Or higher number? Something super simple
with just rolling dice and keeping score." Everybody rolls, the highest total
scores a point, and a tie for the highest is war.

- **Rules** are Korokoro's (`@johnmorrisdotca/korokoro`, `diceWar.ts`, 1.15.0):
  two to eight players, any of them a computer; 1 to 10 dice of 2 to 1000 sides
  each, added up; a tie sends only the tied players to roll again, with the
  stake one higher for every war, the winner taking all; played to a score (1 to
  100) or for a number of rounds (1 to 200), level players sharing a win by
  rounds. A game is its table, seed and moves, kept as text. The site's side is
  `src/lib/party/diceWar/` (`diceWarRules.ts` the party contract, with
  `startWith` for what the set-up chooses; `diceWarThrow.ts`; `diceWarWords.ts`;
  `diceWar.constants.ts`, free of the package so a page never carries it).
- **Where it lives**: a party game (`PartyKind` `diceWar`) at home in
  **Party games** beside Yacht and Pachisi (the Dice family until 2026-10-01), not on the Dice tab. The tab (`/dice`) is a
  tool, a tray with history and odds that is never a game and keeps nothing
  between throws; Dice War is a table of people with a score, kept until it is
  finished and found on My games like every party game, so it follows the
  party-game gate, and Party games is the shelf for games the dice decide.
  The tab itself is unchanged: Korokoro's tray option for Dice War
  (`mountRoller(el, { diceWar: true })`) is not used.
- **Dice are Korokoro's own**: each die is `mountDie` (`DiceWarDie.tsx`), the
  die the tab draws, polygon faces and tumble included. The throw is made
  before anything is drawn (`throwDiceWar`: the people's dice from Korokoro's
  `roll` and the browser's cryptographic generator, handed to the game as the
  move; the computers' from the game's seed), and kept with the game. A die is
  then told its face through the random source `mountDie` accepts, so the tumble
  lands on it, and only a new throw seen after the die has been on the page makes
  it tumble: a reload shows the dice still.
- **The table**: one Roll press throws every person's dice at once (nothing is
  hidden, so there is no device to pass), a row a player with their dice, total
  and points, the throw's winner ringed and the tied marked "War" in words as
  well as colour, players out of a war marked so. A war among computers only is
  thrown for them after a pause (`useDiceWarComputer`). The press sits above the
  rows, since eight players' rows run past a phone's window.
- **Set-up**: how many (2 to 8), dice each (1, 2, 3, 5, 10), sides (d4 to d100),
  what to play to (5, 10, 25 or 50 points, or 10, 20 or 50 rounds), who sits where.
  Opens on a person and a computer, one d6 each, first to 10. A line says the
  exact odds of one throw for the table chosen (`diceWarOdds`). The gate's one
  "size" is the score.
- **The gate** plays it at every score it offers and every number of players,
  each throw the one the game's seed would make for the people at the table
  (`DICE_WAR_RULES.moves`); the rules around a real throw, and the odds and
  words, are tested in `diceWar.test.ts`.

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
- Tenka: the name and kanji 天下; three players as the set-up's default; the
  whole world as the default length and 60 rounds as its count; armies placed
  at random unless "in turn" is chosen; the defender always throws the most
  dice allowed; the card kinds land, sea and air; the forty-two territories,
  six continents, bonuses (5, 2, 5, 4, 7, 2) and twenty sea links in
  `tenkaMap.ts` and the map script; the wood's shape following the map
  (`BoardFrame`'s `aspect`); on a phone, the whole world first, counters that
  do not fit drawn as dots, and the map coming close when a territory is
  chosen to attack or move from, rather than opening on the player's own
  region; Halma for four taken off the Party games shelf to keep it at eight
  (it is still offered from Halma's own page); the device passed between turns by name, with nobody's
  cards shown until the player named says they have it.
- Dice War: in Party games (then the Dice family) as a party game, not on the Dice tab; the kanji
  賽合戦 ("a battle of dice"); first to 10 points with one six-sided die each as the
  game it opens on; a person and a computer as the table it opens on; the set-up
  offering a few dice counts and sides rather than every number the package
  allows; one Roll for every person at the table rather than a press each.
- War (card game): in Tricks (now Table cards), since Cards is full; four lengths (50, 100, 200,
  1000 turns), not Toranpu's five; the kanji 戦争; a "Keep turning" toggle that the
  package does not have.
