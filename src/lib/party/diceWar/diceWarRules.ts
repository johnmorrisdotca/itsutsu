// By package name, which resolves from node_modules for Playwright too; the rest of lib/party stays relative, as the browser specs resolve no alias.
import {
  decodeDiceWar,
  diceWarComputerFaces,
  diceWarOver,
  diceWarPeopleToRoll,
  diceWarWinners,
  encodeDiceWar,
  playDiceWar,
  startDiceWar,
  type DiceWarGame,
  type DiceWarMove,
  type DiceWarOptions,
} from "@johnmorrisdotca/korokoro";

import type { PartyRules } from "../party.types";

/**
 * Dice War as every party game's rules answer (`PartyRules`), from Korokoro's
 * rules (`@johnmorrisdotca/korokoro`): what the New Game Gate plays out at
 * every table it offers, to the score each size names, with one six-sided die
 * each. The choices only the set-up makes (how many dice, how many sides, a
 * number of rounds in place of a score) go through `startWith`.
 *
 * A move is the dice the people at the table threw. The gate has no hand to
 * throw them with, so the one move it is offered is the throw the game's own
 * seed would make for those seats: any dice are a legal throw, and a game
 * played from different seeds is a different game.
 */
export const DICE_WAR_RULES: PartyRules<DiceWarGame, DiceWarMove> & { startWith: (options: DiceWarOptions) => DiceWarGame | null } = {
  start: (size, players, _language, seed, computers) => startDiceWar({ players, computers, to: size, seed: String(seed ?? 1) }),
  startWith: startDiceWar,
  moves: (game) => {
    if (diceWarOver(game)) return [];
    const people = diceWarPeopleToRoll(game);
    return [people.length === 0 ? {} : { faces: Object.fromEntries(people.map((seat) => [String(seat), diceWarComputerFaces(game, game.round, game.wars, seat)])) }];
  },
  play: playDiceWar,
  over: diceWarOver,
  winners: diceWarWinners,
  encode: encodeDiceWar,
  decode: decodeDiceWar,
};
