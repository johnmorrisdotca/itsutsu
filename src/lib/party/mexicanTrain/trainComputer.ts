// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { endsOf, fits, isDouble, pipsOf } from "./dominoes";
import { mexicanOf, openEnd, trainMoves } from "./mexicanTrain";
import type { Domino, TrainGame, TrainMove } from "./mexicanTrain.types";

/**
 * A COMPUTER AT THE TABLE: the move a computer player makes, worked out in
 * the browser from the game alone, the same move every time for the same
 * game. It sees only what its seat may see — its own hand and the table —
 * and never the boneyard's order or another hand.
 *
 * How it plays, the way a sensible player at a real table does:
 *
 *  - It PLANS ITS OWN TRAIN. From its train's open end it finds the longest
 *    run its hand can lay there (`longestRun`), and keeps those tiles for its
 *    own train, laying them one a turn, first to last.
 *  - Everything not in that run it would rather lay somewhere else — the
 *    Mexican Train, or a train left open — and the heavier the better, since
 *    a tile laid is pips that cannot count against it.
 *  - Its own marker out is a train anybody can block, so it lays at home
 *    first when it can, and takes the marker in.
 *  - A DOUBLE it lays only when it holds a tile to cover it with, so the
 *    double is a free second tile rather than a turn spent drawing; when it
 *    must cover somebody else's, it covers with a tile its run can spare.
 *  - Going out wins the round, so a last tile is always laid.
 */

/** How many runs the planner looks at before settling for the longest found: enough for any hand, bounded for a huge one. */
const PLAN_STEPS = 4000;

/**
 * The longest run of tiles from `hand` that can be laid one after another
 * against `end`, in the order they would be laid. A depth-first search over
 * the hand, bounded by `PLAN_STEPS`, preferring the heavier run of two the
 * same length: pips laid are pips that do not count.
 */
export function longestRun(hand: readonly Domino[], end: number): Domino[] {
  let best: Domino[] = [];
  let bestPips = -1;
  let steps = 0;
  const used = new Set<Domino>();
  const run: Domino[] = [];
  const walk = (at: number, pips: number) => {
    steps += 1;
    if (run.length > best.length || (run.length === best.length && pips > bestPips)) {
      best = [...run];
      bestPips = pips;
    }
    if (steps > PLAN_STEPS) return;
    for (const tile of hand) {
      if (used.has(tile) || !fits(tile, at)) continue;
      const [low, high] = endsOf(tile);
      used.add(tile);
      run.push(tile);
      walk(low === at ? high : low, pips + pipsOf(tile));
      run.pop();
      used.delete(tile);
    }
  };
  walk(end, 0);
  return best;
}

/** How good a lay looks to the computer: higher is better. */
function scoreOf(game: TrainGame, move: Extract<TrainMove, { kind: "play" }>, plan: readonly Domino[]): number {
  const seat = game.toPlay;
  const hand = game.hands[seat];
  const { tile, train } = move;
  if (hand.length === 1) return 10_000;
  const own = train === seat;
  const planned = plan.indexOf(tile);
  let score = pipsOf(tile);
  if (own) {
    if (planned === 0) score += 40;
    else if (planned > 0) score -= 25;
    else score += 5;
    if (game.trains[seat].open) score += 30;
  } else {
    score += planned >= 0 ? -30 : 12;
    if (train === mexicanOf(game)) score += 2;
  }
  if (isDouble(tile)) {
    const [value] = endsOf(tile);
    const cover = hand.some((other) => other !== tile && fits(other, value));
    score += cover ? 25 : -20;
  }
  return score;
}

/** The move the computer in the seat to move makes now: the best-scored lay, or the draw, pass or next round it must take. */
export function computerMove(game: TrainGame): TrainMove {
  const offered = trainMoves(game);
  if (offered.length === 0) throw new Error("no move to make: the game is over");
  const plays = offered.filter((move): move is Extract<TrainMove, { kind: "play" }> => move.kind === "play");
  if (plays.length === 0) return offered[0];
  const seat = game.toPlay;
  const plan = longestRun(game.hands[seat], openEnd(game, seat));
  let best = plays[0];
  let bestScore = -Infinity;
  for (const move of plays) {
    const score = scoreOf(game, move, plan);
    if (score > bestScore || (score === bestScore && (move.tile > best.tile || (move.tile === best.tile && move.train < best.train)))) {
      best = move;
      bestScore = score;
    }
  }
  return best;
}
