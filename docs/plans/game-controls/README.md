# Game controls: one set of ending and starting controls for every kind of play

**Status: first commit landed (2026-10-02).** Board row:
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

## What remains

1. **A live game's front door** (`/games/<variant>`) shows Play only. The
   standard is a Continue to the member's game in progress of that variant and
   a New game under it that leaves it in My games. It needs one indexed read
   per signed-in view (as a puzzle's door has) and the e2e suite signs in as an
   operator who always has games going, so every spec that clicks `game-set-up`
   on a variant's page needs a member of its own first. Left for its own change.
2. **Resign in hot-seat party tables** (Dots and Boxes, Mancala, Yacht and the
   rest): a table round one device ends with New game, which asks. A Resign
   needs each game's engine to say who wins when one player drops out; Pair
   Go, Sugoroku and Kumimoji have it already.
3. **Resign against the computer on the practice board**: the engine can
   record a resignation (`WIN_REASONS.resign`) but the session has no action
   for it.
4. **Give up for the word and number puzzles**: they have New game, which keeps
   the run in My games; a Give up that shows the answer needs a record for an
   unsolved grid, which is scoring and is John's to decide.
5. **Tables on several devices** (`OnlineTable`): Leave the table and End the
   table have their own words and question and different effects (a seat
   opens; the table ends for everybody). They want the same row, with Resign
   for the seat that is playing.
6. **Just the board**: the row is hidden there, like every other press that is
   not the move. If Resign should be in the modal, mark the row
   `data-bare-keep`; `bare-board.spec.ts` will then say whether it fits
   without a scroll.
7. **My games' rows** keep their own small Resign (`ResignButton`, shared with
   the live footer), Cancel and "Continue the … →" cards. They are the same
   words; the cards could become `GameInProgressOffer` rows.
