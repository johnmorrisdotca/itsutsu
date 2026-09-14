import type { Stone } from "@/lib/gomoku/gomoku.types";

import type { GameRow } from "./liveGame";

/** A game as the repair reads it: the live select, and the count the row keeps of its moves. */
export type ForfeitRowGame = GameRow & { moveCount: number };

/**
 * What to do with a game whose record stops at a pass the rules refuse.
 *
 * `repair`: the pass is a turn a claimed timeout took, and is to be rewritten
 * as the forfeit it was. `refused`: something about it does not fit a timeout,
 * and it is left alone, with the reason.
 */
export type ForfeitRowVerdict =
  | { kind: "repair"; number: number; stone: Stone }
  | { kind: "refused"; number: number; reason: string };
