import { describe, expect, it } from "vitest";

import { createGame } from "@/lib/gomoku/engine";
import { pendingMove } from "./pendingMove";
import { boardTakesNudges, nudgedMove, nudgesAvailable, OPPOSITE } from "./nudgeMove";

/**
 * A near miss on a phone costs one press, not a whole move started again.
 *
 * Everything here goes through the engine: a nudge is a new placement offered
 * to `pendingMove`, so what these cases prove is that the right question is
 * asked, never that this module has opinions about what is legal.
 */
describe("nudging a placed stone", () => {
  const board = () => createGame({ variant: "freestyle", size: 15 });
  const placed = (row: number, col: number) => {
    const state = board();
    const move = pendingMove(state, { kind: "place", row, col });
    expect(move).not.toBeNull();
    return { state, move: move! };
  };

  it("moves the stone one point and leaves the first point empty", () => {
    const { state, move } = placed(7, 7);
    const up = nudgedMove(state, move, "up");
    expect(up).not.toBeNull();
    expect(up!.turn).toMatchObject({ kind: "place", row: 6, col: 7 });
    /*
     * FROM THE BOARD BEFORE THE MOVE. Nudging from the preview would leave the
     * first stone standing and play a second — so the point it left must be
     * empty in what comes back, and this is the case that says so.
     */
    expect(up!.after.board[7 * 15 + 7]).toBeNull();
  });

  it("goes back where it came from, so a nudge can be undone by its opposite", () => {
    const { state, move } = placed(7, 7);
    const right = nudgedMove(state, move, "right")!;
    const back = nudgedMove(state, right, OPPOSITE.right)!;
    expect(back.turn).toMatchObject({ row: 7, col: 7 });
  });

  it("refuses to leave the board rather than clamping to the edge", () => {
    const { state, move } = placed(0, 0);
    expect(nudgedMove(state, move, "up")).toBeNull();
    expect(nudgedMove(state, move, "left")).toBeNull();
    // And the two that stay on it are offered.
    expect(nudgesAvailable(state, move)).toEqual(new Set(["down", "right"]));
  });

  it("refuses a point another stone is already on, because the engine does", () => {
    const state = createGame({ variant: "freestyle", size: 15 });
    const first = pendingMove(state, { kind: "place", row: 7, col: 7 })!;
    // A board with that stone really played, then a move beside it.
    const after = first.after;
    const beside = pendingMove(after, { kind: "place", row: 7, col: 8 })!;
    expect(nudgedMove(after, beside, "left")).toBeNull();
    expect(nudgesAvailable(after, beside).has("left")).toBe(false);
  });

  it("offers nothing at all when there is no move placed", () => {
    expect(nudgesAvailable(board(), null).size).toBe(0);
  });

  /*
   * THE SHAPE OF THE BOARD DECIDES, NOT ITS SIZE. An arrow on a sheared
   * lattice would point one way and move the stone another, and those boards
   * have the roomiest cells on a phone anyway.
   */
  it("is offered on a square grid and withheld from the hexagon lattice", () => {
    expect(boardTakesNudges(createGame({ variant: "freestyle", size: 15 }))).toBe(true);
    expect(boardTakesNudges(createGame({ variant: "go", size: 19 }))).toBe(true);
    expect(boardTakesNudges(createGame({ variant: "honeycomb" }))).toBe(false);
    expect(boardTakesNudges(createGame({ variant: "hex" }))).toBe(false);
    expect(boardTakesNudges(createGame({ variant: "chineseCheckers" }))).toBe(false);
  });

  it("gives a drop game its columns and not its rows, because gravity chose the row", () => {
    const state = createGame({ variant: "dropFour" });
    const move = pendingMove(state, { kind: "place", row: state.settings.size - 1, col: 3 })!;
    const available = nudgesAvailable(state, move);
    expect(available.has("left")).toBe(true);
    expect(available.has("right")).toBe(true);
    // Up is a point gravity would never leave a disc at, and the engine says so.
    expect(available.has("up")).toBe(false);
  });
});
