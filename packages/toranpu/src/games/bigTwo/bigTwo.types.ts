import type { KeptCardGame } from "../cardGameCodec.ts";
import type { CardId } from "../cardGames.types.ts";
import type { ClimbMove, ClimbTrick } from "../climbing/climbing.types.ts";

/**
 * A GAME OF BIG TWO: its table and moves (what is kept), and the deal they
 * have reached. `size` is how many deals the game lasts: 1, 3 or 5.
 */
export type BigTwoGame = KeptCardGame<ClimbMove> &
  ClimbTrick & {
    /** Which deal this is, from 0. */
    deal: number;
    phase: "playing" | "over";
    /** The lowest card dealt, which the first play of the deal must include; null once it has been played. */
    opening: CardId | null;
    /** Each seat's penalty points so far: the lowest total wins. */
    penalties: number[];
    /** Each finished deal: who went out, and what every seat was charged. */
    deals: { winner: number; charged: number[] }[];
  };
