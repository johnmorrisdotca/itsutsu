import { describe, expect, it } from "vitest";
import { fromDiagram } from "@johnmorrisdotca/narabe/test-support";
import { assess } from "@/lib/gomoku/analysis";
import { GAME_STATUS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { findFatalMove } from "./sessionSupport";

const OPEN_THREE = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . x x x . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

const OPEN_FOUR = `
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . o
  . . x x x x . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
  . . . . . . . . .
`;

const withMoves = (state: GameState): GameState => ({
  ...state,
  moves: [{ stone: STONES.white, point: { row: 3, col: 8 } } as GameState["moves"][number]],
});

describe("findFatalMove", () => {
  it("names the loser's last move where the game can be read", () => {
    const before = assess(fromDiagram(OPEN_THREE, { toPlay: STONES.white }));
    const next = withMoves(fromDiagram(OPEN_FOUR, { toPlay: STONES.white }));

    expect(findFatalMove(before, assess(next), next)).toEqual({ moveNumber: 1, stone: STONES.white });
  });

  it("names no move in a game the reading is off for, even at the end", () => {
    const unread = (Object.keys(VARIANT_SPECS) as RuleVariant[]).find((variant) => !VARIANT_SPECS[variant].analysis);
    if (unread === undefined) throw new Error("no game has its reading off");

    const board = fromDiagram(OPEN_THREE, { toPlay: STONES.white });
    const playing = withMoves({ ...board, settings: { ...board.settings, variant: unread } });
    const won: GameState = { ...playing, status: GAME_STATUS.won, winner: STONES.black };

    expect(assess(won).outlook[STONES.white]).toBe("lost");
    expect(findFatalMove(assess(playing), assess(won), won)).toBeNull();
  });
});
