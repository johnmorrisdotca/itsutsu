import type { DiceTableBase } from "../diceTable/diceTable.types";

/** Throw the die again, or bank what this turn has made. */
export type PigMove = { kind: "roll" } | { kind: "bank" };

/** What the last move did, for the line under the die. */
export type PigLast =
  | { seat: number; kind: "rolled"; die: number; turn: number }
  | { seat: number; kind: "bust"; lost: number }
  | { seat: number; kind: "banked"; points: number };

/** A GAME OF PIG: `size` is the score it is played to. */
export type PigGame = DiceTableBase<PigMove> & {
  /** The die as it last fell; 0 before the first throw. */
  die: number;
  /** What this turn has made so far, lost on a 1. */
  turnPoints: number;
  /** Each seat's banked points. */
  banked: readonly number[];
  last: PigLast | null;
};
