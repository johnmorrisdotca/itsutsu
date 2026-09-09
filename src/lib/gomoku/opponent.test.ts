import { describe, expect, it } from "vitest";

import { createGame, playMove } from "./engine";
import { GAME_STATUS, RULE_VARIANTS, RULE_VARIANT_LIST, STONES, VARIANT_SPECS } from "./gomoku.constants";
import { boardSizesFor } from "./gomoku.constants";
import { seededRandom } from "./rules/random";
import { BOT_PROFILES, BOT_TIER_LIST, BOT_TIERS, TIER_SPECS } from "./opponent.constants";
import { chooseTurn } from "./opponent";
import { applyTurn, legalTurns } from "./opponentTurns";
import { readsThreats } from "./opponentEval";
import { searchTurn, searchable } from "./opponentSearch";
import type { GameSettings, GameState, RuleVariant } from "./gomoku.types";
import type { BotTier } from "./opponent.types";

/**
 * The computer opponent, checked the way the engine is: by playing.
 *
 * The claims worth making about a graded player are that it can finish a game
 * of anything on the site, that it never plays a turn the rules refuse, that it
 * takes a win and stops one, that it knows a giveaway game is giveaway — and
 * that the three grades are actually in that order. Each of those is a test.
 */

/**
 * What the strongest grade may spend in these tests: a small, fixed number of
 * positions, and a clock set far enough out that it never binds.
 *
 * Counted rather than timed, so the same seed gives the same game on a loaded
 * machine as on an idle one. Timed, it does not: the search deepens
 * iteratively, so a busy laptop buys it fewer plies, it plays a different move,
 * and a series that reads 8-0 alone reads 7-1 with the rest of the suite
 * running beside it. That is not a flaky test, it is a test of the laptop.
 *
 * Far less than it gets in a real game, which is the point of asserting with
 * it: a claim that holds when the strongest grade is given a fraction of what
 * it normally spends holds when it is given all of it.
 */
const TEST_BUDGET = { nodes: 600, millis: 60_000 };

/** Plays a whole game between two tiers and returns where it ended. */
function playOut(
  variant: RuleVariant,
  black: BotTier,
  white: BotTier,
  seed: number,
  extra: Partial<GameSettings> = {},
): GameState {
  const random = seededRandom(seed);
  const size = boardSizesFor(variant)[0];
  let state = createGame({ variant, size, ...extra }, random());
  let guard = 0;
  const cap = size * size * 4 + 200;

  while (state.status === GAME_STATUS.playing && guard < cap) {
    const tier = state.toPlay === STONES.black ? black : white;
    const turn = chooseTurn(state, tier, random, TEST_BUDGET);
    if (turn === null) break;
    const next = applyTurn(state, turn);
    // A turn the engine refuses would leave the state untouched and loop forever.
    expect(next, `${variant}: the engine refused a turn the chooser offered`).not.toBe(state);
    state = next;
    guard += 1;
  }
  return state;
}

describe("the graded players", () => {
  it("names three grades, weakest first, each with its own words", () => {
    expect(BOT_TIER_LIST).toEqual([BOT_TIERS.kyu, BOT_TIERS.dan, BOT_TIERS.meijin]);
    for (const tier of BOT_TIER_LIST) {
      const profile = BOT_PROFILES[tier];
      expect(profile.name.length).toBeGreaterThan(1);
      expect(profile.kanji.length).toBeGreaterThan(0);
      expect(profile.strength.length).toBeGreaterThan(0);
      expect(profile.blurb.length).toBeGreaterThan(40);
    }
    // Three names, three kanji, no accidental duplicates.
    expect(new Set(BOT_TIER_LIST.map((tier) => BOT_PROFILES[tier].name)).size).toBe(3);
    expect(new Set(BOT_TIER_LIST.map((tier) => BOT_PROFILES[tier].kanji)).size).toBe(3);
  });

  it("gets stronger, grade by grade, in every knob that makes a player weak", () => {
    const [kyu, dan, meijin] = BOT_TIER_LIST.map((tier) => TIER_SPECS[tier]);
    expect(kyu.blunder).toBeGreaterThan(dan.blunder);
    expect(dan.blunder).toBeGreaterThan(meijin.blunder);
    expect(kyu.guard).toBeLessThan(dan.guard);
    expect(dan.guard).toBeLessThan(meijin.guard);
    expect(kyu.noise).toBeGreaterThan(dan.noise);
    expect(dan.noise).toBeGreaterThan(meijin.noise);
    expect(meijin.blunder).toBe(0);
    expect(meijin.guard).toBe(1);
  });
});

