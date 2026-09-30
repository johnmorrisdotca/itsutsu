import { describe, expect, it } from "vitest";

import { YACHT_BOXES } from "./yacht.constants";
import { YACHT_PHASES, playYacht, startYacht, yachtMoves } from "./yacht";
import { yachtComputerMove } from "./yachtComputer";
import { sheetTotal } from "./yachtScore";
import type { YachtGame } from "./yacht.types";

/** A game with these dice lying after a first roll, for the computer to judge. */
function lying(dice: number[], rolls = 1): YachtGame {
  return { ...startYacht(["", ""], 1, [true, true])!, dice, rolls, held: 0 };
}

describe("yacht: the computer player", () => {
  it("always makes a move the rules offer, and plays a game to the end", () => {
    let game = startYacht(["", "", ""], 99, [true, true, true])!;
    let moves = 0;
    while (game.phase === YACHT_PHASES.playing) {
      const move = yachtComputerMove(game);
      expect(yachtMoves(game)).toContainEqual(move);
      game = playYacht(game, move)!;
      moves += 1;
    }
    expect(moves).toBeLessThanOrEqual(3 * 13 * 4);
  });

  it("writes down a Yacht when it rolls one", () => {
    expect(yachtComputerMove(lying([6, 6, 6, 6, 6]))).toEqual({ kind: "score", box: YACHT_BOXES.indexOf("yacht") });
  });

  it("writes down a large straight when it rolls one", () => {
    expect(yachtComputerMove(lying([2, 3, 4, 5, 6]))).toEqual({ kind: "score", box: YACHT_BOXES.indexOf("largeStraight") });
  });

  it("holds four of a kind and rolls the odd die", () => {
    expect(yachtComputerMove(lying([5, 5, 2, 5, 5]))).toEqual({ kind: "roll", hold: 0b11011 });
  });

  it("scores far better than a player writing the first open box", () => {
    let computer = 0;
    let naive = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      let game = startYacht(["", ""], seed, [true, false])!;
      while (game.phase === YACHT_PHASES.playing) {
        const move =
          game.toPlay === 0 ? yachtComputerMove(game) : game.rolls === 0 ? ({ kind: "roll", hold: 0 } as const) : { kind: "score" as const, box: game.sheets[1].findIndex((one) => one === null) };
        game = playYacht(game, move)!;
      }
      computer += sheetTotal(game.sheets[0]);
      naive += sheetTotal(game.sheets[1]);
    }
    expect(computer / 12).toBeGreaterThan(150);
    expect(computer).toBeGreaterThan(naive * 1.5);
  });
});
