import { speaker, type Speaker } from "@/lib/i18n/i18n";

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
export const gameEndingCopy = (say: Speaker) => ({
  resign: say.say("ending.resign"),
  resignAsk: say.say("ending.resignAsk"),
  /** At a table round one device the player to move resigns: the other seat wins at two, and the table ends with nobody the winner at more. */
  resignFor: (name: string, seats: number) => say.say(seats === 2 ? "ending.resignForTwo" : "ending.resignForMany", { name }),
  resigned: (name: string) => say.say("ending.resigned", { name }),
  /** How a table ended by a resignation reads where its result goes. */
  resignedResult: (name: string, winners: readonly string[]) =>
    winners.length === 0 ? say.say("ending.resignedNobody", { name }) : say.say("ending.resignedWinners", { name, winners: say.list(winners) }),
  giveUp: say.say("ending.giveUp"),
  giveUpAsk: say.say("ending.giveUpAsk"),
  newGame: say.say("ending.newGame"),
  newGameAsk: say.say("ending.newGameAsk"),
  newGameYes: say.say("ending.newGameYes"),
  keepPlaying: say.say("ending.keepPlaying"),
  /** On the link to the set-up screen from a game that stays kept where it is. */
  newGameKeeps: say.say("ending.newGameKeeps"),
  /** On a front door, beside Continue. */
  continue: say.say("ending.continue"),
  continueTo: (what: string) => say.say("ending.continueTo", { what }),
  /** Under New game on a front door, where the game in progress would be ended. */
  doorEnds: say.say("ending.doorEnds"),
  /** Under New game on a front door, where the game in progress is kept. */
  doorKeeps: say.say("ending.doorKeeps"),
  /** Under a live game's Continue, naming the member's other games of it, which wait in My games. */
  othersGoing: (others: number, more: boolean, game: string) =>
    say.say(say.form("ending.othersGoing", more ? others + 1 : others), { others: say.number(others), plus: more ? "+" : "", game }),
  doorAsk: say.say("ending.doorAsk"),
  doorKeep: say.say("ending.doorKeep"),
});

/** The same words in English, for the tables that have not been given a speaker yet. */
export const GAME_ENDING_COPY = gameEndingCopy(speaker("en"));

/** The two ways a game ends from inside it. */
export const ENDINGS = { resign: "resign", giveUp: "giveUp" } as const;
export type Ending = (typeof ENDINGS)[keyof typeof ENDINGS];
