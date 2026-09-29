# Mexican Train: handover (work in progress)

Board row `mexican-train-dominoes-a-family-game` (HIGH). John, 2026-09-29:
"Mexican Train DOminos family game. Options you can decide." The brief is at
the session scratchpad's `i95-new-games-brief.md`.

Branch `dominoes`, cut from `its-board-focus` at `5daf3cd2`. Worktree
`.claude/worktrees/dominoes`, database `itsutsu_dominoes` (migrated, nothing
added to it), port 6733. No dev server was started.

Stopped part way, at the coordinator's word (machine load). **The tree does
not typecheck yet**: four `Record<PartyKind, …>` tables still want their
Mexican Train row (see "Next" below). Nothing is pushed.

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
- **Hidden hands**, covered between two people's turns (still to build; see
  below).

## Done (and unit-tested)

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

## Half done: the table (`src/components/party/`), written but never run

- `DominoFace.tsx`: one domino in SVG, colour-coded pips per number
  (`TRAIN_PIP_COLOURS`), shapes for 0–15 (`pipSpots` in `trainLayout.ts`),
  light in both themes through `surface-light`.
- `trainLayout.ts`: the square table's rows, and the pip layouts.
- `TrainTable.tsx`: `BoardFrame` wood; hub row (round, engine double, the
  boneyard's count); one row per train with marble, name, hand size, marker,
  "+N" hidden tiles and the last few tiles. Rows a held tile may go on are lit
  and are tap and drop targets (`data-train`, `data-target`).
- `TrainHand.tsx` + `useTileDrag.ts`: the hand, standing tiles as buttons;
  pointer-event drag with a floating tile, tap to choose, tap a train to lay,
  double-tap to lay where it alone fits.
- `TrainTurnLine.tsx`, `TrainScores.tsx` (scores panel and the round-over /
  game-over panel with Next round), `TrainComputerMark.tsx`,
  `useTrainComputer.ts` (one computer move per pause, waits while the tab is
  hidden), `trainStore.ts` (`keptInBrowser`, key `itsutsu.mexicanTrain`),
  `TrainSetUp.tsx` (set, 2–8, eight seat rows always laid out with a
  Computer toggle, house rules, live preview).
- Copy and constants: `TRAIN_COPY` and friends at the end of
  `src/components/party/party.constants.ts`; props in `train.types.ts`.

## Next, in order

1. `TrainGame.tsx`: the table page. Kept game or set-up; `useTrainComputer`;
   the cover (with two or more people, hide the hand until "I'm <name>",
   keyed by `game.turn`; with one person, show their hand always); Draw and
   Pass buttons from `trainMoves`; `TrainRoundOver` for `roundOver` and
   `finished`; New game with confirm; `AskIfAway`; `readyMark`; put
   `data-bare-board` on the table's wrapper for Just the board.
2. `TrainOffer.tsx` and `TrainCard.tsx`, after Mancala's, then the
   `PARTY_KIND_TABLES` row. That and step 1 make it typecheck with step 3.
3. `GAME_ADDED` (run `pnpm games:added` once the picture is committed).
4. The Dominoes family: a `GAME_FAMILIES` entry (key `dominoes`, kanji ドミノ,
   `notOnSetUp` with its reason, since `families.coverage.test.ts` requires
   that of a family with no recorded game), a page at
   `src/app/games/dominoes/page.tsx` like `src/app/games/party/page.tsx`, and
   a `FAMILY_MARKS["Dominoes"]` drawing in `FamilyMark.tsx`
   (`familyMark.coverage.test.ts` fails on the plain mark). Consider
   `ALSO_LISTED_IN` on Party games if its shelf has room (eight at most).
5. The gates: `idleWatch.coverage.test.ts` (add `TrainTable` to
   `DRAWS_A_SURFACE`, the set-up's readOnly preview to its exceptions),
   `gamePictures.coverage.test.ts` (`TrainCard.tsx: { GameThumb: "small" }`),
   `boardFrame.coverage.test.ts` if it asks, `playSurface.coverage.test.ts`.
6. The picture: a scene in `e2e/party-screenshots.spec.ts` (a mid-round game
   made with `replayTrain` from a seed and `computerMove`), add the train
   files to `PARTY_ART_FILES`, then `pnpm screenshots:party` (it re-takes
   every party picture; commit only what changed).
7. `e2e/party-train.spec.ts`: stranger reads the front door and rules, Play
   sends them to `/join`; a member plays: set-up, tap-tap, drag, double-tap,
   a computer moves, the cover with two people, reload keeps the game, My
   games lists it, round over and Next round from a kept position.
8. `docs/plans/dominoes/README.md` (the decisions below) and its row in
   `docs/DOCS_UPKEEP.md`.
9. Checks: typecheck, eslint, `pnpm loc:check`, the whole vitest suite with a
   dead database, and the specs the brief lists, with `--workers=1`.
   Screenshots for John at 390 and 1280, light and dark.

## Decisions so far (for John to reverse)

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
- The family's kanji ドミノ (as Checkers is チェッカー); the game's 列車.
- The Dominoes family stays off the set-up screen, because the gate requires
  it of a family with no recorded game.
- No Block or Draw Dominoes sibling yet.
