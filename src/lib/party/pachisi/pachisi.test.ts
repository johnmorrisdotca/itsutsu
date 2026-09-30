import { describe, expect, it } from "vitest";

import { PACHISI_CAPTURE_BONUS, PACHISI_HOME, PACHISI_LAST_TRACK, PACHISI_NEST, PACHISI_TRACK } from "./pachisi.constants";
import { isSafe, pachisiMoves, playPachisi, squareOf, startPachisi } from "./pachisi";
import { decodePachisi, encodePachisi } from "./pachisiCodec";
import { pachisiComputerMove } from "./pachisiComputer";
import { PACHISI_RULES } from "./pachisiRules";
import type { PachisiGame } from "./pachisi.types";

/** A game of pachisi part way through a turn: these pawns, these dice waiting, this seat to move. */
function at(pawns: number[][], dice: [number, number], toPlay = 0): PachisiGame {
  const game = startPachisi(pawns.map(() => ""), 1)!;
  return { ...game, pawns, dice, pending: dice, phase: "move", toPlay, doubles: dice[0] === dice[1] ? 1 : 0 };
}

const N = PACHISI_NEST;

describe("pachisi: the board", () => {
  it("lays every seat's sixty-four squares of track from its own entry, and opposite arms for two", () => {
    const game = startPachisi(["A", "B"])!;
    expect(game.arms).toEqual([0, 2]);
    expect(squareOf(0, 0)).toBe(4);
    expect(squareOf(2, 0)).toBe(38);
    expect(squareOf(0, PACHISI_LAST_TRACK)).toBe(67);
    expect(squareOf(0, PACHISI_LAST_TRACK + 1)).toBeNull();
    expect(new Set(Array.from({ length: PACHISI_TRACK }, (_, square) => square).filter(isSafe)).size).toBe(12);
  });
});

