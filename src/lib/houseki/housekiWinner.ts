import * as chains from "@johnmorrisdotca/houseki/colour-chains";
import * as triplets from "@johnmorrisdotca/houseki/falling-triplets";
import * as swap from "@johnmorrisdotca/houseki/gem-swap";
import * as blocks from "@johnmorrisdotca/houseki/magnetic-blocks";
import * as stones from "@johnmorrisdotca/houseki/stone-collapse";

import type { HousekiCampaign, HousekiKind } from "./houseki.types";

/**
 * A LEVEL WON BY ITS RECORDED PLAN, as the text the server is handed: the package
 * keeps, with every level, a winning play its own tests replay (`witness`), and
 * this plays it through the engine and answers the finished game's save. Used by
 * the tests that hold the server's check to the real thing (`housekiVerify.test.ts`,
 * `houseki.coverage.test.ts`); nothing on the site calls it, so no page's function
 * carries it. `finishedDaily` plays a Daily of a day to its end, for the games that have one.
 */
export function winnerOf(kind: HousekiKind, campaign: HousekiCampaign, number: number): string {
  if (kind === "fallingTriplets") {
    const level = triplets.levelManifest[number - 1]!;
    let state = triplets.createLevel(level.id);
    for (const step of level.witness) {
      const from = state.active!.x;
      const lateral = step.x < from ? "left" : "right";
      for (let at = 0; at < Math.abs(step.x - from); at += 1) state = triplets.applyAction(state, { kind: lateral }).state;
      for (let at = 0; at < step.orientation; at += 1) state = triplets.applyAction(state, { kind: "cycle-forward" }).state;
      state = triplets.advanceTicks(triplets.applyAction(state, { kind: "hard-drop" }).state, 240).state;
    }
    return triplets.encodeGame(state);
  }
  if (kind === "colourChains") {
    const level = { classic: chains.levelManifest, shizen: chains.shizenLevelManifest, arashi: chains.arashiLevelManifest }[campaign][number - 1]!;
    let state = campaign === "shizen" ? chains.createShizenLevel(level.id) : campaign === "arashi" ? chains.createArashiLevel(level.id) : chains.createLevel(level.id);
    const turns = { up: 0, right: 1, down: 2, left: 3 } as const;
    for (const step of level.witness) {
      const from = state.active!.pivot.x;
      const lateral = step.pivotX < from ? "left" : "right";
      for (let at = 0; at < Math.abs(step.pivotX - from); at += 1) state = chains.applyAction(state, { kind: lateral }).state;
      for (let at = 0; at < turns[step.orientation]; at += 1) state = chains.applyAction(state, { kind: "rotate-clockwise" }).state;
      state = chains.advanceTicks(chains.applyAction(state, { kind: "hard-drop" }).state, 240).state;
    }
    return chains.encodeGame(state);
  }
  if (kind === "stoneCollapse") {
    const level = stones.levelManifest[number - 1]!;
    let state = stones.createLevel(level.id);
    for (const ids of level.witness) {
      state = stones.applyAction(state, { kind: "select", stoneId: ids[0]! }).state;
      state = stones.advanceTicks(stones.applyAction(state, { kind: "confirm" }).state, 240).state;
    }
    return stones.encodeGame(state);
  }
  if (kind === "gemSwap") {
    const level = swap.GEM_SWAP_CAMPAIGN[number - 1]!;
    let state = swap.createGame(level.options);
    for (const operation of level.witness) {
      state = operation.kind === "action" ? swap.applyAction(state, operation.action).state : operation.kind === "ticks" ? swap.advanceTicks(state, operation.count).state : swap.advanceTime(state, operation.milliseconds).state;
    }
    return swap.encodeGame(state);
  }
  const level = blocks.levelManifest[number - 1]!;
  let state = blocks.createLevel(level.id);
  for (const action of level.witness) {
    state = blocks.applyAction(state, action).state;
    if (action.kind === "land" || action.kind === "hard-drop") state = blocks.advanceTicks(state, 400).state;
  }
  return blocks.encodeGame(state);
}

