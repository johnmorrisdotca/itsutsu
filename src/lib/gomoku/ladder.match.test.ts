import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { GAME_STATUS, STONES, VARIANT_SPECS, boardSizesFor } from "./gomoku.constants";
import { seededRandom } from "./rules/random";
import { BOT_TIER_LIST } from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { applyTurn } from "./opponentTurns";
import { variantFor } from "./slugs";
import type { GameSettings, RuleVariant, Stone } from "./gomoku.types";
import type { BotTier, SearchBudget } from "./opponent.types";

/**
 * The ladder against itself: every grade against every other, on any board.
 *
 * The claim the whole feature rests on is an ORDER — разряд below 級 below 段
 * below 名人 below 国手 — and an order is a claim about a round robin, not
 * about a pair. `opponent.test.ts` asserts the pairs that are cheap to assert
 * and one of them, 名人 over 級 at Reversi, passed over six games for a year
 * while the true score over thirty was eleven-eighteen the other way. Six games
 * is a coin; the file next door says so in its own preamble and it was right.
 *
 * So this is the whole matrix, and it is a TOOL rather than a gate: it is the
 * thing to run when a knob has been turned, and the numbers it prints are what
 * the ordering claims in `opponent.test.ts` and `opponent.constants.ts` are
 * written from. It plays nothing unless asked, because a full round robin over
 * three boards is minutes rather than seconds.
 *
 *   BOT_LADDER=1 pnpm test:unit src/lib/gomoku/ladder.match.test.ts
 *   BOT_LADDER=1 LADDER_BOARDS=reversi:8 LADDER_GAMES=30 pnpm test:unit …
 *   BOT_LADDER=1 LADDER_TIERS=dan,meijin,guoshou LADDER_NODES=4000 …
 *
 * IN MEMORY, and that is the money-safe half of "Bulk Play Runs Here, Never
 * Through the Site". `bots:play` is the other half and answers a different
 * question: it writes rows somebody can open and watch, and it pays a database
 * for each one. This one answers "who is actually stronger", needs no database
 * and no network, and costs a laptop's CPU — so it is the one to reach for when
 * the question is a number rather than a game to look at.
 *
 * COUNTED POSITIONS, NOT SECONDS. The budget is a node count with the clock set
 * out of reach, so the same seed plays the same game on a loaded machine as on
 * an idle one. Timed, it does not: the search deepens iteratively, a busy
 * laptop buys it fewer plies, and a series that reads 18-11 alone reads 14-15
 * with the rest of the suite beside it. That is a test of the laptop.
 */

/** Whether the round robin was asked for. */
const ASKED = process.env.BOT_LADDER === "1";

/** Games per pairing. Colours alternate, so an even number is the fair one. */
const GAMES = Math.max(2, Number(process.env.LADDER_GAMES ?? "30"));

/**
 * Three deliberately unalike boards, because one game repeated shows one
 * behaviour and implies it is all of them: Reversi is where the order inverted,
 * five in a row is where it flattens at the top, and Connect Four is the one
 * that was reported as separating cleanly.
 */
const DEFAULT_BOARDS = "reversi:8,freestyle:15,dropFour:7";

const BUDGET: SearchBudget = {
  nodes: Number(process.env.LADDER_NODES ?? "6000"),
  millis: Number(process.env.LADDER_MILLIS ?? "600000"),
};

/** A comma-separated option, with the empty string meaning "not given". */
function listed(value: string | undefined): string[] {
  return (value ?? "").split(",").map((one) => one.trim()).filter((one) => one !== "");
}

function tiersAsked(): BotTier[] {
  const asked = listed(process.env.LADDER_TIERS);
  if (asked.length === 0) return [...BOT_TIER_LIST];
  const known = new Set<string>(BOT_TIER_LIST);
  const wrong = asked.filter((one) => !known.has(one));
  if (wrong.length > 0) {
    throw new Error(`LADDER_TIERS names nobody on the graded ladder: ${wrong.join(", ")}`);
  }
  return asked as BotTier[];
}

