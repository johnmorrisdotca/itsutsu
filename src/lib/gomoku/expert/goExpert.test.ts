import { describe, expect, it } from "vitest";

import { createGame, indexOf } from "../engine";
import { MOVE_KINDS, RULE_VARIANTS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { seededRandom } from "../rules/random";
import { expertTurn } from "./expertSearch";
import { GO_EXPERT, goRead, goTurns } from "./goExpert";
import type { Cell, GameState, Stone } from "../gomoku.types";
import type { BotTurn } from "../opponent.types";

/**
 * THE GO PLAYER, held to what a beginner is taught in the first week: take the
 * group in atari, save your own, and never fill your own eye.
 */

function position(stones: [number, number, Stone][], toPlay: Stone = STONES.black, size = 9): GameState {
  const fresh = createGame({ variant: RULE_VARIANTS.go, size });
  const board: Cell[] = fresh.board.map(() => null);
  for (const [row, col, stone] of stones) board[indexOf(size, { row, col })] = stone;
  return { ...fresh, board, toPlay };
}

function at(turn: BotTurn | null): string {
  if (turn === null) return "none";
  return turn.kind === MOVE_KINDS.place ? `${turn.row},${turn.col}` : turn.kind;
}

const reading = { nodes: 20_000, millis: 20_000 };

describe("which game the Go player has studied", () => {
  it("is Go, read from the spec, and nothing else", () => {
    const studied = Object.values(RULE_VARIANTS).filter((variant) => GO_EXPERT.applies(VARIANT_SPECS[variant]));
    expect(studied).toEqual([RULE_VARIANTS.go]);
  });
});

describe("what it counts", () => {
  it("counts the ground nearer its own stones as its own", () => {
    const centre = position([[4, 4, STONES.black]]);
    const edge = position([[0, 0, STONES.black]]);
    expect(goRead(centre, STONES.black)).toBeGreaterThan(goRead(edge, STONES.black));
  });

  it("counts a group in atari as worth more to whoever is to move", () => {
    // White's stone on (4,4) has one liberty left, at (4,5): taken if Black moves, escaping if White does.
    const stones: [number, number, Stone][] = [[4, 4, STONES.white], [3, 4, STONES.black], [5, 4, STONES.black], [4, 3, STONES.black]];
    expect(goRead(position(stones, STONES.black), STONES.black)).toBeGreaterThan(goRead(position(stones, STONES.white), STONES.black));
  });
});

describe("what it plays", () => {
  it("takes a group in atari", () => {
    const state = position([[4, 4, STONES.white], [3, 4, STONES.black], [5, 4, STONES.black], [4, 3, STONES.black], [7, 7, STONES.white]]);
    expect(at(expertTurn(state, GO_EXPERT, seededRandom(3), reading))).toBe("4,5");
  });

  it("saves its own group in atari", () => {
    // Black's stone on (4,4) is in atari, its last liberty at (4,5); White threatens to take it.
    const state = position([[4, 4, STONES.black], [3, 4, STONES.white], [5, 4, STONES.white], [4, 3, STONES.white], [1, 1, STONES.black]]);
    expect(at(expertTurn(state, GO_EXPERT, seededRandom(3), reading))).toBe("4,5");
  });

  it("never offers a move into its own eye", () => {
    // Black surrounds (4,4) on all four sides with healthy stones.
    const state = position([[3, 4, STONES.black], [5, 4, STONES.black], [4, 3, STONES.black], [4, 5, STONES.black], [3, 3, STONES.black], [3, 5, STONES.black], [5, 3, STONES.black], [5, 5, STONES.black]]);
    expect(goTurns(state, 200).map(at)).not.toContain("4,4");
  });

  it("offers to pass once the other side has passed", () => {
    const opened = position([[4, 4, STONES.black]], STONES.white);
    const passed: GameState = {
      ...opened,
      toPlay: STONES.black,
      moves: [{ row: -1, col: -1, stone: STONES.white, kind: MOVE_KINDS.pass }],
    };
    expect(goTurns(passed, 200).map(at)).toContain(MOVE_KINDS.pass);
  });
});
