import type { DiceTableBase } from "../diceTable/diceTable.types";

/** A bid: at least this many dice round the table show this face, ones counting as any face. */
export type LiarsBid = { count: number; face: number };

/** Bid higher, or call the last bid a lie. */
export type LiarsMove = { kind: "bid"; count: number; face: number } | { kind: "call" };

/** A call, as the whole table saw it when every cup was lifted. */
export type LiarsCall = {
  caller: number;
  bidder: number;
  bid: LiarsBid;
  /** How many dice did show that face, ones included. */
  found: number;
  /** Who lost a die. */
  loser: number;
  /** Every seat's dice as they lay under the cups. */
  cups: readonly (readonly number[])[];
};

/**
 * A GAME OF LIAR'S DICE: `size` is how many dice each player starts with.
 * Everybody's dice are under `cups`, so a table on one device covers the screen
 * between people, and a table on several sends each seat only its own
 * (`seenByLiar`).
 */
export type LiarsGame = DiceTableBase<LiarsMove> & {
  /** Each seat's dice. A die lost is gone; a seat with none is out. */
  cups: readonly (readonly number[])[];
  /** The bid to beat, and who made it; null when a round opens. */
  bid: (LiarsBid & { seat: number }) | null;
  /** The round being played, from 0. */
  round: number;
  /** The last call, shown until the next one. */
  called: LiarsCall | null;
};
