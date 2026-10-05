import { encodeLayout, flowOf, gameFromCode, type Flow, type Game, type Kind } from "@johnmorrisdotca/suido";

/**
 * A half-played board opened again: the board as it is dealt, with every piece facing as the kept code says (`gameCode`),
 * by the package's own `gameFromCode`, which knows a block that turns as one is turned whole. The quarters are the fewest
 * clockwise turns from the dealt facing, which is all a drawing needs to show the piece where it was left; how many times it
 * was turned on the way is not kept, and nothing reads it. Null for a code that is not this board's: any piece that is not the
 * dealt piece turned, a pump or drain moved, a locked piece turned, one piece of a block turned alone.
 */
export function resumedGame(start: Game, progress: string): Game | null {
  return gameFromCode(encodeLayout(start.start), progress);
}

/** What the water has done, in the words the line under the board says (`suidoStatus`). */
export type SuidoReading = { solved: boolean; reached: number; wanted: number; leaks: number; kind: Kind };

/** The water on a board read as what the solver wants to be told: how much of what the kind asks is reached, and how many open ends leak. */
export function suidoReading(game: Game, flow: Flow = flowOf(game.start, game.masks)): SuidoReading {
  const drains = game.start.kind === "drains";
  /* An inlet-to-outlet board is read by how far the water has run (its wet pieces): there is one outlet, and "0 of 1 drain" would say less than the water does. */
  return { solved: flow.solved, reached: drains ? flow.wetDrains : flow.wetPieces, wanted: drains ? flow.drains : flow.pieces, leaks: flow.spills.length, kind: game.start.kind };
}
