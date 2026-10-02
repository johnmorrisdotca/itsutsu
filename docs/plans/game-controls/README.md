# Game controls: one set of ending and starting controls for every kind of play

**Status: first commit landed as 0.495.0 (2026-10-02); Resign at the hot-seat tables is the second.** Board row:
`every-game-in-progress-offers-the-same-controls-continue-new-game-and-resign-in`.

John, 2026-10-02, looking at Tenka's front door (a lone "Continue →") and its
table (a small "New game" in a corner): "Where is the option to start a new
game, rather than Continue/Resume? Where is the quit game or lose button, aka
Resign? The New Game button is probably it, but not obvious. We have to be
consistent for all games where there is an ongoing game. Right now it's
disparate/different per family and variant."

## The standard

**Front door** (`/games/<slug>`), when a game is in progress:

- **Continue →** is the big press. **Resume** is only for un-pausing a clock.
- **New game** sits under it, labelled, with a line saying what it does to the
  game in progress. A game kept only in this browser (a pass-and-play table:
  one to a kind of game) is ended by it, so it asks first: "Start a new game?
  The one in progress ends here and is not kept." A game kept somewhere it
  stays (a puzzle's run, which waits in My games) is left where it is: New game
  is a plain link to the set-up screen and says "New game leaves the one in
  progress where it is."
- One component: `GameInProgressOffer` (`src/components/play/`).

**Under the board**, in every kind of play, one row (`GameEnding`):

| Control | For | Asks first? | What it does |
|---|---|---|---|
| **Resign** | a game against somebody or something that can win it | yes: "Resign this game? The other side wins." (Pair Go names the team) | the other side wins; a live game goes through the existing resign route, its rules (`allowResign`) and its record untouched |
| **Give up** | a game played alone (patience, the cube) | yes: "Give up this game? It ends here, unsolved." | what it always did: the run is played out and kept as it stood |
| **New game** | any | only while it would throw a game away | a table kept in the browser is replaced; a puzzle or a live game is left in My games and the link goes to the set-up screen |

The words are `GAME_ENDING_COPY` and the three buttons are `EndGameButton`,
`NewGameButton` and `NewGameLink`, all in `src/components/play/GameEnding.tsx`
and built on `ConfirmButton`, so the question is asked in place with a button
that names the act. The row is furniture in Just the board (`data-chrome`):
leave that mode and it is there, as the live game's Resign has always been.

`src/components/play/gameEnding.coverage.test.ts` holds it: a surface somebody
plays on (found as `idleWatch.coverage.test.ts` finds one, by `<AskIfAway`,
`useIdleWatch(` or `useSolve(`) draws the shared controls or is listed with its
reason, every party door draws `GameInProgressOffer`, no table defines its own
Continue or its own New game question, and Resume stays the word for a clock.

## What changed in the first commit

- Front doors: every party game's offer, Pair Go's, Block Five for four's,
  Halma and Checkers for four (`PartyOffer`) and a puzzle's door
  (`PuzzlePlayOrResume`) are `GameInProgressOffer`.
- Under the board: every pass-and-play table (Dots and Boxes, Superghost,
  Mancala, Mexican Train, the race games on `PartyRaceGame`, Block Five for
  four, the card games, Yacht, Hitotsu, Sugoroku, Dice War, Pachisi, Tenka,
  Pair Go), the practice board, a live game's footer, Free Cell,
  Spider, Solitaire, the cube, and every other puzzle's solve (`PuzzleNewGame`).
- Pair Go (on one device and at a table) and the Kumimoji party table keep
  Resign; Sugoroku's "Give up" is Resign, in its fixed row of three presses.
- The patience games and the cube used to give up on one press with no
  question. They ask now.
- The puzzle set-up's "Resume" is Continue.

## Resign at a table round one device (second commit)

John, 2026-10-02: "add Resign to the hot-seat (pass-and-play, kept-in-browser)
party and card tables." The rule, the same for every one of them
(`src/lib/party/resign.ts`; the row is `TableEnding`):

- **The player to move resigns**, after a question that names them: "Resign
  this game for Ann? The other player wins." (two seats) or "...The table ends
  here, with nobody the winner." (three or more). Dice War rolls everybody at
  once, so there the first person still to roll resigns.
- **At two seats the other seat wins.** The table ends in its engine's own
  terms (`resignTables.ts`: status or phase finished, `winners` the other
  seat), and says "Ann resigned. Ben wins." where its turn line was
  (`ResignedResult`).
- **At three or more the table ends where it stands**: "Ann resigned. The
  game ended where it stood, with nobody the winner." Standings and scores stay
  as they are and no winner is invented.
- **Why not take the seat out and play on**, which was the preferred answer
  where an engine can do it: a kept game is its moves played out again from a
  seed (Dots, Tenka, Train, Ghost, Block Five and the packages' cards all
  are), and a seat that stops playing is a move none of those engines can
  replay. Tenka and Superghost do knock players out, but by the rules of the
  game, in the moves. Taking a seat out would need a move for it in each
  package (Tenka, Domino, Hitotsu, Korokoro, Toranpu); see the list at the
  end.
- **Kept, not played**: a resignation rides after the game's own text in the
  browser's storage (`RESIGNED_MARK`), and `keptInBrowser` reads it back
  through the table's `resign` function, so a reload, My games' history and a
  game opened from it show the table as it ended. Never rated; no database,
  no scoring, XP or rating is touched, and no package is edited: the card
  games, whose engines are Toranpu's, carry the resignation on the table
  alone (`CardPlay`).
- **Gate**: `gameEnding.coverage.test.ts` holds that every table round one
  device draws `TableEnding` (Pair Go and Sugoroku, which already resigned
  through their engines, are named) and that every kept store passes its
  `resign`; `e2e/game-resign.spec.ts` asks the question, answers it and reloads
  at seventeen tables.
- **No table is without Resign.** A game with no opponent at a table (a solo
  sheet) would keep Give up and say why; none of these tables is one. Yacht
  is played for the higher sheet, so it resigns like the rest.

If a package should one day take a seat out, what each needs is a move
(`resign`, kept in the moves) that removes the seat and passes its turn on:
Tenka (`@johnmorrisdotca/tenka`, `TENKA_MOVES`), Mexican Train
(`@johnmorrisdotca/domino`), Hitotsu (`@johnmorrisdotca/hitotsu`), Dice War
(`@johnmorrisdotca/korokoro`) and the card games (`@johnmorrisdotca/toranpu`).
The site's own Dots, Mancala, Yacht, Pachisi, Superghost, Block Five and the
race games would take the same change in `src/lib/party`.

## What remains

1. **A live game's front door** (`/games/<variant>`) shows Play only. The
   standard is a Continue to the member's game in progress of that variant and
   a New game under it that leaves it in My games. It needs one indexed read
   per signed-in view (as a puzzle's door has) and the e2e suite signs in as an
   operator who always has games going, so every spec that clicks `game-set-up`
   on a variant's page needs a member of its own first. Left for its own change.
2. **Resign against the computer on the practice board**: the engine can
   record a resignation (`WIN_REASONS.resign`) but the session has no action
   for it.
3. **Give up for the word and number puzzles**: they have New game, which keeps
   the run in My games; a Give up that shows the answer needs a record for an
   unsolved grid, which is scoring and is John's to decide.
4. **Tables on several devices** (`OnlineTable`): Leave the table and End the
   table have their own words and question and different effects (a seat
   opens; the table ends for everybody). They want the same row, with Resign
   for the seat that is playing.
5. **Just the board**: the row is hidden there, like every other press that is
   not the move. If Resign should be in the modal, mark the row
   `data-bare-keep`; `bare-board.spec.ts` will then say whether it fits
   without a scroll.
6. **My games' rows** keep their own small Resign (`ResignButton`, shared with
   the live footer), Cancel and "Continue the … →" cards. They are the same
   words; the cards could become `GameInProgressOffer` rows.
