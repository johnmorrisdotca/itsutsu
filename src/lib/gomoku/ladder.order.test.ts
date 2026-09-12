import { describe, expect, it } from "vitest";

import { createGame } from "./engine";
import { GAME_STATUS, RULE_VARIANTS, RULE_VARIANT_LIST, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { seededRandom } from "./rules/random";
import { BOT_TIERS, TIER_SPECS } from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { applyTurn, legalTurns, sameTurn } from "./opponentTurns";
import { lookAheadTurn, lookable } from "./opponentLook";
import { searchable } from "./opponentSearch";
import { readsPosition } from "./opponentEval";
import type { RuleVariant, Stone } from "./gomoku.types";
import type { BotTier, SearchBudget } from "./opponent.types";

/**
 * The ordering claim, in the games where it was measured BACKWARDS.
 *
 * `opponent.test.ts` already asserts the pairings that were always in order.
 * This file is the other half, and every case in it is a score somebody
 * measured the wrong way round:
 *
 *   Reversi 8×8, thirty games a pairing, colours alternating
 *     before   段 16 - 12 名人 · 段 16 - 12 国手 · 級 6 - 23 段
 *     after    段  0 - 30 名人 · 段  0 - 30 国手 · 級 6 - 23 段
 *
 *   Checkers 8×8, ten games a pairing
 *     before   級 5 - 4 名人 · разряд 5 - 4 名人 · every pairing inside a game
 *     after    級 0 - 10 名人 · разряд 0 - 10 名人
 *
 * Neither was a tuning question. Reversi had NO look-ahead for any grade — the
 * line games' search refuses a flipping board, rightly — so `searchDepth`, the
 * only knob separating 名人 from 国手, did nothing in twenty-three of the site's
 * thirty-nine games, and at one ply a flipping game is not being read at all.
 * Checkers had no READING: it matched none of the families the shared
 * evaluation knows, so every position in every game of checkers scored zero and
 * all five grades chose by the tie-break.
 *
 * The second is the more dangerous shape and it is worth naming: a reading that
 * cannot measure a game returned a number that is in range. Nothing failed,
 * nothing looked wrong, and the ladder simply was not one.
 *
 * The full round robin these lines come from is `ladder.match.test.ts`, which is
 * a tool rather than a gate — a matrix over three boards is minutes. What is
 * gated here is short, seeded, and counted in positions rather than seconds, so
 * it says the same thing on a loaded machine as on an idle one.
 *
 * WHAT IS STILL NOT AN ORDER, because a ladder half fixed and described as fixed
 * is the fault this file exists about:
 *
 * - **名人 and 国手 are level at most games.** Both deepen two plies at a time
 *   and keep the last pass they FINISHED, so asking one for eight plies and the
 *   other for six changes nothing at all unless an eight-deep pass finishes
 *   inside a request. Reversi over thirty games: 14-16, and over fifteen
 *   positions the two depths chose the same move every time. Five in a row over
 *   ten games: 5-5, and not one of them drawn. Where the branching is small
 *   enough the extra plies do arrive — a board of checkers, a race — so it is a
 *   per-game fact, and 国手's blurb now says as much rather than promising a
 *   deeper read everywhere. See LEVEL_AT_THE_TOP for the games where neither of
 *   them searches at all.
 * - **The three grades that do not search are level at Reversi**: разряд 14-16
 *   級, разряд 14-16 段, while 級 loses 6-23 to 段. A flipping game cannot be
 *   played at one ply, so no reweighting of the one-ply reading orders three
 *   one-ply players — `flipScore`'s comment carries the measurement from trying.
 * - **段's 1-1-with-four-draws against 名人 at five in a row was a six-game
 *   artefact.** Over ten games it is 1-9, and none drawn. The flattening in that
 *   report was real for the top two and not for 段.
 */

/**
 * What each side may spend on one move: a small fixed number of positions, with
 * the clock set out of reach.
 *
 * Counted rather than timed, so the same seed gives the same game however busy
 * the laptop is — see the note in `opponent.test.ts`, which learned this the
 * expensive way. Far less than a real game gives it, which is what makes the
 * claim worth asserting with: a ladder that holds when the top grades are given
 * a fraction of their thinking holds when they are given all of it.
 */
const TEST_BUDGET: SearchBudget = { nodes: 900, millis: 60_000 };

/** Plays one game out and says who won, or null for a draw. */
function playOut(
  variant: RuleVariant,
  size: number,
  black: BotTier,
  white: BotTier,
  seed: number,
): Stone | null {
  const random = seededRandom(seed);
  let state = createGame({ variant, size }, random());
  const cap = size * size * 4 + 200;
  for (let turn = 0; turn < cap && state.status === GAME_STATUS.playing; turn += 1) {
    const tier = state.toPlay === STONES.black ? black : white;
    const chosen = chooseTurn(state, tier, random, TEST_BUDGET);
    if (chosen === null) break;
    const next = applyTurn(state, chosen);
    expect(next, `${variant}: the engine refused a turn the chooser offered`).not.toBe(state);
    state = next;
  }
  return state.status === GAME_STATUS.won ? state.winner : null;
}

/**
 * A series with the colours swapped every game, and what share of it the
 * stronger grade took.
 *
 * Swapping is not a nicety: white has the last word in Reversi and black opens
 * everywhere else, so a series from one seat measures the seat.
 */
function share(
  variant: RuleVariant,
  size: number,
  strong: BotTier,
  weak: BotTier,
  games: number,
): number {
  let won = 0;
  let lost = 0;
  for (let game = 0; game < games; game += 1) {
    const strongIsBlack = game % 2 === 0;
    const winner = strongIsBlack
      ? playOut(variant, size, strong, weak, 1_000 + game * 37)
      : playOut(variant, size, weak, strong, 1_000 + game * 37);
    const mine = strongIsBlack ? STONES.black : STONES.white;
    if (winner === mine) won += 1;
    else if (winner !== null) lost += 1;
  }
  return (won + (games - won - lost) / 2) / games;
}

/**
 * The games where the top two grades are the same player, and it is a decision
 * rather than an oversight.
 *
 * 名人 and 国手 differ in three knobs and nothing else: how many turns they
 * weigh (140 against 180), how many of the best they check a reply for (28
 * against 34), and how many plies they look ahead (6 against 8). The first two
 * are inert on any board that never offers a hundred and forty turns, which is
 * every board below nineteen points — so on the games listed here the ONLY
 * difference left is the search, and neither search runs.
 *
 * Each of these is a game the shared reading cannot read a position in. That is
 * the honest reason and it is a different statement from "we did not get round
 * to it": a search over a leaf value that is the same number everywhere returns
 * whichever move was enumerated first, so looking ahead here would buy a slower
 * move rather than a better one. What the site owes a reader is to say the top
 * two are level at these, not to pretend a knob is doing something.
 *
 * The list is asserted exactly, so a game added tomorrow that nothing can read
 * fails this test instead of quietly joining it.
 */
const LEVEL_AT_THE_TOP: readonly RuleVariant[] = [
  // A line game where making the line LOSES, so the threat ladder the search
  // orders itself by is exactly backwards. Excluded from the reading on purpose.
  RULE_VARIANTS.misereFive,
  RULE_VARIANTS.giveawayDrop,
  RULE_VARIANTS.notakto,
  // The maker wants a line of either colour and the breaker wants none: one
  // board, two objectives, and no single reading of a position.
  RULE_VARIANTS.makerBreaker,
  // The next piece is drawn after the turn, so a search past this move is a
  // search of a board that will not happen.
  RULE_VARIANTS.dominoFive,
  RULE_VARIANTS.blockFive,
  // A quarter turn rotates the board under the reading, and a turn there is two
  // decisions rather than one.
  RULE_VARIANTS.twistFive,
  RULE_VARIANTS.twistFour,
  // Lines that clear, and holes that move a stone elsewhere: the window count
  // is not a true account of either.
  RULE_VARIANTS.clearDrop,
  RULE_VARIANTS.wormDrop,
  // Won by a shape the line reading does not count — a short run, a square, a
  // line of anybody's colour — on a board small enough that nothing else can
  // tell two grades apart either.
  RULE_VARIANTS.trapThree,
  RULE_VARIANTS.squareFour,
  RULE_VARIANTS.wildTicTacToe,
  /*
   * Hex is the one entry here that is excluded by MEASUREMENT rather than by
   * having nothing to read. How much of an axis a colour spans is a nudge
   * towards its own edges and not an account of joining them, and searching it
   * took 名人 from 8-2 against разряд to 5-5 over ten games a pairing. A reading
   * that is only a nudge stays a nudge; see `readsPosition`.
   */
  RULE_VARIANTS.hex,
];

describe("every rung of the ladder is a different player", () => {
  it("looks ahead in every game the shared reading can read", () => {
    const blind = RULE_VARIANT_LIST.filter((variant) => {
      const spec = VARIANT_SPECS[variant];
      return !searchable(spec) && !lookable(spec);
    });
    /*
     * Exact, not a subset. A game that joins this list has quietly lost the one
     * knob that separates the top two grades, and the site goes on offering
     * both of them as though it had not.
     */
    expect([...blind].sort()).toEqual([...LEVEL_AT_THE_TOP].sort());
  });

  it("looks ahead where the reading says something, and declines where it does not", () => {
    // The flipping family: the corners and the replies are a real reading.
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.reversi])).toBe(true);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.antiReversi])).toBe(true);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.grandReversi])).toBe(true);
    // Area in Go, and distance home in a race.
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.go])).toBe(true);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.halma])).toBe(true);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.chineseCheckers])).toBe(true);
    /*
     * And NOT the connection game, which is the case worth a line of its own:
     * `connectScore` says something, it is not nothing, and it is still not a
     * thing to maximise. Measured, searching it made 名人 worse.
     */
    expect(readsPosition(VARIANT_SPECS[RULE_VARIANTS.hex])).toBe(false);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.hex])).toBe(false);
    // Material and advancement in checkers, which had no reading at all.
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.checkers])).toBe(true);
    expect(readsPosition(VARIANT_SPECS[RULE_VARIANTS.checkers])).toBe(true);

    /*
     * And it stands aside for the line games rather than competing with them.
     * That search reads whole-board shape and orders itself by the threat
     * ladder, which is a better account of a line game than a position score.
     */
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(true);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(false);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.dropFour])).toBe(false);

    // Nothing can read these, so nothing looks: see LEVEL_AT_THE_TOP.
    expect(readsPosition(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.twistFive])).toBe(false);
    expect(lookable(VARIANT_SPECS[RULE_VARIANTS.dominoFive])).toBe(false);
  });

  it("hands back a turn the chooser actually weighed, in every family it reads", () => {
    /*
     * The search is USED rather than merely present, which is a second claim and
     * the one that fails quietly.
     *
     * `chooseTurn` weighs `TierSpec.width` turns, asks the look-ahead for its
     * opinion, and then finds that opinion among the turns it weighed so it can
     * check it is not a blunder. A turn it cannot find is treated as unsafe and
     * dropped — so if the two ever enumerate different samples of the same
     * position, the grade pays for a search and plays the one-ply move, and
     * nothing anywhere says so. Two ways that could happen and both are real:
     * `legalTurns` SPREADS a long list of slides evenly to fit whatever limit it
     * is handed, so two limits give two samples; and `sameTurn` answered false
     * for a slide and for a pass until the look-ahead existed to play them.
     *
     * One position per family it reads, which is what makes this a gate on the
     * mechanism rather than on Reversi.
     */
    const width = TIER_SPECS[BOT_TIERS.guoshou].width;
    for (const [variant, size] of [
      [RULE_VARIANTS.reversi, 8],
      [RULE_VARIANTS.antiReversi, 8],
      [RULE_VARIANTS.checkers, 8],
      [RULE_VARIANTS.halma, 8],
      [RULE_VARIANTS.chineseCheckers, 17],
      [RULE_VARIANTS.go, 9],
    ] as [RuleVariant, number][]) {
      const random = seededRandom(29);
      let state = createGame({ variant, size }, random());
      // A few turns in, so a flipping board has flips and a race has moved.
      for (let turn = 0; turn < 6 && state.status === GAME_STATUS.playing; turn += 1) {
        const played = chooseTurn(state, BOT_TIERS.dan, random, TEST_BUDGET);
        if (played === null) break;
        state = applyTurn(state, played);
      }
      const found = lookAheadTurn(state, 4, seededRandom(31), TEST_BUDGET, width);
      expect(found, `${variant}: the look-ahead had nothing to say`).not.toBeNull();
      const weighed = legalTurns(state, width);
      expect(
        weighed.some((turn) => sameTurn(turn, found!)),
        `${variant}: the look-ahead chose a turn the chooser never weighed`,
      ).toBe(true);
    }
  });
});

