import type { DiceTableBase } from "../diceTable/diceTable.types";

/** The only thing a player does: throw. */
export type SayuMove = { kind: "roll" };

/** Where one die sends a counter. */
export type SayuFace = "left" | "right" | "pot" | "keep";

/** A GAME OF SAYU: `size` is how many counters each player starts with. */
export type SayuGame = DiceTableBase<SayuMove> & {
  /** Each seat's counters. They exist inside this one game, start level, and are worth nothing outside it. */
  counters: readonly number[];
  /** The counters gone to the pot. */
  pot: number;
  /** The dice as they last fell; none before the first throw. */
  dice: readonly number[];
  /** Who threw them. */
  thrower: number | null;
};
