/**
 * How long real Chinese Checkers games go without progress — measured, so the
 * no-progress cap is a number read off games rather than imagined.
 *
 * REPORT ONLY, AND IN MEMORY. Nothing here touches a database, a server or the
 * site: every game is `createGame` and `chooseTurn` in this process, the same
 * code a live seat runs, and nothing is kept once the report is printed. It
 * changes no cap either — `NO_PROGRESS_RULES` is lifted for Chinese Checkers
 * while the games play and put back afterwards, because a measurement taken
 * with the rule in force would be measuring its own threshold.
 *
 * WHAT IT PRINTS. For every game: who played, how it ended, how many pieces
 * each side had home, the longest window over which the racing rule would have
 * fired, and the ply the cap in force would have called it off at. Then the
 * distribution of those longest stalls over the games that were WON, what each
 * candidate cap would have done to them and to the ones that never finished,
 * and a recommendation read off the won games with the margin the other race
 * games carry (see `stallMeasure.constants.ts`).
 *
 *   CC_STALL=1 pnpm exec vitest run src/lib/bots/chineseCheckersStall.play.test.ts --disable-console-intercept
 *
 *   CC_STALL_TIERS=kyu,dan,meijin     who plays; default the five grades
 *   CC_STALL_EACH=2                   games per ordered pairing (both seats are already covered)
 *   CC_STALL_SEED=20260914            first seed; each game takes the next
 *   CC_STALL_CEILING=3000             plies before a game is filed as unfinished
 *   CC_STALL_NODES=900                a counted search budget, so a rerun plays the same games;
 *                                     without it the search gets the live clock (BOT_MOVE_MILLIS)
 *   CC_STALL_LIMIT=10                 play only the first N games of the plan
 *
 * It is a vitest file for the `@/` paths, and does nothing unless CC_STALL=1.
 */
import { describe, expect, it } from "vitest";

