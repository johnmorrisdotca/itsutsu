import type { DiceTableBase } from "../diceTable/diceTable.types";

/** Throw the dice left, set aside the dice in the mask, or bank the turn. */
export type TenThousandMove = { kind: "roll" } | { kind: "keep"; mask: number } | { kind: "bank" };

/** Where a turn stands: about to throw; thrown, and must set aside some dice that score; or set aside, and free to throw on or bank. */
export type TenThousandStage = "roll" | "keep" | "more";

/** What the last move did, for the line under the dice. */
export type TenThousandLast =
  | { seat: number; kind: "bust"; lost: number }
  | { seat: number; kind: "rolled" }
  | { seat: number; kind: "kept"; points: number; hot: boolean }
  | { seat: number; kind: "banked"; points: number };

/** A GAME OF TEN THOUSAND: `size` is the score that starts the last round. */
export type TenThousandGame = DiceTableBase<TenThousandMove> & {
  stage: TenThousandStage;
  /** The dice on the table: what the last throw left that has not been set aside. */
  dice: readonly number[];
  /** The dice set aside this turn. */
  aside: readonly number[];
  /** What this turn has made so far, lost on a throw that scores nothing. */
  turnPoints: number;
  /** Each seat's banked points. */
  banked: readonly number[];
  /** The seat that first reached the score: everybody else has one more turn. Null until somebody has. */
  lastRoundFrom: number | null;
  last: TenThousandLast | null;
};