describe("every turn it offers is a turn the rules allow", () => {
  it.each([...RULE_VARIANT_LIST])("%s", (variant) => {
    const random = seededRandom(7);
    const size = boardSizesFor(variant)[0];
    let state = createGame({ variant, size }, random());

    // Ten turns in, then check every single option the chooser would weigh.
    for (let step = 0; step < 10 && state.status === GAME_STATUS.playing; step += 1) {
      const turn = chooseTurn(state, BOT_TIERS.dan, random, TEST_BUDGET);
      if (turn === null) break;
      state = applyTurn(state, turn);
    }
    if (state.status !== GAME_STATUS.playing) return;

    const turns = legalTurns(state);
    expect(turns.length).toBeGreaterThan(0);
    for (const turn of turns) {
      expect(applyTurn(state, turn), `${variant}: offered a turn the engine refuses`).not.toBe(state);
    }
  });
});

describe("it can finish a game of anything on the site", () => {
  /*
   * Go's own board is 19×19, four times the points of the 9×9 and 10×10
   * boards every other variant here is checked on, and its chooser has no
   * shape-based reading to lean on the way the line games do (`analysis` is
   * off), so it weighs every one of those points by the same general score
   * the whole game through. A full game reliably finishes — see below — just
   * past the default 5s test timeout, so it alone gets more room; a real bug
   * would still show up as the guard cap or an outright refusal, neither of
   * which a longer clock hides.
   */
  it.each([...RULE_VARIANT_LIST])(
    "%s",
    (variant) => {
      const state = playOut(variant, BOT_TIERS.dan, BOT_TIERS.kyu, 1234);
      /*
       * Not every game here must *end* — the race games can be called off by the
       * guard, as the simulator's own slide cap acknowledges — but the position
       * must always be one the engine and the chooser agree about: either it is
       * settled, or there was still a turn to take when we stopped counting.
       */
      if (state.status === GAME_STATUS.playing) {
        expect(legalTurns(state).length, `${variant}: stopped with nothing to play`).toBeGreaterThan(0);
      } else {
        expect([GAME_STATUS.won, GAME_STATUS.draw]).toContain(state.status);
      }
    },
    120_000,
  );
});

