import { describe, expect, it } from "vitest";

import { createGame, indexOf, pointOf } from "../engine";
import { GAME_STATUS, MOVE_KINDS, RULE_VARIANTS, STONES, VARIANT_SPECS } from "../gomoku.constants";
import { applyTurn } from "../opponentTurns";
import { expertTurn } from "./expertSearch";
import { raceBoard } from "./raceBoard";
import { RACE_EXPERT, assign, raceRead, raceTurns } from "./raceExpert";
import { seededRandom } from "../rules/random";
import type { Cell, GameState, Stone } from "../gomoku.types";

/**
 * WHAT THE RACE PLAYER KNOWS THAT THE SHARED READING DOES NOT.
 *
 * The series against the graded ladder is the claim about strength and lives
 * in `specialists.match.test.ts`. What is here is the MECHANISM that series
 * measures, case by case, because a series says a player is stronger and does
 * not say which of its ideas is doing the work — and every case below is a
 * position the old reading got wrong.
 */

const HALMA = RULE_VARIANTS.halma;

/** A Halma board with only the pieces named on it, and `toPlay` to move. */
function halma(size: number, pieces: { at: [number, number]; stone: Stone }[], toPlay: Stone = STONES.black): GameState {
  const fresh = createGame({ variant: HALMA, size });
  const board: Cell[] = fresh.board.map((cell) => (cell === STONES.black || cell === STONES.white ? null : cell));
  for (const piece of pieces) board[indexOf(size, { row: piece.at[0], col: piece.at[1] })] = piece.stone;
  return { ...fresh, board, toPlay };
}

/** The camp `stone` is racing to fill, deepest square first, as points. */
function campPoints(size: number, stone: Stone): [number, number][] {
  const measured = raceBoard(HALMA, size);
  return measured.campOf[stone].map((index) => {
    const point = pointOf(size, index);
    return [point.row, point.col] as [number, number];
  });
}

describe("which games the race player has studied", () => {
  it("is decided by the spec, never by the variant's name", () => {
    const studied = Object.values(RULE_VARIANTS).filter((variant) => RACE_EXPERT.applies(VARIANT_SPECS[variant]));
    expect(studied.sort()).toEqual([RULE_VARIANTS.chineseCheckers, RULE_VARIANTS.halma].sort());
  });

  it("says nothing about a game where nothing races", () => {
    for (const variant of [RULE_VARIANTS.reversi, RULE_VARIANTS.standard, RULE_VARIANTS.go, RULE_VARIANTS.checkers]) {
      expect(RACE_EXPERT.applies(VARIANT_SPECS[variant]), variant).toBe(false);
    }
  });
});

describe("the piece left behind", () => {
  it("outweighs a shorter total walk, which is the case a sum gets backwards", () => {
    /*
     * THE CASE THE OLD READING COULD NOT SEE, and the reason `strand` exists.
     *
     * One position is three pieces a little way out. The other is two pieces
     * already in the two deepest squares of the camp and one still on its own
     * starting corner. By TOTAL distance left the second is the better of the
     * two — it is seven steps from finished against eight — so a reading that
     * adds up distances prefers it.
     *
     * It is plainly the worse position. The game is not over until the LAST
     * piece is in, and that piece has the whole board to cross; the first
     * position finishes in three moves and this one cannot finish in fewer
     * than seven. A sum does not merely fail to see the difference here, it
     * gets the sign wrong, which is how a player talks itself into leaving a
     * piece at home and calling the position good.
     */
    const size = 8;
    const measured = raceBoard(HALMA, size);
    const deep = campPoints(size, STONES.black);

    const together = halma(size, [
      { at: [4, 4], stone: STONES.black },
      { at: [4, 5], stone: STONES.black },
      { at: [5, 4], stone: STONES.black },
    ]);
    const stranded = halma(size, [
      { at: deep[0], stone: STONES.black },
      { at: deep[1], stone: STONES.black },
      { at: [0, 0], stone: STONES.black },
    ]);

    const spread = assign(together.board, measured, STONES.black);
    const behind = assign(stranded.board, measured, STONES.black);
    // The premise: by the sum alone, the stranded army is the one ahead.
    expect(behind.total, "the sum has to favour the stranded army or this case proves nothing").toBeLessThan(spread.total);
    // And the fact the sum is blind to.
    expect(behind.worst).toBeGreaterThan(spread.worst);
    // The reading has to come down on the other side of its own sum.
    expect(raceRead(stranded, STONES.black)).toBeLessThan(raceRead(together, STONES.black));
  });
});

describe("the piece in the doorway", () => {
  it("is charged for the square behind it, rather than counted as home", () => {
    /*
     * A camp is filled from the back. A piece that stops at the mouth scores
     * nothing to a reading that measures to the nearest camp square — it IS on
     * one — while standing in the way of everything still to come. Here one
     * piece is in the shallowest square of the camp with the deepest still
     * empty, and the reading has to price the walk somebody must still make.
     */
    const size = 8;
    const measured = raceBoard(HALMA, size);
    const camp = campPoints(size, STONES.black);
    const mouth = camp[camp.length - 1];
    const back = camp[0];

    const inTheDoorway = halma(size, [{ at: mouth, stone: STONES.black }]);
    const atTheBack = halma(size, [{ at: back, stone: STONES.black }]);

    expect(assign(atTheBack.board, measured, STONES.black).total, "a piece on the deepest square is home").toBe(0);
    expect(assign(inTheDoorway.board, measured, STONES.black).total, "the deepest square still has to be filled").toBeGreaterThan(0);
    expect(raceRead(atTheBack, STONES.black)).toBeGreaterThan(raceRead(inTheDoorway, STONES.black));
  });
});

