/**
 * THE WORDS FOR ENDING A GAME AND STARTING ANOTHER, one set for every kind of
 * play (`docs/plans/game-controls/README.md`).
 *
 * - **Resign** ends a game against somebody or something that can win it: the
 *   other side wins.
 * - **Give up** ends a game played alone (a puzzle, patience): there is no
 *   other side, so it ends unsolved.
 * - **New game** starts another. Where it would throw the game in progress
 *   away it asks first, and the question says what is lost; where the game
 *   in progress is kept (a puzzle's run, a game between members) it says so
 *   and asks nothing.
 * - **Continue** takes the game in progress up again; **Resume** is only for
 *   un-pausing a clock.
 */
export const GAME_ENDING_COPY = {
  resign: "Resign",
  resignAsk: "Resign this game? The other side wins.",
  giveUp: "Give up",
  giveUpAsk: "Give up this game? It ends here, unsolved.",
  newGame: "New game",
  newGameAsk: "Start a new game? The one in progress ends here and is not kept.",
  newGameYes: "Start a new game",
  keepPlaying: "Keep playing",
  /** On the link to the set-up screen from a game that stays kept where it is. */
  newGameKeeps: "Starts a new game. This one stays where it is, in My games.",
  /** On a front door, beside Continue. */
  continue: "Continue →",
  continueTo: (what: string) => `Continue ${what} →`,
  /** Under New game on a front door, where the game in progress would be ended. */
  doorEnds: "New game ends the one in progress here.",
  /** Under New game on a front door, where the game in progress is kept. */
  doorKeeps: "New game leaves the one in progress where it is.",
  doorAsk: "Start a new game? The one in progress ends here and is not kept.",
  doorKeep: "Keep it",
} as const;

/** The two ways a game ends from inside it. */
export const ENDINGS = { resign: "resign", giveUp: "giveUp" } as const;
export type Ending = (typeof ENDINGS)[keyof typeof ENDINGS];
