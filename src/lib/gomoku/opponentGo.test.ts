import { describe, expect, it } from "vitest";

import { createGame, indexOf } from "./engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES } from "./gomoku.constants";
import { legalTurns } from "./opponentTurns";
import type { Cell, GameState, Stone } from "./gomoku.types";

/**
 * THE COMPUTER DOES NOT FILL ITS OWN GROUND AT GO.
 *
 * John, 2026-09-23, on 9x9: White covered nearly the whole board, filling
 * ground it had already walled in, instead of passing. A stone there changes
 * the area count by nothing, so it tied with passing and was chosen half the
 * time. It is not offered any more; with nothing useful left, the pass is.
 */

function position(stones: [number, number, Stone][], toPlay: Stone, size = 5): GameState {
  const fresh = createGame({ variant: RULE_VARIANTS.go, size: 9 });
  const board: Cell[] = Array.from({ length: size * size }, () => null);
  for (const [row, col, stone] of stones) board[indexOf(size, { row, col })] = stone;
  return { ...fresh, settings: { ...fresh.settings, size }, board, toPlay };
}

describe("the computer's moves at Go", () => {
  it("leave out every point inside its own walls", () => {
    // Black's wall down column 2 owns columns 0-1; White owns columns 3-4 the same way.
    const wall: [number, number, Stone][] = [];
    for (let row = 0; row < 5; row += 1) wall.push([row, 2, STONES.black], [row, 3, STONES.white]);
    const turns = legalTurns(position(wall, STONES.black), 400);
    const places = turns.filter((turn) => turn.kind === MOVE_KINDS.place);
    expect(places.every((turn) => turn.kind === MOVE_KINDS.place && turn.col === 4)).toBe(true);
  });

  it("always keep the pass, which is how a finished game ends", () => {
    const wall: [number, number, Stone][] = [];
    for (let row = 0; row < 5; row += 1) wall.push([row, 2, STONES.black], [row, 3, STONES.white]);
    const turns = legalTurns(position(wall, STONES.black), 400);
    expect(turns.some((turn) => turn.kind === MOVE_KINDS.pass)).toBe(true);
  });
});
