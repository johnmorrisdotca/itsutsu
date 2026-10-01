// Free of Korokoro, like the rest of the party constants: the rules page and the catalogue import this, and a page's server function must not carry the dice package for it (`diceWar.test.ts` holds these to its limits).

/** How a game of Dice War is played to its end: to a score, or for a number of rounds. */
export type DiceWarGoalKind = "points" | "rounds";

/**
 * WHAT THE SET-UP OFFERS, from the limits the package allows
 * (`DICE_WAR_LIMITS`): two to eight players, one to ten dice each, dice of two
 * to a thousand sides, a score of one to a hundred, or one to two hundred
 * rounds. The set-up offers a few of each, the ones people reach for; the
 * rules take any in range.
 */
export const DICE_WAR_LIMITS_HERE = { fewestPlayers: 2, mostPlayers: 8, mostDice: 10, mostSides: 1000, mostPoints: 100, mostRounds: 200 } as const;

/** The scores a game may be played to: the party contract's one "size", and the usual 10 the set-up opens on. */
export const DICE_WAR_POINT_GOALS = [5, 10, 25, 50] as const;
export const DICE_WAR_DEFAULT_POINTS = 10;

/** The numbers of rounds a game may be played for instead. */
export const DICE_WAR_ROUND_GOALS = [10, 20, 50] as const;

/** How many dice each player rolls, added up, and how many sides each die has. */
export const DICE_WAR_DICE = [1, 2, 3, 5, 10] as const;
export const DICE_WAR_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;

/** The table the set-up opens on: a person and the computer, one six-sided die each, first to 10. */
export const DICE_WAR_DEFAULTS = { players: 2, dice: 1, sides: 6, goal: "points" as DiceWarGoalKind, to: DICE_WAR_DEFAULT_POINTS };

/** A seat's name as the table says it: the one typed, or "Computer 3" or "Player 2". */
export function diceWarSeatName(players: readonly string[], computers: readonly boolean[], seat: number): string {
  const given = players[seat]?.trim() ?? "";
  if (given !== "") return given;
  return computers[seat] === true ? `Computer ${seat + 1}` : `Player ${seat + 1}`;
}
