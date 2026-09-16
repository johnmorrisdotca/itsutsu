import { describe, expect, it } from "vitest";

import { BOT_TIER_LIST, TIER_SPECS } from "@/lib/gomoku/opponent.constants";
import { boardSizesFor, GAME_STATUS, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { createGame } from "@/lib/gomoku/engine";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { applyTurn, legalTurns } from "@/lib/gomoku/opponentTurns";
import { seatToPlay } from "@/lib/gomoku/rules/seats";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";

/**
 * IS THE COMPUTER ACTUALLY PERFECT AT THE GAMES THAT ARE SMALL ENOUGH TO BE?
 *
 * A bot's strength is usually an opinion. On a 3×3 board it is not: the whole
 * game tree fits in memory, so there is a RIGHT answer to every position, and
 * "how good is the top grade" becomes a fact rather than a ladder result.
 *
 * That matters more here than it looks. The site's own honesty rule is that a
 * grade is a difficulty rather than a label, and the smallest games are where
 * a player is most certain they have been cheated or let off: everybody knows
 * tic-tac-toe is a draw, so a computer that loses it is not "gentle", it is
 * broken. And the measurement that this file's sibling produces — spread
 * between grades — says nothing at all here, because at tic-tac-toe every
 * grade SHOULD agree: the correct move is the correct move.
 *
 * So this walks the true game tree, and for every position where the mover can
 * still hold the result, asks whether the grade's move throws it away.
 *
 *   pnpm bots:perfect                          the small games
 *   BOT_PERFECT_GAMES=tictactoe,notakto        only these
 *   BOT_PERFECT_TIERS=meijin,guoshou           only these grades
 *
 * It writes nothing and touches no database.
 */
const ASKED = process.env.BOT_PERFECT === "1";

/** Games whose whole tree is small enough to walk honestly. Anything bigger belongs in bots:grades. */
const SMALL: readonly RuleVariant[] = [
  RULE_VARIANTS.tictactoe,
  RULE_VARIANTS.wildTicTacToe,
  RULE_VARIANTS.notakto,
  RULE_VARIANTS.trapThree,
];

/** The value of a position TO THE SIDE ABOUT TO MOVE: 1 it can force a win, 0 a draw, -1 it is lost. */
type Value = 1 | 0 | -1;

/**
 * A position's key.
 *
 * The board and whose turn it is, which is all a game with no history-dependent
 * rule needs. Symmetry is deliberately NOT folded in: it would make the walk
 * smaller and it would also make a mistake in the folding indistinguishable
 * from a mistake in the bot, which is the one thing this file exists to tell
 * apart.
 */
function keyOf(state: GameState): string {
  return `${state.board.map((cell) => cell ?? ".").join("")}|${state.toPlay}`;
}

/** Who won, from the point of view of the side about to move — or null while the game is alive. */
function settled(state: GameState, mover: string): Value | null {
  if (state.status === GAME_STATUS.playing) return null;
  if (state.status === GAME_STATUS.draw || state.winner === null) return 0;
  return state.winner === mover ? 1 : -1;
}

function solve(state: GameState, seen: Map<string, Value>): Value {
  const mover = state.toPlay;
  const done = settled(state, mover);
  if (done !== null) return done;

  const key = keyOf(state);
  const known = seen.get(key);
  if (known !== undefined) return known;

  const turns = legalTurns(state, 200);
  if (turns.length === 0) {
    seen.set(key, 0);
    return 0;
  }

  let best: Value = -1;
  for (const turn of turns) {
    const next = applyTurn(state, turn);
    if (next === state) continue;
    // The reply is valued for whoever moves NEXT, so it comes back negated —
    // except where the same side moves again, which some variants allow.
    const theirs = solve(next, seen);
    const mine: Value = next.toPlay === mover ? theirs : (-theirs as Value);
    if (mine > best) best = mine;
    if (best === 1) break;
  }
  seen.set(key, best);
  return best;
}

type Reading = { variant: RuleVariant; tier: BotTier; asked: number; threw: number; examples: string[] };

function readGrade(variant: RuleVariant, size: number, tier: BotTier, seen: Map<string, Value>): Reading {
  const reading: Reading = { variant, tier, asked: 0, threw: 0, examples: [] };

  const walk = (state: GameState, depth: number) => {
    if (state.status !== GAME_STATUS.playing || depth > 12) return;
    const turns = legalTurns(state, 200);
    if (turns.length === 0) return;

    const before = solve(state, seen);
    // A position already lost cannot be thrown away, and a position with one
    // legal turn is not a decision. Neither says anything about the grade.
    if (before > -1 && turns.length > 1) {
      const mover = state.toPlay;
      const chosen = chooseTurn(state, tier, Math.random, { nodes: 20_000, millis: 10_000 });
      if (chosen !== null) {
        const next = applyTurn(state, chosen);
        if (next !== state) {
          const theirs = solve(next, seen);
          const after: Value = next.toPlay === mover ? theirs : (-theirs as Value);
          reading.asked += 1;
          if (after < before) {
            reading.threw += 1;
            if (reading.examples.length < 2) {
              reading.examples.push(`${keyOf(state)} → ${JSON.stringify(chosen)} (${before} to ${after})`);
            }
          }
        }
      }
    }

    // Walk a few branches rather than all of them: enough positions to catch a
    // grade that throws games away, without the run becoming the solve itself.
    for (const turn of turns.slice(0, 3)) {
      const next = applyTurn(state, turn);
      if (next !== state) walk(next, depth + 1);
    }
  };

  walk(createGame({ variant, size }, 0), 0);
  return reading;
}

describe.skipIf(!ASKED)("the small games, where perfect play is a fact", () => {
  const named = (process.env.BOT_PERFECT_GAMES ?? "").trim();
  const games = named === "" ? SMALL : (named.split(",").map((one) => one.trim()) as RuleVariant[]);
  const tiersNamed = (process.env.BOT_PERFECT_TIERS ?? "").trim();
  const tiers = tiersNamed === "" ? BOT_TIER_LIST : (tiersNamed.split(",").map((one) => one.trim()) as BotTier[]);

  it("says how often each grade throws a result it was holding", () => {
    console.log("\nEvery position is solved exactly. A THROW is a move that turns a win or a draw into less.\n");
    for (const variant of games) {
      const size = boardSizesFor(variant)[0]!;
      const seen = new Map<string, Value>();
      const opening = solve(createGame({ variant, size }, 0), seen);
      const verdict = opening === 1 ? "first player wins" : opening === 0 ? "a draw" : "second player wins";
      console.log(`${variant} ${size}×${size} — with perfect play: ${verdict}  (${seen.size} positions)`);
      for (const tier of tiers) {
        const reading = readGrade(variant, size, tier, seen);
        const rate = reading.asked === 0 ? "–" : `${Math.round((reading.threw / reading.asked) * 100)}%`;
        const searches = TIER_SPECS[tier].searchDepth > 0 ? "" : "  (no search)";
        console.log(
          `   ${tier.padEnd(9)} threw ${String(reading.threw).padStart(3)}/${String(reading.asked).padEnd(3)} = ${rate.padStart(4)}${searches}`,
        );
        for (const one of reading.examples) console.log(`      ${one}`);
      }
      console.log("");
    }
    expect(games.length).toBeGreaterThan(0);
  }, 1_800_000);
});
