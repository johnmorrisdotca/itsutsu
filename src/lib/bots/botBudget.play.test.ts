import { describe, expect, it } from "vitest";

import { BOT_MOVE_MILLIS } from "@/lib/bots/bots.constants";
import { BOT_TIERS } from "@/lib/gomoku/opponent.constants";
import { boardSizesFor, GAME_STATUS, RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { createGame } from "@/lib/gomoku/engine";
import { chooseTurn } from "@/lib/gomoku/opponent";
import { applyTurn } from "@/lib/gomoku/opponentTurns";
import type { BotTier } from "@/lib/gomoku/opponent.types";
import type { GameState, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";

/**
 * DOES THINKING LONGER ACTUALLY WIN?
 *
 * Everything about moving the computer player into the player's own browser
 * rests on one assumption nobody has tested: that a grade given seconds instead
 * of the 250 ms a paid request allows is a MEANINGFULLY STRONGER OPPONENT.
 *
 * It is not enough that it plays DIFFERENTLY. `pnpm bots:grades` already showed
 * that — at ten times the budget the top two grades stop agreeing. Different is
 * cheap; a coin would be different. The question is whether the deeper one
 * beats the shallower one over a series, and by how much.
 *
 * If it wins heavily, the browser is worth every hour spent on it and a
 * grandmaster grade is simply a longer think on somebody else's machine. If it
 * barely wins, then depth is not what is holding this ladder back, and the work
 * belongs somewhere else entirely — which is worth finding out from a run that
 * costs nothing rather than from a feature that costs weeks.
 *
 * The same grade plays both seats, so nothing differs between the two players
 * except the clock. Colours alternate, because in most of these games the
 * opener has the advantage and a series played one way round measures that
 * instead.
 *
 *   pnpm bots:budget                              the default pairing
 *   BOT_BUDGET_GAMES=freestyle,renju,reversi      which games
 *   BOT_BUDGET_EACH=6                             games per game, colours alternating
 *   BOT_BUDGET_TIER=meijin                        which grade plays itself
 *   BOT_BUDGET_MS=250,2000                        the two budgets, in milliseconds
 *
 * It writes nothing and touches no database, so it can run on both machines at
 * once — which is the point, because the fast one is otherwise idle.
 */
const ASKED = process.env.BOT_BUDGET === "1";

function whole(name: string, fallback: number, least: number): number {
  const text = process.env[name];
  if (text === undefined || text.trim() === "") return fallback;
  const value = Number(text.trim());
  if (!Number.isInteger(value) || value < least) {
    throw new Error(`${name} must be a whole number of at least ${least}, not "${text}".`);
  }
  return value;
}

const EACH = whole("BOT_BUDGET_EACH", 4, 2);
const TIER = (process.env.BOT_BUDGET_TIER ?? BOT_TIERS.guoshou) as BotTier;
const MILLIS = (process.env.BOT_BUDGET_MS ?? `${BOT_MOVE_MILLIS},2000`)
  .split(",")
  .map((one) => Number(one.trim()));

const GAMES: readonly RuleVariant[] = (process.env.BOT_BUDGET_GAMES ?? "")
  .trim()
  .split(",")
  .map((one) => one.trim())
  .filter(Boolean)
  .concat() as RuleVariant[];

const DEFAULT_GAMES: readonly RuleVariant[] = [
  RULE_VARIANTS.freestyle,
  RULE_VARIANTS.renju,
  RULE_VARIANTS.connect6,
  RULE_VARIANTS.reversi,
];

/** One game between the same grade on two different clocks. Returns who won, from the DEEP player's side. */
function play(variant: RuleVariant, size: number, deepIsBlack: boolean, cap: number): "deep" | "shallow" | "draw" {
  let state: GameState = createGame({ variant, size }, 0.5);
  const deep: Stone = deepIsBlack ? "black" : "white";

  for (let move = 0; move < cap && state.status === GAME_STATUS.playing; move += 1) {
    const thinking = state.toPlay === deep ? MILLIS[1]! : MILLIS[0]!;
    /*
     * Milliseconds and not nodes, deliberately, and it is the one measurement
     * here that MUST be a wall clock. The question is about the budget a real
     * request allows against the budget a browser allows, and those are times.
     * A node budget would measure something nobody is choosing between.
     */
    const turn = chooseTurn(state, TIER, Math.random, { millis: thinking });
    if (turn === null) break;
    const next = applyTurn(state, turn);
    if (next === state) break;
    state = next;
  }

  if (state.status !== GAME_STATUS.won || state.winner === null) return "draw";
  return state.winner === deep ? "deep" : "shallow";
}

describe.skipIf(!ASKED)("thinking longer, against thinking less long", () => {
  const games = GAMES.length > 0 ? GAMES : DEFAULT_GAMES;

  it("plays the same grade against itself on two clocks and counts", () => {
    console.log(
      `\n${TIER} against itself: ${MILLIS[1]}ms a move against ${MILLIS[0]}ms.\n` +
        `${EACH} games per board, colours alternating. Nothing is written anywhere.\n`,
    );
    let deepWins = 0;
    let shallowWins = 0;
    let draws = 0;

    for (const variant of games) {
      const size = boardSizesFor(variant)[0]!;
      let d = 0;
      let s = 0;
      let e = 0;
      const started = Date.now();
      for (let round = 0; round < EACH; round += 1) {
        const result = play(variant, size, round % 2 === 0, 200);
        if (result === "deep") d += 1;
        else if (result === "shallow") s += 1;
        else e += 1;
      }
      deepWins += d;
      shallowWins += s;
      draws += e;
      console.log(
        `${variant.padEnd(14)} ${size}×${size}  deep ${d}  shallow ${s}  drawn ${e}` +
          `   (${Math.round((Date.now() - started) / 1000)}s)`,
      );
    }

    const played = deepWins + shallowWins + draws;
    const decisive = deepWins + shallowWins;
    console.log(
      `\nDEEP ${deepWins} — SHALLOW ${shallowWins} — DRAWN ${draws}  of ${played}\n` +
        (decisive === 0
          ? "Every game drawn: this pairing says nothing about depth.\n"
          : `The longer think won ${Math.round((deepWins / decisive) * 100)}% of the decided games.\n`),
    );

    // A measurement, not a judgement: it fails only if it measured nothing.
    expect(played).toBeGreaterThan(0);
  }, 3_600_000);
});