function boardsAsked(): { variant: RuleVariant; size: number }[] {
  return listed(process.env.LADDER_BOARDS ?? DEFAULT_BOARDS).map((one) => {
    const [name, size] = one.split(":");
    const variant = name in VARIANT_SPECS ? (name as RuleVariant) : variantFor(name);
    if (variant === null || variant === undefined) {
      throw new Error(`LADDER_BOARDS names a game this site does not have: ${name}`);
    }
    const sizes = boardSizesFor(variant);
    if (size === undefined) return { variant, size: sizes[Math.floor(sizes.length / 2)] };
    const wanted = Number(size);
    if (!sizes.includes(wanted)) {
      throw new Error(`${name} is not played on ${size}×${size}. It plays on: ${sizes.join(", ")}`);
    }
    return { variant, size: wanted };
  });
}

/** Plays one game out and says who won, or null for a draw. */
function playOut(
  variant: RuleVariant,
  size: number,
  black: BotTier,
  white: BotTier,
  seed: number,
  extra: Partial<GameSettings> = {},
): Stone | null {
  const random = seededRandom(seed);
  let state = createGame({ variant, size, ...extra }, random());
  const cap = size * size * 4 + 200;

  for (let turn = 0; turn < cap && state.status === GAME_STATUS.playing; turn += 1) {
    const tier = state.toPlay === STONES.black ? black : white;
    const chosen = chooseTurn(state, tier, random, BUDGET);
    if (chosen === null) break;
    const next = applyTurn(state, chosen);
    expect(next, `${variant}: the engine refused a turn the chooser offered`).not.toBe(state);
    state = next;
  }
  return state.status === GAME_STATUS.won ? state.winner : null;
}

type Tally = { wins: number; losses: number; draws: number };

/**
 * One pairing, colours swapped every game.
 *
 * Swapping is not a nicety. Black moves first in five in a row and white has
 * the last word in Reversi, so a series played from one seat measures the seat
 * at least as much as the player.
 */
function series(
  variant: RuleVariant,
  size: number,
  first: BotTier,
  second: BotTier,
): Tally {
  const tally: Tally = { wins: 0, losses: 0, draws: 0 };
  for (let game = 0; game < GAMES; game += 1) {
    const firstIsBlack = game % 2 === 0;
    const seed = 1_000 + game * 37;
    const winner = firstIsBlack
      ? playOut(variant, size, first, second, seed)
      : playOut(variant, size, second, first, seed);
    const mine = firstIsBlack ? STONES.black : STONES.white;
    if (winner === null) tally.draws += 1;
    else if (winner === mine) tally.wins += 1;
    else tally.losses += 1;
  }
  return tally;
}

/** The share of the series a player took, counting a draw as half a game. */
function score(tally: Tally): number {
  const played = tally.wins + tally.losses + tally.draws;
  return played === 0 ? 0 : (tally.wins + tally.draws / 2) / played;
}

describe.runIf(ASKED)("the graded ladder against itself", () => {
  const tiers = tiersAsked();
  const boards = boardsAsked();

  it.each(boards)(
    "reports every pairing at $variant $size",
    ({ variant, size }) => {
      const points: Record<string, number> = {};
      for (const tier of tiers) points[tier] = 0;
      const lines: string[] = [];

      for (let i = 0; i < tiers.length; i += 1) {
        for (let j = i + 1; j < tiers.length; j += 1) {
          const tally = series(variant, size, tiers[i], tiers[j]);
          points[tiers[i]] += score(tally);
          points[tiers[j]] += 1 - score(tally);
          lines.push(
            `  ${tiers[i].padEnd(8)} ${String(tally.wins).padStart(2)} - ` +
              `${String(tally.losses).padEnd(2)} ${tiers[j].padEnd(8)}` +
              (tally.draws > 0 ? `  (${tally.draws} drawn)` : ""),
          );
        }
      }

      const table = [
        `\n${variant} ${size}×${size}, ${GAMES} games per pairing, colours alternating,`,
        `budget ${BUDGET.nodes} positions a move:`,
        ...lines,
        "  —",
        ...[...tiers]
          .sort((a, b) => points[b] - points[a])
          .map((tier) => `  ${tier.padEnd(8)} ${points[tier].toFixed(1)} of ${tiers.length - 1}`),
      ].join("\n");
      console.log(table);
      expect(lines.length).toBe((tiers.length * (tiers.length - 1)) / 2);
    },
    3_600_000,
  );
});