/** The tallest a column stands in a falling game's board, for choosing where to drop. */
function tallest(board: readonly unknown[], width: number, height: number, hidden: number): number {
  let most = 0;
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height + hidden; y += 1) {
      if (board[y * width + x] !== null && board[y * width + x] !== undefined) {
        most = Math.max(most, height + hidden - y);
        break;
      }
    }
  }
  return most;
}

/**
 * A DAILY OF A DAY, PLAYED TO ITS END, by looking one piece ahead: every place and way up a piece may be
 * put down is tried in the engine, and the one that scores most and stands lowest is kept. Enough to
 * reach the end of a game of sixty pieces, which dropping every piece where it comes in does not.
 */
export function finishedDaily(kind: "fallingTriplets" | "colourChains" | "stoneCollapse" | "gemSwap", day: string): string {
  if (kind === "stoneCollapse") {
    let state = stones.createGame({ mode: "daily", dailyDate: day });
    for (let step = 0; step < 4000 && !["finished", "won", "lost"].includes(state.phase); step += 1) {
      if (state.phase !== "ready") {
        state = stones.advanceTicks(state, 30).state;
        continue;
      }
      const pick = stones.legalActions(state).find((action) => action.kind === "select");
      if (pick === undefined) break;
      state = stones.applyAction(stones.applyAction(state, pick).state, { kind: "confirm" }).state;
    }
    return stones.encodeGame(state);
  }
  if (kind === "gemSwap") {
    let state = swap.createGame({ mode: "daily", dailyDate: day });
    for (let step = 0; step < 4000 && state.outcome === null; step += 1) {
      if (state.phase !== "ready") {
        state = swap.advanceTicks(state, 30).state;
        continue;
      }
      const legal = swap.legalActions(state);
      const move = legal.find((action) => action.kind === "swap") ?? legal.find((action) => action.kind === "reshuffle");
      if (move === undefined) break;
      state = swap.applyAction(state, move).state;
    }
    return swap.encodeGame(state);
  }
  const falling = kind === "fallingTriplets";
  let state = falling ? triplets.createGame({ mode: "daily", seed: day }) : chains.createGame({ mode: "daily", dailyDate: day });
  const engine = falling ? triplets : chains;
  for (let step = 0; step < 4000 && !["finished", "won", "lost"].includes(state.phase); step += 1) {
    const active = state.active;
    if (state.phase !== "falling" || active === null) {
      state = engine.advanceTicks(state as never, 30).state as typeof state;
      continue;
    }
    const { width, height } = state.settings;
    const turns = falling ? 3 : 4;
    let best = state;
    let bestValue = -Infinity;
    for (let turn = 0; turn < turns; turn += 1) {
      let base = state;
      for (let at = 0; at < turn; at += 1) base = engine.applyAction(base as never, { kind: falling ? "cycle-forward" : "rotate-clockwise" } as never).state as typeof state;
      for (let x = 0; x < width; x += 1) {
        let trial = base;
        const from = "x" in base.active! ? (base.active as { x: number }).x : (base.active as { pivot: { x: number } }).pivot.x;
        for (let at = 0; at < Math.abs(x - from); at += 1) trial = engine.applyAction(trial as never, { kind: x < from ? "left" : "right" } as never).state as typeof state;
        const dropped = engine.advanceTicks(engine.applyAction(trial as never, { kind: "hard-drop" } as never).state as never, 300).state as typeof state;
        const value = (dropped.score - state.score) * 2 - tallest(dropped.board, width, height, 3) * 10 - (dropped.phase === "lost" ? 1e6 : 0);
        if (value > bestValue) {
          bestValue = value;
          best = dropped;
        }
      }
    }
    state = best;
  }
  return falling ? triplets.encodeGame(state as triplets.GameState) : chains.encodeGame(state as chains.GameState);
}
