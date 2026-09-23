import { otherStone, pieceMoves, pointOf } from "../engine";
import { MOVE_KINDS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { isKingAt } from "../rules/checkers";
import { DRAUGHTS, DRAUGHTS_WEIGHTS, EXPERT_KINDS } from "./expert.constants";
import type { GameState, Point, Stone, VariantSpec } from "../gomoku.types";
import type { BotTurn } from "../opponent.types";
import type { Expert } from "./expert.types";

/**
 * The draughts player: English checkers and the five federation games —
 * international, Brazilian, Canadian, Russian and pool.
 *
 * The graded players read these games by material and how far each man has
 * come, and nothing else, so they give away their first row, walk men forward
 * to be taken, and have no idea that four against three wants trading down.
 * This reading is the one a club player would describe out loud: material,
 * then the back rank, the centre and a small pull forward, and a reason to
 * exchange when ahead. It is searched by the same alpha-beta as the other
 * specialists (`expertSearch.ts`), whose forced-move extension follows a
 * compulsory capture past the nominal depth — which in draughts is most of
 * the tactics.
 *
 * Advisory, like every specialist: the engine lists the legal moves, including
 * the compulsory and majority captures each federation writes, applies them,
 * and says who has won. A capture chain arrives as one jump at a time, and the
 * search keeps the same side to move until the chain ends, because the state
 * says so; nothing here counts a chain itself.
 */

/** Whether a game is one of the draughts family: read from its rules, never its name. */
function draughtsApplies(spec: VariantSpec): boolean {
  return spec.checkersRules !== null && spec.checkersRules !== undefined;
}

/** How many rows a man of this colour has come from its own first row. */
function advanced(stone: Stone, row: number, size: number): number {
  return stone === STONES.black ? row : size - 1 - row;
}

/** Whether a square is in the middle band of the board, a quarter in from every edge. */
function central(point: Point, size: number): boolean {
  const low = Math.floor(size / 4);
  const high = size - 1 - low;
  return point.row >= low && point.row <= high && point.col >= low && point.col <= high;
}

/** How far a square is from the middle of the board, in king moves. */
function offCentre(point: Point, size: number): number {
  const middle = (size - 1) / 2;
  return Math.max(Math.abs(point.row - middle), Math.abs(point.col - middle));
}

/** What a draughts position is worth to `me`. */
export function draughtsRead(state: GameState, me: Stone): number {
  const { size, variant } = state.settings;
  const flying = VARIANT_SPECS[variant].checkersRules?.flyingKings ?? false;
  const kingWorth = flying ? DRAUGHTS_WEIGHTS.flyingKing : DRAUGHTS_WEIGHTS.king;
  const foe = otherStone(me);

  const material: Record<Stone, number> = { black: 0, white: 0 };
  const shape: Record<Stone, number> = { black: 0, white: 0 };
  // Counted first: whether a first row is worth holding depends on the other side's men.
  const men: Record<Stone, number> = { black: countMen(state, STONES.black), white: countMen(state, STONES.white) };
  let pieces = 0;

  for (let index = 0; index < state.board.length; index += 1) {
    const cell = state.board[index];
    if (cell !== STONES.black && cell !== STONES.white) continue;
    pieces += 1;
    const point = pointOf(size, index);
    if (isKingAt(state.kings, point)) {
      material[cell] += kingWorth;
      shape[cell] -= offCentre(point, size) * DRAUGHTS_WEIGHTS.kingCentre;
      continue;
    }
    material[cell] += DRAUGHTS_WEIGHTS.man;
    const rows = advanced(cell, point.row, size);
    shape[cell] += rows * DRAUGHTS_WEIGHTS.advance;
    if (central(point, size)) shape[cell] += DRAUGHTS_WEIGHTS.centre;
    // The first row is only worth holding while the other side still has a man to crown.
    if (rows === 0 && men[otherStone(cell)] > 0) {
      shape[cell] += DRAUGHTS_WEIGHTS.backRank;
    }
  }

  const lead = material[me] - material[foe];
  // Ahead, every exchange is worth having: the same lead is bigger over fewer pieces.
  const trade = pieces === 0 ? 0 : (lead * DRAUGHTS_WEIGHTS.trade) / (pieces * DRAUGHTS_WEIGHTS.man);
  return lead + trade + shape[me] - shape[foe];
}

/** Men of a colour on the board, for the back-rank rule; kings cannot crown again. */
function countMen(state: GameState, stone: Stone): number {
  const { size } = state.settings;
  let count = 0;
  for (let index = 0; index < state.board.length; index += 1) {
    if (state.board[index] === stone && !isKingAt(state.kings, pointOf(size, index))) count += 1;
  }
  return count;
}

/**
 * The moves worth looking at, the ones most likely to matter first.
 *
 * Ordering only. Captures need no help — when one is on the board the engine
 * offers nothing else — so what is sorted is the quiet move: a man that
 * crowns first, then a king towards the middle, then a man forward, and a man
 * stepping off its own first row last, since that row is what stops the other
 * side crowning.
 */
export function draughtsTurns(state: GameState, limit: number): BotTurn[] {
  const spec = VARIANT_SPECS[state.settings.variant];
  if (!draughtsApplies(spec)) return [];
  const { size } = state.settings;
  const me = state.toPlay;
  const chain = state.chainAt;

  const ranked: { turn: BotTurn; worth: number }[] = [];
  for (let index = 0; index < state.board.length; index += 1) {
    if (state.board[index] !== me) continue;
    const from = pointOf(size, index);
    // Mid-chain, only the piece that is jumping may move.
    if (chain !== null && (chain.row !== from.row || chain.col !== from.col)) continue;
    const king = isKingAt(state.kings, from);
    for (const to of pieceMoves(state, from)) {
      let worth = 0;
      const jumped = Math.abs(to.row - from.row);
      worth += jumped * 10;
      if (!king) {
        const reached = advanced(me, to.row, size);
        if (reached === size - 1) worth += 1000;
        worth += reached;
        if (advanced(me, from.row, size) === 0) worth -= 20;
      } else {
        worth += (offCentre(from, size) - offCentre(to, size)) * 5;
      }
      ranked.push({ turn: { kind: MOVE_KINDS.move, from, row: to.row, col: to.col }, worth });
    }
  }
  ranked.sort((a, b) => b.worth - a.worth);
  return ranked.slice(0, limit).map((entry) => entry.turn);
}

/**
 * The draughts specialist. Like the race player, every move is a slide with a
 * `from`, so `candidates` answers nothing and `turns` is what the search reads.
 */
export const DRAUGHTS_EXPERT: Expert = {
  kind: EXPERT_KINDS.draughts,
  applies: draughtsApplies,
  read: draughtsRead,
  candidates: () => [],
  turns: draughtsTurns,
  branch: DRAUGHTS.branch,
  rootBranch: DRAUGHTS.rootBranch,
  depth(): number {
    return DRAUGHTS.depth;
  },
};
