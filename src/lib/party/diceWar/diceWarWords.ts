import type { DiceWarGame } from "@johnmorrisdotca/korokoro";

import type { Speaker } from "../../i18n/i18n";

import { lastThrow } from "./diceWarThrow";

/**
 * WHAT DICE WAR SAYS AT THE TABLE, in words, from the game: which round it is,
 * what the last throw did, and what comes next. Pure, so the words are tested
 * without a screen; the table only prints them.
 */

const points = (count: number, say: Speaker) => say.count("party.diceWar.points", count);

/** Names in a line: "Ann", "Ann and Ben", "Ann, Ben and Cy", or Ann、Ben、Cy. */
export function namesInLine(names: readonly string[], say: Speaker): string {
  return names.length < 2 ? (names[0] ?? "") : say.list(names);
}

/** Which round it is, and what the game is played to: "Round 3, first to 10 points" or "Round 3 of 20". */
export function diceWarRoundLine(game: DiceWarGame, say: Speaker): string {
  return game.goal === "rounds"
    ? say.say("party.diceWar.roundOf", { round: String(game.round), to: String(game.to) })
    : say.say("party.diceWar.roundFirst", { round: String(game.round), points: points(game.to, say) });
}

/** The last throw, in a line: who won it and what they take, or who tied and goes to war. Empty before the first. */
export function diceWarSaid(game: DiceWarGame, name: (seat: number) => string, say: Speaker): string {
  const throwMade = lastThrow(game);
  if (throwMade === null) return "";
  const high = throwMade.rolls.find((one) => throwMade.tied.includes(one.seat))?.total ?? 0;
  if (throwMade.winner !== null) return say.say(throwMade.war === 0 ? "party.diceWar.wonRound" : "party.diceWar.wonWar", { name: name(throwMade.winner), high: String(high), points: points(throwMade.stake, say) });
  // A throw nobody won, with the round already moved on: the war went on past what the game allows, and nobody scores.
  if (game.round > throwMade.round) return say.say("party.diceWar.calledOff", { names: namesInLine(throwMade.tied.map(name), say) });
  return say.say("party.diceWar.tiedWar", { names: namesInLine(throwMade.tied.map(name), say), high: String(high) });
}

/** What comes next, in a line: who rolls, and what is at stake. Empty once the game is over. */
export function diceWarNext(game: DiceWarGame, name: (seat: number) => string, say: Speaker): string {
  if (game.phase === "over") return "";
  if (game.wars > 0) return say.say("party.diceWar.rollAgain", { names: namesInLine(game.rollers.map(name), say), points: points(game.stake, say) });
  return say.say(game.throws.length === 0 ? "party.diceWar.rollFirst" : "party.diceWar.rollNext");
}

/** How the game ended, in a line: who reached the score or had the most points when the rounds ran out. */
export function diceWarEnding(game: DiceWarGame, winners: readonly number[], name: (seat: number) => string, say: Speaker): string {
  const names = namesInLine(winners.map(name), say);
  if (game.ended === "points") return say.say("party.diceWar.reached", { names, points: points(game.to, say) });
  return say.say(winners.length > 1 ? "party.diceWar.shareMost" : "party.diceWar.hasMost", { names, rounds: String(game.to) });
}
