import { describe, expect, it } from "vitest";

import { seededRandom } from "../../puzzles/random";
import { tileOf } from "./dominoes";
import { TRAIN_DEFAULT_OPTIONS } from "./mexicanTrain.constants";
import { TRAIN_PHASES, mayLay, playTrain, startTrain, trainMoves, trainTotals } from "./mexicanTrain";
import type { TrainGame, TrainOptions } from "./mexicanTrain.types";
import { computerMove, longestRun } from "./trainComputer";

/**
 * Mexican Train's computer player (`trainComputer`): it always makes a move
 * the rules take, it plans the longest run for its own train and keeps it,
 * it lays a double only with a cover in hand, and over many games it beats a
 * player choosing at random — a player that plays, not one that merely moves.
 */

function position(hands: number[][], options: TrainOptions = TRAIN_DEFAULT_OPTIONS): TrainGame {
  const game = startTrain(12, ["Ann", "Ben"], 1, options, [true, false])!;
  return { ...game, hands, boneyard: [], toPlay: 0, drew: false, passes: 0, uncovered: [], chaining: false };
}

describe("the computer at the Mexican Train table", () => {
  it("finds the longest run a hand can lay from an end", () => {
    const hand = [tileOf(12, 4), tileOf(4, 9), tileOf(9, 1), tileOf(12, 2), tileOf(7, 7)];
    expect(longestRun(hand, 12)).toEqual([tileOf(12, 4), tileOf(4, 9), tileOf(9, 1)]);
    expect(longestRun(hand, 5)).toEqual([]);
  });

  it("starts its own train with the first tile of that run, and keeps the rest of it off the Mexican Train", () => {
    const game = position([[tileOf(12, 4), tileOf(4, 9), tileOf(9, 1), tileOf(12, 2), tileOf(0, 3)], [tileOf(5, 5)]]);
    expect(computerMove(game)).toEqual({ kind: "play", tile: tileOf(12, 4), train: 0 });
    const laid = { ...game, trains: game.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 4], open: false } : train)), hands: [[tileOf(4, 9), tileOf(9, 1), tileOf(12, 2), tileOf(0, 3)], [tileOf(5, 5)]] };
    // The spare 12–2 goes on the Mexican Train rather than break the run at home.
    expect(computerMove(laid)).toEqual({ kind: "play", tile: tileOf(4, 9), train: 0 });
  });

  it("lays a double only when it holds the tile to cover it", () => {
    const covered = position([[tileOf(12, 12 - 0), tileOf(12, 5)], [tileOf(1, 1)]]);
    const home = { ...covered, trains: covered.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 6], open: false } : train)) };
    const withCover = { ...home, hands: [[tileOf(6, 6), tileOf(6, 3), tileOf(12, 11)], [tileOf(1, 1)]] };
    expect(computerMove(withCover)).toEqual({ kind: "play", tile: tileOf(6, 6), train: 0 });
    const without = { ...home, hands: [[tileOf(6, 6), tileOf(12, 11)], [tileOf(1, 1)]] };
    expect(computerMove(without)).toEqual({ kind: "play", tile: tileOf(12, 11), train: 2 });
  });

  it("always makes a move the rules take, whole games through, under every house rule", () => {
    for (const options of [TRAIN_DEFAULT_OPTIONS, { length: "short", doubles: "chain", mexican: "ownFirst" } as TrainOptions]) {
      let game = startTrain(9, ["", "", ""], 5, options, [true, true, true])!;
      let steps = 0;
      while (game.phase !== TRAIN_PHASES.finished && steps < 20_000) {
        const move = computerMove(game);
        if (move.kind === "play") expect(mayLay(game, move.tile, move.train)).toBe(true);
        const next = playTrain(game, move);
        expect(next).not.toBeNull();
        game = next!;
        steps += 1;
      }
      expect(game.phase).toBe(TRAIN_PHASES.finished);
      expect(game.winners.length).toBeGreaterThan(0);
    }
  });

  it("beats a player choosing at random, most games out of forty", () => {
    let won = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const random = seededRandom(seed);
      let game = startTrain(12, ["Computer", "Random"], seed, { ...TRAIN_DEFAULT_OPTIONS, length: "short" }, [true, false])!;
      while (game.phase !== TRAIN_PHASES.finished) {
        const offered = trainMoves(game);
        const move = game.toPlay === 0 ? computerMove(game) : offered[Math.floor(random() * offered.length)];
        game = playTrain(game, move)!;
      }
      const [mine, theirs] = trainTotals(game);
      if (mine < theirs) won += 1;
    }
    expect(won).toBeGreaterThanOrEqual(26);
  });
});
