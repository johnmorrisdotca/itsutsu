import type { GameState, Point, Stone, VariantSpec } from "../gomoku.types";

/**
 * The specialists: a player that knows one game rather than every game.
 *
 * The five graded players share one reading — `opponentEval.ts` — which counts
 * what can be counted in any of the forty games on this site: discs, captures,
 * pieces home, the shape of a line. That is the right way to have an opponent
 * in every game at once, and it is the wrong way to have a strong one in any
 * particular game.
 *
 * This used to cite the Reversi series — the grades that search deepest losing
 * eighteen games to eleven to the ones that barely search — as the proof, and
 * that reading of it turned out to be wrong. Those grades were not searching
 * deepest in Reversi; they were not searching AT ALL, because the line games'
 * search declines a flipping board. The losses were the absence of a lookahead
 * rather than the presence of a bad one, and once `opponentLook.ts` gave them
 * one the same series became 段 0-30 名人.
 *
 * The claim a specialist rests on is the one that survived that: 為乃木 takes ten
 * games in ten off every graded player, including off a 名人 that now searches
 * eight plies of Reversi. A shared reading that covers forty games is the right
 * way to have an opponent everywhere and still not the way to have the best one
 * anywhere — corners, edge stability, parity and the exact endgame are one
 * game's theory, and no amount of depth over disc count and mobility arrives
 * at them.
 *
 * So a specialist is not a grade with the knobs turned up. It is a different
 * reading of one family of board, and it is chosen by what the game's spec
 * says the game *is* — a game where stones turn over, a game where lines are
 * read — never by the variant's name and never by the player's own.
 */

/** What a colour has going on this board: its shape, and its points to five. */
export type LineReading = {
  /** The weighted count of every window this colour could still fill. */
  score: number;
  /** Board indices of the empty points that would complete five for it. */
  fives: number[];
  /**
   * How many open threes it holds: shapes one stone away from a four with
   * both ends still empty.
   *
   * The threat that decides games between players who can count. A four can
   * be blocked at its one point; an open four has two and cannot be, so the
   * open three is the last moment the other side gets to say anything, and a
   * reading that cannot see one will let a lost position look level.
   */
  openThrees: number;
};

/** Which family of board a specialist has actually studied. */
export type ExpertKind = "flip" | "line";

/**
 * One specialist's knowledge of one family: which games it applies to, what a
 * position in them is worth, and which moves are worth looking at first.
 *
 * Advisory, in the same sense `threats.ts` and `analysis.ts` are advisory:
 * nothing here decides what is legal or who has won. Every move it weighs is
 * offered to the engine and every outcome is read back out of it.
 */
export type Expert = {
  kind: ExpertKind;
  /**
   * Whether this reading says anything true about a game with this spec.
   *
   * Read from the spec's mechanics — does it flip, does it wrap, does a line
   * decide it — so a variant added tomorrow is covered or excluded by what it
   * is rather than by whether anybody remembered to name it here.
   */
  applies(spec: VariantSpec): boolean;
  /** What a live position is worth from `me`'s side, in the search's units. */
  read(state: GameState, me: Stone): number;
  /** The moves worth searching here, best first, at most `limit` of them. */
  candidates(state: GameState, limit: number): Point[];
  /** How many candidates are weighed at a node below the root, and at it. */
  branch: number;
  rootBranch: number;
  /** How deep to look in this position — deeper where the game is nearly over. */
  depth(state: GameState): number;
};