describe("what every grade sees", () => {
  it("takes five in a row when it is there to be taken", () => {
    // Black four in a row on row 4; white idling in the four corners, where it
    // has no line of its own and nothing to answer.
    const idle = [
      { row: 0, col: 0 },
      { row: 0, col: 8 },
      { row: 8, col: 0 },
      { row: 8, col: 8 },
    ];
    for (const tier of BOT_TIER_LIST) {
      let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
      [2, 3, 4, 5].forEach((col, index) => {
        state = playMove(state, { row: 4, col });
        state = playMove(state, idle[index]);
      });
      const turn = chooseTurn(state, tier, seededRandom(3), TEST_BUDGET);
      expect(turn?.kind).toBe("place");
      const after = applyTurn(state, turn!);
      expect(after.status, `${tier} did not finish the line`).toBe(GAME_STATUS.won);
      expect(after.winner).toBe(STONES.black);
    }
  });

  it("stops four in a row where stopping it is still possible", () => {
    /*
     * Deliberately *not* an open four. An open four cannot be stopped by one
     * stone — both ends win — so a player who answers it has not shown
     * anything, and a player who plays elsewhere has not blundered. The
     * position that tells you something is a four with one end already shut:
     * there is exactly one saving point, and a grade either finds it or does
     * not.
     */
    for (const tier of [BOT_TIERS.dan, BOT_TIERS.meijin] as const) {
      let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
      state = playMove(state, { row: 4, col: 2 });
      state = playMove(state, { row: 4, col: 1 });
      state = playMove(state, { row: 4, col: 3 });
      state = playMove(state, { row: 8, col: 0 });
      state = playMove(state, { row: 4, col: 4 });
      state = playMove(state, { row: 8, col: 8 });
      state = playMove(state, { row: 4, col: 5 });
      expect(state.toPlay).toBe(STONES.white);

      const turn = chooseTurn(state, tier, seededRandom(11), TEST_BUDGET);
      expect(turn?.kind).toBe("place");
      const played = turn as { row: number; col: number };
      expect(
        `${played.row},${played.col}`,
        `${tier} let black finish the line`,
      ).toBe("4,6");
    }
  });

  it("knows a giveaway game is giveaway, and will not complete the line", () => {
    // The same four in a row, in the game where making five loses.
    let state = createGame({ variant: RULE_VARIANTS.misereFive, size: 9 }, 0);
    for (const col of [2, 3, 4, 5]) {
      state = playMove(state, { row: 4, col });
      state = playMove(state, { row: 0, col });
    }
    for (const tier of BOT_TIER_LIST) {
      const turn = chooseTurn(state, tier, seededRandom(5), TEST_BUDGET);
      const after = applyTurn(state, turn!);
      expect(
        after.winner,
        `${tier} completed a losing line in a giveaway game`,
      ).not.toBe(STONES.white);
    }
  });

  it("looks ahead, and only where looking ahead says something true", () => {
    /*
     * The strongest grade's actual difference, tested directly rather than by
     * sampling games.
     *
     * Whether Meijin *wins more* than Dan is a question about a series, and a
     * series on a board big enough for the answer to mean anything takes
     * minutes — too slow to keep here. Measured separately, over twelve games
     * on a fifteen by fifteen board with the colours swapped, the search wins
     * ten and loses two against the identical player with the search turned
     * off. What is asserted here is the mechanism that produces that: it finds
     * the move, and it declines to look where looking is meaningless.
     */
    let state = createGame({ variant: RULE_VARIANTS.freestyle, size: 9 }, 0);
    const idle = [
      { row: 0, col: 0 },
      { row: 0, col: 8 },
      { row: 8, col: 0 },
    ];
    // Black three in a row in the open; either extension makes a four nobody can stop.
    [3, 4, 5].forEach((col, index) => {
      state = playMove(state, { row: 4, col });
      state = playMove(state, idle[index]);
    });

    const found = searchTurn(state, 6, seededRandom(2), TEST_BUDGET);
    expect(found?.kind).toBe("place");
    const played = found as { row: number; col: number };
    expect(`${played.row},${played.col}`).toMatch(/^4,(2|6)$/);

    // A flipping board has no line to read ahead, so the search declines it.
    const reversi = createGame({ variant: RULE_VARIANTS.reversi, size: 8 }, 0);
    expect(searchTurn(reversi, 6, seededRandom(2), TEST_BUDGET)).toBeNull();
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(true);
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.reversi])).toBe(false);
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.halma])).toBe(false);
    // Making the line loses here, so the ladder the ordering leans on is wrong.
    expect(searchable(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
  });

  it("reads lines only where the reading says something true", () => {
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.freestyle])).toBe(true);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.renju])).toBe(true);
    // Making the line loses, so the ladder is exactly backwards.
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.misereFive])).toBe(false);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.notakto])).toBe(false);
    // A shorter run loses, and a square wins: neither is a thing the ladder counts.
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.trapThree])).toBe(false);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.squareFour])).toBe(false);
    // Nothing on a flipping or racing board is a line at all.
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.reversi])).toBe(false);
    expect(readsThreats(VARIANT_SPECS[RULE_VARIANTS.halma])).toBe(false);
  });
});

/**
 * The claim the whole feature rests on: the grades are in the order they are
 * offered in. Played over a series with the colours swapped each game, so a
 * result cannot be an artefact of who opened.
 */
describe("the grades beat the grades below them", () => {
  /**
   * A series with the colours swapped every game, so a result cannot be an
   * artefact of who opened — which on these boards is most of the advantage.
   */
  const series = (
    variant: RuleVariant,
    strong: BotTier,
    weak: BotTier,
    games: number,
    size?: number,
  ) => {
    let won = 0;
    let lost = 0;
    for (let game = 0; game < games; game += 1) {
      const strongIsBlack = game % 2 === 0;
      const state = playOut(
        variant,
        strongIsBlack ? strong : weak,
        strongIsBlack ? weak : strong,
        1000 + game,
        size === undefined ? {} : { size },
      );
      const strongStone = strongIsBlack ? STONES.black : STONES.white;
      if (state.winner === strongStone) won += 1;
      else if (state.winner !== null) lost += 1;
    }
    return { score: (won + (games - won - lost) / 2) / games, won, lost, games };
  };

  it("Meijin beats Kyu at Gomoku", () => {
    expect(series(RULE_VARIANTS.freestyle, BOT_TIERS.meijin, BOT_TIERS.kyu, 8).score).toBeGreaterThanOrEqual(0.875);
  });

  it("Dan beats Kyu at Gomoku", () => {
    expect(series(RULE_VARIANTS.freestyle, BOT_TIERS.dan, BOT_TIERS.kyu, 8).score).toBeGreaterThan(0.5);
  });

  it("Meijin beats Kyu at Connect Four", () => {
    expect(series(RULE_VARIANTS.dropFour, BOT_TIERS.meijin, BOT_TIERS.kyu, 8).score).toBeGreaterThan(0.5);
  });

  it("Meijin beats Kyu at Reversi", () => {
    expect(series(RULE_VARIANTS.reversi, BOT_TIERS.meijin, BOT_TIERS.kyu, 6).score).toBeGreaterThan(0.5);
  });
});
