import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DIRECTIONS, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Cell, Stone } from "@/lib/gomoku/gomoku.types";

/**
 * TUNING THE COMPUTER'S JUDGEMENT FROM GAMES — Texel's method, asked for by name.
 *
 * `pnpm bots:eval-tune`, over the positions `pnpm bots:eval-games` wrote. The
 * line games' score counts, for each colour, the open windows of five points
 * holding one, two, three or four of its stones, and weights them 1, 4, 16, 64
 * and 256 — numbers chosen by hand, the same for the side about to move and the
 * side that has just moved. This finds the weights under which the score best
 * predicts how the games actually ended: the score is turned into an expected
 * result through a logistic curve, and the weights are moved one at a time for
 * as long as the average squared error over all positions keeps falling.
 *
 * The side to move and the side that is not get weights of their own, because
 * the same shape is not worth the same to both: an open three is a threat to
 * the side about to play it into four, and a thing to answer for the side
 * that has just let it stand.
 *
 * A fifth of the positions are held back and never tuned on. The weights are
 * worth keeping only if they predict those better too; improving on the tuned
 * four fifths alone would be fitting the sample, not learning the game.
 *
 * Knobs: `BOT_TUNE_IN` (required), a folder of the `.jsonl` files to read.
 */
const INPUT = process.env.BOT_TUNE_IN ?? "";
const SIZE = 15;
const LENGTH = 5;

type Position = { moves: string[]; result: number };
/** For one position: the side to move's windows by stones held (1–4), then the other side's. */
type Features = { mine: Float64Array; theirs: Float64Array; result: number };

function windowsByStones(board: Cell[], stone: Stone): Float64Array {
  const counts = new Float64Array(LENGTH);
  for (const step of DIRECTIONS) {
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const lastRow = row + step.row * (LENGTH - 1);
        const lastCol = col + step.col * (LENGTH - 1);
        if (lastRow < 0 || lastRow >= SIZE || lastCol < 0 || lastCol >= SIZE) continue;
        let own = 0;
        let open = true;
        for (let k = 0; k < LENGTH; k += 1) {
          const cell = board[(row + step.row * k) * SIZE + (col + step.col * k)];
          if (cell === stone) own += 1;
          else if (cell !== null) {
            open = false;
            break;
          }
        }
        if (open && own > 0 && own < LENGTH) counts[own] += 1;
      }
    }
  }
  return counts;
}

function featuresOf(position: Position): Features {
  const board: Cell[] = new Array(SIZE * SIZE).fill(null);
  position.moves.forEach((move, index) => {
    const [row, col] = move.split(",").map(Number);
    board[row * SIZE + col] = index % 2 === 0 ? STONES.black : STONES.white;
  });
  const toPlay = position.moves.length % 2 === 0 ? STONES.black : STONES.white;
  const other = toPlay === STONES.black ? STONES.white : STONES.black;
  return { mine: windowsByStones(board, toPlay), theirs: windowsByStones(board, other), result: position.result };
}

/** Weights: [unused, one, two, three, four] for the side to move, then the same for the other side. */
type Weights = { mine: number[]; theirs: number[] };

function score(features: Features, weights: Weights): number {
  let total = 0;
  for (let own = 1; own < LENGTH; own += 1) {
    total += weights.mine[own] * features.mine[own] - weights.theirs[own] * features.theirs[own];
  }
  return total;
}

function meanSquaredError(set: readonly Features[], weights: Weights, scale: number): number {
  let sum = 0;
  for (const features of set) {
    const expected = 1 / (1 + Math.exp(-score(features, weights) / scale));
    sum += (features.result - expected) ** 2;
  }
  return sum / set.length;
}

/** The logistic curve's width that fits the given weights best, by a coarse then a fine sweep. */
function bestScale(set: readonly Features[], weights: Weights): number {
  let best = 1;
  let bestError = Infinity;
  for (let scale = 10; scale <= 100_000; scale *= 1.25) {
    const error = meanSquaredError(set, weights, scale);
    if (error < bestError) {
      bestError = error;
      best = scale;
    }
  }
  for (let scale = best / 1.25; scale <= best * 1.25; scale *= 1.02) {
    const error = meanSquaredError(set, weights, scale);
    if (error < bestError) {
      bestError = error;
      best = scale;
    }
  }
  return best;
}

describe.skipIf(INPUT === "")("tuning the computer's judgement from games", () => {
  it("finds the window weights that predict the results best", () => {
    const positions: Position[] = [];
    for (const file of readdirSync(INPUT).filter((name) => name.endsWith(".jsonl"))) {
      for (const line of readFileSync(join(INPUT, file), "utf8").split("\n")) {
        if (line.trim() !== "") positions.push(JSON.parse(line) as Position);
      }
    }
    const all = positions.map(featuresOf);
    // Held back by position in the file, not at random, so a run is repeatable.
    const held = all.filter((_, index) => index % 5 === 0);
    const tuned = all.filter((_, index) => index % 5 !== 0);
    console.log(`${all.length} quiet positions: ${tuned.length} to tune on, ${held.length} held back`);

    const start: Weights = { mine: [0, 1, 4, 16, 64], theirs: [0, 1, 4, 16, 64] };
    const scale = bestScale(tuned, start);
    const before = { tuned: meanSquaredError(tuned, start, scale), held: meanSquaredError(held, start, scale) };
    console.log(`hand-set weights: scale ${scale.toFixed(1)}, error ${before.tuned.toFixed(5)} tuned / ${before.held.toFixed(5)} held back`);

    // One weight at a time, up or down by a factor, for as long as the tuned error falls.
    const weights: Weights = { mine: [...start.mine], theirs: [...start.theirs] };
    let error = before.tuned;
    for (let factor = 1.5; factor > 1.01; factor = Math.sqrt(factor)) {
      let improved = true;
      while (improved) {
        improved = false;
        for (const side of ["mine", "theirs"] as const) {
          for (let own = 1; own < LENGTH; own += 1) {
            for (const step of [factor, 1 / factor]) {
              const trial: Weights = { mine: [...weights.mine], theirs: [...weights.theirs] };
              trial[side][own] = weights[side][own] * step;
              const trialError = meanSquaredError(tuned, trial, scale);
              if (trialError < error) {
                error = trialError;
                weights[side][own] = trial[side][own];
                improved = true;
              }
            }
          }
        }
      }
    }
    const after = { tuned: error, held: meanSquaredError(held, weights, scale) };
    const unit = weights.mine[1];
    const shown = (list: number[]) => list.slice(1).map((value) => (value / unit).toFixed(2)).join(", ");
    console.log(`tuned weights, as multiples of a lone stone to move: to move [${shown(weights.mine)}], not to move [${shown(weights.theirs)}]`);
    console.log(`tuned error ${after.tuned.toFixed(5)} (was ${before.tuned.toFixed(5)}), held back ${after.held.toFixed(5)} (was ${before.held.toFixed(5)})`);
    expect(all.length).toBeGreaterThan(0);
  }, 24 * 3_600_000);
});
