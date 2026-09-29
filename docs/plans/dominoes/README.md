# Dominoes: a family, opened with Mexican Train

**Status: built 2026-09-29 on branch `dominoes`** (board row
`mexican-train-dominoes-a-family-game`, HIGH). John, 2026-09-29: "Mexican
Train DOminos family game. Options you can decide."

Mexican Train for two to eight round one phone or tablet, with a computer in
any seat, at `/games/mexican-train/pass-and-play`; its front door and rules at
`/games/mexican-train`; its family, Dominoes ドミノ, at `/games/dominoes`.

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

Dominoes ドミノ (`GAME_FAMILIES`, key `dominoes`): its games are party games,
so, like Party games, it counts towards no award (`RECORDED_FAMILIES`), has a
page of its own at `src/app/games/dominoes/page.tsx`, and stays off the set-up
screen (`notOnSetUp`), which makes games between two. Its mark
(`FAMILY_MARKS.Dominoes`) is a little train of dominoes out of a double.
Mexican Train is not listed on the Party games shelf: that shelf shows its
eight already.

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

## Later: several devices

A row in `ONLINE_GAMES` would need `redact(state, seat)` (every hand but the
reader's, and the boneyard, blanked), as Kumimoji's stage 3 in
`docs/plans/party-online/README.md` does; the moves are small and checked by
`playTrain` in microseconds, and `computerMove` is already a pure `computer`
function. Not built.

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
- The family's kanji ドミノ (as Checkers is チェッカー); the game's 列車.
- The Dominoes family stays off the set-up screen, because the gate requires
  it of a family with no recorded game.
- No Block or Draw Dominoes sibling yet.