describe("pachisi: a turn", () => {
  it("opens with a throw, and a pawn enters only on a five", () => {
    const game = startPachisi(["A", "B"], 3)!;
    expect(pachisiMoves(game)).toEqual([{ kind: "roll" }]);
    expect(pachisiMoves(at([[N, N, N, N], [N, N, N, N]], [5, 3]))).toEqual([{ kind: "move", pawn: 0, use: 0 }]);
    expect(pachisiMoves(at([[N, N, N, N], [N, N, N, N]], [6, 3]))).toEqual([]);
  });

  it("enters a pawn on two dice adding to five, using both", () => {
    const game = at([[N, N, N, N], [N, N, N, N]], [2, 3]);
    expect(pachisiMoves(game)).toEqual([{ kind: "enter", pawn: 0 }]);
    const entered = playPachisi(game, { kind: "enter", pawn: 0 })!;
    expect(entered.pawns[0]).toEqual([0, N, N, N]);
    expect(entered.toPlay).toBe(1);
  });

  it("moves each die on its own, and passes the turn when both are used", () => {
    const game = at([[10, N, N, N], [N, N, N, N]], [3, 4]);
    const one = playPachisi(game, { kind: "move", pawn: 0, use: 0 })!;
    expect(one.pawns[0][0]).toBe(13);
    expect(one.pending).toEqual([4]);
    const two = playPachisi(one, { kind: "move", pawn: 0, use: 0 })!;
    expect(two.pawns[0][0]).toBe(17);
    expect(two.toPlay).toBe(1);
  });

  it("takes a lone opponent on an ordinary square, sends it to its nest, and earns twenty", () => {
    // Seat 1 enters at square 38; its pawn at progress 4 stands on square 42, which seat 0 reaches from progress 35 by a 3.
    const game = at([[35, N, N, N], [4, N, N, N]], [3, 6]);
    expect(isSafe(42)).toBe(false);
    const took = playPachisi(game, { kind: "move", pawn: 0, use: 0 })!;
    expect(took.pawns[1][0]).toBe(N);
    expect(took.pending).toEqual([6, PACHISI_CAPTURE_BONUS]);
    expect(took.last).toMatchObject({ kind: "moved", took: 1 });
  });

  it("never takes on a safe square, where two colours may stand together", () => {
    // Square 38 is seat 1's entry, a safe square: seat 0 reaches it from progress 30 by a 4.
    const game = at([[30, N, N, N], [0, N, N, N]], [4, 1]);
    const shared = playPachisi(game, { kind: "move", pawn: 0, use: 0 })!;
    expect(shared.pawns[1][0]).toBe(0);
    expect(shared.pending).toEqual([1]);
  });

  it("lets nothing pass or land on a blockade of two pawns of one colour", () => {
    // Seat 1's two pawns at progress 6 stand on square 44; seat 0 at progress 36 (square 40) cannot pass them.
    const game = at([[36, N, N, N], [6, 6, N, N]], [6, 2]);
    const moves = pachisiMoves(game);
    expect(moves).toEqual([{ kind: "move", pawn: 0, use: 1 }]);
  });

  it("brings a pawn home only by the exact count, and earns ten", () => {
    const game = at([[PACHISI_HOME - 4, N, N, N], [N, N, N, N]], [6, 4]);
    expect(pachisiMoves(game)).toEqual([{ kind: "move", pawn: 0, use: 1 }]);
    const home = playPachisi(game, { kind: "move", pawn: 0, use: 1 })!;
    expect(home.pawns[0][0]).toBe(PACHISI_HOME);
    expect(home.last).toMatchObject({ kind: "moved", home: true });
  });

  it("is won by the first player with all four pawns home", () => {
    const game = at([[PACHISI_HOME, PACHISI_HOME, PACHISI_HOME, PACHISI_HOME - 3], [N, N, N, N]], [3, 1]);
    const won = playPachisi(game, { kind: "move", pawn: 3, use: 0 })!;
    expect(won.phase).toBe("finished");
    expect(won.winners).toEqual([0]);
    expect(pachisiMoves(won)).toEqual([]);
  });

  it("throws again after doubles, and a third double sends the leading pawn back", () => {
    let game: PachisiGame | null = { ...startPachisi(["A", "B"], 1)!, pawns: [[20, 40, N, N], [N, N, N, N]] };
    // Find a seed whose first three throws are all doubles, then play them.
    for (let seed = 1; seed < 200_000; seed += 1) {
      const trial = { ...game, seed };
      const thrice = [0, 1, 2].every((throwAt) => {
        const after = playPachisi({ ...trial, thrown: throwAt, phase: "roll", doubles: throwAt, pending: [] }, { kind: "roll" })!;
        return after.dice[0] === after.dice[1];
      });
      if (thrice) {
        game = { ...trial, doubles: 2, thrown: 2 };
        break;
      }
    }
    const third = playPachisi(game!, { kind: "roll" })!;
    expect(third.last).toMatchObject({ kind: "thirdDouble", pawn: 1 });
    expect(third.pawns[0]).toEqual([20, N, N, N]);
    expect(third.toPlay).toBe(1);
  });
});

describe("pachisi: the table", () => {
  it("seats two to four, never one or five", () => {
    expect(PACHISI_RULES.start(PACHISI_TRACK, ["A"])).toBeNull();
    expect(startPachisi(["A", "B", "C", "D", "E"])).toBeNull();
    expect(startPachisi(["A", "B", "C"])!.arms).toEqual([0, 1, 2]);
  });

  it("is kept as its table and moves, and read back exactly", () => {
    let game = startPachisi(["Ann", "Ben"], 9, [false, true])!;
    for (let step = 0; step < 40; step += 1) game = playPachisi(game, pachisiComputerMove(game))!;
    expect(decodePachisi(encodePachisi(game))).toEqual(game);
    expect(decodePachisi("nonsense")).toBeNull();
  });

  it("the computer plays only moves offered, and beats a player choosing at random", () => {
    let computerWins = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      let game = startPachisi(["", ""], seed, [true, false])!;
      let step = 0;
      while (game.phase !== "finished" && step < 5000) {
        const offered = pachisiMoves(game);
        const move = game.toPlay === 0 ? pachisiComputerMove(game) : offered[(step * 7919) % offered.length];
        expect(offered).toContainEqual(move);
        game = playPachisi(game, move)!;
        step += 1;
      }
      if (game.winners.includes(0)) computerWins += 1;
    }
    expect(computerWins).toBeGreaterThanOrEqual(14);
  });
});
