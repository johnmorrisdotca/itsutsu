import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { BLOCKED, GAME_STATUS, HOT, RULE_VARIANTS, STONES } from "./gomoku.constants";
import { chooseTurn } from "./opponent";
import { BOT_TIERS } from "./opponent.constants";
import { applyTurn } from "./opponentTurns";
import { seededRandom } from "./rules/random";
import { ROCK_PLACEMENTS } from "./rules/rocks.constants";
import { landRocks, rockLayout } from "./rules/rocks";
import type { GameState } from "./gomoku.types";
import type { BotTier, SearchBudget } from "./opponent.types";
import type { RockRules } from "./rules/rocks.types";

/**
 * THE OBSTACLE PLAYTEST (board row an-obstacle-family-…). John, 2026-09-16:
 * "PLAYTEST FIRST, finalize over time" — make the rocks tunable, play every
 * combination with the computer players on this machine, and name only the
 * two or three that play well. This is the playing.
 *
 * Every game is two equal players, one grade on both seats, so what is
 * measured is the BOARD, not the players. For each combination it prints how
 * often each colour won, how many were drawn, and how long the games ran,
 * beside plain five in a row on the same rules. The four questions the row
 * asks read straight off that:
 *
 * - does it always end — the draws, and whether any game ran out the cap;
 * - can both colours win — black's share against white's;
 * - is it decided in the opening — the shortest game and the colour split;
 * - does it play differently from five in a row — every figure against the
 *   first line, which has no rocks at all.
 *
 * Writes nothing and reaches no database. Runs only when asked:
 *
 *   ROCKS_PLAYTEST=1 pnpm exec vitest run src/lib/gomoku/obstacles.playtest.test.ts --disable-console-intercept
 *
 * ROCKS_GAMES (20), ROCKS_TIER (dan) and ROCKS_NODES (3000 positions a move)
 * tune the run; counted positions rather than a clock, so a run on a busy
 * machine plays the same games as one on an idle one.
 */

const RUN = process.env.ROCKS_PLAYTEST === "1";
const GAMES = Number(process.env.ROCKS_GAMES ?? 20);
const TIER = (process.env.ROCKS_TIER ?? BOT_TIERS.dan) as BotTier;
const BUDGET: SearchBudget = { nodes: Number(process.env.ROCKS_NODES ?? 3000), millis: 600_000 };
const SIZE = 15;

/** Every combination worth a line: plain first, today's Obstacle Five second, then the grid. */
function combinations(): RockRules[] {
  const plain: RockRules = { rocks: 0, hot: 0, placement: ROCK_PLACEMENTS.scattered, arriveAfter: null };
  const today: RockRules = { rocks: 6, hot: 2, placement: ROCK_PLACEMENTS.scattered, arriveAfter: null };
  const grid: RockRules[] = [];
  for (const placement of [ROCK_PLACEMENTS.scattered, ROCK_PLACEMENTS.garden]) {
    for (const rocks of [4, 8, 12, 20]) {
      for (const hot of [0, 2]) {
        for (const arriveAfter of [null, 8]) grid.push({ rocks, hot, placement, arriveAfter });
      }
    }
  }
  return [plain, today, ...grid];
}

function label(rules: RockRules): string {
  const when = rules.arriveAfter === null ? "at start" : `after ${rules.arriveAfter}`;
  return `${rules.placement.padEnd(9)} rocks ${String(rules.rocks).padStart(2)} hot ${rules.hot} ${when.padEnd(8)}`;
}

/** Stones on the board: the length of a game in the only unit every game shares. */
function stonesDown(state: GameState): number {
  return state.board.filter((cell) => cell === STONES.black || cell === STONES.white).length;
}

type Outcome = { winner: "black" | "white" | "draw" | "unfinished"; stones: number };

/** One game on one layout, the same grade on both seats. */
function playOut(rules: RockRules, seed: number): Outcome {
  const random = seededRandom(seed);
  let state = createGame({ variant: RULE_VARIANTS.obstacleFive, size: SIZE }, random());
  // Take up the variant's own six-and-two and lay these rules' furniture instead.
  const layout = rockLayout(rules, SIZE, seed);
  expect(layout, label(rules)).not.toBeNull();
  const cleared = state.board.map((cell) => (cell === BLOCKED || cell === HOT ? null : cell));
  state = { ...state, board: rules.arriveAfter === null ? landRocks(cleared, SIZE, layout!) : cleared };
  let landed = rules.arriveAfter === null;

  const cap = SIZE * SIZE * 2;
  for (let turn = 0; turn < cap && state.status === GAME_STATUS.playing; turn += 1) {
    if (!landed && stonesDown(state) >= rules.arriveAfter!) {
      state = { ...state, board: landRocks(state.board, SIZE, layout!) };
      landed = true;
    }
    const chosen = chooseTurn(state, TIER, random, BUDGET);
    if (chosen === null) break;
    state = applyTurn(state, chosen);
  }
  const stones = stonesDown(state);
  if (state.status === GAME_STATUS.won) return { winner: state.winner === STONES.black ? "black" : "white", stones };
  if (state.status === GAME_STATUS.playing) return { winner: "unfinished", stones };
  return { winner: "draw", stones };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

describe.runIf(RUN)("the obstacle playtest", () => {
  it(
    "plays every combination and prints what each board did",
    () => {
      console.log(`obstacle playtest: ${SIZE}×${SIZE}, ${TIER} against ${TIER}, ${GAMES} games each, ${BUDGET.nodes} positions a move`);
      console.log("                                    black white drawn unfin  median shortest");
      for (const rules of combinations()) {
        const started = Date.now();
        const outcomes = Array.from({ length: GAMES }, (_, game) => playOut(rules, 7_000 + game * 37));
        const count = (winner: Outcome["winner"]) => outcomes.filter((outcome) => outcome.winner === winner).length;
        const lengths = outcomes.map((outcome) => outcome.stones);
        console.log(
          `${label(rules)}  ${String(count("black")).padStart(5)} ${String(count("white")).padStart(5)} ${String(count("draw")).padStart(5)} ${String(count("unfinished")).padStart(5)}  ${String(median(lengths)).padStart(6)} ${String(Math.min(...lengths)).padStart(8)}   (${Math.round((Date.now() - started) / 1000)}s)`,
        );
      }
    },
    24 * 60 * 60 * 1000,
  );
});
