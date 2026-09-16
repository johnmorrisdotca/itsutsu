import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";

import { BOT_MOVE_MILLIS } from "@/lib/bots/bots.constants";
import { BOT_ALL_TIERS, BOT_TIER_LIST, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import { boardSizesFor, GAME_STATUS, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { createGame } from "@/lib/gomoku/engine";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { applyTurn, legalTurns, sameTurn } from "@/lib/gomoku/opponentTurns";
import { playsAsExpert } from "@/lib/gomoku/expert/experts";
import type { BotTier, SearchBudget } from "@/lib/gomoku/opponent.types";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * WHAT EACH GRADE ACTUALLY DOES, GAME BY GAME.
 *
 * The ladder is one set of knobs — depth, width, guard, blunder, noise — laid
 * over forty-four games that share an engine and nothing else. Nothing has
 * ever checked that those knobs still MEAN anything once the game changes.
 * They plainly do at five-in-a-row, which they were tuned on. Whether Razryad
 * and 国手 pick different moves at Halma, or at Hex, or on a 12×12 draughts
 * board, is not recorded anywhere, and a grade that plays the same move as
 * every other grade is a label rather than a difficulty.
 *
 * So this measures the one thing that decides whether the rest of the bot work
 * is worth funding: **the spread**, the average number of DISTINCT moves the
 * five grades produce between them from the same position. A spread of 1.00 is
 * five names for one player. Five is a ladder in which every rung differs.
 *
 * It writes nothing, anywhere. It plays no rated game, creates no row and
 * touches no database — every position is built in memory by `createGame` and
 * `applyTurn`, which is why this can run on two machines at once while
 * `bots:play` cannot.
 *
 *   pnpm bots:grades                              every game, every grade
 *   BOT_GRADES_GAMES=go,hex,halma pnpm bots:grades       only these
 *   BOT_GRADES_SHARD=1/2 pnpm bots:grades                the first half of the games
 *   BOT_GRADES_POSITIONS=16 pnpm bots:grades             positions sampled per game
 *   BOT_GRADES_OUT=/tmp/a.json pnpm bots:grades          also write the numbers as JSON
 *   BOT_GRADES_MILLIS=1 pnpm bots:grades                 budget by the clock, as live
 *
 * **The budget is in NODES by default, not milliseconds, and that is the whole
 * reason two machines can be compared.** A wall-clock budget buys more search
 * on a faster machine, so the same grade at the same position is a different
 * player on the laptop than on the Studio — and a shard from each would not be
 * one measurement. Nodes are the same everywhere. `BOT_GRADES_MILLIS=1` asks
 * for the live budget instead, which answers a different question: what the
 * grade manages inside the 250 ms a real request allows it.
 */
const ASKED = process.env.BOT_GRADES === "1";

/** A whole-number option, or its default. A value given and unreadable stops the run rather than being guessed at. */
function whole(name: string, fallback: number, least: number): number {
  const text = process.env[name];
  if (text === undefined || text.trim() === "") return fallback;
  const value = Number(text.trim());
  if (!Number.isInteger(value) || value < least) {
    throw new Error(`${name} must be a whole number of at least ${least}, not "${text}".`);
  }
  return value;
}

const POSITIONS = whole("BOT_GRADES_POSITIONS", 10, 1);
const NODES = whole("BOT_GRADES_NODES", 6_000, 100);
const STRIDE = whole("BOT_GRADES_STRIDE", 3, 1);
const byClock = process.env.BOT_GRADES_MILLIS === "1";
const BUDGET: SearchBudget = byClock ? { millis: BOT_MOVE_MILLIS } : { nodes: NODES, millis: 60_000 };

/** The five rungs a player meets. The specialists are a different question and are left out. */
const GRADES: readonly BotTier[] = BOT_TIER_LIST;

/**
 * The games to measure, in a stable order so a shard means the same thing on
 * both machines. `BOT_GRADES_SHARD=1/2` takes the first half, `2/2` the second.
 */
function gamesInScope(): RuleVariant[] {
  const named = (process.env.BOT_GRADES_GAMES ?? "").trim();
  const all = Object.values(RULE_VARIANTS).slice().sort();
  let chosen = all;
  if (named !== "") {
    const want = named.split(",").map((one) => one.trim()).filter(Boolean);
    const unknown = want.filter((one) => !all.includes(one as RuleVariant));
    if (unknown.length > 0) throw new Error(`BOT_GRADES_GAMES names no such game: ${unknown.join(", ")}`);
    chosen = want as RuleVariant[];
  }
  const shard = (process.env.BOT_GRADES_SHARD ?? "").trim();
  if (shard === "") return chosen;
  const [partText, ofText] = shard.split("/");
  const part = Number(partText);
  const of = Number(ofText);
  if (!Number.isInteger(part) || !Number.isInteger(of) || of < 1 || part < 1 || part > of) {
    throw new Error(`BOT_GRADES_SHARD must read like "1/2", not "${shard}".`);
  }
  return chosen.filter((_, at) => at % of === part - 1);
}

/** A seeded generator, so a run is the same run twice and the same run on both machines. */
function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

type GradeReading = {
  tier: BotTier;
  /** Positions where this grade was asked and answered. */
  asked: number;
  /** How often it chose what the top grade chose. */
  withTop: number;
  msTotal: number;
  msMax: number;
};

type GameReading = {
  variant: RuleVariant;
  size: number;
  /** Positions that offered a real choice — one legal turn is not a decision. */
  positions: number;
  /** Mean distinct moves across the grades, per position. 1.00 means the ladder is flat here. */
  spread: number;
  /** Positions where every grade played the same move. */
  unanimous: number;
  grades: GradeReading[];
  /** How many of the five grades run a search at all here. */
  searchers: number;
  /** Whether a studied specialist already covers this game. */
  expert: boolean;
};

/**
 * Walk a game, stopping every few moves to hand the position to every grade.
 *
 * The walk itself is played by the gentlest grade, so the positions are ones a
 * real game reaches rather than noise — a position no player would ever stand
 * in tells us nothing about what a grade does in a game.
 */
function readGame(variant: RuleVariant, size: number, seed: number): GameReading {
  const random = seeded(seed);
  let state: GameState = createGame({ variant, size }, random());
  const grades = new Map<BotTier, GradeReading>(
    GRADES.map((tier) => [tier, { tier, asked: 0, withTop: 0, msTotal: 0, msMax: 0 }]),
  );
  const top = GRADES[GRADES.length - 1]!;

  let positions = 0;
  let distinctTotal = 0;
  let unanimous = 0;
  let moved = 0;

  while (positions < POSITIONS && state.status === GAME_STATUS.playing) {
    const choices = legalTurns(state, 200);
    if (choices.length === 0) break;

    if (moved % STRIDE === 0 && choices.length > 1) {
      const picked: { tier: BotTier; turn: ReturnType<typeof chooseTurn> }[] = [];
      for (const tier of GRADES) {
        // Every grade is asked with the SAME seed, so a difference between two
        // of them is the grade and never the dice.
        const started = performance.now();
        const turn = chooseTurn(state, tier, seeded(seed + positions), BUDGET);
        const spent = performance.now() - started;
        const reading = grades.get(tier)!;
        if (turn !== null) {
          reading.asked += 1;
          reading.msTotal += spent;
          reading.msMax = Math.max(reading.msMax, spent);
        }
        picked.push({ tier, turn });
      }

      const topTurn = picked.find((one) => one.tier === top)?.turn ?? null;
      const distinct: NonNullable<ReturnType<typeof chooseTurn>>[] = [];
      for (const { tier, turn } of picked) {
        if (turn === null) continue;
        if (topTurn !== null && sameTurn(turn, topTurn)) grades.get(tier)!.withTop += 1;
        if (!distinct.some((seen) => sameTurn(seen, turn))) distinct.push(turn);
      }
      if (distinct.length > 0) {
        positions += 1;
        distinctTotal += distinct.length;
        if (distinct.length === 1) unanimous += 1;
      }
    }

    // The walk is played by the gentlest grade: cheap, and it reaches ordinary
    // positions rather than the sharp ones a strong player steers into.
    const step = chooseTurn(state, GRADES[0]!, random, { nodes: 400, millis: 5_000 });
    if (step === null) break;
    const next = applyTurn(state, step);
    if (next === state) break;
    state = next;
    moved += 1;
  }

  return {
    variant,
    size,
    positions,
    spread: positions === 0 ? 0 : distinctTotal / positions,
    unanimous,
    grades: GRADES.map((tier) => grades.get(tier)!),
    searchers: GRADES.filter((tier) => TIER_SPECS[tier].searchDepth > 0).length,
    // Not about the five grades, which have studied nothing: whether a
    // SPECIALIST covers this game, which is the alternative to a wider ladder.
    expert: BOT_ALL_TIERS.some((tier) => playsAsExpert(TIER_SPECS[tier].expertise, variant)),
  };
}

function line(reading: GameReading): string {
  const flat = reading.spread < 1.2 ? "  ← FLAT" : "";
  const each = reading.grades
    .map((g) => `${g.tier.slice(0, 4)} ${g.asked === 0 ? "  –" : `${Math.round((g.withTop / g.asked) * 100)}%`.padStart(4)}`)
    .join("  ");
  const ms = reading.grades.reduce((sum, g) => sum + g.msTotal, 0);
  return (
    `${reading.variant.padEnd(22)} ${String(reading.size).padStart(3)}  ` +
    `n=${String(reading.positions).padStart(2)}  spread ${reading.spread.toFixed(2)}  ` +
    `${each}  ${Math.round(ms)}ms${flat}`
  );
}

describe.skipIf(!ASKED)("what each grade actually does, game by game", () => {
  const games = gamesInScope();

  it("reads every game in scope and reports the spread between the grades", () => {
    const readings: GameReading[] = [];
    console.log(
      `\nMeasuring ${games.length} game(s) × ${GRADES.length} grades, ${POSITIONS} positions each.\n` +
        `Budget: ${byClock ? `${BOT_MOVE_MILLIS}ms a move, as live (NOT comparable between machines)` : `${NODES} nodes a move, repeatable`}.\n` +
        `Percentages are how often a grade played 国手's move. "spread" is distinct moves per position, out of ${GRADES.length}.\n`,
    );

    for (const variant of games) {
      const size = boardSizesFor(variant)[0]!;
      const started = performance.now();
      const reading = readGame(variant, size, 20260916);
      readings.push(reading);
      console.log(`${line(reading)}   (${Math.round((performance.now() - started) / 1000)}s)`);
    }

    const measured = readings.filter((one) => one.positions > 0);
    const flat = measured.filter((one) => one.spread < 1.2);
    console.log(
      `\n${measured.length} game(s) measured. ` +
        `${flat.length} of them FLAT — every grade plays much the same move:\n` +
        (flat.length === 0 ? "  (none)\n" : flat.map((one) => `  ${one.variant} (spread ${one.spread.toFixed(2)})`).join("\n") + "\n"),
    );

    const out = (process.env.BOT_GRADES_OUT ?? "").trim();
    if (out !== "") {
      writeFileSync(out, JSON.stringify({ budget: BUDGET, positions: POSITIONS, readings }, null, 2));
      console.log(`Numbers written to ${out}\n`);
    }

    // The run is a measurement, not a judgement: it fails only if it measured
    // nothing at all, which would mean the harness broke rather than the bots.
    expect(measured.length).toBeGreaterThan(0);
  }, 3_600_000);
});
