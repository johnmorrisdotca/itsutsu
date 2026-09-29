import type { MancalaRuleSet } from "./mancala.types";

/**
 * Each rule set's board, counted in the holes a seed may be sown into — the
 * number `PARTY_SPECS` offers as Mancala's "sizes", so choosing a board is
 * choosing the rules: Kalah's fourteen (twelve pits and both stores, since a
 * sowing passes through your own) or Oware's twelve (its stores only keep
 * what is taken).
 *
 * Apart from `mancala.ts` because `party.constants.ts` reads it too, and
 * `mancala.ts` reads `party.constants.ts`.
 */
export const MANCALA_BOARDS: Record<MancalaRuleSet, number> = { kalah: 14, oware: 12 };

/** Each rule set by name, as the set-up, the turn line and the rules page say it. */
export const MANCALA_RULE_NAMES: Record<MancalaRuleSet, string> = { kalah: "Kalah", oware: "Oware" };

/** A board's rule set by name — "Kalah" for 14, "Oware" for 12 — or null for neither. */
export function mancalaBoardName(board: number): string | null {
  if (board === MANCALA_BOARDS.kalah) return MANCALA_RULE_NAMES.kalah;
  if (board === MANCALA_BOARDS.oware) return MANCALA_RULE_NAMES.oware;
  return null;
}
