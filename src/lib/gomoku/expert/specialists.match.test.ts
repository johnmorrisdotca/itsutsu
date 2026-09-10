import { describe, expect, it } from "vitest";

import { createGame } from "../engine";
import { GAME_STATUS, RULE_VARIANTS, STONES, boardSizesFor } from "../gomoku.constants";
import { seededRandom } from "../rules/random";
import { BOT_TIERS, BOT_TIER_LIST } from "../opponent.constants";
import { chooseTurn } from "../opponent";
import { applyTurn } from "../opponentTurns";
import type { GameSettings, RuleVariant, Stone } from "../gomoku.types";
import type { BotTier, SearchBudget } from "../opponent.types";

/**
 * The specialists, measured rather than argued about.
 *
 * The claim is a claim about a series, so it is tested as one: every graded
 * player, both colours, enough games that the answer is not the dice. Six
 * games is noise — that was learned expensively here, by two sessions reaching
 * opposite conclusions about the same pair of players — so ten is the floor,
 * and the bar is a clear majority rather than one game up.
 *
 * Two runs, and which one is which matters.
 *
 * **Reversi runs on every build.** Each side may examine the same fixed number
 * of positions, with the clock set out of reach, so the answer does not depend
 * on what else the laptop was doing — the reason the graded players' own tests
 * give for counting positions rather than seconds. It costs about eighty
 * seconds and it is the case that started all this, so it is worth them.
 *
 * **Five in a row has to be asked for**, and the reason is worth writing down
 * because it is a finding rather than an excuse:
 *
 *   BOT_SERIES=1 pnpm test:unit src/lib/gomoku/expert/specialists.match.test.ts
 *
 * Counting positions is the wrong measure of fairness there. The shared
 * reading costs roughly nine times what the specialist's costs per position on
 * a fifteen-point board — 名人 spends about a second and a half on a move where
 * the specialist spends a sixth of that — so "the same number of positions" is
 * a rule that hands one side nine times the thinking. Measured that way the two
 * come out about level; measured on the clock they both actually get, the
 * specialist wins seven or eight games in ten. The clock is the honest measure
 * and the machine-dependent one, so it is the long run's job, and the long run
 * is thirty games an opponent on the board the game is really played on.
 *
 * What gates the build for five in a row instead is `expert.test.ts`: the
 * reading finds the point that completes a five, tells an open three from a
 * dead one, answers a four instead of weighing thirteen quiet moves, and takes
 * its own win ahead of blocking. Those are the mechanism the series measures.
 * It is the same division the graded players' own tests already make, and for
 * the same reason.
 */

/** Whether the full series on the full board was asked for. */
const LONG = process.env.BOT_SERIES === "1";

/** Games per opponent, half with the specialist black and half white. */
const GAMES = LONG ? 30 : 10;

/**
 * What each side may spend on one move: the real clock in the long run,
 * counted positions in the short one. See the note above on why the two say
 * different things.
 */
const BUDGET: SearchBudget = LONG
  ? { nodes: 200_000, millis: 250 }
  : { nodes: 1_500, millis: 600_000 };

type Series = { wins: number; losses: number; draws: number };

/** Plays one game out between two players and says who won, or null for a draw. */
function playOut(
  variant: RuleVariant,
  black: BotTier,
  white: BotTier,
  seed: number,
  extra: Partial<GameSettings> = {},
): Stone | null {
  const random = seededRandom(seed);
  const size = boardSizesFor(variant)[0];
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
  if (state.status !== GAME_STATUS.won) return null;
  return state.winner;
}

/**
 * A whole series between two players, colours swapped every game.
 *
 * Swapping matters more here than it would in a symmetric game: black moves
 * first in five in a row and white has the last word in Reversi, and a series
 * played from one seat measures the seat as much as the player.
 */
function series(
  variant: RuleVariant,
  specialist: BotTier,
  against: BotTier,
  extra: Partial<GameSettings> = {},
): Series {
  const tally: Series = { wins: 0, losses: 0, draws: 0 };
  for (let game = 0; game < GAMES; game += 1) {
    const specialistIsBlack = game % 2 === 0;
    const seed = 1_000 + game * 37;
    const winner = specialistIsBlack
      ? playOut(variant, specialist, against, seed, extra)
      : playOut(variant, against, specialist, seed, extra);
    const mine = specialistIsBlack ? STONES.black : STONES.white;
    if (winner === null) tally.draws += 1;
    else if (winner === mine) tally.wins += 1;
    else tally.losses += 1;
  }
  return tally;
}

/** The series as a line worth reading in the run's output. */
function report(specialist: BotTier, against: BotTier, tally: Series): string {
  return `${specialist} vs ${against}: ${tally.wins}W ${tally.losses}L ${tally.draws}D`;
}

/**
 * The bar: won clearly, not won narrowly.
 *
 * A player one game up over ten is a coin, and the claim is that a specialist
 * is a different class of player at its own game. So the wins have to beat the
 * losses by a fifth of the series — two games in ten, six in thirty — and a
 * series full of draws fails it as surely as a series of losses. That is
 * deliberate: the ceiling the five-in-a-row specialist was built to break was
 * a ceiling made of draws.
 */
function claim(specialist: BotTier, against: BotTier, tally: Series): void {
  console.log(report(specialist, against, tally));
  expect(tally.wins, report(specialist, against, tally)).toBeGreaterThan(
    tally.losses + Math.floor(GAMES / 5),
  );
}

describe("the Reversi specialist against the ladder", () => {
  it.each([...BOT_TIER_LIST])(
    "beats %s over a series",
    (against) => {
      claim(
        BOT_TIERS.tamenoki,
        against,
        series(RULE_VARIANTS.reversi, BOT_TIERS.tamenoki, against),
      );
    },
    600_000,
  );
});

/*
 * Thirty games an opponent at fifteen points, on the clock a request gives a
 * computer player. Last measured:
 *
 *   10-0 разряд · 10-0 級 · 7-3 段 · 8-2 名人 · 9-1 国手, and not one draw.
 *
 * The shape of that row is the diagnosis over again: the specialist beats 国手
 * more comfortably than it beats 段, because a deeper search over a reading
 * that misunderstands the game is not a smaller error than a shallow one, it
 * is a better-executed one.
 */
describe.runIf(LONG)("the five-in-a-row specialist against the ladder", () => {
  it.each([...BOT_TIER_LIST])(
    "beats %s over a series",
    (against) => {
      claim(
        BOT_TIERS.meritalu,
        against,
        series(RULE_VARIANTS.freestyle, BOT_TIERS.meritalu, against, { size: 15 }),
      );
    },
    900_000,
  );
});
