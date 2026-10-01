import type { DiceWarGame } from "@johnmorrisdotca/korokoro";

import { lastThrow } from "./diceWarThrow";

/**
 * WHAT DICE WAR SAYS AT THE TABLE, in words, from the game: which round it is,
 * what the last throw did, and what comes next. Pure, so the words are tested
 * without a screen; the table only prints them.
 */

const points = (count: number) => (count === 1 ? "1 point" : `${count} points`);

/** Names in a line: "Ann", "Ann and Ben", "Ann, Ben and Cy". */
export function namesInLine(names: readonly string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Which round it is, and what the game is played to: "Round 3, first to 10 points" or "Round 3 of 20". */
export function diceWarRoundLine(game: DiceWarGame): string {
  return game.goal === "rounds" ? `Round ${game.round} of ${game.to}` : `Round ${game.round}, first to ${points(game.to)}`;
}

/** The last throw, in a line: who won it and what they take, or who tied and goes to war. Empty before the first. */
export function diceWarSaid(game: DiceWarGame, name: (seat: number) => string): string {
  const throwMade = lastThrow(game);
  if (throwMade === null) return "";
  const high = throwMade.rolls.find((one) => throwMade.tied.includes(one.seat))?.total ?? 0;
  if (throwMade.winner !== null) return `${name(throwMade.winner)} won the ${throwMade.war === 0 ? "round" : "war"} with ${high} and takes ${points(throwMade.stake)}.`;
  // A throw nobody won, with the round already moved on: the war went on past what the game allows, and nobody scores.
  if (game.round > throwMade.round) return `${namesInLine(throwMade.tied.map(name))} tied again and again, so the round is called off and nobody scores.`;
  return `${namesInLine(throwMade.tied.map(name))} tied with ${high}: war!`;
}

/** What comes next, in a line: who rolls, and what is at stake. Empty once the game is over. */
export function diceWarNext(game: DiceWarGame, name: (seat: number) => string): string {
  if (game.phase === "over") return "";
  if (game.wars > 0) return `${namesInLine(game.rollers.map(name))} roll again, with ${points(game.stake)} at stake.`;
  return game.throws.length === 0 ? "Everybody rolls. The highest total scores a point." : "Everybody rolls for the next point.";
}

/** How the game ended, in a line: who reached the score or had the most points when the rounds ran out. */
export function diceWarEnding(game: DiceWarGame, winners: readonly number[], name: (seat: number) => string): string {
  const who = namesInLine(winners.map(name));
  if (game.ended === "points") return `${who} reached ${points(game.to)}.`;
  return winners.length > 1 ? `${who} share the most points after ${game.to} rounds.` : `${who} has the most points after ${game.to} rounds.`;
}
