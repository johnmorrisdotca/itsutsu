import { describe, expect, it } from "vitest";

import { BOT_TIERS } from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { applyTurn, legalTurns } from "./opponentTurns";
import { createGame, inMovePhase, legalPoints, pointOf } from "./engine";
import { replayMoves } from "./rules/record";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import type { GameState } from "./gomoku.types";
import { seededRandom } from "./rules/random";

/**
 * nineMensMorris through the site: the rule is Narabe's (`rules/mills.ts`, tested there), and what is asked here is that the programs, which
 * enumerate turns through the engine and were not changed for it, can play it: lay, move, take a man when one is owed, and finish.
 */
/** Men taken over every program's game: one game can end without a mill, blocked or drawn, and all of them cannot. */
const TAKEN = { count: 0 };

describe("the programs play nineMensMorris", () => {
  it("offers a program the men it may take, and nothing else, when a mill is owed its taking", () => {
    let state: GameState = createGame({ variant: RULE_VARIANTS.nineMensMorris, size: 7 });
    for (const point of [{ row: 0, col: 0 }, { row: 6, col: 0 }, { row: 0, col: 3 }, { row: 6, col: 3 }, { row: 0, col: 6 }]) {
      state = applyTurn(state, { kind: "place", row: point.row, col: point.col } as never);
    }
    expect(state.pendingRemoval).toBe(true);
    expect(inMovePhase(state)).toBe(false);
    const turns = legalTurns(state);
    expect(turns.map((turn) => "row" in turn && `${turn.row},${turn.col}`).sort()).toEqual(["6,0", "6,3"]);
    expect(legalPoints(state)).toHaveLength(2);
    const taken = applyTurn(state, turns[0]!);
    expect(taken.pendingRemoval).toBe(false);
    expect(taken.toPlay).toBe("white");
  });

  it.each(Object.values(BOT_TIERS))("%s finishes a game against itself, takes men on the way, and the record replays", (tier) => {
    const random = seededRandom(tier.length * 97);
    let state: GameState = createGame({ variant: RULE_VARIANTS.nineMensMorris, size: 7 });
    const start = state;
    let turns = 0;
    let taken = 0;
    while (state.status === GAME_STATUS.playing && turns < 700) {
      const turn = chooseTurn(state, tier, random);
      expect(turn, `turn ${turns}`).not.toBeNull();
      const next = applyTurn(state, turn!);
      expect(next, `turn ${turns} did not change the game`).not.toBe(state);
      if (state.pendingRemoval) taken += 1;
      state = next;
      turns += 1;
    }
    expect(state.status).not.toBe(GAME_STATUS.playing);
    TAKEN.count += taken;
    // The board is still only the twenty-four points, and the record alone makes the same game.
    expect(state.board.filter((cell) => cell === "blocked")).toHaveLength(25);
    expect(pointOf(7, 0)).toEqual({ row: 0, col: 0 });
    const timeline = replayMoves(start, state.moves.map((move) => (move.kind === "move" ? { row: move.row, col: move.col, stone: move.stone, kind: "move" as const, from: move.from! } : { row: move.row, col: move.col, stone: move.stone, kind: "place" as const })));
    expect(timeline.at(-1)!.board).toEqual(state.board);
    expect(timeline.at(-1)!.status).toBe(state.status);
  }, 120_000);

  it("took men between them", () => {
    expect(TAKEN.count).toBeGreaterThan(0);
  });
});
