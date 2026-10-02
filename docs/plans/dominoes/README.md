# Dominoes: a family, opened with Mexican Train

**Status: built 2026-09-29 on branch `dominoes`** (board row
`mexican-train-dominoes-a-family-game`, HIGH). John, 2026-09-29: "Mexican
Train DOminos family game. Options you can decide."

Mexican Train for two to eight round one phone or tablet, with a computer in
any seat, at `/games/mexican-train/pass-and-play`; its front door and rules at
`/games/mexican-train`; its family, since 2026-10-01, Party games (it was in Tiles 牌 for a day, `/games/party`); it was Dominoes ドミノ at `/games/dominoes` until then, an address that no longer answers.

## The kind: a PartyKind

Mexican Train is a `PartyKind` (`mexicanTrain`), not a new kind. It is a
table of two to eight people round one device, never rated, kept only in the
browser: exactly what `docs/plans/party-games/README.md` describes. What it
adds to the kind:

- **A seed.** `PartyRules.start` takes an optional fourth argument, `seed`,
  and the party gate (`party.coverage.test.ts`, `playOut`) passes each game's
  seed, so a game dealt from a shuffle is dealt afresh in each of the sixty
  games. Games with nothing hidden ignore it.
- **Computer players**, which no party game had: `computers: boolean[]` on the
  game, played in the browser (`trainComputer.ts`, `useTrainComputer.ts`).
- **Hidden hands**, covered between two people's turns (`TrainGame.tsx`).

## The rules and the computer (`src/lib/party/mexicanTrain/`)

`src/lib/party/mexicanTrain/`, pure, every move returns a new game:

- `mexicanTrain.types.ts`: tiles are numbers (`low * 16 + high`); a laid tile
  is `from * 16 + to`; trains numbered by seat, the Mexican Train last. The
  move record is a linked chain (`history`), not an array: copying an array
  on every move made the gate O(n²) (a double-fifteen game runs to 4,000
  moves). Read it with `movesOf` / `moveCount`.
- `mexicanTrain.constants.ts`: sets 9 / 12 / 15, hand sizes, rounds, options
  and their defaults, set names.
- `dominoes.ts`: tile helpers.
- `mexicanTrain.ts`: `startTrain`, `legalPlays`, `mayLay`, `trainMoves`,
  `playTrain`, `replayTrain`, `trainTotals`, `trainAgain`, `trainPlayerName`,
  `peopleAt`. Every shuffle is drawn from the seed and the round's number.
- `trainCodec.ts`: `encodeTrain` / `decodeTrain`, JSON of the table plus a
  compact move string (`p<tile>.<train>`, `d`, `x`, `n`), replayed on read.
- `trainRules.ts`: `MEXICAN_TRAIN_RULES`, registered in `PARTY_RULES`.
- `trainComputer.ts`: plans the longest run for its own train
  (`longestRun`, bounded DFS) and keeps it, lays spare heavy tiles elsewhere,
  takes its own marker in, lays a double only with a cover in hand, always
  goes out when it can. It beat a random player 30 of 40 games, a greedy
  heaviest-tile player 50 of 60 heads-up, and 24 of 60 as one of four
  (a fair share is 15).
- `mexicanTrain.test.ts` (22 cases) and `trainComputer.test.ts` (5): all pass.
- The party gate's play-out passes for Mexican Train: the whole gate case,
  every party game, took about 17 s here under heavy load.

Registered: `PartyKind`, `PartyPlays`, `PARTY_KINDS`, `PARTY_KIND_LIST`,
`PARTY_DISPLAY` (copy), `PARTY_SPECS` (2–8 players, sets 9/12/15, default 12
and four players), `PARTY_RULES`, `PARTY_SLUGS` (`mexican-train`), and in
`partyRulesPage.ts` `OFFERED_WORDS` and `TABLE_WORDS`.

## The table (`src/components/party/`)

- `TrainGame.tsx`: the page. The kept game or the set-up; the computer seats
  played one move at a time after a short pause (`useTrainComputer`, never a
  poll, paused while the tab is hidden); Draw and Pass from `trainMoves`; the
  round over and the game over (`TrainRoundOver`), Next round and Play again;
  New game with a confirm; `AskIfAway`; `readyMark`; `data-bare-board` and the
  size chooser's `data-scale-*` marks, as Mancala's table has.
- **Hidden hands.** With one person at a table of computers, that person's
  hand is always face up, laid from on their turn. With two or more people the
  hand of the player to move waits under a cover ("Pass the device to Ben",
  "I'm Ben"), shown for that turn only, and covered again on every new turn; a
  reload opens on the cover. A computer's turn shows no hand.
- `TrainTable.tsx`: the hub (round, engine double, boneyard count) and a row
  per train on `BoardFrame` wood; each row keeps the last few tiles and a
  "+N", so the table is one fixed square on a phone; rows a held tile may go
  on are lit and are tap and drop targets.
- `TrainHand.tsx` + `useTileDrag.ts`: drag a tile onto a lit train, tap it and
  then the train, or double-tap it to lay it where it alone fits.
