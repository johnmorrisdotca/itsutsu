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
const GAME_ENDING_COPY_END = "The game ended where it stood, with nobody the winner.";

export const GAME_ENDING_COPY = {
  resign: "Resign",
  resignAsk: "Resign this game? The other side wins.",
  /** At a table round one device the player to move resigns: the other seat wins at two, and the table ends with nobody the winner at more. */
  resignFor: (name: string, seats: number) => (seats === 2 ? `Resign this game for ${name}? The other player wins.` : `Resign this game for ${name}? The table ends here, with nobody the winner.`),
  resigned: (name: string) => `${name} resigned.`,
  /** How a table ended by a resignation reads where its result goes. */
  resignedResult: (name: string, winners: readonly string[]) => (winners.length === 0 ? `${name} resigned. ${GAME_ENDING_COPY_END}` : `${name} resigned. ${winners.join(" and ")} wins.`),
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
  /** Under a live game's Continue, naming the member's other games of it, which wait in My games. */
  othersGoing: (others: number, more: boolean, game: string) => `${others}${more ? "+" : ""} other ${game} ${others === 1 && !more ? "game is" : "games are"} going in My games`,
  doorAsk: "Start a new game? The one in progress ends here and is not kept.",
  doorKeep: "Keep it",
} as const;

/** The two ways a game ends from inside it. */
export const ENDINGS = { resign: "resign", giveUp: "giveUp" } as const;
export type Ending = (typeof ENDINGS)[keyof typeof ENDINGS];