/**
 * The scores that were measured the wrong way round, asserted the right way
 * round.
 *
 * A clear majority rather than one game up, because the bar for "stronger" has
 * to be higher than the dice. Six games is a coin — that is written in
 * `expert/specialists.match.test.ts` and it was learned here, where a six-game
 * series said 名人 beat 級 at Reversi for as long as the true score over thirty
 * was eleven-eighteen the other way.
 */
describe("the grades beat the grades below them where it was measured backwards", () => {
  const GAMES = 8;
  /** Won clearly: three quarters of the series, counting a draw as half. */
  const CLEARLY = 0.75;

  it(
    "Meijin beats Dan at Reversi",
    () => {
      const got = share(RULE_VARIANTS.reversi, 8, BOT_TIERS.meijin, BOT_TIERS.dan, GAMES);
      expect(got, `Meijin took ${got} of the series`).toBeGreaterThanOrEqual(CLEARLY);
    },
    180_000,
  );

  it(
    "Guoshou beats Dan at Reversi",
    () => {
      const got = share(RULE_VARIANTS.reversi, 8, BOT_TIERS.guoshou, BOT_TIERS.dan, GAMES);
      expect(got, `Guoshou took ${got} of the series`).toBeGreaterThanOrEqual(CLEARLY);
    },
    180_000,
  );

  it(
    "Meijin beats Dan at the giveaway flipping game, where the smaller pile wins",
    () => {
      /*
       * The same inversion as Reversi and worth its own case, because the
       * giveaway board is the one flipping game the Reversi specialist declines
       * — every sentence of Reversi theory is a different sentence there — so
       * the graded ladder is the whole of what a player gets at it.
       */
      const got = share(RULE_VARIANTS.antiReversi, 8, BOT_TIERS.meijin, BOT_TIERS.dan, GAMES);
      expect(got, `Meijin took ${got} of the series`).toBeGreaterThanOrEqual(CLEARLY);
    },
    180_000,
  );

  it(
    "Meijin beats Kyu at Checkers, which had no ladder at all",
    () => {
      const got = share(RULE_VARIANTS.checkers, 8, BOT_TIERS.meijin, BOT_TIERS.kyu, GAMES);
      expect(got, `Meijin took ${got} of the series`).toBeGreaterThanOrEqual(CLEARLY);
    },
    180_000,
  );

  it(
    "Dan beats Razryad at Checkers, which the gentlest grade used to win",
    () => {
      const got = share(RULE_VARIANTS.checkers, 8, BOT_TIERS.dan, BOT_TIERS.razryad, GAMES);
      expect(got, `Dan took ${got} of the series`).toBeGreaterThan(0.5);
    },
    180_000,
  );
});
