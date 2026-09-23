import { indexOf, isStone, pointOf } from "@/lib/gomoku/engine";
import { groupAt } from "@/lib/gomoku/rules/go";
import type { Cell, GameState } from "@/lib/gomoku/gomoku.types";

import type { BoardMark } from "./board.types";

/**
 * GO, MARKED ON THE BOARD FOR SOMEBODY LEARNING IT.
 *
 * John, 2026-09-23, his first game of Go: "I had no idea where I could go…
 * It didn't identify the places I could go." In Go nearly every empty point is
 * a legal move, so the useful mark is the exception: a cross on the points the
 * rules forbid right now (a stone with no liberty that takes nothing, or the
 * ko), and a ring on the last liberty of any group in atari — the point where
 * it is taken, or saved. The words for the same things are under the board, in
 * `GoHelp`.
 *
 * Read from the engine's own answer about legality and its own groups; decides
 * nothing.
 */
export function goBoardMarks(state: GameState, legal: ReadonlySet<number>): BoardMark[] {
  const { size } = state.settings;
  const marks: BoardMark[] = [];
  const ringed = new Set<number>();
  const seen = new Set<number>();
  for (let index = 0; index < state.board.length; index += 1) {
    const cell = state.board[index];
    if (cell === null) {
      if (!legal.has(index)) marks.push({ ...pointOf(size, index), kind: "forbidden" });
      continue;
    }
    if (!isStone(cell) || seen.has(index)) continue;
    const group = groupAt(state.board as Cell[], size, pointOf(size, index));
    for (const stone of group.stones) seen.add(indexOf(size, stone));
    if (group.liberties.size !== 1) continue;
    const liberty = [...group.liberties][0];
    if (ringed.has(liberty) || !legal.has(liberty)) continue;
    ringed.add(liberty);
    marks.push({ ...pointOf(size, liberty), kind: "forced" });
  }
  return marks;
}