import { BOT_MOVE_MILLIS } from "@/lib/bots/bots.constants";
import { createGame } from "@/lib/gomoku/engine";
import { GAME_STATUS, RULE_VARIANTS, STONES, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { BOT_ALL_TIERS, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { applyTurn } from "@/lib/gomoku/opponentTurns";
import { STAR_RADIUS, starPiecesHome } from "@/lib/gomoku/rules/chineseCheckers";
import { NO_PROGRESS_RULES } from "@/lib/gomoku/rules/noProgress";
import { seededRandom } from "@/lib/gomoku/rules/random";
import type { Cell, GameState } from "@/lib/gomoku/gomoku.types";
import type { BotTier, SearchBudget } from "@/lib/gomoku/opponent.types";

import { firstFiring, longestStall, nearestRank, raceLedger, recommendCap } from "./stallMeasure";
import {
  STALL_CANDIDATE_CAPS,
  STALL_DEFAULT_CEILING,
  STALL_DEFAULT_EACH,
  STALL_DEFAULT_SEED,
  STALL_MARGIN,
} from "./stallMeasure.constants";
import type { PlayedRace } from "./stallMeasure.types";

const ASKED = process.env.CC_STALL === "1";
const VARIANT = RULE_VARIANTS.chineseCheckers;

/** A whole number from the environment, or the default; anything else is refused rather than guessed at. */
function whole(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name}=${raw} is not a whole number above zero`);
  return value;
}

function tiersAsked(): BotTier[] {
  const raw = process.env.CC_STALL_TIERS;
  if (raw === undefined || raw.trim() === "") return [...BOT_TIER_LIST];
  const named = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const unknown = named.filter((name) => !(BOT_ALL_TIERS as readonly string[]).includes(name));
  if (unknown.length > 0) throw new Error(`CC_STALL_TIERS names no such player: ${unknown.join(", ")}`);
  return named as BotTier[];
}

/** Plays one game to a finish, to nothing left to play, or to the ceiling. */
function playRace(black: BotTier, white: BotTier, seed: number, ceiling: number, budget: SearchBudget, caps: number[]): PlayedRace {
  const started = Date.now();
  const random = seededRandom(seed);
  const size = boardSizesFor(VARIANT)[0];
  let state: GameState = createGame({ variant: VARIANT, size }, random());
  let stuck = false;

  for (let turns = 0; state.status === GAME_STATUS.playing && state.moves.length < ceiling; turns += 1) {
    if (turns > ceiling * 2) throw new Error(`${black} v ${white}, seed ${seed}: turns are being taken without moves being made`);
    const tier = state.toPlay === STONES.black ? black : white;
    const turn = chooseTurn(state, tier, random, budget);
    if (turn === null) {
      stuck = true;
      break;
    }
    const next = applyTurn(state, turn);
    if (next === state) throw new Error(`${black} v ${white}, seed ${seed}: the engine refused a turn the chooser offered`);
    state = next;
  }

  // With the rule lifted and no agreed length, nothing can draw a game. A draw here means the lift did not take.
  if (state.status === GAME_STATUS.draw) throw new Error(`${black} v ${white}, seed ${seed}: drawn with the rule lifted — the measurement is not measuring`);

  const ledger = raceLedger(state);
  if (ledger === null) throw new Error("the rule cannot read the star's camps, so no number here would mean anything");

  const board = state.board as Cell[];
  return {
    black,
    white,
    seed,
    outcome: state.status === GAME_STATUS.won ? "won" : stuck ? "stuck" : "unfinished",
    winner: state.status === GAME_STATUS.won ? state.winner : null,
    plies: state.moves.length,
    home: {
      black: starPiecesHome(board, size, STAR_RADIUS, STONES.black),
      white: starPiecesHome(board, size, STAR_RADIUS, STONES.white),
    },
    longest: longestStall(ledger),
    firing: Object.fromEntries(caps.map((cap) => [cap, firstFiring(ledger, cap)])),
    millis: Date.now() - started,
  };
}

const pad = (text: string | number, width: number) => String(text).padEnd(width);
const lead = (text: string | number, width: number) => String(text).padStart(width);

function describeRace(race: PlayedRace, at: number, of: number, currentCap: number): string {
  const ending =
    race.outcome === "won" ? `won by ${race.winner} in ${race.plies}` : race.outcome === "stuck" ? `stuck at ${race.plies}` : `UNFINISHED at ${race.plies}`;
  const stall = race.longest === null ? "none" : `${race.longest.plies} (to ply ${race.longest.endsAt})`;
  const cap = race.firing[currentCap];
  return (
    `  ${lead(at, String(of).length)}/${of}  ${pad(`${race.black} v ${race.white}`, 20)} seed ${race.seed}  ` +
    `${pad(ending, 20)} home ${race.home.black}-${race.home.white}  longest stall ${pad(stall, 20)} ` +
    `cap ${currentCap}: ${cap === null ? "never" : `ply ${cap}`}  ${(race.millis / 1000).toFixed(1)}s`
  );
}

const BUCKETS: [number, number][] = [
  [0, 0],
  [1, 9],
  [10, 19],
  [20, 49],
  [50, 99],
  [100, 199],
  [200, 399],
  [400, Infinity],
];

function report(races: PlayedRace[], currentCap: number, caps: number[]): void {
  const won = races.filter((race) => race.outcome === "won");
  const unfinished = races.filter((race) => race.outcome !== "won");
  const stalls = won.map((race) => race.longest?.plies ?? 0).sort((a, b) => a - b);
  const lengths = won.map((race) => race.plies).sort((a, b) => a - b);

  console.log(`\nGames: ${races.length}   won ${won.length}   not finished ${unfinished.length}`);
  if (won.length > 0) {
    console.log(`Plies in won games: min ${lengths[0]}, median ${nearestRank(lengths, 0.5)}, max ${lengths[lengths.length - 1]}`);
    console.log(
      `Longest stall in won games (plies): min ${stalls[0]}, median ${nearestRank(stalls, 0.5)}, ` +
        `p90 ${nearestRank(stalls, 0.9)}, p95 ${nearestRank(stalls, 0.95)}, max ${stalls[stalls.length - 1]}`,
    );
    console.log("\n  longest stall   won games");
    for (const [low, high] of BUCKETS) {
      const count = stalls.filter((stall) => stall >= low && stall <= high).length;
      const label = high === Infinity ? `${low}+` : low === high ? `${low}` : `${low}-${high}`;
      console.log(`  ${pad(label, 15)} ${lead(count, 9)}  ${"#".repeat(count)}`);
    }
  }

  console.log("\n  cap    won games it calls off   unfinished games it ends (median ply)");
  for (const cap of caps) {
    const cut = won.filter((race) => race.firing[cap] !== null).length;
    const ends = unfinished.map((race) => race.firing[cap]).filter((ply): ply is number => ply !== null).sort((a, b) => a - b);
    const marker = cap === currentCap ? "  <- in force" : "";
    console.log(
      `  ${pad(cap, 6)} ${lead(cut, 24)}   ${lead(ends.length, 10)} of ${unfinished.length}` +
        `${ends.length > 0 ? ` (${nearestRank(ends, 0.5)})` : ""}${marker}`,
    );
  }

  if (unfinished.length > 0) {
    console.log("\nGames that did not finish:");
    for (const race of unfinished) {
      const cap = race.firing[currentCap];
      console.log(
        `  ${race.black} v ${race.white}, seed ${race.seed}: ${race.outcome} after ${race.plies} plies, home ` +
          `${race.home.black}-${race.home.white}; the cap of ${currentCap} ${cap === null ? "would never have ended it" : `ends it at ply ${cap}`}`,
      );
    }
  }

  const pairings = new Map<string, PlayedRace[]>();
  for (const race of races) pairings.set(`${race.black} v ${race.white}`, [...(pairings.get(`${race.black} v ${race.white}`) ?? []), race]);
  console.log("\n  pairing              games  won  longest stall (max)");
  for (const [name, games] of pairings) {
    const most = Math.max(0, ...games.map((race) => race.longest?.plies ?? 0));
    console.log(`  ${pad(name, 20)} ${lead(games.length, 5)} ${lead(games.filter((race) => race.outcome === "won").length, 4)}  ${lead(most, 19)}`);
  }

  const said = recommendCap(
    currentCap,
    won.map((race) => ({ longest: race.longest?.plies ?? 0, endedByCurrentCap: race.firing[currentCap] !== null })),
    STALL_MARGIN,
  );
  console.log(`\nRecommendation: ${said.verdict.toUpperCase()}${said.suggested === null ? "" : ` (${said.suggested})`}`);
  console.log(`  ${said.why}`);
  console.log("  Report only: this runner changes no cap. The number lives in rules/noProgress.ts.\n");
}

describe("Chinese Checkers, measured for the no-progress cap", () => {
  it.skipIf(!ASKED)(
    "plays bot games with the rule lifted and prints how long they went without progress",
    () => {
      const inForce = NO_PROGRESS_RULES[VARIANT];
      if (inForce === undefined) throw new Error("Chinese Checkers has no no-progress rule to measure");
      const currentCap = inForce.plies;
      const caps = [...new Set([...STALL_CANDIDATE_CAPS, currentCap])].sort((a, b) => a - b);

      const tiers = tiersAsked();
      const each = whole("CC_STALL_EACH", STALL_DEFAULT_EACH);
      const seed = whole("CC_STALL_SEED", STALL_DEFAULT_SEED);
      const ceiling = whole("CC_STALL_CEILING", STALL_DEFAULT_CEILING);
      const nodes = process.env.CC_STALL_NODES ? whole("CC_STALL_NODES", 1) : null;
      const budget: SearchBudget = nodes === null ? { millis: BOT_MOVE_MILLIS } : { nodes, millis: 60_000 };

      const plan: { black: BotTier; white: BotTier; seed: number }[] = [];
      for (const black of tiers) {
        for (const white of tiers) {
          for (let game = 0; game < each; game += 1) plan.push({ black, white, seed: seed + plan.length });
        }
      }
      const limit = process.env.CC_STALL_LIMIT ? whole("CC_STALL_LIMIT", plan.length) : plan.length;
      const playing = plan.slice(0, limit);

      console.log(
        `\nChinese Checkers, ${playing.length} game(s): ${tiers.join(", ")}; ${each} per ordered pairing; seeds from ${seed}; ` +
          `ceiling ${ceiling} plies; search ${nodes === null ? `${BOT_MOVE_MILLIS}ms a move, as live` : `${nodes} nodes a move, repeatable`}.`,
      );
      console.log(`The cap in force is ${currentCap} plies (${inForce.measure}); lifted while these play.\n`);

      const races: PlayedRace[] = [];
      NO_PROGRESS_RULES[VARIANT] = { ...inForce, plies: Number.MAX_SAFE_INTEGER };
      try {
        playing.forEach((match, index) => {
          const race = playRace(match.black, match.white, match.seed, ceiling, budget, caps);
          races.push(race);
          console.log(describeRace(race, index + 1, playing.length, currentCap));
        });
      } finally {
        NO_PROGRESS_RULES[VARIANT] = inForce;
      }

      report(races, currentCap, caps);
      expect(NO_PROGRESS_RULES[VARIANT]?.plies).toBe(currentCap);
    },
    24 * 60 * 60 * 1000,
  );
});
