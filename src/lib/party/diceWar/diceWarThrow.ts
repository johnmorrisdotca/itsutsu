import { cryptoSource, diceWarPeopleToRoll, playDiceWar, roll, type DiceWarGame, type DiceWarThrow, type RandomSource } from "@johnmorrisdotca/korokoro";

/**
 * THE THROW A TABLE MAKES: the dice of every person who rolls now, thrown by
 * Korokoro from the browser's own cryptographic generator, handed to the game
 * as the move. The computers' dice are the game's own, from its seed. Where
 * nobody at the table is to roll (a war among computers only), the move is
 * empty and the game throws for them.
 *
 * The dice are decided here, before anything is drawn: the tumble a person
 * watches only shows what was thrown, and the throw is kept with the game, so
 * reading a game back throws nothing again.
 */
export function throwDiceWar(game: DiceWarGame, source: RandomSource = cryptoSource()): DiceWarGame | null {
  const people = diceWarPeopleToRoll(game);
  if (people.length === 0) return playDiceWar(game, {});
  const faces = Object.fromEntries(people.map((seat) => [String(seat), roll({ count: game.dice, sides: game.sides }, source).faces]));
  return playDiceWar(game, { faces });
}

/** The throw just made, or null before the first. */
export function lastThrow(game: DiceWarGame): DiceWarThrow | null {
  return game.throws.at(-1) ?? null;
}

/** Whether the game has people to roll next: a person's press is what the table waits on. */
export function waitsOnPerson(game: DiceWarGame): boolean {
  return game.phase !== "over" && diceWarPeopleToRoll(game).length > 0;
}