- `DominoFace.tsx`: our own SVG domino, pips coloured per number, light in
  both themes (`surface-light`).
- `TrainSetUp.tsx`: set, two to eight players, a name and a Computer toggle
  per seat (all eight rows laid out, so nothing moves), the house rules, and
  the live table as the preview.
- `TrainOffer.tsx`, `TrainCard.tsx` (My games > Pass and play), and the
  `PARTY_KIND_TABLES` row.

## The family

Dominoes ドミノ was a family of its own (key `dominoes`, 2026-09-29) with a page
at `/games/dominoes`. On 2026-10-01 it became part of **Tiles** 牌
(`GAME_FAMILIES`, key `tiles`) with Mahjong Solitaire and the cube, on John's
word ("Adjust: mahjong and Dominoes stuff... as Tiles games"), and the same
day Tiles was dissolved and Mexican Train went to Party games. The key
`dominoes` is `FAMILY_ABSORBED` into `party`; no ledger row can hold it, since
a party game is never recorded. Mexican Train is a party game at home in Party games, set up at its own table from its own page, and its family page is `/games/party`.

## Tests

- `mexicanTrain.test.ts`, `trainComputer.test.ts`, and the party gate
  (`party.coverage.test.ts`: sixty seeded games at every set and table size,
  every one ending, every seat winning some).
- `e2e/party-train.spec.ts`: a stranger reads the front door, rules and
  family and is sent to `/join` by Play; one person and a computer lay by tap,
  drag and double-tap, the computer answers, the game survives a reload and
  waits on My games; two people pass a cover; a round's end is counted and the
  next round dealt round the next double.
- The picture: a scene in `e2e/party-screenshots.spec.ts`, stamped by
  `partyArt.data.ts`.

## Several devices (built 2026-09-30)

A row in `ONLINE_GAMES` (`src/lib/party/online/onlineTrain.ts`) and a board in
`ONLINE_VIEWS` (`TrainOnline.tsx`), as the other party tables join
(`docs/plans/party-online/README.md`):

- **The set-up asks where.** Several devices puts a seat chooser in each
  seat's row (you, a buddy, anyone with the link, or the computer) and Start
  sets the table on the server, dealt from a seed the set-up's browser draws
  (`freshSeed`, as on one device) and the house rules chosen; the server
  checks both (`{ seed, options }`).
- **A move is a move**: a tile laid on a train, a draw, a pass, the next
  round. The server plays it by `playTrain`; the next round is dealt by
  whichever seat the table waits on when a round ends.
- **Each device shows its own tiles, face up, and nobody else's**; the scores
  say how many each holds. No cover: nobody else is looking at the screen.
- **The computer** is the table's own (`computerMove`), one move at a time,
  worked out in the browser of the member whose move handed it the turn
  (`onlineComputerMoves.ts`), as Kumimoji's is.
- `e2e/party-online-train.spec.ts`: two members and a computer, each hand only
  on its own device, a turn from each device and the computer's seen on both.

Not built: the `redact(state, seat)` this section once asked for. The table
state is sent whole, as for every other game on several devices (a game here
is its seed and its moves, replayed), so every seat's browser could read the
other hands and the boneyard from the page's data. The page never draws them;
see the decision below.

## Decisions to review

- A `PartyKind`, with a `seed` added to the party contract and the gate.
- Sets double-9, double-12 (default) and double-15, chosen as the "board".
- Hand sizes: double-12 15 / 12 / 10 for 2–4 / 5–6 / 7–8 players (the common
  published figures); double-9 10 / 8 / 6; double-15 15 / 13 / 12.
- Rounds: every round (one per double, top to blank) by default, or a short
  game of half as many, from the top.
- Doubles: "one at a time" by default (a double must be covered before
  anything else, the layer lays again to cover it); "chained" lets more
  doubles follow, then the last laid is covered first.
- Mexican Train open from the start by default; house rule "after your own".
- One tile a turn, including the first turn (no "play all you can" opening).
- A player must lay if they can; draws only with nothing to lay; the drawn
  tile must be laid if it goes. The round ends the moment a hand is empty,
  even on a double.
- Scores are plain pips (double blank scores nothing extra).
- The first round is led by the first seat, each round after by the next.
- Trains on a phone: each row shows the last few tiles and a "+N" count, so
  the table is one fixed square and nothing scrolls; the open end is always
  at the right.
- Pips are colour-coded per number, as most double-12 sets are.
- The set-up opens with seat 1 a person and the other seats computers.
- One person at a table of computers sees their own hand at all times, with no cover; two or more people pass a cover every turn.
- The game's kanji 列車; the family's, since 2026-10-01, is 牌 (Tiles).
- No Block or Draw Dominoes sibling yet.
- On several devices the other hands are hidden by the page, not from it: the
  table state is sent whole, as Kumimoji's is ("browser checks to save $$$").
  Keeping them from a determined reader would mean the server sending each
  seat a view with the others' tiles taken out, and the seed with them.
- The next round at a table on several devices is dealt by whoever the table
  waits on (the player who went out, or the last to pass), not by the host.