describe("the moves it offers", () => {
  it("are all legal, and are slides rather than placements", () => {
    const state = createGame({ variant: HALMA, size: 8 }, 0.5);
    const turns = raceTurns(state, 200);
    expect(turns.length).toBeGreaterThan(0);
    for (const turn of turns) {
      expect(turn.kind).toBe(MOVE_KINDS.move);
      expect(applyTurn(state, turn), "the engine refused a move the player offered").not.toBe(state);
    }
  });

  it("puts the jump that carries a piece furthest at the top of the list", () => {
    /*
     * A chain of jumps arrives from the engine as one landing, so nothing here
     * has to know what a jump is — ordering by ground gained is enough to
     * prefer the ladder. Which is the point: the ladder is the game, and the
     * old ordering had no way to prefer one.
     */
    const size = 8;
    const state = halma(size, [
      { at: [0, 0], stone: STONES.black },
      { at: [1, 1], stone: STONES.white },
      { at: [3, 3], stone: STONES.white },
    ]);
    const measured = raceBoard(HALMA, size);
    const nearest = measured.stepsToNearest[STONES.black];
    const first = raceTurns(state, 100)[0];
    expect(first.kind).toBe(MOVE_KINDS.move);
    if (first.kind !== MOVE_KINDS.move) throw new Error("a race move is a slide");
    const gained = nearest[indexOf(size, { row: 0, col: 0 })] - nearest[indexOf(size, { row: first.row, col: first.col })];
    expect(gained, "the best move offered gains less ground than a two-jump chain would").toBeGreaterThanOrEqual(4);
  });

  it("says nothing at all in a game that is not a race", () => {
    const reversi = createGame({ variant: RULE_VARIANTS.reversi, size: 8 }, 0.5);
    expect(raceTurns(reversi, 20)).toEqual([]);
    expect(RACE_EXPERT.candidates(reversi, 20)).toEqual([]);
  });
});

describe("the player, through its own search", () => {
  it("fills the last square of the camp when filling it wins", () => {
    /*
     * Through `expertTurn`, so it is the search that has to find it and the
     * engine that has to agree the game is over. A specialist that could not
     * finish a won position would read as broken rather than as weak.
     */
    const size = 8;
    const camp = campPoints(size, STONES.black);
    /*
     * The MOUTH of the camp is the square left empty, not the back of it. Every
     * neighbour of the deepest square is itself a camp square, so a piece
     * waiting to fill that one would have to be standing in the camp already.
     */
    const mine = camp.slice(0, camp.length - 1).map((at) => ({ at, stone: STONES.black as Stone }));
    const mouth = camp[camp.length - 1];
    const waiting: [number, number] = [mouth[0] - 1, mouth[1] - 1];
    const state = halma(size, [...mine, { at: waiting, stone: STONES.black }], STONES.black);
    expect(state.board.filter((cell) => cell === STONES.black), "the position must hold a full army").toHaveLength(camp.length);

    const turn = expertTurn(state, RACE_EXPERT, seededRandom(4), { nodes: 20_000, millis: 5_000 });
    expect(turn).not.toBeNull();
    const after = applyTurn(state, turn!);
    expect(after.status, "the camp was not filled").toBe(GAME_STATUS.won);
    expect(after.winner).toBe(STONES.black);
  });

  it("will not walk a piece back out of the camp for nothing", () => {
    /*
     * The other half of the same idea. Every piece is home but one, and the
     * only thing that can improve the position is bringing that one up — so a
     * move that takes a finished piece back out is a move that undoes work,
     * and no amount of noise should choose it.
     */
    const size = 8;
    const camp = campPoints(size, STONES.black);
    const home = camp.slice(0, camp.length - 1).map((at) => ({ at, stone: STONES.black as Stone }));
    const state = halma(size, [...home, { at: [3, 3], stone: STONES.black }], STONES.black);
    const measured = raceBoard(HALMA, size);

    const turn = expertTurn(state, RACE_EXPERT, seededRandom(9), { nodes: 20_000, millis: 5_000 });
    expect(turn).not.toBeNull();
    const before = assign(state.board, measured, STONES.black);
    const after = assign(applyTurn(state, turn!).board, measured, STONES.black);
    expect(after.total, "the move made the army's walk home longer").toBeLessThanOrEqual(before.total);
  });

  it("reads the star as well as the square, because it asks the board rather than the game", () => {
    // One case on the other lattice, since the whole design claim is that the
    // geometry comes from the engine and not from the variant's name.
    const star = createGame({ variant: RULE_VARIANTS.chineseCheckers, size: 17 }, 0.5);
    const turn = expertTurn(star, RACE_EXPERT, seededRandom(11), { nodes: 8_000, millis: 5_000 });
    expect(turn).not.toBeNull();
    const after = applyTurn(star, turn!);
    expect(after).not.toBe(star);
    const measured = raceBoard(RULE_VARIANTS.chineseCheckers, 17);
    const before = assign(star.board, measured, STONES.black);
    const moved = assign(after.board, measured, STONES.black);
    expect(moved.total, "the opening move gained no ground on the star").toBeLessThan(before.total);
  });
});
