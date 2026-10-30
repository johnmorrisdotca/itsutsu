import { describe, expect, it } from "vitest";

import { chooseTurn } from "./opponent";
import { BOT_TIERS } from "./opponent.constants";
import { applyTurn, legalTurns } from "./opponentTurns";
import { createGame, inMovePhase, legalPoints, movePiece, pieceMoves, pointOf } from "./engine";
import { GAME_STATUS, RULE_VARIANTS } from "./gomoku.constants";
import type { GameState, RuleVariant } from "./gomoku.types";
import { seededRandom } from "./rules/random";
import { replayMoves } from "./rules/record";

/**
 * Breakthrough, Lines of Action and Amazons through the site: the rules are Narabe's (`rules/movers.ts`, tested there), and what is asked here
 * is that the programs, which enumerate turns through the engine and were not changed for these, can play each to its end, within a browser's time.
 */
const GAMES: readonly (readonly [RuleVariant, number])[] = [
  [RULE_VARIANTS.breakthrough, 8],
  [RULE_VARIANTS.linesOfAction, 8],
  [RULE_VARIANTS.amazons, 10],
];

/** The slowest a single turn may take a program, on a laptop in a test: above this, a browser's player would feel it. */
const SLOWEST_TURN_MS = 12_000;

describe.each(GAMES)("the programs play %s", (variant, size) => {
  it("sets its men out as the rules say and offers only moves the engine will take", () => {
    const state = createGame({ variant, size });
    expect(state.board.filter((cell) => cell === "black").length).toBeGreaterThan(0);
    expect(state.board.filter((cell) => cell === "white").length).toBe(state.board.filter((cell) => cell === "black").length);
    expect(inMovePhase(state)).toBe(true);
    const own = state.board.flatMap((cell, index) => (cell === state.toPlay ? [pointOf(size, index)] : []));
    const moves = own.flatMap((from) => pieceMoves(state, from).map((to) => ({ from, to })));
    expect(moves.length).toBeGreaterThan(0);
    const after = movePiece(state, moves[0]!.from, moves[0]!.to);
    expect(after).not.toBe(state);
    expect(legalTurns(state).length).toBeGreaterThan(0);
  });

  it.each(Object.values(BOT_TIERS))("%s finishes a game against itself, and the record replays", (tier) => {
    const random = seededRandom(tier.length * 53 + size);
    const start = createGame({ variant, size });
    let state: GameState = start;
    let turns = 0;
    let slowest = 0;
    while (state.status === GAME_STATUS.playing && turns < 900) {
      const began = performance.now();
      const turn = chooseTurn(state, tier, random);
      slowest = Math.max(slowest, performance.now() - began);
      expect(turn, `turn ${turns}`).not.toBeNull();
      const next = applyTurn(state, turn!);
      expect(next, `turn ${turns} did not change the game`).not.toBe(state);
      state = next;
      turns += 1;
    }
    expect(state.status, `${turns} turns`).not.toBe(GAME_STATUS.playing);
    expect(slowest, `the slowest turn took ${Math.round(slowest)} ms`).toBeLessThan(SLOWEST_TURN_MS);
    const timeline = replayMoves(start, state.moves.map((move) => (move.kind === "move" ? { row: move.row, col: move.col, stone: move.stone, kind: "move" as const, from: move.from! } : { row: move.row, col: move.col, stone: move.stone, kind: "place" as const })));
    expect(timeline.at(-1)!.board).toEqual(state.board);
    expect(timeline.at(-1)!.status).toBe(state.status);
  }, 300_000);
});

describe("an Amazon's arrow", () => {
  it("is offered to a program as the point after the queen, and only squares the queen reaches", () => {
    const start = createGame({ variant: RULE_VARIANTS.amazons, size: 10 });
    const own = start.board.flatMap((cell, index) => (cell === start.toPlay ? [pointOf(10, index)] : []));
    const from = own[0]!;
    const to = pieceMoves(start, from)[0]!;
    const moved = movePiece(start, from, to);
    expect(moved.pendingShot).toEqual(to);
    expect(moved.toPlay).toBe(start.toPlay);
    expect(inMovePhase(moved)).toBe(false);
    const turns = legalTurns(moved);
    expect(turns.length).toBe(legalPoints(moved).length);
    const shot = applyTurn(moved, turns[0]!);
    expect(shot.pendingShot).toBeNull();
    expect(shot.toPlay).not.toBe(start.toPlay);
    expect(shot.board.filter((cell) => cell === "blocked")).toHaveLength(1);
  });
});
