import { isStone, otherStone } from "@/lib/gomoku/engine";
import { MOVE_KINDS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { pointName } from "@/lib/gomoku/notation";
import { groupAt } from "@/lib/gomoku/rules/go";
import type { Cell, GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";
import type { BotTurn } from "@/lib/gomoku/opponent.types";

/**
 * WHAT A BEGINNER AT GO NEEDS TOLD, read off the position.
 *
 * John, 2026-09-23, his first game of Go: he was winning at move 102 — his big
 * group had two eyes, and the computer had passed twice — and then played into
 * one of his own eyes, and the computer took the whole group with the next
 * stone and the game with it. Nothing on the page had said the game could end,
 * or that the move was fatal. The rules knew both; the board said neither.
 *
 * Everything here is a reading of the engine's own rules — the group, its
 * liberties, the last move — and decides nothing: the engine still says what is
 * legal and who has won.
 */

/** Whether this is Go, where all of this applies. */
export function isGo(state: GameState): boolean {
  return VARIANT_SPECS[state.settings.variant]?.go === true;
}

/** Whether the other side's last move was a pass, so passing now ends the game. */
export function theyJustPassed(state: GameState, seat: Stone | null): boolean {
  if (seat === null || state.toPlay !== seat) return false;
  const last = state.moves[state.moves.length - 1];
  // A turn lost on time is not a pass, and is not the first of two.
  return last !== undefined && last.kind === MOVE_KINDS.pass && last.stone !== seat && last.headStart !== true;
}

/** A group down to its last liberty: whose it is, where it is, and the point that would take it. */
export type GroupInAtari = { stone: Stone; at: string; lastLiberty: string; stones: number };

/** Every group on the board with one liberty left, the reader's own first. */
export function groupsInAtari(state: GameState, seat: Stone | null): GroupInAtari[] {
  const { size } = state.settings;
  const seen = new Set<number>();
  const found: GroupInAtari[] = [];
  for (let index = 0; index < state.board.length; index += 1) {
    const cell = state.board[index];
    if (!isStone(cell) || seen.has(index)) continue;
    const from = { row: Math.floor(index / size), col: index % size };
    const group = groupAt(state.board as Cell[], size, from);
    for (const stone of group.stones) seen.add(stone.row * size + stone.col);
    if (group.liberties.size !== 1) continue;
    const liberty = [...group.liberties][0];
    found.push({
      stone: cell,
      at: pointName(size, group.stones[0]),
      lastLiberty: pointName(size, { row: Math.floor(liberty / size), col: liberty % size }),
      stones: group.stones.length,
    });
  }
  return found.sort((a, b) => Number(b.stone === seat) - Number(a.stone === seat));
}

/** Why a stone about to be played is dangerous to its own side, or null when it is not. */
export type GoRisk = "fillsOwnEye" | "selfAtari";

function neighbours(point: Point, size: number): Point[] {
  return [
    { row: point.row - 1, col: point.col },
    { row: point.row + 1, col: point.col },
    { row: point.row, col: point.col - 1 },
    { row: point.row, col: point.col + 1 },
  ].filter((next) => next.row >= 0 && next.row < size && next.col >= 0 && next.col < size);
}

/**
 * The danger in a stone the player is about to place, read before it is sent.
 *
 * - `fillsOwnEye`: every point around it is the player's own stone. That is an
 *   eye — the empty point a group lives by — and filling it is how John's
 *   winning group died.
 * - `selfAtari`: once it is down, the group it joins has one liberty left, so
 *   the other side takes it with the next stone. A capture the stone makes is
 *   already counted: `after` is the position the engine produced.
 */
export function goRisk(before: GameState, turn: BotTurn, after: GameState): GoRisk | null {
  if (!isGo(before) || turn.kind !== MOVE_KINDS.place) return null;
  const { size } = before.settings;
  const me = before.toPlay;
  const point = { row: turn.row, col: turn.col };
  const around = neighbours(point, size);
  if (around.every((next) => before.board[next.row * size + next.col] === me)) return "fillsOwnEye";
  if (after === before) return null;
  const group = groupAt(after.board as Cell[], size, point);
  return group.liberties.size === 1 ? "selfAtari" : null;
}

/** The colour's name for a sentence. */
export function colourName(stone: Stone): string {
  return stone === STONES.black ? "Black" : "White";
}

/** The other colour, for "White passed" said to Black. */
export function otherName(seat: Stone): string {
  return colourName(otherStone(seat));
}
